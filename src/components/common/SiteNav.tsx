"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/elder", label: "长辈端" },
  { href: "/family", label: "子女端" },
  { href: "/drill", label: "反诈演练" },
  { href: "/console", label: "AI 指挥台" },
  { href: "/cases", label: "案例库" },
];

export function SiteNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="守望首页">
          <Wordmark />
        </Link>
        <ul className="ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-surface/70 p-1 text-[14px] shadow-sm [scrollbar-width:none]">
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-ink-2 transition-colors duration-200 hover:text-ink sm:px-3.5",
                    active && "bg-ink text-surface hover:text-surface",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
