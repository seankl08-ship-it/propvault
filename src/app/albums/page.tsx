import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AlbumsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Albums</h1>
      <p className="mt-2 text-zinc-500">
        Welcome, {session.user?.name ?? session.user?.email}. Albums will appear here.
      </p>
    </main>
  );
}
