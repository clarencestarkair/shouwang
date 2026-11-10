import Link from "next/link";
import { ArrowRight, Bell, Brain, Check, Cpu, Database, Eye, Lock, ScanText, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/common/SiteNav";
import { Wordmark } from "@/components/common/Logo";
import { HomeStory } from "@/components/home/HomeStory";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { RULE_COUNT } from "@/lib/core/rules";
import { CASES, KNOWLEDGE } from "@/lib/core/rag";

export default function Home() {
  return (
    <div className="dark-stage grain min-h-dvh overflow-x-clip">
      <SiteNav />
      <main>
        {/* ———————— Hero ———————— */}
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute right-[-10rem] top-[-6rem] h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.62_0.21_30/0.32),oklch(0.62_0.21_30/0.06)_55%,transparent_72%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-24">
            <div className="animate-rise">
              <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[oklch(0.75_0.17_35)]">Silver Guardian Agent · 银发反诈守护</p>
              <h1 className="mt-5 text-[3.4rem] font-bold leading-[1.04] tracking-[-0.035em] sm:text-[4.6rem]">
                替爸妈，
                <br />
                多看一眼。
                <span className="mt-3 block text-[0.5em] font-semibold tracking-[-0.02em] text-ink-3">在钱转出去之前。</span>
              </h1>
              <p className="mt-7 max-w-[32rem] text-[1.08rem] leading-relaxed text-ink-2">
                可疑短信拍给它，陌生电话说给它。守望的多个 AI 智能体会看图识字、翻案例、查号码、核链接，用老人一眼能懂的方式告诉他：是不是骗局、现在该做什么，并第一时间告诉家人。
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/elder" className="group inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-bg transition-transform hover:-translate-y-px">
                  我是长辈 <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link href="/family" className="glass inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium">
                  我是子女
                </Link>
                <Link href="/console" className="inline-flex h-12 items-center gap-2 px-3 text-[15px] font-medium text-ink-2 hover:text-ink">
                  <Cpu className="size-4" aria-hidden /> 看 AI 怎么工作
                </Link>
              </div>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
                {[
                  [String(CASES.length + KNOWLEDGE.length), "条反诈知识"],
                  [String(RULE_COUNT), "条可解释规则"],
                  ["100%", "困难样本召回"],
                ].map(([v, k]) => (
                  <div key={k}>
                    <dt className="text-xs text-ink-3">{k}</dt>
                    <dd className="tnum mt-1 text-[1.7rem] font-semibold tracking-tight">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroShowcase />
          </div>
        </section>

        {/* ———————— 叙事：40 秒 ———————— */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent">How it works</p>
              <h2 className="mt-3 text-[2.3rem] font-semibold leading-tight tracking-tight sm:text-[2.9rem]">一张诈骗传单的 40 秒</h2>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-2">下面的数据来自一次真实运行：老人把小区门口发的“领养老补贴”传单拍给守望。</p>
            </div>
            <div className="mt-14">
              <HomeStory />
            </div>
          </div>
        </section>

        {/* ———————— 四个入口 ———————— */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="text-[2.3rem] font-semibold leading-tight tracking-tight sm:text-[2.9rem]">
                骗局针对一个人，
                <br />
                防骗靠一家人。
              </h2>
              <p className="max-w-sm text-ink-2">长辈判断、子女守护、日常演练，再加一个给评委和开发者看的 AI 指挥台。</p>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-6">
              <Tile href="/elder" k="长辈端" t="整屏变色，三个大字" d="识破骗局的那一刻，整屏警示红，只写“别转钱”。原文上标出可疑句，告诉老人骗子下一步会让他做什么。" className="lg:col-span-3">
                <div className="mt-6 flex gap-4">
                  <div className="w-36 shrink-0 rounded-2xl p-4 text-white" style={{ background: "radial-gradient(120% 80% at 20% 0%, oklch(0.74 0.19 40), oklch(0.6 0.22 29) 55%, oklch(0.5 0.2 27))" }}>
                    <p className="text-[10px] text-white/80">守望 · 极高风险</p>
                    <p className="mt-2 text-[30px] font-black leading-none">别转钱</p>
                  </div>
                  <div className="flex-1 space-y-2 text-[12px]">
                    {["冒充身份", "制造恐慌", "要求保密", "要钱"].map((x, i) => (
                      <p key={x} className="flex items-center gap-2">
                        <span className={`grid size-5 place-items-center rounded-full bg-danger text-[10px] font-bold text-bg ${i === 3 ? "ring-4 ring-danger-soft" : ""}`}>{i < 3 ? <Check className="size-3" strokeWidth={3} /> : 4}</span>
                        <span className="text-ink-2">{x}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </Tile>
              <Tile href="/family" k="子女端" t="家庭守护中心" d="实时预警、14 天风险趋势、类型雷达、高发时段热力，AI 每周写一份守护周报。" className="lg:col-span-3">
                <svg viewBox="0 0 300 80" className="mt-6 h-20 w-full" aria-hidden>
                  <defs>
                    <linearGradient id="tileTrend" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,62 L30,40 L60,22 L90,24 L120,46 L150,30 L180,36 L210,18 L240,26 L270,44 L300,38 L300,80 L0,80 Z" fill="url(#tileTrend)" />
                  <path d="M0,62 L30,40 L60,22 L90,24 L120,46 L150,30 L180,36 L210,18 L240,26 L270,44 L300,38" fill="none" stroke="var(--danger)" strokeWidth="2" />
                  <line x1="0" x2="300" y1="34" y2="34" stroke="var(--danger)" strokeOpacity="0.4" strokeDasharray="4 5" />
                </svg>
              </Tile>
              <Tile href="/console" k="AI 指挥台" t="一次分析，两种视角" d="节点图、服务端计时甘特图、规则命中、检索相似度、双通道校验，每一步都看得见。" className="lg:col-span-4">
                <div className="mt-6 flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      [Lock, "脱敏"],
                      [Eye, "感知"],
                      [ScanText, "规则"],
                      [Brain, "研判"],
                      [Database, "检索"],
                      [ShieldCheck, "审查"],
                      [Bell, "通知"],
                    ] as const
                  ).map(([I, l], i, arr) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span className="glass flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px]">
                        <I className="size-3.5 text-ink-2" aria-hidden />
                        {l}
                      </span>
                      {i < arr.length - 1 && <span className="h-px w-3 bg-line-2" />}
                    </span>
                  ))}
                </div>
              </Tile>
              <Tile href="/drill" k="反诈演练" t="让 AI 扮一次骗子" d="剧本来自案例库，AI 教练逐句复盘打分。" className="lg:col-span-2">
                <div className="mt-6 space-y-2 text-[12.5px]">
                  <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-surface-3 px-3 py-2">您涉嫌洗钱，不要告诉家人……</p>
                  <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-accent px-3 py-2 text-bg">我要先问问我儿子</p>
                </div>
              </Tile>
            </div>
          </div>
        </section>

        {/* ———————— 架构 ———————— */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent">Architecture</p>
            <h2 className="mt-3 text-[2.3rem] font-semibold tracking-tight sm:text-[2.9rem]">多智能体流水线，一套可复用的能力核心</h2>
            <div className="mt-12 grid gap-3">
              <Layer name="浏览器端" items={["Next.js 15 · React 19", "PII 脱敏", "jsQR 二维码", "Web Speech 语音", "UI Message Stream"]} />
              <Layer name="智能体" accent items={["感知 Agent · VLM", "规则引擎 · 注入检测", "研判 Agent · Tool Loop", "安全审查 · 双通道", "演练 / 教练 Agent"]} />
              <Layer name="能力核心" items={[`RAG · ${CASES.length} 案例 + ${KNOWLEDGE.length} 常识`, "BM25 + 向量 · RRF", "号码核验", "链接仿冒核验", "MCP Server（stdio / HTTP）"]} />
              <Layer name="模型层" items={["OpenAI 兼容协议", "文本 / 视觉 / 向量分别配置", "通义千问 · DeepSeek · Claude", "无模型时规则兜底"]} />
            </div>
          </div>
        </section>

        {/* ———————— 评测 ———————— */}
        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent">Evaluation</p>
              <h2 className="mt-3 text-[2.3rem] font-semibold leading-tight tracking-tight sm:text-[2.9rem]">
                骗子换个说法，规则就失灵。
                <br />
                守望依然识破。
              </h2>
              <p className="mt-4 leading-relaxed text-ink-2">16 条未参与规则编写的隐蔽样本，真实模型 + 工具调用 + 安全审查跑完整条流水线。</p>
            </div>
            <div className="glass rounded-[1.75rem] p-7">
              <p className="text-sm text-ink-2">困难样本召回率</p>
              <div className="mt-6 space-y-5">
                <Bar label="纯规则引擎" value={12.5} color="var(--surface-3)" />
                <Bar label="守望 · 双通道 Agent" value={100} color="var(--danger)" />
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
                {[
                  ["0%", "常规样本误报"],
                  ["23/23", "单元测试"],
                  ["2.9", "次工具调用 / 分析"],
                ].map(([v, k]) => (
                  <div key={k}>
                    <p className="tnum text-xl font-semibold tracking-tight">{v}</p>
                    <p className="mt-0.5 text-xs text-ink-3">{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-ink-3 sm:px-6">
            <Wordmark />
            <p>第九届传智杯 AI WEB 网页开发挑战赛参赛作品 · 西安交通大学 AIFuture · 遇到诈骗请拨打 110 · 反诈咨询 96110</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Tile({ href, k, t, d, className, children }: { href: string; k: string; t: string; d: string; className?: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className={`glass group relative overflow-hidden rounded-[1.75rem] p-7 transition-colors hover:border-line-2 ${className ?? ""}`}>
      <p className="text-[13px] font-semibold text-ink-3">{k}</p>
      <h3 className="mt-2 text-[1.4rem] font-semibold tracking-tight">{t}</h3>
      <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-ink-2">{d}</p>
      {children}
      <ArrowRight className="absolute right-7 top-7 size-5 text-ink-3 transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

function Layer({ name, items, accent }: { name: string; items: string[]; accent?: boolean }) {
  return (
    <div className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[8rem_1fr] sm:items-center ${accent ? "border-accent/40 bg-accent-soft" : "border-line bg-surface/60"}`}>
      <p className={`text-[14px] font-semibold ${accent ? "text-accent" : "text-ink-2"}`}>{name}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((x) => (
          <span key={x} className="rounded-lg border border-line bg-bg/60 px-3 py-1.5 text-[13px] text-ink">
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="mb-2 text-sm text-ink-2">{label}</p>
      <div className="h-10 overflow-hidden rounded-xl bg-surface-2">
        <div className="flex h-full items-center justify-end rounded-xl px-3" style={{ width: `${Math.max(value, 14)}%`, background: color }}>
          <span className="tnum text-sm font-semibold text-ink">{value}%</span>
        </div>
      </div>
    </div>
  );
}
