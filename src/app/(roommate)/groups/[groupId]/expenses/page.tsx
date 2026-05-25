import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupExpensesClient from "./client";

export default async function GroupExpensesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <GroupExpensesClient
      initialExpenses={[]}
      initialMembers={[]}
    />
  );
}
