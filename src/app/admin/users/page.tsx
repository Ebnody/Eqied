import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { UsersTable, UserRow } from "./users-table";

export const dynamic = "force-dynamic";

async function getUsers(): Promise<UserRow[]> {
  const rows = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isVerified: true,
      disabledAt: true,
      createdAt: true,
      _count: { select: { transactions: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.fullName || u.email || u.phone || "Unnamed",
    email: u.email || "—",
    phone: u.phone || "—",
    status: u.disabledAt
      ? "suspended"
      : u.isVerified
      ? "active"
      : "pending",
    joined: u.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    joinedAt: u.createdAt.toISOString(),
    transactions: u._count.transactions,
  }));
}

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await getUsers();
  return (
    <UsersTable
      users={users}
      adminId={admin.id}
      isSuperAdmin={admin.role === "SUPER_ADMIN"}
    />
  );
}
