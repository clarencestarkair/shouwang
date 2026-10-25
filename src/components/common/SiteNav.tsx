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
