import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupLoansClient from "./client";

export default async function GroupLoansPage({
  params,
}: {
  params: { groupId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groupId = params.groupId;

  const [loansRes, groupRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/roommate/groups/${groupId}/loans`, {
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/roommate/groups/${groupId}`, {
      cache: "no-store",
    }),
  ]);

  const loansData = loansRes.ok ? await loansRes.json() : { loans: [] };
  const groupData = groupRes.ok ? await groupRes.json() : { members: [] };

  return (
    <GroupLoansClient
      initialLoans={loansData.loans ?? []}
      initialMembers={groupData.members ?? []}
    />
  );
}
