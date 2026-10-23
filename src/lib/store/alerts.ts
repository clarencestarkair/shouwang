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

function persist(alerts: FamilyAlert[]) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(alerts.slice(0, 200), null, 2));
  } catch {
    // 只读文件系统（如 Serverless）下静默忽略，仍保留内存数据
  }
}

export function listAlerts(): FamilyAlert[] {
  return store().alerts;
}

export function addAlert(input: Omit<FamilyAlert, "id" | "createdAt" | "status">): FamilyAlert {
  const s = store();
  const alert: FamilyAlert = { ...input, id: crypto.randomUUID(), createdAt: Date.now(), status: "new" };
  s.alerts.unshift(alert);
  persist(s.alerts);
  s.bus.emit("alert", alert);
  return alert;
}
