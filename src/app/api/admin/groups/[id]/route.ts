import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

// PATCH /api/admin/groups/[id] — archive / unarchive (any admin)
const patchSchema = z.object({
  action: z.enum(["archive", "unarchive"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
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

  const target = await prisma.roommateGroup.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isArchiving = parsed.data.action === "archive";
  const updated = await prisma.roommateGroup.update({
    where: { id },
    data: { archivedAt: isArchiving ? new Date() : null },
  });

  await logAdminAction({
    adminId: admin.id,
    action: isArchiving ? "ARCHIVE_GROUP" : "UNARCHIVE_GROUP",
    resource: "RoommateGroup",
    resourceId: id,
    details: JSON.stringify({ name: target.name }),
    req,
  });

  return NextResponse.json({
    ok: true,
    group: { id: updated.id, archivedAt: updated.archivedAt },
  });
}

// DELETE /api/admin/groups/[id] — hard delete (super admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const superAdmin = await requireSuperAdmin();
  const { id } = await params;

  const target = await prisma.roommateGroup.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await prisma.roommateGroup.delete({ where: { id } });

  await logAdminAction({
    adminId: superAdmin.id,
    action: "DELETE_GROUP",
    resource: "RoommateGroup",
    resourceId: id,
    details: JSON.stringify({ name: target.name }),
    req,
  });

  return NextResponse.json({ ok: true });
}
