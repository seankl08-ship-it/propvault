"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ displayName }: { displayName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--green)] font-[family-name:var(--font-montserrat)] text-[13px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
        >
          {initials(displayName)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-2)]">
          {displayName}
        </div>
        <DropdownMenuItem
          onClick={() =>
            signOut({ callbackUrl: `${window.location.origin}/login` })
          }
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
