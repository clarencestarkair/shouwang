/**
 * 守望 · 多智能体反诈分析流水线
 *
 *   ① 端侧预处理（浏览器完成）：PII 脱敏、二维码解析、图片压缩
 *   ② 感知 Agent：视觉大模型识别截图/照片中的文字与可疑细节
 *   ③ 规则引擎初筛：可解释风险信号 + 实体抽取 + 提示词注入检测
 *   ④ 研判 Agent：检索案例(RAG) → 核验号码/链接(Tool) → 提交结构化报告
 *   ⑤ 安全审查：双通道校验、危险建议过滤、高风险兜底动作、家属通知
 *
 * 全程以 UI Message Stream 流式推送，前端实时展示每个阶段的“思考过程”。
 */
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  stepCountIs,
  streamText,
  type ModelMessage,
} from "ai";
import { aiStatus, embedQuery, modelConfig, sampling, textModel, visionModel } from "@/lib/ai/provider";
import { GUARDIAN_SYSTEM, FAMILY_ADVICE_HINT, PERCEPTION_PROMPT } from "@/lib/ai/prompts";
import { createGuardianTools } from "@/lib/ai/tools";
import type { GuardianRequestBody, GuardianUIMessage, PerceptionData, TraceData } from "@/lib/ai/messages";
import { detectChannel, extractEntities, scanText } from "@/lib/core/rules";
import { detectInjection, maskPII, wrapUntrusted } from "@/lib/core/safety";
import { hybridSearch } from "@/lib/core/rag";
import { buildFallbackReport } from "@/lib/core/fallback";
import { addAlert } from "@/lib/store/alerts";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGES = 3;

function parseDataUrl(url: string): { mediaType: string; data: string } | null {
  const m = url.match(/^data:([^;]+);base64,(.+)$/);
  return m ? { mediaType: m[1], data: m[2] } : null;
}

/** 从感知结果中取出【完整文字】段落，作为人可读的预览 */
function perceptionToPlainText(perceived: string): string {
  if (!perceived) return "";
  const blocks = [...perceived.matchAll(/【完整文字】([\s\S]*?)(?=【|$)/g)].map((m) => m[1]);
  return (blocks.length ? blocks.join(" ") : perceived).replace(/\s+/g, " ").trim();
}

/** 历史消息去掉图片（已在当轮转成文字），节省 token 并避免重复感知 */
function stripFiles(messages: GuardianUIMessage[]): GuardianUIMessage[] {
  return messages.map((m) => ({ ...m, parts: m.parts.filter((p) => p.type !== "file") }));
}

export async function POST(req: Request) {
  const { messages, profile, clientSide }: { messages: GuardianUIMessage[] } & GuardianRequestBody = await req.json();
  const elderName = profile?.elderName?.slice(0, 10) || "长辈";

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return new Response("bad request", { status: 400 });

  const userText = last.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .slice(0, 4000);
  const images = last.parts
    .filter((p) => p.type === "file" && p.mediaType.startsWith("image/"))
    .slice(0, MAX_IMAGES)
    .map((p) => (p.type === "file" ? parseDataUrl(p.url) : null))
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const qr = (clientSide?.qr ?? []).slice(0, 5);
  const status = aiStatus();

      // ① 端侧预处理结果回显
      const masked = clientSide?.masked ?? [];
      trace({
        step: "privacy",
        status: "done",
        title: "隐私保护",
        detail: masked.length ? `已在本机隐藏 ${masked.map((m) => `${m.label}×${m.count}`).join("、")}` : "本机检查：未发现需要隐藏的敏感信息",
      });

      // ② 多模态感知
      let perceived = "";
      if (images.length > 0) {
        if (status.vision) {
          trace({ step: "perception", status: "running", title: "看图识字", detail: `正在识别 ${images.length} 张图片…` });
          try {
            const results = await Promise.all(
              images.map((img) =>
                generateText({
                  model: visionModel(),
                  maxRetries: 1,
                  messages: [
                    {
                      role: "user",
                      content: [
                        { type: "text", text: PERCEPTION_PROMPT },
                        { type: "image", image: img.data, mediaType: img.mediaType },
                      ],
                    },
                  ],
                }),
              ),
            );
            perceived = results.map((r, i) => `（图${i + 1}）\n${r.text}`).join("\n\n");
            writer.write({ type: "data-perception", id: "perception", data: { images: images.length, text: perceived, qr } });
            trace({ step: "perception", status: "done", title: "看图识字", detail: `识别完成，提取约 ${perceived.length} 字` });
          } catch (e) {
            trace({ step: "perception", status: "error", title: "看图识字", detail: `图片识别失败：${(e as Error).message.slice(0, 60)}` });
          }
        } else {
          trace({ step: "perception", status: "skipped", title: "看图识字", detail: "未配置视觉模型" });
        }
      }

      // ③ 规则引擎初筛（对文字 + 图片识别结果 + 二维码内容统一扫描）
      // 家属端预览：用户原话 + 图片中的文字（去掉感知模块的格式标签）
      const preview = maskPII(
        [userText, perceptionToPlainText(perceived) && `图片文字：${perceptionToPlainText(perceived)}`, qr.length ? `二维码：${qr.join(" ")}` : ""]
          .filter(Boolean)
          .join(" ｜ "),
      ).text.slice(0, 180);
      const analysisText = maskPII([userText, perceived, qr.length ? `二维码内容：${qr.join(" ")}` : ""].filter(Boolean).join("\n")).text;
      const scan = scanText(analysisText);
      const entities = extractEntities(analysisText);
      const injection = detectInjection(analysisText);
      writer.write({
        type: "data-rules",
        id: "rules",
        data: { score: scan.score, signals: scan.signals, entities, injection: injection.hits },
      });
      trace({
        step: "rules",
        status: "done",
        title: "规则初筛",
        detail: scan.signals.length ? `发现 ${scan.signals.length} 个可疑信号，初步风险分 ${scan.score}` : "未命中可疑规则",
      });

      // 大模型不可用 → 兜底
      const fallback = async (reason: string) => {
        const { docs } = await hybridSearch(analysisText || userText, { topK: 3, embedQuery: status.embedding ? embedQuery : undefined });
        const report = buildFallbackReport(scan, docs);
        writer.write({ type: "data-fallback", id: "fallback", data: { reason, report } });
        addAlert({
          elderName,
          level: report.level,
          score: report.score,
          channel: detectChannel(userText, images.length > 0),
          fraudType: report.fraudType,
          headline: report.headline,
          contentPreview: preview,
          reasons: report.reasons,
          familyAdvice: report.familyAdvice,
        });
        trace({ step: "agent", status: "skipped", title: "AI 研判", detail: reason });
        trace({ step: "guard", status: "done", title: "安全兜底", detail: "已用规则引擎和案例库生成保守建议" });
      };

      if (!status.text) {
        await fallback("未配置大模型，已启用规则引擎兜底");
        return;
      }

      // ④ 研判 Agent
      trace({ step: "agent", status: "running", title: "AI 研判", detail: "检索相似案例、核验号码与链接…" });

      const contextBlock = [
        "以下是本轮需要分析的内容（已脱敏）：",
        wrapUntrusted([userText, perceived && `【图片识别结果】\n${perceived}`, qr.length ? `【本机解析的二维码内容】${qr.join("；")}` : ""].filter(Boolean).join("\n\n")),
        "",
        "【系统预分析，仅供参考】",
        `- 规则引擎初步风险分：${scan.score}（${scan.level}）`,
        `- 命中信号：${scan.signals.map((s) => `${s.label}「${s.evidence}」`).join("；") || "无"}`,
        `- 抽取到的号码：${entities.phones.join("、") || "无"}；链接：${entities.urls.join("、") || "无"}`,
        injection.suspicious ? `- ⚠️ 检测到疑似操纵 AI 的语句：${injection.hits.join("；")}` : "",
        `- 用户称呼：${elderName}`,
      ]
        .filter(Boolean)
        .join("\n");
