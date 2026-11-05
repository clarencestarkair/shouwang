"use client";
/**
 * 证据标注：在老人发来的原文（或截图识别出的文字）上直接高亮可疑句，
 * 编号与右侧的理由一一对应；规则引擎命中的片段用虚线下划线标出。
 */
import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { RiskReport, RiskSignal } from "@/lib/core/types";
import { cn } from "@/lib/utils";
