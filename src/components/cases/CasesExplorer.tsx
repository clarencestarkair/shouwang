"use client";
/**
 * 案例库：既是给家属/老人看的反诈课堂，也是 RAG 知识库的可视化窗口——
 * 搜索时展示每条结果由“关键词”还是“语义”通道命中，让检索过程可解释。
 */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDown, Lightbulb, Loader2, Search } from "lucide-react";
import { FRAUD_TYPES, type FraudCase, type FraudType, type RetrievedDoc } from "@/lib/core/types";
import { cn } from "@/lib/utils";
