import { prisma } from "./prisma";
import { NextRequest } from "next/server";

interface LogAdminActionInput {
  adminId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: string;
  req?: NextRequest;
}

export async function logAdminAction(input: LogAdminActionInput) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        details: input.details ?? null,
        ipAddress: input.req?.headers.get("x-forwarded-for") ||
          input.req?.headers.get("x-real-ip") ||
          null,
        userAgent: input.req?.headers.get("user-agent") || null,
      },
    });
  } catch {
    // Silently fail so logging never breaks the main operation
  }
}
