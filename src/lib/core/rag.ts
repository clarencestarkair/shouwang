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

// ———————————————————— 中文分词（无词典） ————————————————————

const STOP = new Set("的了是在我你他她它们这那就也都和与及或吗呢吧啊呀哦嗯".split(""));

/**
 * 中文用字级 bigram + unigram，英文/数字按词切分。
 * 对短文本反诈场景（短信、话术）效果稳定，且零依赖、浏览器可用。
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const lower = text.toLowerCase();
  for (const w of lower.match(/[a-z0-9]+/g) ?? []) tokens.push(w);
  const han = lower.replace(/[^一-龥]+/g, " ").split(" ").filter(Boolean);
  for (const seg of han) {
    for (let i = 0; i < seg.length; i++) {
      if (!STOP.has(seg[i])) tokens.push(seg[i]);
      if (i + 1 < seg.length) tokens.push(seg.slice(i, i + 2));
    }
  }
  return tokens;
}
