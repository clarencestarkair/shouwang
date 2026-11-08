"use client";
/**
 * Agent 指挥台页面：左边是老人手机上看到的画面，右边是同一次分析的完整 AI 过程。
 * 用于评审演示——一次输入，同时看到“产品体验”和“技术深度”。
 */
import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, ImageIcon, RotateCcw } from "lucide-react";
import type { GuardianRequestBody, GuardianUIMessage } from "@/lib/ai/messages";
import { maskPII } from "@/lib/core/safety";
import { prepareImage } from "@/lib/client/image";
import { EXAMPLES } from "@/components/elder/examples";
import { AgentConsole } from "./AgentConsole";
import { PhonePreview } from "./PhonePreview";
import { deriveAnalysis } from "./derive";
import { cn } from "@/lib/utils";
