"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Shield, GraduationCap, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface ProfileMenuProps {
  profile: Partial<Profile> | null;
}

export function ProfileMenu({ profile }: ProfileMenuProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      router.push("/auth/login");
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "administrator":
        return <Shield className="h-3 w-3 mr-1 text-purple-600" />;
      case "recruiter":
        return <Building2 className="h-3 w-3 mr-1 text-blue-600" />;
      default:
        return <GraduationCap className="h-3 w-3 mr-1 text-emerald-600" />;
    }
  };

  const roleLabel = profile?.role || "student";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
          <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-2">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.full_name || "Placement Candidate"}
              </p>
              <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-1.5 flex items-center">
                {getRoleIcon(roleLabel)}
                {roleLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email || "student@placementhub.edu"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Profile & Qualifications</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
