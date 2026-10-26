"use client";
/**
 * 长辈端主界面：一问一答，结论以“风险仪表 + 大字”呈现。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { ArrowRight, ChevronDown, Cpu, Settings2, Volume2 } from "lucide-react";
import { Markdown } from "@/components/common/Markdown";
import type { GuardianRequestBody, GuardianUIMessage } from "@/lib/ai/messages";
import { maskPII } from "@/lib/core/safety";
import { prepareImage } from "@/lib/client/image";
import { speak, stopSpeaking } from "@/lib/client/speech";
import { useSettings } from "@/lib/stores/settings";
import { AgentTrace } from "./AgentTrace";
import { Composer, type ComposerSubmit } from "./Composer";
import { VerdictField } from "@/components/analysis/VerdictField";
import { ScamProgress } from "@/components/analysis/ScamProgress";
import { EvidenceView } from "@/components/analysis/EvidenceView";
import { AgentConsole } from "@/components/analysis/AgentConsole";
import { deriveAnalysis } from "@/components/analysis/derive";
import { SettingsPanel } from "./SettingsPanel";
import { EXAMPLES } from "./examples";
