// GET /api/roommate/groups/[groupId] — group detail (members, my membership)
// DELETE /api/roommate/groups/[groupId] — delete group (owner only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const group = await prisma.roommateGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              telegramUsername: true,
              telegramLink: { select: { chatId: true } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
    },
    me: { memberId: me.id, role: me.role },
    members: group.members.map((m) => ({
      id: m.id,
      role: m.role,
      nickname: m.nickname,
      joinedAt: m.joinedAt,
      user: {
        id: m.user.id,
        fullName: m.user.fullName,
        telegramUsername: m.user.telegramUsername,
        hasTelegram: !!m.user.telegramLink,
      },
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me || me.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.roommateGroup.delete({ where: { id: groupId } });
  return NextResponse.json({ ok: true });
}
