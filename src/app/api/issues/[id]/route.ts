import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// GET /api/issues/[id] — fetch one ticket with its messages (owner only)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  const issue = await prisma.issueReport.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!issue || issue.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Mark as read by user when they open it
  if (issue.unreadByUser) {
    await prisma.issueReport.update({
      where: { id },
      data: { unreadByUser: false },
    });
  }

  return NextResponse.json({ issue });
}
