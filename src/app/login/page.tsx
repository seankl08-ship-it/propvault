import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BrandStripe } from "@/components/brand-stripe";
import { Wordmark } from "@/components/wordmark";

const eyebrow =
  "font-[family-name:var(--font-montserrat)] font-bold uppercase tracking-[0.14em] text-[11px] text-[var(--ink-3)]";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/albums");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <BrandStripe />

      <header className="flex items-center justify-between px-7 py-5">
        <Wordmark />
        <span className={eyebrow}>Sign in</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-[380px] rounded-[18px] border border-[var(--line)] bg-[var(--paper)] p-[34px]"
          style={{ boxShadow: "0 18px 50px rgba(20,20,30,0.08)" }}
        >
          <h1 className="font-[family-name:var(--font-montserrat)] text-[34px] font-extrabold leading-none tracking-tight text-[var(--ink)]">
            Welcome.
          </h1>
          <p className="mt-2 font-[family-name:var(--font-mukta)] text-[15px] text-[var(--ink-2)]">
            Sign in to access the prop library.
          </p>

          <div className="mt-[26px]">
            <LoginForm />
          </div>

          <div className="my-5 h-px w-full bg-[var(--line)]" />

          <p className="text-center font-[family-name:var(--font-mukta)] text-[13px] text-[var(--ink-3)]">
            Invite-only. Need access? ask an admin.
          </p>
        </div>
      </main>

      <footer className="flex items-center justify-between px-7 py-5">
        <span className={eyebrow}>PropVault · Internal Tool</span>
        <span className={eyebrow}>v0.1 · Shag Carpet Productions</span>
      </footer>
    </div>
  );
}
