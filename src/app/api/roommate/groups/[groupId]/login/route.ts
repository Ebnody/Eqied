// POST /api/roommate/groups/[groupId]/login
// Body: { telegramUsername, password }
// Issues a group-session cookie scoped to this group.
//
// Security: the password is the shared group password. To prevent anyone with
// the password from impersonating an arbitrary member by guessing handles,
// the supplied telegramUsername must match a User row that is BOTH a member
// of the group AND has a TelegramLink (i.e. has actually used the bot).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import {
  createGroupSession,
  setGroupSessionCookie,
} from "@/lib/roommate/session";

const schema = z.object({
  telegramUsername: z.string().trim().min(2).max(40),
  password: z.string().min(1).max(100),
});

function normalize(u: string): string {
  return u.replace(/^@/, "").toLowerCase();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
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

  const tgUsername = normalize(parsed.data.telegramUsername);

  const group = await prisma.roommateGroup.findUnique({
    where: { id: groupId },
  });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const passwordOk = await verifyPassword(
    parsed.data.password,
    group.passwordHash
  );
  if (!passwordOk) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const member = await prisma.roommateGroupMember.findFirst({
    where: {
      groupId,
      user: {
        telegramUsername: tgUsername,
        telegramLink: { is: { chatId: { not: undefined } } },
      },
    },
    include: { user: true },
  });
  if (!member) {
    return NextResponse.json(
      {
        error:
          "No member with that Telegram username has joined this group via the bot yet.",
      },
      { status: 401 }
    );
  }

  const { token } = await createGroupSession(groupId, member.id, member.userId);
  await setGroupSessionCookie(groupId, token);

  return NextResponse.json({
    ok: true,
    memberId: member.id,
    role: member.role,
  });
}
