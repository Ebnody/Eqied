import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

// PATCH /api/admin/users/[id] — suspend/unsuspend a user (any admin)
const patchSchema = z.object({
  action: z.enum(["suspend", "unsuspend"]),
  reason: z.string().max(500).optional(),
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

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.id === admin.id) {
    return NextResponse.json(
      { error: "You cannot suspend your own account." },
      { status: 400 }
    );
  }

  if (
    (target.role === "ADMIN" || target.role === "SUPER_ADMIN") &&
    admin.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json(
      { error: "Only a Super Admin can suspend other admins." },
      { status: 403 }
    );
  }

  const isSuspending = parsed.data.action === "suspend";
  const updated = await prisma.user.update({
    where: { id },
    data: {
      disabledAt: isSuspending ? new Date() : null,
      disabledReason: isSuspending ? parsed.data.reason ?? null : null,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: isSuspending ? "SUSPEND_USER" : "UNSUSPEND_USER",
    resource: "User",
    resourceId: target.id,
    details: JSON.stringify({
      targetEmail: target.email,
      targetPhone: target.phone,
      reason: parsed.data.reason ?? null,
    }),
    req,
  });

  return NextResponse.json({
    ok: true,
    user: { id: updated.id, disabledAt: updated.disabledAt },
  });
}

// DELETE /api/admin/users/[id] — hard delete (super admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const superAdmin = await requireSuperAdmin();
  const { id } = await params;

  if (id === superAdmin.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { roommateGroupsOwned: { select: { id: true, name: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Schema sets onDelete: Restrict for owned RoommateGroups, so we must
  // remove those first. Members/expenses/etc. cascade from the group.
  const ownedGroupIds = target.roommateGroupsOwned.map((g) => g.id);
  if (ownedGroupIds.length > 0) {
    await prisma.roommateGroup.deleteMany({
      where: { id: { in: ownedGroupIds } },
    });
  }

  await prisma.user.delete({ where: { id } });

  await logAdminAction({
    adminId: superAdmin.id,
    action: "DELETE_USER",
    resource: "User",
    resourceId: id,
    details: JSON.stringify({
      targetEmail: target.email,
      targetPhone: target.phone,
      targetFullName: target.fullName,
      cascadedGroups: target.roommateGroupsOwned.map((g) => g.name),
    }),
    req,
  });

  return NextResponse.json({ ok: true });
}
