import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { SearchBar } from "@/components/search-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const displayName = session.user?.name ?? session.user?.email ?? "User";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/albums" className="text-lg font-bold tracking-tight">
            PropVault
          </Link>
          <div className="hidden flex-1 justify-center px-4 md:flex">
            <SearchBar />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">
              {displayName}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
