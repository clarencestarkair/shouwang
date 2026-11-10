"use client";
/**
 * 首页叙事：“40 秒里发生了什么”。
 * 左侧手机随滚动切换状态（收到短信 → 标出可疑句 → AI 分析中 → 整屏警示），
 * 右侧五个步骤各附一组真实测得的数据。所有内容静止时完整可见，滚动只负责高亮当前步骤。
 */
import { useEffect, useRef, useState } from "react";
import { Bell, Brain, Database, Eye, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Eye,
    t: "看懂图片",
    d: "老人拍下小区门口的福利传单。浏览器先压缩图片、在本机解出二维码里的网址，再交给视觉大模型逐字识别。",
    data: [
      ["端侧二维码", "ylbt-gov-cn.top"],
      ["感知 Agent", "18.3 s"],
    ],
  },
  {
    icon: Brain,
    t: "规则初筛",
    d: "30 条可解释规则先扫一遍：神药、冒充政府发补贴、免费送东西、可疑链接后缀……同时检查有没有想操纵 AI 的话。",
    data: [
      ["命中信号", "6 个"],
      ["初筛风险分", "87"],
    ],
  },
  {
    icon: Database,
    t: "翻案例、查链接",
    d: "研判 Agent 自主决定换两种说法检索案例库，并行核验传单上的 400 电话和二维码网址。",
    data: [
      ["检索", "BM25 + 向量 · RRF"],
      ["链接风险", "75 · 冒用官方字样"],
    ],
  },
  {
    icon: ShieldCheck,
    t: "双通道审查",
    d: "模型结论与规则引擎交叉校验，相差两级以上就高不就低；“可以转账”“把验证码告诉他”这类建议一律拦下。",
    data: [
      ["规则 / 最终", "87 / 90"],
      ["危险建议", "0 条"],
    ],
  },
  {
    icon: Bell,
    t: "告诉老人，也告诉家人",
    d: "老人的手机整屏变红，只写三个字；子女端无需刷新就收到提醒，附上“怎么跟妈妈说”。",
    data: [
      ["端到端", "≈ 40 s"],
      ["家属推送", "SSE 实时"],
    ],
  },
];

export function HomeStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <StoryPhone step={active} />
      </div>
      <ol className="space-y-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.t}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-i={i}
              className={cn("glass rounded-[1.5rem] p-6 transition-all duration-500 lg:min-h-[13rem]", active === i ? "border-line-2 opacity-100" : "opacity-60")}
            >
              <div className="flex items-center gap-3">
                <span className={cn("grid size-10 place-items-center rounded-xl transition-colors", active === i ? "bg-ink text-bg" : "bg-surface-3 text-ink-2")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-mono text-xs text-ink-3">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 text-[1.35rem] font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-2 max-w-[34rem] leading-relaxed text-ink-2">{s.d}</p>
              <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
                {s.data.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12px] text-ink-3">{k}</dt>
                    <dd className="tnum mt-0.5 font-mono text-[15px] text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StoryPhone({ step }: { step: number }) {
  const red = step >= 4;
  return (
    <div className="relative mx-auto w-[300px]">
      <div aria-hidden className={cn("absolute -inset-16 rounded-full blur-3xl transition-opacity duration-700", red ? "opacity-100" : "opacity-30")} style={{ background: "radial-gradient(closest-side, oklch(0.62 0.21 30 / 0.45), transparent)" }} />
      <div className="relative rounded-[48px] bg-[#0b0c0e] p-[10px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1.5px_#2c2e33]">
        <div
          className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-[39px] transition-[background] duration-700"
          style={{ background: red ? "radial-gradient(120% 80% at 20% 0%, oklch(0.74 0.19 40), oklch(0.6 0.22 29) 50%, oklch(0.5 0.2 27))" : "oklch(0.985 0.002 260)" }}
        >
          <span className="absolute left-1/2 top-[16px] z-10 h-6 w-[84px] -translate-x-1/2 rounded-full bg-[#0b0c0e]" />
          <div className={cn("flex justify-between px-6 pt-4 font-mono text-[11px] font-semibold", red ? "text-white" : "text-[#16181d]")}>
            <span>9:41</span>
            <span>5G</span>
          </div>
          {red ? (
            <div className="animate-rise flex flex-1 flex-col p-5 text-white">
              <p className="flex justify-between text-[10.5px] font-semibold text-white/85">
                <span>守望 · 极高风险</span>
                <span>90</span>
              </p>
              <p className="mt-5 text-[54px] font-black leading-none tracking-[-0.04em]">别扫码</p>
              <p className="mt-3 text-[14px] font-semibold">假补贴！别扫码，别交 199 元</p>
              <div className="mt-auto space-y-1.5">
                <p className="rounded-xl bg-white/16 px-3 py-2 text-[11.5px]">国家补贴从来不让先交钱</p>
                <p className="rounded-xl bg-white/16 px-3 py-2 text-[11.5px]">二维码指向冒充政府的假网站</p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <span className="rounded-xl bg-white py-2.5 text-center text-[12px] font-bold text-[oklch(0.5_0.2_27)]">打给孩子</span>
                  <span className="rounded-xl bg-black/20 py-2.5 text-center text-[12px] font-semibold">读给我听</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-3 p-4 text-[#16181d]">
              <p className="text-[11px] text-[#7c818c]">发给守望</p>
              <div className="relative ml-auto w-[78%] overflow-hidden rounded-2xl rounded-br-md shadow-md ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/demo/poster-qr.png" alt="小区门口发的福利传单" className="block w-full" />
                {step >= 1 && (
                  <>
                    <span className="animate-rise absolute left-[8%] top-[41%] h-[5%] w-[76%] rounded bg-[oklch(0.62_0.21_30/0.35)] ring-2 ring-[oklch(0.62_0.21_30)]" />
                    <span className="animate-rise absolute left-[29%] top-[58%] h-[24%] w-[42%] rounded ring-2 ring-[oklch(0.62_0.21_30)]" />
                  </>
                )}
              </div>
              {step >= 2 && (
                <div className="animate-rise space-y-1.5 rounded-2xl bg-white p-3 text-[11px] shadow-sm ring-1 ring-black/5">
                  <p className="font-semibold">守望正在分析</p>
                  {["案例检索 · 6 条相关", "链接核验 · 风险 75", step >= 3 ? "安全审查 · 通过" : "研判中…"].map((x) => (
                    <p key={x} className="flex items-center gap-1.5 text-[#4b505b]">
                      <span className="size-1.5 rounded-full bg-[oklch(0.57_0.2_258)]" />
                      {x}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
