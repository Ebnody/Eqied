// GET /api/roommate/groups/[groupId]/balances
// Returns net balance per member plus an optimized settlement plan.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";
import { computeBalances } from "@/lib/roommate/settle";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [members, expenses, loans, settlements] = await Promise.all([
    prisma.roommateGroupMember.findMany({
      where: { groupId },
      include: { user: { select: { fullName: true, telegramUsername: true } } },
    }),
    prisma.roommateExpense.findMany({
      where: { groupId },
      include: { splits: true },
    }),
    prisma.roommateLoan.findMany({ where: { groupId } }),
    prisma.roommateSettlement.findMany({ where: { groupId } }),
  ]);

  const result = computeBalances({
    memberIds: members.map((m) => m.id),
    expenses: expenses.map((e) => ({
      paidByMemberId: e.paidByMemberId,
      splits: e.splits.map((s) => ({ memberId: s.memberId, share: s.share })),
    })),
    loans: loans.map((l) => ({
      lenderMemberId: l.lenderMemberId,
      borrowerMemberId: l.borrowerMemberId,
      outstanding: Math.max(0, l.amount - l.paid),
    })),
    settlements: settlements.map((s) => ({
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: s.amount,
    })),
  });

  const memberMap = new Map(members.map((m) => [m.id, m]));
  return NextResponse.json({
    balances: result.balances.map((b) => {
      const m = memberMap.get(b.memberId);
      return {
        ...b,
        member: m
          ? {
              id: m.id,
              nickname: m.nickname,
              userName: m.user.fullName,
              telegramUsername: m.user.telegramUsername,
            }
          : null,
      };
    }),
    transfers: result.transfers.map((t) => {
      const from = memberMap.get(t.fromMemberId);
      const to = memberMap.get(t.toMemberId);
      return {
        ...t,
        from: from
          ? { id: from.id, name: from.user.fullName ?? from.user.telegramUsername }
          : null,
        to: to
          ? { id: to.id, name: to.user.fullName ?? to.user.telegramUsername }
          : null,
      };
    }),
  });
}
