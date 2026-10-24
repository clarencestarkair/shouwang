/**
 * SSE 实时推送：长辈端一旦产生检测结果，子女端看板毫秒级收到预警。
 */
import { subscribe } from "@/lib/store/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
