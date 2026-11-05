/**
 * 从一条助手消息（+ 对应的用户消息）中派生出分析视图需要的全部数据：
 * 报告、规则命中、感知结果、工具调用、计时、模型用量。
 */
import type { GuardianUIMessage, RulesData, PerceptionData, TraceData, ToolTimeData, GuardianMetadata } from "@/lib/ai/messages";
import type { RiskReport, RetrievedDoc, PhoneCheckResult, UrlCheckResult } from "@/lib/core/types";

export interface ToolRun {
  id: string;
  name: "searchFraudCases" | "checkPhoneNumber" | "checkUrl" | "submitRiskReport" | "notifyFamily";
  state: string;
  input: unknown;
  output: unknown;
  time?: ToolTimeData;
}

export interface Analysis {
  report: RiskReport | null;
  notified: boolean;
  fallback: boolean;
  rules: RulesData | null;
  perception: PerceptionData | null;
  traces: Record<string, TraceData>;
  tools: ToolRun[];
  searches: { query: string; docs: RetrievedDoc[]; channels?: { bm25: boolean; vector: boolean } }[];
  phones: PhoneCheckResult[];
  urls: UrlCheckResult[];
  meta: GuardianMetadata | undefined;
  finalText: string;
  sourceText: string;
  busy: boolean;
}

/** 感知结果中取出【完整文字】段落 */
export function perceptionPlain(text: string): string {
  const blocks = [...text.matchAll(/【完整文字】([\s\S]*?)(?=【|$)/g)].map((m) => m[1].trim());
  return (blocks.length ? blocks.join("\n") : text).trim();
}

export function deriveAnalysis(message: GuardianUIMessage, userMessage: GuardianUIMessage | undefined, busy: boolean): Analysis {
  const a: Analysis = {
    report: null,
    notified: false,
    fallback: false,
    rules: null,
    perception: null,
    traces: {},
    tools: [],
    searches: [],
    phones: [],
    urls: [],
    meta: message.metadata,
    finalText: "",
    sourceText: "",
    busy,
  };
  const times = new Map<string, ToolTimeData>();
  const texts: string[] = [];
  for (const p of message.parts) {
    switch (p.type) {
      case "data-trace":
        a.traces[p.data.step] = p.data;
        break;
      case "data-rules":
        a.rules = p.data;
        break;
      case "data-perception":
        a.perception = p.data;
        break;
      case "data-tooltime":
        times.set(p.data.toolCallId, p.data);
        break;
      case "data-fallback":
        a.report = p.data.report;
        a.notified = p.data.report.notifyFamily;
        a.fallback = true;
        break;
      case "text":
        texts.push(p.text);
        break;
      default:
        if (p.type.startsWith("tool-")) {
          const t = p as unknown as { type: string; toolCallId: string; state: string; input: unknown; output: unknown };
          a.tools.push({ id: t.toolCallId, name: t.type.slice(5) as ToolRun["name"], state: t.state, input: t.input, output: t.output });
          if (t.state === "output-available") {
            if (t.type === "tool-submitRiskReport") {
              const o = t.output as { report: RiskReport; notified: boolean };
              a.report = o.report;
              a.notified = o.notified;
            } else if (t.type === "tool-searchFraudCases") {
              const o = t.output as { results: RetrievedDoc[]; channels: { bm25: boolean; vector: boolean } };
              a.searches.push({ query: (t.input as { query: string }).query, docs: o.results, channels: o.channels });
            } else if (t.type === "tool-checkPhoneNumber") a.phones.push(t.output as PhoneCheckResult);
            else if (t.type === "tool-checkUrl") a.urls.push(t.output as UrlCheckResult);
          }
        }
    }
  }
  for (const t of a.tools) t.time = times.get(t.id);
  a.finalText = texts.join("\n").trim();
  const userText = userMessage?.parts.filter((p) => p.type === "text").map((p) => (p.type === "text" ? p.text : "")).join("\n") ?? "";
  a.sourceText = [userText, a.perception ? perceptionPlain(a.perception.text) : ""].filter(Boolean).join("\n\n");
  return a;
}
