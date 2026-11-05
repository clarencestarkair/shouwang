"use client";
/**
 * 骗局进度条：把所有诈骗共有的四步剧本摆出来，标出骗子已经走到哪一步，
 * 并预判他下一步会让老人做什么——让老人提前识破，而不是事后才知道。
 */
import { ArrowRight, Check, Eye } from "lucide-react";
import { SCAM_STAGES } from "@/lib/core/types";
import { cn } from "@/lib/utils";
