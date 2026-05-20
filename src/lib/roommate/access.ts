// Access-control helpers for roommate groups.
// A user can interact with a group via TWO paths:
//   1. They own a personal account (logged in) AND have a RoommateGroupMember row.
//   2. They have a group-session cookie (Telegram username + group password).
//
// `getActiveMember` returns the membership for the current request, preferring
// the personal-session path when both are present.

import { prisma } from "../prisma";
import { getCurrentUser } from "../auth";
import { getGroupSessionMember } from "./session";

export type MemberRole = "owner" | "admin" | "member";

/**
 * Resolve the current viewer's membership for a given group, or null
 * if they have no access.
 */
export async function getActiveMember(groupId: string) {
  // 1. Personal session first.
  const user = await getCurrentUser();
  if (user) {
    const member = await prisma.roommateGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
      include: { user: true, group: true },
    });
    if (member) return member;
  }

  // 2. Fall back to group-session cookie.
  return getGroupSessionMember(groupId);
}

/**
 * Like getActiveMember but throws a structured error if no access.
 * Callers should catch and convert to a 401/403 response.
 */
export async function requireActiveMember(groupId: string) {
  const member = await getActiveMember(groupId);
  if (!member) {
    const err = new Error("FORBIDDEN");
    (err as Error & { code: string }).code = "FORBIDDEN";
    throw err;
  }
  return member;
}

export function isAtLeastAdmin(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function isOwner(role: string): boolean {
  return role === "owner";
}
