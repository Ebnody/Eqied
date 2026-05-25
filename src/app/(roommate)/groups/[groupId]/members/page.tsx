import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import GroupMembersClient from "./client";

export default async function GroupMembersPage({
  params,
}: {
  params: { groupId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groupId = params.groupId;

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/roommate/groups/${groupId}`, {
    cache: "no-store",
  });

  const data = res.ok ? await res.json() : { members: [], me: { role: "member" } };

  return (
    <GroupMembersClient
      initialMembers={data.members ?? []}
      initialMyRole={data.me?.role ?? "member"}
    />
  );
}
