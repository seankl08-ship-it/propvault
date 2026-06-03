"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Trophy } from "lucide-react";

const navItems: {
  label: string;
  href: string;
  Icon?: typeof Trophy;
}[] = [
  { label: "Albums", href: "/albums" },
  { label: "Search", href: "/search" },
  { label: "Leaderboard", href: "/leaderboard", Icon: Trophy },
  { label: "Hall of Fame", href: "/hall-of-fame", Icon: Star },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-5 md:flex">
      {navItems.map((item) => {
        const active =
          item.href === "/albums"
            ? pathname === "/albums" || pathname.startsWith("/albums/")
            : pathname.startsWith(item.href);
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative inline-flex items-center gap-1.5 pb-1 font-[family-name:var(--font-montserrat)] text-sm font-semibold transition-colors ${
              active ? "text-white" : "text-white/55 hover:text-white/80"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
            {active && (
              <span className="absolute -bottom-[2px] left-0 h-[3px] w-full rounded-full bg-[var(--cyan)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="hidden flex-1 md:block">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by product code, e.g. 10003…"
        className="h-9 w-full rounded-[10px] border border-white/[0.16] bg-white/[0.10] px-3.5 font-[family-name:var(--font-mukta)] text-sm text-white placeholder:text-white/45 focus:border-[var(--cyan)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(0,174,239,0.25)]"
      />
    </form>
  );
}
