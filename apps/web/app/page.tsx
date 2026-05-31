import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already authenticated, go straight to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 text-white font-sans">
      <div className="w-full max-w-2xl text-center space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent sm:text-6xl">
            NIRF Ranking Platform
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-lg mx-auto">
            Automate NIRF data collection, score calculation, and ranking readiness assessment for educational institutions.
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-100">Get Started</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Sign in to access the TLR module dashboard, manage institutions, and track your NIRF ranking scores.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block w-full sm:w-auto rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-10 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            Sign In / Create Account
          </Link>
        </div>

        <p className="text-zinc-600 text-xs">
          Built with Next.js, NestJS, and Supabase.
        </p>
      </div>
    </div>
  );
}
