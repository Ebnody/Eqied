// Group-session JWT issued after a Telegram-username + group-password login.
// Lives in a separate cookie from the main session and is bound to a single
// RoommateGroupMember row.
//
// A user can have multiple group sessions concurrently (one per group)
// because the cookie name encodes the groupId.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "../prisma";

const GROUP_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short. Set it in your .env file.");
  }
  return new TextEncoder().encode(secret);
}

function cookieNameFor(groupId: string): string {
  return `ethiobudget_group_${groupId}`;
}

interface GroupJwtPayload {
  sub: string; // memberId
  gid: string; // groupId
  uid: string; // userId
  jti: string;
  exp?: number;
  iat?: number;
}

export async function createGroupSession(
  groupId: string,
  memberId: string,
  userId: string
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const jti = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + GROUP_SESSION_DURATION_SECONDS * 1000);

  await prisma.roommateGroupSession.create({
    data: { memberId, jti, expiresAt },
  });

  const token = await new SignJWT({ gid: groupId, uid: userId, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(memberId)
    .setIssuedAt()
    .setExpirationTime(`${GROUP_SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());

  return { token, jti, expiresAt };
}

export async function setGroupSessionCookie(groupId: string, token: string) {
  const jar = await cookies();
  jar.set(cookieNameFor(groupId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GROUP_SESSION_DURATION_SECONDS,
  });
}

export async function clearGroupSessionCookie(groupId: string) {
  const jar = await cookies();
  jar.delete(cookieNameFor(groupId));
}

/**
 * Verify the group cookie and return the active member, or null.
 * Rejects revoked or expired session rows even if the JWT is still in date.
 */
export async function getGroupSessionMember(groupId: string) {
  const jar = await cookies();
  const token = jar.get(cookieNameFor(groupId))?.value;
  if (!token) return null;

  let payload: GroupJwtPayload;
  try {
    const v = await jwtVerify(token, getJwtSecret());
    payload = v.payload as unknown as GroupJwtPayload;
  } catch {
    return null;
  }
  if (payload.gid !== groupId) return null;
  if (typeof payload.sub !== "string") return null;

  const session = await prisma.roommateGroupSession.findUnique({
    where: { jti: payload.jti },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const member = await prisma.roommateGroupMember.findUnique({
    where: { id: payload.sub },
    include: { user: true, group: true },
  });
  if (!member || member.groupId !== groupId) return null;
  return member;
}
