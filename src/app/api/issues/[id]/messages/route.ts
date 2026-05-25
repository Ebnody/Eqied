import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const replySchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

// POST /api/issues/[id]/messages — user posts a reply on their own ticket
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = replySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const issue = await prisma.issueReport.findUnique({ where: { id } });
  if (!issue || issue.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (issue.status === "closed") {
    return NextResponse.json(
      { error: "This ticket is closed. Open a new ticket if you need more help." },
      { status: 400 }
    );
  }

  const now = new Date();
  const [message] = await prisma.$transaction([
    prisma.issueMessage.create({
      data: {
        issueId: id,
        senderType: "user",
        senderId: user.id,
        body: parsed.data.body,
      },
    }),
    prisma.issueReport.update({
      where: { id },
      data: {
        lastReplyAt: now,
        lastReplyBy: "user",
        unreadByAdmin: true,
        // Re-open if the user replies on a resolved ticket
        status: issue.status === "resolved" ? "open" : issue.status,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, message });
}
