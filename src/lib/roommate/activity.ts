// Thin helper for writing to RoommateActivityLog.

import { prisma } from "../prisma";

export type RoommateActivityKind =
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "loan_added"
  | "loan_paid"
  | "settlement"
  | "member_joined"
  | "member_invited"
  | "invite_accepted"
  | "invite_declined"
  | "group_created";

export async function logActivity(opts: {
  groupId: string;
  actorMemberId?: string | null;
  kind: RoommateActivityKind;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.roommateActivityLog.create({
    data: {
      groupId: opts.groupId,
      actorMemberId: opts.actorMemberId ?? null,
      kind: opts.kind,
      payload: opts.payload ? JSON.stringify(opts.payload) : null,
    },
  });
}
