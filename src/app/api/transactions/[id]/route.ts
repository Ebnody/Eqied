import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z.object({
  categoryKey: z.string().min(1).optional(),
  status: z.enum(["categorized", "uncategorized", "ignored", "duplicate"]).optional(),
  notes: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 400 });

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updateData: {
    categoryKey?: string;
    status?: string;
    notes?: string;
  } = {};

  if (parsed.data.categoryKey) {
    updateData.categoryKey = parsed.data.categoryKey;
    updateData.status = "categorized";
  }
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const txn = await prisma.transaction.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true, transaction: txn });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
