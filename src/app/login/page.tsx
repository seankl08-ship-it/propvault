import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/albums");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">PropVault</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
