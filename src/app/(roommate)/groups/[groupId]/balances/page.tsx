import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupBalancesClient from "./client";

export default async function GroupBalancesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <GroupBalancesClient
      initialBalances={[]}
      initialTransfers={[]}
      initialMembers={[]}
    />
  );
}
