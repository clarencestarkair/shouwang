/**
 * SSE 实时推送：长辈端一旦产生检测结果，子女端看板毫秒级收到预警。
 */
import { subscribe } from "@/lib/store/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          cleanup();
        }
      };
      send("ready", { ts: Date.now() });
      const unsubscribe = subscribe(
        (a) => send("alert", a),
        (a) => send("update", a),
        () => send("reset", {}),
      );
      // 心跳，防止代理断开空闲连接
      const heartbeat = setInterval(() => send("ping", Date.now()), 20000);
      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
