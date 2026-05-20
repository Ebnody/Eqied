import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  // Require the literal word RESET to prevent accidental wipes.
  confirm: z.literal("RESET"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Type RESET to confirm" },
      { status: 400 }
    );
  }

  // Wipe financial data scoped to this user.
  // Budget cascades to BudgetCategory; Transaction holds an optional FK to
  // ForwardedSms (SetNull) so order matters less, but we delete transactions
  // first to keep things tidy.
  const [
    transactions,
    forwardedSms,
    budgets,
    salaries,
    notifications,
    otpCodes,
  ] = await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId: user.id } }),
    prisma.forwardedSms.deleteMany({ where: { userId: user.id } }),
    prisma.budget.deleteMany({ where: { userId: user.id } }),
    prisma.monthlySalary.deleteMany({ where: { userId: user.id } }),
    prisma.notification.deleteMany({ where: { userId: user.id } }),
    prisma.otpCode.deleteMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      transactions: transactions.count,
      forwardedSms: forwardedSms.count,
      budgets: budgets.count,
      salaries: salaries.count,
      notifications: notifications.count,
      otpCodes: otpCodes.count,
    },
  });
}
