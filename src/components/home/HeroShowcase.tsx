/**
 * 首屏产品图：用真实界面拼成的“产品合影”——
 * 浏览器里是 AI 指挥台，前面是老人手机上的整屏警示，右上角是子女收到的通知。
 * 所有数字取自一次真实运行（传单图片，端到端 50.7 s）。
 */
import { Bell, Brain, Check, Database, Eye, Lock, ScanText, ShieldCheck } from "lucide-react";

const BARS: [string, number, number, string][] = [
  ["感知 Agent", 0, 29, "var(--accent)"],
  ["规则引擎", 29, 30, "var(--warn)"],
  ["研判 Agent", 30, 84, "var(--danger)"],
  ["↳ 案例检索", 52, 63, "var(--ok)"],
  ["↳ 链接核验", 52, 53, "var(--ok)"],
  ["口语总结", 84, 100, "var(--ink-3)"],
];

export function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem] pb-10 pt-6" aria-hidden>
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,oklch(0.62_0.21_30/0.35),transparent)] blur-2xl" />
