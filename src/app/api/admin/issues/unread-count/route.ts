import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/issues/unread-count — small endpoint for sidebar badge polling
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const count = await prisma.issueReport.count({
    where: { unreadByAdmin: true },
  });

  return NextResponse.json({ count });
}
