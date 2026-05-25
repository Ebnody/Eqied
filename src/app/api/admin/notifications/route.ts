import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

interface NotificationItem {
  id: string;
  kind: "ticket" | "user_signup" | "group_created";
  title: string;
  body: string;
  link: string;
  createdAt: string;
  unread: boolean;
}

// GET /api/admin/notifications — aggregated feed of admin-relevant events
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const [unreadTickets, recentUsers, recentGroups] = await Promise.all([
    prisma.issueReport.findMany({
      where: { unreadByAdmin: true },
      orderBy: { lastReplyAt: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            telegramUsername: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: "USER",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        telegramUsername: true,
        createdAt: true,
      },
    }),
    prisma.roommateGroup.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        createdBy: {
          select: { fullName: true, email: true, phone: true },
        },
      },
    }),
  ]);

  function userLabel(u: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    telegramUsername?: string | null;
  }): string {
    return (
      u.fullName ||
      u.email ||
      u.phone ||
      (u.telegramUsername ? `@${u.telegramUsername}` : null) ||
      "Someone"
    );
  }

  const items: NotificationItem[] = [
    ...unreadTickets.map((t) => ({
      id: `ticket-${t.id}`,
      kind: "ticket" as const,
      title: `New message: ${t.subject}`,
      body: `From ${userLabel(t.user)}`,
      link: `/admin/messages?id=${t.id}`,
      createdAt: t.lastReplyAt.toISOString(),
      unread: true,
    })),
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      kind: "user_signup" as const,
      title: "New user signed up",
      body: userLabel(u),
      link: `/admin/users`,
      createdAt: u.createdAt.toISOString(),
      unread: false,
    })),
    ...recentGroups.map((g) => ({
      id: `group-${g.id}`,
      kind: "group_created" as const,
      title: `New group created: ${g.name}`,
      body: `Owner: ${userLabel(g.createdBy)}`,
      link: `/admin/groups`,
      createdAt: g.createdAt.toISOString(),
      unread: false,
    })),
  ];

  // Sort by createdAt desc and cap at 30
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limited = items.slice(0, 30);

  return NextResponse.json({
    items: limited,
    unreadCount: unreadTickets.length,
  });
}
