// GET  /api/roommate/groups/[groupId]/loans — list
// POST /api/roommate/groups/[groupId]/loans — record a loan

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";
import { logActivity } from "@/lib/roommate/activity";
import { publish } from "@/lib/roommate/events";
import { notifyLoanAdded } from "@/lib/roommate/notify";

const createSchema = z
  .object({
    lenderMemberId: z.string().min(1),
    borrowerMemberId: z.string().min(1),
    amount: z.number().int().positive(),
    reason: z.string().max(200).optional().or(z.literal("")),
    occurredAt: z.string().datetime().optional(),
  })
  .refine((d) => d.lenderMemberId !== d.borrowerMemberId, {
    message: "Lender and borrower must differ",
    path: ["borrowerMemberId"],
  });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const loans = await prisma.roommateLoan.findMany({
    where: { groupId },
    orderBy: { occurredAt: "desc" },
    include: {
      lender: { include: { user: { select: { fullName: true, telegramUsername: true } } } },
      borrower: { include: { user: { select: { fullName: true, telegramUsername: true } } } },
    },
  });
  return NextResponse.json({ loans });
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

  // Make sure both members belong to this group.
  const members = await prisma.roommateGroupMember.findMany({
    where: {
      groupId,
      id: { in: [data.lenderMemberId, data.borrowerMemberId] },
    },
    select: { id: true },
  });
  if (members.length !== 2) {
    return NextResponse.json(
      { error: "Lender or borrower is not a member of this group." },
      { status: 400 }
    );
  }

  const loan = await prisma.roommateLoan.create({
    data: {
      groupId,
      lenderMemberId: data.lenderMemberId,
      borrowerMemberId: data.borrowerMemberId,
      amount: data.amount,
      reason: data.reason || null,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
    },
    include: {
      lender: { include: { user: { select: { fullName: true } } } },
    },
  });

  await logActivity({
    groupId,
    actorMemberId: me.id,
    kind: "loan_added",
    payload: { loanId: loan.id, amount: loan.amount },
  });
  publish(groupId, "loan_added", { loanId: loan.id });
  publish(groupId, "balances_changed", {});

  // DM the borrower
  const group = await prisma.roommateGroup.findUnique({ where: { id: groupId } });
  notifyLoanAdded({
    groupId,
    groupName: group?.name ?? "your group",
    lenderName: loan.lender.user.fullName ?? "Someone",
    borrowerMemberId: loan.borrowerMemberId,
    amount: loan.amount,
    members: [],
  }).catch(() => {});

  return NextResponse.json({ loanId: loan.id });
}
