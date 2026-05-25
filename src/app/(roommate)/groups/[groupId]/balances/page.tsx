import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupBalancesClient from "./client";

export default async function GroupBalancesPage({
  params,
}: {
  params: { groupId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groupId = params.groupId;

  const [balancesRes, groupRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/roommate/groups/${groupId}/balances`, {
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/roommate/groups/${groupId}`, {
      cache: "no-store",
    }),
  ]);

  const balancesData = balancesRes.ok ? await balancesRes.json() : { balances: [], transfers: [] };
  const groupData = groupRes.ok ? await groupRes.json() : { members: [] };

  return (
    <GroupBalancesClient
      initialBalances={balancesData.balances ?? []}
      initialTransfers={balancesData.transfers ?? []}
      initialMembers={groupData.members ?? []}
    />
  );
}
