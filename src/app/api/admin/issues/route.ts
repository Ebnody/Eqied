import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/issues — list all tickets, optionally filtered by status
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const where: Record<string, unknown> = {};
  if (
    status &&
    ["open", "in_progress", "resolved", "closed"].includes(status)
  ) {
    where.status = status;
  }
  if (search) {
    where.subject = { contains: search, mode: "insensitive" };
  }

  const [issues, unreadCount] = await Promise.all([
    prisma.issueReport.findMany({
      where,
      orderBy: [{ unreadByAdmin: "desc" }, { lastReplyAt: "desc" }],
      take: 200,
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
      },
    }),
    prisma.issueReport.count({ where: { unreadByAdmin: true } }),
  ]);

  return NextResponse.json({ issues, unreadCount });
}
