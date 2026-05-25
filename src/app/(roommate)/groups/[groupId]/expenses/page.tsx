import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupExpensesClient from "./client";

export default async function GroupExpensesPage({
  params,
}: {
  params: { groupId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groupId = params.groupId;

  const [expensesRes, groupRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/roommate/groups/${groupId}/expenses`, {
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/roommate/groups/${groupId}`, {
      cache: "no-store",
    }),
  ]);

  const expensesData = expensesRes.ok ? await expensesRes.json() : { expenses: [] };
  const groupData = groupRes.ok ? await groupRes.json() : { members: [] };

  return (
    <GroupExpensesClient
      initialExpenses={expensesData.expenses ?? []}
      initialMembers={groupData.members ?? []}
    />
  );
}
