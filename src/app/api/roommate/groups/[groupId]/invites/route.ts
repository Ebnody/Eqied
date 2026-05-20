// POST /api/roommate/groups/[groupId]/invites
// Owner/admin creates an invite for a Telegram username. Returns a deep-link
// the owner can share (e.g. https://t.me/<bot>?start=invite_<token>).
//
// If the invited user already has a TelegramLink (bot chat known) we send
// the invite DM immediately; otherwise we just return the share link.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getActiveMember, isAtLeastAdmin } from "@/lib/roommate/access";
import { sendTelegramMessage } from "@/lib/telegram/send";
import { logActivity } from "@/lib/roommate/activity";

const schema = z.object({
  telegramUsername: z
    .string()
    .trim()
    .regex(/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/, "Invalid Telegram username"),
});

function normalize(u: string): string {
  return u.replace(/^@/, "").toLowerCase();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const me = await getActiveMember(groupId);
  if (!me) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isAtLeastAdmin(me.role)) {
    return NextResponse.json(
      { error: "Only the owner or an admin can invite." },
      { status: 403 }
    );
  }

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

  const tgUsername = normalize(parsed.data.telegramUsername);

  // Don't invite an existing member.
  const existing = await prisma.roommateGroupMember.findFirst({
    where: {
      groupId,
      user: { telegramUsername: tgUsername },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "That user is already a member." },
      { status: 409 }
    );
  }

  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.roommateInvite.create({
    data: {
      groupId,
      telegramUsername: tgUsername,
      token,
      invitedById: me.userId,
      expiresAt,
    },
  });

  await logActivity({
    groupId,
    actorMemberId: me.id,
    kind: "member_invited",
    payload: { inviteId: invite.id, telegramUsername: tgUsername },
  });

  // Build deep-link
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const inviteUrl = botUsername
    ? `https://t.me/${botUsername}?start=invite_${token}`
    : null;

  // If the invited user is already known to the bot, DM them directly.
  let dmSent = false;
  const candidates = await prisma.user.findMany({
    where: { telegramUsername: { not: null } },
    include: { telegramLink: true },
  });
  const known =
    candidates.find(
      (u) => u.telegramUsername!.toLowerCase() === tgUsername
    ) ?? null;
  if (known?.telegramLink?.chatId && inviteUrl) {
    const group = await prisma.roommateGroup.findUnique({
      where: { id: groupId },
    });
    await sendTelegramMessage(
      known.telegramLink.chatId,
      `🏠 You've been invited to join the roommate group "${group?.name}".\n\nTap the link to accept:\n${inviteUrl}`
    );
    dmSent = true;
  }

  return NextResponse.json({
    inviteId: invite.id,
    inviteUrl,
    dmSent,
    telegramUsername: tgUsername,
    expiresAt,
  });
}
