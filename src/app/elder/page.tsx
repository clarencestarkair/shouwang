import type { Metadata } from "next";
import { SiteNav } from "@/components/common/SiteNav";
import { ElderApp } from "@/components/elder/ElderApp";

export const metadata: Metadata = { title: "长辈端 · 守望" };

export default function ElderPage() {
  return (
    <>
      <SiteNav />
      <ElderApp />
    </>
  );
}
