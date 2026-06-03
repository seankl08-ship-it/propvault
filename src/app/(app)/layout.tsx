import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";
import { TopNav, TopSearch } from "@/components/top-nav";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

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
      <header
        className="sticky top-0 z-40 flex h-[62px] items-center gap-[22px] bg-[var(--ink)] px-[22px]"
      >
        <Link href="/albums" className="shrink-0">
          <Wordmark dark size="sm" />
        </Link>
        <TopNav />
        <TopSearch />
        {/* TODO: wire Upload to the active album's upload dialog; links to albums for now */}
        <Button asChild variant="primary" size="sm" className="shrink-0">
          <Link href="/albums">＋ Upload</Link>
        </Button>
        <UserMenu displayName={displayName} />
      </header>
      <main>{children}</main>
    </div>
  );
}
