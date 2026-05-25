import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupMembersClient from "./client";

export default async function GroupMembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <GroupMembersClient
      initialMembers={[]}
      initialMyRole="member"
    />
  );
}
