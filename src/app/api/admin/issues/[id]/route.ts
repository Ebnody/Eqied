import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

// GET /api/admin/issues/[id] — fetch a ticket with messages; marks as read by admin
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;

  const issue = await prisma.issueReport.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          telegramUsername: true,
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (issue.unreadByAdmin) {
    await prisma.issueReport.update({
      where: { id },
      data: { unreadByAdmin: false },
    });
  }

  return NextResponse.json({ issue });
}

const patchSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

// PATCH /api/admin/issues/[id] — change status
export async function PATCH(
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const issue = await prisma.issueReport.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.issueReport.update({
    where: { id },
    data: {
      status: parsed.data.status,
      // When closing/resolving, surface to user as unread so they see the change
      unreadByUser:
        parsed.data.status === "resolved" || parsed.data.status === "closed"
          ? true
          : issue.unreadByUser,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "UPDATE_ISSUE_STATUS",
    resource: "IssueReport",
    resourceId: id,
    details: JSON.stringify({
      from: issue.status,
      to: parsed.data.status,
      subject: issue.subject,
    }),
    req,
  });

  return NextResponse.json({ ok: true, issue: { id: updated.id, status: updated.status } });
}
