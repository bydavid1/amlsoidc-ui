"use client";

import { useParams } from "next/navigation";
import { UserProfile } from "@/features/admin/components/user-profile";

export default function AdminUserProfilePage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <UserProfile userId={params.id} />
    </div>
  );
}
