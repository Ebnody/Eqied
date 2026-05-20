// POST /api/roommate/groups/[groupId]/loans/[loanId]/payment
// Body: { amount: <santim> }   -- amount being repaid now (positive).
// Updates `paid` and `status` on the loan.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";
import { logActivity } from "@/lib/roommate/activity";
import { publish } from "@/lib/roommate/events";

const schema = z.object({
  amount: z.number().int().positive(),
});

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ groupId: string; loanId: string }>;
  }
) {
  const { groupId, loanId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const loan = await prisma.roommateLoan.findUnique({
    where: { id: loanId },
  });
  if (!loan || loan.groupId !== groupId) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  const remaining = loan.amount - loan.paid;
  if (parsed.data.amount > remaining) {
    return NextResponse.json(
      { error: `Payment exceeds remaining (${remaining} santim).` },
      { status: 400 }
    );
  }

  const newPaid = loan.paid + parsed.data.amount;
  const status = newPaid >= loan.amount ? "paid" : newPaid > 0 ? "partial" : "unpaid";

  const updated = await prisma.roommateLoan.update({
    where: { id: loanId },
    data: { paid: newPaid, status },
  });

  await logActivity({
    groupId,
    actorMemberId: me.id,
    kind: "loan_paid",
    payload: { loanId, payment: parsed.data.amount, paidTotal: newPaid },
  });
  publish(groupId, "loan_updated", { loanId });
  publish(groupId, "balances_changed", {});

  return NextResponse.json({
    loanId: updated.id,
    paid: updated.paid,
    status: updated.status,
  });
}
