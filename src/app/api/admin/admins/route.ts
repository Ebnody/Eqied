import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/admin-logger";
import { randomBytes } from "crypto";

function generateTempPassword(): string {
  return randomBytes(6).toString("hex").toUpperCase();
}

// GET /api/admin/admins — list all admins (super admin only)
export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "VIEW_ADMINS",
    resource: "Admin",
    req,
  });

  return NextResponse.json({ admins });
}

const createAdminSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
});

// POST /api/admin/admins — create a new admin (super admin only)
export async function POST(req: NextRequest) {
  const superAdmin = await requireSuperAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { fullName, email, phone, role } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email or phone already exists" },
      { status: 409 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const newAdmin = await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      phone: phone || null,
      role,
      passwordHash,
      mustChangePassword: true,
      isVerified: true,
    },
  });

  await sendEmail({
    to: email,
    subject: "Your EthioBudget Admin Account",
    text: `Hello ${fullName},

Your admin account has been created for EthioBudget.

Login URL: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/login
Email: ${email}
Temporary Password: ${tempPassword}

Please log in and change your password immediately.

Best regards,
EthioBudget Team`,
  });

  await logAdminAction({
    adminId: superAdmin.id,
    action: "CREATE_ADMIN",
    resource: "User",
    resourceId: newAdmin.id,
    details: JSON.stringify({ fullName, email, role }),
    req,
  });

  return NextResponse.json({
    ok: true,
    admin: {
      id: newAdmin.id,
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      role: newAdmin.role,
      mustChangePassword: newAdmin.mustChangePassword,
    },
  });
}

// DELETE /api/admin/admins?id=<adminId> — remove an admin (super admin only, can't delete self)
export async function DELETE(req: NextRequest) {
  const superAdmin = await requireSuperAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (id === superAdmin.id) {
    return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || (target.role !== "ADMIN" && target.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  await logAdminAction({
    adminId: superAdmin.id,
    action: "DELETE_ADMIN",
    resource: "User",
    resourceId: id,
    details: JSON.stringify({ fullName: target.fullName, email: target.email, role: target.role }),
    req,
  });

  return NextResponse.json({ ok: true });
}
