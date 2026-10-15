import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 相对时间：刚刚 / 5 分钟前 / 昨天 14:20 */
export function relativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts;
  if (diff < 60e3) return "刚刚";
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)} 分钟前`;
  const d = new Date(ts);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (diff < 24 * 3600e3 && new Date(now).getDate() === d.getDate()) return `今天 ${hm}`;
  if (diff < 48 * 3600e3) return `昨天 ${hm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}
