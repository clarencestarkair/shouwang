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
