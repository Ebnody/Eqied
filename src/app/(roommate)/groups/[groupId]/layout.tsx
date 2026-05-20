import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveMember } from "@/lib/roommate/access";
import { tForLocale } from "@/i18n/server";
import { isValidLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { GroupTabs } from "./group-tabs";
import { Badge } from "@/components/ui/badge";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const member = await getActiveMember(groupId);
  if (!member) {
    redirect(`/groups/${groupId}/login`);
  }

  const group = await prisma.roommateGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { select: { fullName: true, telegramUsername: true } },
        },
      },
    },
  });
  if (!group) redirect("/groups");

  const rawLocale = member.user?.preferredLocale ?? "";
  const locale = (isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE) as import("@/i18n/config").Locale;
  const t = tForLocale(locale);

  const tabs = [
    { href: `/groups/${groupId}`, label: t("roommate.page.dashboard") },
    { href: `/groups/${groupId}/expenses`, label: t("roommate.page.expenses") },
    { href: `/groups/${groupId}/loans`, label: t("roommate.page.loans") },
    { href: `/groups/${groupId}/balances`, label: t("roommate.page.balances") },
    { href: `/groups/${groupId}/members`, label: t("roommate.page.members") },
    { href: `/groups/${groupId}/reports`, label: t("roommate.page.reports") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-slate-500 mt-0.5">{group.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="capitalize self-start">
          {t("roommate.page.myRole")}: {member.role === "owner"
            ? t("roommate.page.owner")
            : member.role === "admin"
            ? t("roommate.page.admin")
            : t("roommate.page.member")}
        </Badge>
      </div>

      <GroupTabs tabs={tabs} />

      {children}
    </div>
  );
}
