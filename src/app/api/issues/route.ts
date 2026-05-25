import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const createSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  category: z
    .enum(["bug", "payment", "feature", "account", "other"])
    .default("other"),
  body: z.string().trim().min(5).max(5000),
});

// GET /api/issues — list current user's tickets
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const issues = await prisma.issueReport.findMany({
    where: { userId: user.id },
    orderBy: { lastReplyAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      category: true,
      status: true,
      lastReplyAt: true,
      lastReplyBy: true,
      unreadByUser: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ issues });
}

// POST /api/issues — create a new ticket with the first message
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const issue = await prisma.issueReport.create({
    data: {
      userId: user.id,
      subject: parsed.data.subject,
      category: parsed.data.category,
      lastReplyBy: "user",
      unreadByAdmin: true,
      messages: {
        create: {
          senderType: "user",
          senderId: user.id,
          body: parsed.data.body,
        },
      },
    },
    select: { id: true, subject: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, issue });
}
