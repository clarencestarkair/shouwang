/** 家属预警：列表 / 更新状态 / 重置演示数据 */
import { listAlerts, resetAlerts, updateAlertStatus } from "@/lib/store/alerts";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ alerts: listAlerts() });
}

const patchSchema = z.object({ id: z.string(), status: z.enum(["new", "read", "handled"]) });

export async function PATCH(req: Request) {
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "参数错误" }, { status: 400 });
  const alert = updateAlertStatus(parsed.data.id, parsed.data.status);
  return alert ? Response.json({ alert }) : Response.json({ error: "未找到" }, { status: 404 });
}

/** 重置为演示数据（录制视频前使用） */
export async function DELETE() {
  resetAlerts();
  return Response.json({ ok: true });
}
