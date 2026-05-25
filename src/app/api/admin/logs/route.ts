import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

export async function GET(req: NextRequest) {
  const superAdmin = await requireSuperAdmin();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const adminId = searchParams.get("adminId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (adminId) where.adminId = adminId;

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.adminLog.count({ where }),
  ]);

  await logAdminAction({
    adminId: superAdmin.id,
    action: "VIEW_LOGS",
    resource: "AdminLog",
    req,
  });

  return NextResponse.json({ logs, total });
}
