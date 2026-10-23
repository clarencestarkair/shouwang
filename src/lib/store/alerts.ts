/**
 * 家属预警存储（服务端单例）+ 发布订阅，用于 SSE 实时推送到子女端看板。
 *
 * 比赛演示版：内存存储 + 本地 JSON 文件持久化（可写时）。
 * 生产环境可替换为 Redis Pub/Sub + PostgreSQL，接口保持不变。
 */
import "server-only";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import type { FamilyAlert } from "@/lib/core/types";
import { seedAlerts } from "./seed";

const FILE = path.join(process.cwd(), "data", "runtime", "alerts.json");

interface AlertStore {
  alerts: FamilyAlert[];
  bus: EventEmitter;
}

const g = globalThis as unknown as { __shouwangAlerts?: AlertStore };

function load(): FamilyAlert[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as FamilyAlert[];
  } catch {
    return seedAlerts();
  }
}
