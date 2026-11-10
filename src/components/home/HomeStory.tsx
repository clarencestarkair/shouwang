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
