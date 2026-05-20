// GET /api/roommate/groups/[groupId]/reports?from=ISO&to=ISO&format=csv
// CSV export of expenses + loans + settlements within the date range.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatSantim(santim: number): string {
  return (santim / 100).toFixed(2);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) return new Response("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const dateRange: Record<string, Date> = {};
  if (fromParam) dateRange.gte = new Date(fromParam);
  if (toParam) dateRange.lte = new Date(toParam);
  const hasRange = !!(fromParam || toParam);

  const [group, expenses, loans, settlements] = await Promise.all([
    prisma.roommateGroup.findUnique({ where: { id: groupId } }),
    prisma.roommateExpense.findMany({
      where: { groupId, ...(hasRange ? { occurredAt: dateRange } : {}) },
      orderBy: { occurredAt: "asc" },
      include: {
        paidBy: { include: { user: { select: { fullName: true, telegramUsername: true } } } },
        splits: {
          include: {
            member: { include: { user: { select: { fullName: true, telegramUsername: true } } } },
          },
        },
      },
    }),
    prisma.roommateLoan.findMany({
      where: { groupId, ...(hasRange ? { occurredAt: dateRange } : {}) },
      orderBy: { occurredAt: "asc" },
      include: {
        lender: { include: { user: { select: { fullName: true } } } },
        borrower: { include: { user: { select: { fullName: true } } } },
      },
    }),
    prisma.roommateSettlement.findMany({
      where: { groupId, ...(hasRange ? { settledAt: dateRange } : {}) },
      orderBy: { settledAt: "asc" },
      include: {
        fromMember: { include: { user: { select: { fullName: true } } } },
        toMember: { include: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  const lines: string[] = [];
  lines.push(`# Roommate group report: ${group?.name ?? ""}`);
  if (hasRange) {
    lines.push(
      `# Range: ${fromParam ?? ""} → ${toParam ?? ""}`
    );
  }
  lines.push("");

  // Expenses block
  lines.push("# Expenses");
  lines.push("Date,Title,Category,Amount (ETB),Paid By,Split Type,Share Detail");
  for (const e of expenses) {
    const paidBy =
      e.paidBy.user.fullName ?? e.paidBy.user.telegramUsername ?? "";
    const shareDetail = e.splits
      .map((s) => {
        const name = s.member.user.fullName ?? s.member.user.telegramUsername ?? s.memberId;
        return `${name}: ${formatSantim(s.share)}`;
      })
      .join("; ");
    lines.push(
      [
        e.occurredAt.toISOString(),
        escapeCsv(e.title),
        e.categoryKey,
        formatSantim(e.amount),
        escapeCsv(paidBy),
        e.splitType,
        escapeCsv(shareDetail),
      ].join(",")
    );
  }
  lines.push("");

  // Loans block
  lines.push("# Loans");
  lines.push("Date,Lender,Borrower,Amount (ETB),Paid (ETB),Status,Reason");
  for (const l of loans) {
    lines.push(
      [
        l.occurredAt.toISOString(),
        escapeCsv(l.lender.user.fullName ?? ""),
        escapeCsv(l.borrower.user.fullName ?? ""),
        formatSantim(l.amount),
        formatSantim(l.paid),
        l.status,
        escapeCsv(l.reason ?? ""),
      ].join(",")
    );
  }
  lines.push("");

  // Settlements block
  lines.push("# Settlements");
  lines.push("Date,From,To,Amount (ETB),Notes");
  for (const s of settlements) {
    lines.push(
      [
        s.settledAt.toISOString(),
        escapeCsv(s.fromMember.user.fullName ?? ""),
        escapeCsv(s.toMember.user.fullName ?? ""),
        formatSantim(s.amount),
        escapeCsv(s.notes ?? ""),
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  const safeName = (group?.name ?? "group").replace(/[^\w-]+/g, "_");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}-report.csv"`,
    },
  });
}
