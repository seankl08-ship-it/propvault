"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Trophy, Menu, X } from "lucide-react";

const navItems: {
  label: string;
  href: string;
  Icon?: typeof Trophy;
}[] = [
  { label: "Albums", href: "/albums" },
  { label: "Leaderboard", href: "/leaderboard", Icon: Trophy },
  { label: "Hall of Fame", href: "/hall-of-fame", Icon: Star },
];

export function TopNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const items = [
    ...navItems,
    ...(isAdmin ? [{ label: "Pick Winners", href: "/admin/pick-winner", Icon: Trophy }] : []),
  ];

  return (
    <nav className="hidden items-center gap-5 md:flex">
      {items.map((item) => {
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

export function MobileMenuButton({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [
    ...navItems,
    ...(isAdmin ? [{ label: "Pick Winners", href: "/admin/pick-winner", Icon: Trophy }] : []),
  ];

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/70 hover:text-white"
        aria-label="Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed right-4 top-[70px] z-50 w-52 overflow-hidden rounded-xl border border-white/10 bg-[var(--ink)] shadow-xl">
          {items.map((item) => {
            const active =
              item.href === "/albums"
                ? pathname === "/albums" || pathname.startsWith("/albums/")
                : pathname.startsWith(item.href);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
        </div>
        </>
      )}
    </div>
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
