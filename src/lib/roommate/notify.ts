// Sends Telegram DMs to the chat IDs linked to each group member.
// Honors the user's preferredLocale.

import { prisma } from "../prisma";
import { sendTelegramMessage } from "../telegram/send";
import { tForLocale } from "@/i18n/server";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "@/i18n/config";
import { formatETB } from "../utils";

interface MemberRow {
  id: string;
  userId: string;
}

async function chatsForMembers(
  memberIds: string[]
): Promise<Array<{ memberId: string; chatId: string; locale: Locale }>> {
  if (!memberIds.length) return [];
  const members = await prisma.roommateGroupMember.findMany({
    where: { id: { in: memberIds } },
    include: {
      user: {
        select: {
          preferredLocale: true,
          telegramLink: { select: { chatId: true } },
          settings: { select: { telegramNotifications: true } },
        },
      },
    },
  });
  const out: Array<{ memberId: string; chatId: string; locale: Locale }> = [];
  for (const m of members) {
    if (m.user.settings && m.user.settings.telegramNotifications === false) continue;
    const chatId = m.user.telegramLink?.chatId;
    if (!chatId) continue;
    const code = m.user.preferredLocale;
    const locale = isValidLocale(code) ? code : DEFAULT_LOCALE;
    out.push({ memberId: m.id, chatId, locale });
  }
  return out;
}

interface NotifyOptions {
  /** If set, members with these IDs are excluded (typically the actor). */
  excludeMemberIds?: string[];
}

async function fanout(
  recipients: MemberRow[],
  buildText: (locale: Locale) => string,
  opts: NotifyOptions = {}
) {
  const excl = new Set(opts.excludeMemberIds ?? []);
  const targets = await chatsForMembers(
    recipients.map((r) => r.id).filter((id) => !excl.has(id))
  );
  await Promise.allSettled(
    targets.map((t) => sendTelegramMessage(t.chatId, buildText(t.locale)))
  );
}

export async function notifyExpenseAdded(opts: {
  groupId: string;
  groupName: string;
  actorMemberId: string;
  actorName: string;
  amount: number;
  title: string;
  members: MemberRow[];
}) {
  await fanout(
    opts.members,
    (locale) => {
      const t = tForLocale(locale);
      return `💸 ${t("roommate.notify.expenseAdded", {
        actor: opts.actorName,
        amount: formatETB(opts.amount),
        title: opts.title,
        group: opts.groupName,
      })}`;
    },
    { excludeMemberIds: [opts.actorMemberId] }
  );
}

export async function notifyLoanAdded(opts: {
  groupId: string;
  groupName: string;
  lenderName: string;
  borrowerMemberId: string;
  amount: number;
  members: MemberRow[];
}) {
  // Targeted DM to the borrower; informational broadcast to others is noisy.
  const targets = await chatsForMembers([opts.borrowerMemberId]);
  await Promise.allSettled(
    targets.map((t) => {
      const t2 = tForLocale(t.locale);
      return sendTelegramMessage(
        t.chatId,
        `🤝 ${t2("roommate.notify.loanAdded", {
          lender: opts.lenderName,
          amount: formatETB(opts.amount),
          group: opts.groupName,
        })}`
      );
    })
  );
}

export async function notifyMemberJoined(opts: {
  groupName: string;
  newMemberName: string;
  newMemberId: string;
  members: MemberRow[];
}) {
  await fanout(
    opts.members,
    (locale) => {
      const t = tForLocale(locale);
      return `👋 ${t("roommate.notify.memberJoined", {
        name: opts.newMemberName,
        group: opts.groupName,
      })}`;
    },
    { excludeMemberIds: [opts.newMemberId] }
  );
}

export async function notifySettlement(opts: {
  groupName: string;
  fromName: string;
  toMemberId: string;
  amount: number;
}) {
  const targets = await chatsForMembers([opts.toMemberId]);
  await Promise.allSettled(
    targets.map((t) => {
      const tt = tForLocale(t.locale);
      return sendTelegramMessage(
        t.chatId,
        `✅ ${tt("roommate.notify.settlement", {
          from: opts.fromName,
          amount: formatETB(opts.amount),
          group: opts.groupName,
        })}`
      );
    })
  );
}
