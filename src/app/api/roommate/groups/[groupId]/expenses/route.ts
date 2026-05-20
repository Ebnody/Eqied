// GET  /api/roommate/groups/[groupId]/expenses — list (paginated by `limit`)
// POST /api/roommate/groups/[groupId]/expenses — add an expense + splits

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";
import { isRoommateCategory } from "@/lib/roommate/categories";
import { computeSplits, type SplitType } from "@/lib/roommate/splits";
import { logActivity } from "@/lib/roommate/activity";
import { publish } from "@/lib/roommate/events";
import { notifyExpenseAdded } from "@/lib/roommate/notify";

const participantSchema = z.object({
  memberId: z.string().min(1),
  part: z.number().nonnegative().optional(),
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.number().int().positive(), // santim
  categoryKey: z.string().refine(isRoommateCategory, "Unknown category"),
  splitType: z.enum(["equal", "percent", "exact"]),
  paidByMemberId: z.string().min(1),
  participants: z.array(participantSchema).min(1),
  occurredAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const where: Record<string, unknown> = { groupId };
  if (fromParam || toParam) {
    const range: Record<string, Date> = {};
    if (fromParam) range.gte = new Date(fromParam);
    if (toParam) range.lte = new Date(toParam);
    where.occurredAt = range;
  }

  const items = await prisma.roommateExpense.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      splits: true,
      paidBy: { include: { user: { select: { fullName: true, telegramUsername: true } } } },
    },
  });
  return NextResponse.json({ expenses: items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Validate that paidBy + every participant memberId belong to this group.
  const memberIds = Array.from(
    new Set([data.paidByMemberId, ...data.participants.map((p) => p.memberId)])
  );
  const members = await prisma.roommateGroupMember.findMany({
    where: { groupId, id: { in: memberIds } },
    select: { id: true },
  });
  if (members.length !== memberIds.length) {
    return NextResponse.json(
      { error: "One or more members are not in this group." },
      { status: 400 }
    );
  }

  const splitResult = computeSplits(
    data.splitType as SplitType,
    data.amount,
    data.participants
  );
  if (!splitResult.ok) {
    return NextResponse.json(
      { error: splitResult.error.message, code: splitResult.error.code },
      { status: 400 }
    );
  }

  const expense = await prisma.roommateExpense.create({
    data: {
      groupId,
      title: data.title,
      amount: data.amount,
      categoryKey: data.categoryKey,
      splitType: data.splitType,
      paidByMemberId: data.paidByMemberId,
      createdByMemberId: me.id,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      notes: data.notes || null,
      splits: {
        create: splitResult.splits.map((s) => ({
          memberId: s.memberId,
          share: s.share,
        })),
      },
    },
    include: { splits: true },
  });

  await logActivity({
    groupId,
    actorMemberId: me.id,
    kind: "expense_added",
    payload: {
      expenseId: expense.id,
      amount: expense.amount,
      title: expense.title,
    },
  });
  publish(groupId, "expense_added", { expenseId: expense.id });
  publish(groupId, "balances_changed", {});

  // Fire-and-forget Telegram fan-out.
  prisma.roommateGroupMember
    .findMany({
      where: { groupId },
      select: { id: true, userId: true },
    })
    .then((members) => {
      const actorName =
        (me as { user?: { fullName?: string | null } }).user?.fullName ??
        "Someone";
      const groupRow = prisma.roommateGroup.findUnique({ where: { id: groupId } });
      return groupRow.then((g) =>
        notifyExpenseAdded({
          groupId,
          groupName: g?.name ?? "your group",
          actorMemberId: me.id,
          actorName,
          amount: expense.amount,
          title: expense.title,
          members,
        })
      );
    })
    .catch(() => {});

  return NextResponse.json({ expenseId: expense.id });
}
