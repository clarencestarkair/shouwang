/**
 * RAG 混合检索：BM25（关键词通道）+ 向量检索（语义通道），RRF 融合排序。
 *
 * 为什么混合：
 * - 诈骗话术中“安全账户”“验证码”等关键术语，BM25 命中精准；
 * - 骗子会换说法（“资金清查”“配合调查”），向量检索能捕捉语义相似；
 * - RRF（Reciprocal Rank Fusion）无需对两路分数做归一化，稳健且可解释。
 *
 * 本模块不依赖 AI SDK，向量化函数由调用方注入，因此 MCP Server 也能复用。
 */
import fs from "node:fs";
import path from "node:path";
import casesJson from "../../../data/cases.json";
import knowledgeJson from "../../../data/knowledge.json";
import type { FraudCase, KnowledgeItem, RetrievedDoc } from "./types";

export const CASES = casesJson as FraudCase[];
export const KNOWLEDGE = knowledgeJson as KnowledgeItem[];

interface IndexedDoc {
  id: string;
  kind: "case" | "knowledge";
  title: string;
  /** 送入向量模型 / BM25 的全文 */
  text: string;
  snippet: string;
  fraudType?: FraudCase["type"];
}

/** 构造检索文档；关键词重复两次以提升其 BM25 权重 */
export const DOCS: IndexedDoc[] = [
  ...CASES.map((c) => ({
    id: c.id,
    kind: "case" as const,
    title: c.title,
    fraudType: c.type,
    text: [c.title, c.script, c.process, c.redFlags.join("；"), c.keywords.join(" "), c.keywords.join(" ")].join("\n"),
    snippet: `【${c.title}】典型话术：${c.script}\n识别要点：${c.redFlags.join("；")}\n防范：${c.advice.join("；")}`,
  })),
  ...KNOWLEDGE.map((k) => ({
    id: k.id,
    kind: "knowledge" as const,
    title: k.title,
    text: [k.title, k.content, k.keywords.join(" "), k.keywords.join(" ")].join("\n"),
    snippet: `【${k.title}】${k.content}`,
  })),
];
