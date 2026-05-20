// GET  /api/roommate/groups/[groupId]/settlements — list
// POST /api/roommate/groups/[groupId]/settlements — record a manual settlement

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";
import { logActivity } from "@/lib/roommate/activity";
import { publish } from "@/lib/roommate/events";
import { notifySettlement } from "@/lib/roommate/notify";

const schema = z
  .object({
    fromMemberId: z.string().min(1),
    toMemberId: z.string().min(1),
    amount: z.number().int().positive(),
    notes: z.string().max(200).optional().or(z.literal("")),
  })
  .refine((d) => d.fromMemberId !== d.toMemberId, {
    message: "From and to must differ",
    path: ["toMemberId"],
  });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.roommateSettlement.findMany({
    where: { groupId },
    orderBy: { settledAt: "desc" },
    include: {
      fromMember: { include: { user: { select: { fullName: true } } } },
      toMember: { include: { user: { select: { fullName: true } } } },
    },
  });
  return NextResponse.json({ settlements: items });
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const members = await prisma.roommateGroupMember.findMany({
    where: {
      groupId,
      id: { in: [data.fromMemberId, data.toMemberId] },
    },
    select: { id: true },
  });
  if (members.length !== 2) {
    return NextResponse.json(
      { error: "From or to member is not in this group." },
      { status: 400 }
    );
  }

  const settlement = await prisma.roommateSettlement.create({
    data: {
      groupId,
      fromMemberId: data.fromMemberId,
      toMemberId: data.toMemberId,
      amount: data.amount,
      notes: data.notes || null,
    },
    include: {
      fromMember: { include: { user: { select: { fullName: true } } } },
    },
  });

  await logActivity({
    groupId,
    actorMemberId: me.id,
    kind: "settlement",
    payload: {
      settlementId: settlement.id,
      amount: data.amount,
      from: data.fromMemberId,
      to: data.toMemberId,
    },
  });
  publish(groupId, "settlement_recorded", { settlementId: settlement.id });
  publish(groupId, "balances_changed", {});

  // DM the receiver
  const group = await prisma.roommateGroup.findUnique({ where: { id: groupId } });
  notifySettlement({
    groupName: group?.name ?? "your group",
    fromName: settlement.fromMember.user.fullName ?? "Someone",
    toMemberId: settlement.toMemberId,
    amount: settlement.amount,
  }).catch(() => {});

  return NextResponse.json({ settlementId: settlement.id });
}
