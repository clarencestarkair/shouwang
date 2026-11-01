import type { Metadata } from "next";
import { SiteNav } from "@/components/common/SiteNav";
import { DrillApp, type DrillScenario } from "@/components/drill/DrillApp";
import { CASES } from "@/lib/core/rag";
import type { FraudType } from "@/lib/core/types";

export const metadata: Metadata = { title: "反诈演练 · 守望" };

/** 精选老年人最高发的几类骗局作为演练剧本（每类取第一个案例） */
const PICK: FraudType[] = ["impersonate_police", "impersonate_relative", "deepfake", "health_product", "pension_scam", "fake_subsidy"];

export default function DrillPage() {
  const scenarios: DrillScenario[] = PICK.map((t) => CASES.find((c) => c.type === t))
    .filter((c) => c !== undefined)
    .map((c) => ({ id: c.id, type: c.type, title: c.title, channel: c.channels[0] ?? "电话", hint: `常见受害人群：${c.targetGroup}` }));
  return (
    <div className="dark-stage grain min-h-dvh">
      <SiteNav />
      <DrillApp scenarios={scenarios} />
    </div>
  );
}
