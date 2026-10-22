/**
 * 稳健的 JSON 抽取：兼容不同服务商对结构化输出支持程度的差异，
 * 从模型输出中提取第一个 JSON 对象并用 zod 校验，失败返回 null（由调用方兜底）。
 */
import type { z } from "zod";
