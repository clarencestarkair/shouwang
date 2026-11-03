/**
 * 预计算 RAG 向量索引：pnpm rag:build
 * 读取 data/cases.json + data/knowledge.json，调用向量模型，输出 data/embeddings.json。
 * 运行时检索只需对查询做一次向量化，文档向量全部离线完成，降低延迟与成本。
 */
import fs from "node:fs";
import path from "node:path";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embedMany } from "ai";
import { DOCS } from "../src/lib/core/rag";
