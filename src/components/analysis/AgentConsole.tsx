"use client";
/**
 * AI 指挥台：把一次分析的多智能体流水线完整摊开——
 * 节点图（谁在工作）→ 甘特时间线（每步耗时，来自服务端计时）→ 规则命中 → 检索结果与相似度
 * → 号码/链接核验 → 双通道校验与安全审查 → 模型用量。
 * 数据全部来自真实的流式消息，没有任何模拟值。
 */
import type { ReactNode } from "react";
import { Bell, Brain, Database, Eye, FileCheck2, Gauge as GaugeIcon, Link2, Lock, MessageSquareText, Phone, ScanText, ShieldCheck } from "lucide-react";
import { FRAUD_TYPES, RISK_LABEL } from "@/lib/core/types";
import { cn } from "@/lib/utils";
import { perceptionPlain, type Analysis } from "./derive";

type NodeState = "idle" | "running" | "done" | "skipped" | "error";

interface GNode {
  key: string;
  label: string;
  sub: string;
  icon: typeof Brain;
  state: NodeState;
  ms?: number;
}

function traceState(a: Analysis, step: string): NodeState {
  const t = a.traces[step];
  if (!t) return "idle";
  return t.status === "running" ? "running" : t.status === "skipped" ? "skipped" : t.status === "error" ? "error" : "done";
}

function toolState(state: string): NodeState {
  return state === "output-available" ? "done" : state === "output-error" ? "error" : "running";
}

const fmtMs = (ms?: number) => (ms === undefined ? "" : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`);

export function AgentConsole({ a, className }: { a: Analysis; className?: string }) {
  const hasImage = Boolean(a.perception) || Boolean(a.traces.perception);
  const toolNodes: GNode[] = a.tools
    .filter((t) => t.name !== "submitRiskReport" && t.name !== "notifyFamily")
    .map((t) => ({
      key: t.id,
      label: t.name === "searchFraudCases" ? "案例检索" : t.name === "checkPhoneNumber" ? "号码核验" : "链接核验",
      sub: t.name === "searchFraudCases" ? "RAG · BM25 + 向量" : t.name === "checkPhoneNumber" ? "Function Calling" : "Function Calling",
      icon: t.name === "searchFraudCases" ? Database : t.name === "checkPhoneNumber" ? Phone : Link2,
      state: toolState(t.state),
      ms: t.time?.durationMs,
    }));
  const report = a.tools.find((t) => t.name === "submitRiskReport");

  const stages: (GNode | GNode[])[] = [
    { key: "input", label: "用户输入", sub: hasImage ? "文字 + 图片" : "文字", icon: MessageSquareText, state: "done" },
    { key: "privacy", label: "端侧脱敏", sub: "PII Masking", icon: Lock, state: traceState(a, "privacy"), ms: a.traces.privacy?.at },
    { key: "perception", label: "感知 Agent", sub: hasImage ? "VLM 看图识字" : "无图片，跳过", icon: Eye, state: hasImage ? traceState(a, "perception") : "skipped" },
    { key: "rules", label: "规则引擎", sub: "30 条规则 · 注入检测", icon: ScanText, state: traceState(a, "rules") },
    { key: "agent", label: "研判 Agent", sub: "Tool Loop 规划", icon: Brain, state: traceState(a, "agent") },
    toolNodes.length ? toolNodes : [{ key: "tools", label: "工具调用", sub: "等待规划", icon: Database, state: a.report ? "skipped" : "idle" }],
    { key: "report", label: "结构化报告", sub: "zod schema", icon: FileCheck2, state: a.fallback ? "skipped" : report ? toolState(report.state) : "idle" },
    { key: "guard", label: "安全审查", sub: "双通道 · 护栏", icon: ShieldCheck, state: traceState(a, "guard") },
    { key: "notify", label: "家属通知", sub: "SSE 推送", icon: Bell, state: a.report ? (a.notified ? "done" : "skipped") : "idle" },
  ];

  const running = a.busy || Object.values(a.traces).some((t) => t.status === "running");
  const total = a.meta?.totalMs ?? (Object.values(a.traces).reduce((m, t) => Math.max(m, t.at ?? 0), 0) || undefined);

  return (
    <section aria-label="AI 指挥台" className={cn("dark-stage overflow-hidden rounded-[1.75rem] border border-line", className)}>
      {/* 头部状态栏 */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            {running && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-accent" />}
            <span className={cn("relative size-2.5 rounded-full", running ? "bg-accent" : "bg-ok")} />
          </span>
          <h4 className="text-[15px] font-semibold tracking-tight">Agent 指挥台</h4>
          <span className="text-[13px] text-ink-3">{running ? "分析中" : "已完成"}</span>
        </div>
        <dl className="ml-auto flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px]">
          <Stat k="model" v={a.meta?.model ?? (a.fallback ? "rules-fallback" : "—")} />
          <Stat k="latency" v={fmtMs(total) || "—"} />
          <Stat k="tokens" v={a.meta?.usage?.totalTokens ? `${a.meta.usage.inputTokens ?? 0} in · ${a.meta.usage.outputTokens ?? 0} out` : "—"} />
          <Stat k="tools" v={String(a.tools.length)} />
        </dl>
      </header>

      {/* 节点图 */}
      <div className="px-5 py-6 sm:px-6">
        <ol className="flex flex-wrap items-center gap-y-4">
          {stages.map((s, i) => (
            <li key={i} className="flex items-center">
              {Array.isArray(s) ? (
                <div className="flex flex-col gap-2">
                  {s.map((n) => (
                    <NodeCard key={n.key} n={n} compact />
                  ))}
                </div>
              ) : (
                <NodeCard n={s} />
              )}
              {i < stages.length - 1 && <Connector active={edgeActive(stages, i)} />}
            </li>
          ))}
        </ol>
      </div>

      {/* 甘特时间线 */}
      <Timeline a={a} total={total} />

      {/* 明细面板 */}
      <div className="grid gap-px border-t border-line bg-line md:grid-cols-2 xl:grid-cols-3">
        <Panel title="规则引擎" icon={ScanText} meta={a.rules ? `初筛分 ${a.rules.score}` : undefined}>
          {a.rules ? (
            a.rules.signals.length ? (
              <ul className="space-y-2">
                {[...a.rules.signals].sort((x, y) => y.weight - x.weight).slice(0, 6).map((s) => (
                  <li key={s.id} className="grid grid-cols-[1fr_5rem_2rem] items-center gap-3 text-[13px]">
                    <span className="truncate text-ink">{s.label}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <span className="block h-full rounded-full bg-warn" style={{ width: `${Math.min(100, (s.weight / 45) * 100)}%` }} />
                    </span>
                    <span className="tnum text-right font-mono text-[11px] text-ink-3">+{s.weight}</span>
                  </li>
                ))}
                {a.rules.injection.length > 0 && <li className="rounded-lg bg-danger-soft px-2.5 py-1.5 text-[12px] text-danger">检测到操纵 AI 的语句：{a.rules.injection.join("、")}</li>}
              </ul>
            ) : (
              <Empty>未命中可疑规则</Empty>
            )
          ) : (
            <Empty>等待中…</Empty>
          )}
        </Panel>

        <Panel title="案例检索 · RAG" icon={Database} meta={a.searches.length ? `${a.searches.length} 次检索` : undefined}>
          {a.searches.length ? (
            <div className="space-y-3">
              {a.searches.slice(0, 2).map((q, i) => {
                const max = Math.max(...q.docs.map((d) => d.score), 0.0001);
                return (
                  <div key={i}>
                    <p className="truncate font-mono text-[11px] text-ink-3">query: {q.query}</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {q.docs.slice(0, 3).map((d) => (
                        <li key={d.id} className="grid grid-cols-[3.6rem_1fr_auto] items-center gap-2 text-[12.5px]">
                          <span className="font-mono text-[11px] text-accent">{d.id}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-ink">{d.title}</span>
                            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-surface-3">
                              <span className="block h-full rounded-full bg-accent" style={{ width: `${(d.score / max) * 100}%` }} />
                            </span>
                          </span>
                          <span className="flex gap-1">
                            {d.matchedBy.map((m) => (
                              <span key={m} className="rounded bg-surface-3 px-1 font-mono text-[9.5px] uppercase text-ink-2">
                                {m === "bm25" ? "kw" : "vec"}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>{a.report ? "本次未检索" : "等待 Agent 规划…"}</Empty>
          )}
        </Panel>

        <Panel title="号码 / 链接核验" icon={Phone} meta={a.phones.length + a.urls.length ? `${a.phones.length + a.urls.length} 项` : undefined}>
          {a.phones.length + a.urls.length ? (
            <ul className="space-y-2.5">
              {a.phones.map((p) => (
                <Check key={p.normalized} name={p.input} score={p.riskScore} tags={p.tags} />
              ))}
              {a.urls.map((u) => (
                <Check key={u.input} name={u.hostname ?? u.input} score={u.riskScore} tags={u.tags} />
              ))}
            </ul>
          ) : (
            <Empty>内容中没有需要核验的号码或链接</Empty>
          )}
        </Panel>

        <Panel title="双通道校验 · 安全审查" icon={ShieldCheck} meta={a.report ? RISK_LABEL[a.report.level] : undefined}>
          {a.report ? (
            <div className="space-y-3">
              <DualBar label="规则通道" value={a.rules?.score ?? 0} color="var(--warn)" />
              <DualBar label="模型 + 审查（最终）" value={a.report.score} color="var(--danger)" />
              <p className="text-[12.5px] leading-relaxed text-ink-2">
                {a.report.guardNotes?.length ? a.report.guardNotes.join("；") : "两通道结论一致，未触发修正；危险建议过滤通过。"}
              </p>
              <p className="text-[12px] text-ink-3">
                类型：{a.report.fraudType !== "none" && a.report.fraudType !== "unknown" ? FRAUD_TYPES[a.report.fraudType] : "非诈骗 / 未知"} · 引用 {a.report.citedCases.length} 条依据
              </p>
            </div>
          ) : (
            <Empty>等待报告…</Empty>
          )}
        </Panel>

        <Panel title="多模态感知" icon={Eye} meta={a.perception ? `${a.perception.images} 张图` : undefined}>
          {a.perception ? (
            <div className="space-y-2">
              <p className="line-clamp-6 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-2">{perceptionPlain(a.perception.text)}</p>
              {a.perception.qr.length > 0 && <p className="text-[12px] text-accent">端侧二维码：{a.perception.qr.join("、")}</p>}
            </div>
          ) : (
            <Empty>本次没有图片输入</Empty>
          )}
        </Panel>

        <Panel title="骗局阶段研判" icon={GaugeIcon} meta={a.report?.scamStage ? `第 ${a.report.scamStage} / 4 步` : undefined}>
          {a.report ? (
            <div className="space-y-2.5">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className={cn("h-1.5 flex-1 rounded-full", (a.report?.scamStage ?? 0) >= n ? "bg-danger" : "bg-surface-3")} />
                ))}
              </div>
              <p className="text-[12.5px] leading-relaxed text-ink-2">{a.report.nextMove ? `预判下一步：${a.report.nextMove}` : "未处于诈骗流程中"}</p>
            </div>
          ) : (
            <Empty>等待报告…</Empty>
          )}
        </Panel>
      </div>
    </section>
  );
}

function edgeActive(stages: (GNode | GNode[])[], i: number) {
  const next = stages[i + 1];
  const n = Array.isArray(next) ? next[0] : next;
  return n?.state === "running" || n?.state === "done";
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

function NodeCard({ n, compact }: { n: GNode; compact?: boolean }) {
  const Icon = n.icon;
  return (
    <div
      className={cn(
        "glass relative rounded-2xl transition-all duration-500",
        compact ? "w-[8.5rem] px-3 py-2" : "w-[7.75rem] px-3 py-2.5",
        n.state === "running" && "glow-accent",
        n.state === "idle" && "opacity-40",
        n.state === "skipped" && "opacity-55",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("grid size-7 place-items-center rounded-lg", n.state === "done" ? "bg-ink text-bg" : n.state === "running" ? "bg-accent text-bg" : n.state === "error" ? "bg-danger text-bg" : "bg-surface-3 text-ink-3")}>
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="font-mono text-[10px] text-ink-3">{n.state === "running" ? "running" : n.state === "skipped" ? "skip" : fmtMs(n.ms)}</span>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-tight text-ink">{n.label}</p>
      <p className="mt-0.5 truncate text-[11px] text-ink-3">{n.sub}</p>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return <span aria-hidden className={cn("mx-1 h-0.5 w-4 rounded-full", active ? "flow-line" : "bg-surface-3")} />;
}

function Timeline({ a, total }: { a: Analysis; total?: number }) {
  if (!total) return null;
  const t = a.traces;
  const rows: { label: string; start: number; end: number; color: string }[] = [];
  const privacyEnd = t.privacy?.at ?? 0;
  rows.push({ label: "端侧脱敏", start: 0, end: Math.max(privacyEnd, total * 0.004), color: "var(--ink-3)" });
  let cursor = privacyEnd;
  if (t.perception?.at && t.perception.status !== "running") {
    rows.push({ label: "感知 Agent", start: cursor, end: t.perception.at, color: "var(--accent)" });
    cursor = t.perception.at;
  }
  if (t.rules?.at) {
    rows.push({ label: "规则引擎", start: cursor, end: Math.max(t.rules.at, cursor + total * 0.004), color: "var(--warn)" });
    cursor = t.rules.at;
  }
  const reportTool = a.tools.find((x) => x.name === "submitRiskReport");
  const reportAt = reportTool?.time?.endAt ?? t.guard?.at;
  // 研判 Agent 的推理覆盖从规则结束到提交报告的整段；工具调用嵌套在其中
  if (reportAt) rows.push({ label: "研判 Agent（推理）", start: cursor, end: reportAt, color: "var(--danger)" });
  for (const tool of a.tools) {
    if (!tool.time || tool.name === "submitRiskReport" || tool.name === "notifyFamily") continue;
    rows.push({
      label: tool.name === "searchFraudCases" ? "↳ 案例检索" : tool.name === "checkPhoneNumber" ? "↳ 号码核验" : "↳ 链接核验",
      start: tool.time.startAt,
      end: Math.max(tool.time.endAt ?? tool.time.startAt, tool.time.startAt + total * 0.004),
      color: "var(--ok)",
    });
  }
  if (reportAt && total > reportAt) rows.push({ label: "口语总结（流式）", start: reportAt, end: total, color: "var(--ink-2)" });

  return (
    <div className="border-t border-line px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between text-[12px] text-ink-3">
        <span className="font-semibold uppercase tracking-[0.08em]">时间线 · 服务端计时</span>
        <span className="font-mono">0 — {fmtMs(total)}</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-[12px]">
            <span className="truncate text-ink-2">{r.label}</span>
            <span className="relative h-2.5 rounded-full bg-surface-2">
              <span className="absolute inset-y-0 rounded-full" style={{ left: `${(r.start / total) * 100}%`, width: `${Math.max(0.6, ((r.end - r.start) / total) * 100)}%`, background: r.color }} />
            </span>
            <span className="tnum text-right font-mono text-[11px] text-ink-3">{fmtMs(r.end - r.start)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
