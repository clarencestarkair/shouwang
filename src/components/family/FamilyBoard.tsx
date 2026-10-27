"use client";
/**
 * 子女端守护看板：
 * - SSE 实时接收长辈端检测结果，高风险时声音 + 浮层提醒
 * - 本周概览、七日风险分布、诈骗类型分布
 * - 每条预警附带“怎么和爸妈说”的沟通建议（不责备、先共情）
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Check, Copy, MessageCircleHeart, RotateCcw, Sparkles, X } from "lucide-react";
import { ChannelDonut, HourHeatmap, TrendChart, TypeRadar } from "./charts";
import { LEVEL_COLOR, LevelChip, RiskGauge } from "@/components/common/RiskGauge";
import { RISK_LABEL, levelRank, type FamilyAlert, type RiskLevel } from "@/lib/core/types";
import { cn, relativeTime } from "@/lib/utils";
