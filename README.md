# 守望 · 银发反诈守护 Agent

> 替爸妈，多看一眼。

**守望**是一个面向老年人的多模态反诈守护智能体 Web 应用。老人把拿不准的短信截图、电话内容、聊天记录交给守望，它会像一位懂反诈的晚辈一样：**看图识字 → 翻案例 → 查号码 → 核链接**，最后用风险仪表和一句大白话告诉老人是不是骗局、现在该怎么做；遇到高风险，子女端会实时收到预警和沟通建议。

2026 第九届传智杯全国大学生数智创新与 AI 应用大赛 · AI WEB 网页开发挑战赛参赛作品（研究生组 · 西安交通大学 AIFuture 团队）。

---

## 功能

| 模块 | 说明 |
| --- | --- |
| **长辈端** `/elder` | 按住说话 / 拍照截图 / 粘贴短信；识破骗局时整屏变色 + “别转钱”式大字指令；骗局进度条与下一步预判；原文证据高亮；自动朗读；一键拨打 96110 或子女；三档字号 |
| **子女端** `/family` | 家庭守护中心：多位家人、KPI 周环比、14 天风险趋势、类型雷达、渠道分布、时段热力、AI 守护周报；SSE 实时预警附沟通建议 |
| **AI 指挥台** `/console` | 一次分析两种视角：老人手机画面 + 多智能体节点图、服务端计时甘特图、规则命中、检索相似度、号码/链接核验、双通道校验、token 用量 |
| **反诈演练** `/drill` | AI 根据案例库剧本扮演骗子，老人在零风险环境中练习识破；结束后 AI 教练结构化复盘打分 |
| **案例库** `/cases` | 48 个典型骗局 + 32 条反诈常识；自然语言检索，展示关键词/语义双通道命中情况 |
| **MCP Server** | 反诈能力以 MCP 标准工具开放，Claude Desktop / Cursor 等客户端可直接调用（stdio 与 HTTP 双传输） |

## 技术架构

```
┌──────────────────────────── 浏览器（端侧） ────────────────────────────┐
│ Next.js App Router · React 19 · TypeScript · Tailwind v4 · Zustand      │
│ ① PII 脱敏（身份证/银行卡/验证码） ② 图片压缩 + jsQR 二维码解析          │
│ ③ Web Speech API 语音输入 / 朗读      ④ useChat 流式渲染 · SSE 订阅预警   │
└───────────────┬─────────────────────────────────────────────────────────┘
                │ UI Message Stream（类型安全的流式协议）
┌───────────────▼──────────────── /api/chat 多智能体流水线 ───────────────┐
│ 感知 Agent  ── 视觉大模型识别截图文字与可疑细节                            │
│ 规则引擎    ── 30 条可解释风险规则 · 实体抽取 · 提示词注入检测             │
│ 研判 Agent  ── Tool Loop：searchFraudCases(RAG) / checkPhoneNumber /     │
│               checkUrl / submitRiskReport / notifyFamily                │
│ 安全审查    ── 双通道校验（就高不就低）· 危险建议过滤 · 高风险兜底动作      │
│ 降级兜底    ── 大模型不可用时由规则引擎 + 案例库生成保守建议                 │
└───────┬─────────────────────┬──────────────────────┬────────────────────┘
        │                     │                      │
  RAG 混合检索            家属预警存储            MCP Server
  BM25 + 向量 · RRF     EventEmitter + SSE    stdio / Streamable HTTP
```

- **模型接入**：统一走 OpenAI 兼容协议（Vercel AI SDK v6 + `@ai-sdk/openai-compatible`），文本 / 视觉 / 向量模型可分别配置不同服务商（通义千问、DeepSeek、智谱、硅基流动等）。
- **核心逻辑与框架解耦**：`src/lib/core` 全部是纯函数，Web 端 Agent 与 MCP Server 共用同一实现。

## 快速开始

环境要求：Node.js ≥ 20.12，pnpm ≥ 9。

未配置 `LLM_API_KEY` 时，应用会自动进入**规则引擎兜底模式**，长辈端、子女端、案例库仍可完整演示（反诈演练需要大模型）。

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | 开发 / 构建 / 生产运行 |
| `pnpm typecheck` / `pnpm lint` | 类型检查 / 代码规范 |
| `pnpm test` | 核心模块单元测试（23 项） |
| `pnpm eval` | 离线评测：规则引擎准确率、RAG Hit@3 |
| `pnpm eval:agent <baseUrl> [样本文件]` | 端到端 Agent 评测（真实模型 + 工具 + 安全审查） |
| `pnpm rag:build` | 生成 `data/embeddings.json` 向量索引 |
| `pnpm mcp` | 以 stdio 方式启动 MCP Server |

### 环境变量

见 [`.env.example`](./.env.example)。开发与评测使用的模型为 Claude Opus 5.5（文本 / 视觉）+ text-embedding-3-small（向量），经 OpenAI 兼容网关接入；换用其他服务商时建议先运行 `pnpm eval:agent` 验证效果。最少只需 `LLM_API_KEY`（默认使用通义千问：`qwen-plus` + `qwen-vl-max` + `text-embedding-v3`）。部分模型（如 Claude Opus 5.x）不接受 `temperature`，设置 `LLM_SUPPORTS_TEMPERATURE=false` 即可。

### 部署

```bash
docker compose up -d --build        # 读取 .env.local，预警数据挂载卷持久化
# 或：pnpm build && pnpm start      # Next.js standalone 产物
```

## MCP 接入

守望把 4 个反诈工具与案例资源以 [Model Context Protocol](https://modelcontextprotocol.io) 开放：

| 工具 | 说明 |
| --- | --- |
| `search_fraud_cases` | 案例/知识混合检索 |
| `check_phone_number` | 号码风险核验 |
| `check_url` | 链接仿冒核验 |
| `scan_text_risk` | 规则引擎扫描 + 提示词注入检测 |

**本地（stdio）**，以 Claude Desktop 为例：

```json
{
  "mcpServers": {
    "shouwang": { "command": "pnpm", "args": ["--dir", "/path/to/shouwang", "mcp"] }
  }
}
```

**远程（Streamable HTTP）**：部署后连接 `https://<你的域名>/api/mcp`。

## 评测

端到端评测对每条样本调用真实的 `/api/chat`（测试环境：Claude Opus 5.5 + text-embedding-3-small），对比三个通道。结果文件见 `data/*-agent-results.json`。

**常规评测集** `data/eval.json`（30 例：诈骗 20 例覆盖 14 类 + 提示词注入，正常 10 例）

| 通道 | 准确率 | 精确率 | 召回率 | 误报率 |
| --- | --- | --- | --- | --- |
| 规则引擎 | 96.7% | 100% | 95.0% | 0% |
| 大模型 | 100% | 100% | 100% | 0% |
| **双通道（最终）** | **100%** | **100%** | **100%** | **0%** |

**困难评测集** `data/eval-hard.json`（16 例：未参与规则编写的隐蔽诈骗 8 例 + 易误报正常消息 8 例）

| 通道 | 准确率 | 精确率 | 召回率 | 误报率 |
| --- | --- | --- | --- | --- |
| 规则引擎 | 50.0% | 50.0% | 12.5% | 12.5% |
| **双通道（最终）** | **93.8%** | 88.9% | **100%** | 12.5% |
