import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import type { Profile } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  let user = null;
  let profile: Partial<Profile> | null = null;

  try {
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user;

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      profile = (profileData as Profile | null) || {
        id: user.id,
        email: user.email || "",
        full_name: (user.user_metadata?.full_name as string) || "Placement Candidate",
        role: "student",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("Dashboard layout auth error:", err);
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader profile={profile} />
      <div className="flex-1 flex">
        <DashboardSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
