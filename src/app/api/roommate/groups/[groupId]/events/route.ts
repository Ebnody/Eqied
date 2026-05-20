// GET /api/roommate/groups/[groupId]/events
// Server-Sent Events stream of live updates. Clients should EventSource this
// and refetch the relevant section on each event.

import { NextRequest } from "next/server";
import { getActiveMember } from "@/lib/roommate/access";
import { subscribe, type RoommateEvent } from "@/lib/roommate/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Initial hello so the client receives something immediately.
      controller.enqueue(encoder.encode(`: connected ${Date.now()}\n\n`));

      const unsubscribe = subscribe(groupId, (event: RoommateEvent) => {
        const payload = JSON.stringify(event);
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.kind}\ndata: ${payload}\n\n`)
          );
        } catch {
          // controller already closed; ignore.
        }
      });

      // Heartbeat every 25s so proxies don't close idle connections.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Best-effort close handler; Next runtime calls `cancel` on disconnect.
      (controller as unknown as { __cleanup?: () => void }).__cleanup = () => {
        unsubscribe();
        clearInterval(heartbeat);
      };
    },
    cancel() {
      const c = this as unknown as { __cleanup?: () => void };
      if (c.__cleanup) c.__cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
