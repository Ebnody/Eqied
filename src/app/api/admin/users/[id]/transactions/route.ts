import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/users/[id]/transactions — all transactions for a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: id },
    orderBy: { occurredAt: "desc" },
    select: {
      id: true,
      type: true,
      amount: true,
      categoryKey: true,
      source: true,
      paymentMethod: true,
      status: true,
      counterparty: true,
      reference: true,
      occurredAt: true,
      createdAt: true,
      notes: true,
    },
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.fullName },
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.categoryKey ?? "Uncategorized",
      source: t.source,
      method: t.paymentMethod ?? "—",
      status: t.status,
      counterparty: t.counterparty ?? "—",
      reference: t.reference ?? "—",
      occurredAt: t.occurredAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
      notes: t.notes ?? "",
    })),
  });
}
