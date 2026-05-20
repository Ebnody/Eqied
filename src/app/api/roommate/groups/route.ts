// GET  /api/roommate/groups       — list the current user's group memberships
// POST /api/roommate/groups       — create a new group (creator becomes owner)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/roommate/activity";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  password: z.string().min(6).max(100),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberships = await prisma.roommateGroupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { members: true, expenses: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
  return NextResponse.json({
    groups: memberships.map((m) => ({
      groupId: m.group.id,
      name: m.group.name,
      description: m.group.description,
      memberCount: m.group._count.members,
      expenseCount: m.group._count.expenses,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  const passwordHash = await hashPassword(data.password);

  const group = await prisma.roommateGroup.create({
    data: {
      name: data.name,
      description: data.description || null,
      passwordHash,
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
    include: { members: true },
  });

  const ownerMember = group.members.find((m) => m.userId === user.id);
  await logActivity({
    groupId: group.id,
    actorMemberId: ownerMember?.id,
    kind: "group_created",
    payload: { name: group.name },
  });

  return NextResponse.json({ groupId: group.id });
}
