import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { GroupsTable, GroupRow } from "./groups-table";

export const dynamic = "force-dynamic";

async function getGroups(): Promise<GroupRow[]> {
  const rows = await prisma.roommateGroup.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      createdBy: { select: { fullName: true, email: true, phone: true } },
      _count: { select: { members: true, expenses: true } },
      expenses: { select: { amount: true } },
    },
  });
  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    members: g._count.members,
    expenses: g._count.expenses,
    totalVolume: g.expenses.reduce((sum, e) => sum + e.amount, 0),
    created: g.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    createdAt: g.createdAt.toISOString(),
    owner:
      g.createdBy.fullName ||
      g.createdBy.email ||
      g.createdBy.phone ||
      "Unknown",
    status: g.archivedAt ? "archived" : "active",
  }));
}

export default async function AdminGroupsPage() {
  const admin = await requireAdmin();
  const groups = await getGroups();
  return (
    <GroupsTable
      groups={groups}
      isSuperAdmin={admin.role === "SUPER_ADMIN"}
    />
  );
}
