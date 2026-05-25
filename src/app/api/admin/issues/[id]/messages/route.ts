import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

const replySchema = z.object({
  body: z.string().trim().min(1).max(5000),
  setStatus: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .optional(),
});

// POST /api/admin/issues/[id]/messages — admin posts a reply
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
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
  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  // Auto-promote to in_progress when admin replies on a fresh open ticket
  const nextStatus =
    parsed.data.setStatus ??
    (issue.status === "open" ? "in_progress" : issue.status);

  const [message] = await prisma.$transaction([
    prisma.issueMessage.create({
      data: {
        issueId: id,
        senderType: "admin",
        senderId: admin.id,
        body: parsed.data.body,
      },
    }),
    prisma.issueReport.update({
      where: { id },
      data: {
        lastReplyAt: now,
        lastReplyBy: "admin",
        unreadByUser: true,
        unreadByAdmin: false,
        status: nextStatus,
      },
    }),
  ]);

  await logAdminAction({
    adminId: admin.id,
    action: "REPLY_ISSUE",
    resource: "IssueReport",
    resourceId: id,
    details: JSON.stringify({
      subject: issue.subject,
      newStatus: nextStatus,
    }),
    req,
  });

  return NextResponse.json({ ok: true, message, status: nextStatus });
}
