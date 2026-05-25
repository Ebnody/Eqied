import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupLoansClient from "./client";

export default async function GroupLoansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <GroupLoansClient
      initialLoans={[]}
      initialMembers={[]}
    />
  );
}
