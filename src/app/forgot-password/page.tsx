"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LegalLinks } from "@/components/layout/LegalLinks";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // Must be on Supabase's Redirect URLs allowlist, or Supabase silently
      // falls back to the project's Site URL and the link lands nowhere useful.
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    // Deliberately show the same confirmation whether or not the address is
    // registered — differentiating them turns this form into an account
    // enumeration oracle. Real failures (rate limits, transport) still surface.
    if (error && !/user not found/i.test(error.message)) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] px-4">
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-blue-400/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card relative z-10 w-full max-w-md rounded-[20px] p-10 shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
      >
        {sent ? (
          <>
            <MailCheck className="h-8 w-8 text-emerald-400" />
            <h1 className="mt-4 font-display text-3xl font-bold text-white">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              If an account exists for <span className="text-white">{email.trim()}</span>, we&apos;ve
              sent a link to reset your password. It expires in one hour.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Nothing arrived? Check your spam folder, or{" "}
              <button
                onClick={() => setSent(false)}
                className="text-blue-400 underline hover:text-blue-300"
              >
                try a different address
              </button>
              .
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-white">Reset Password</h1>
            <p className="mt-2 text-sm text-slate-400">
              We&apos;ll email you a link to set a new one.
            </p>

            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-[14px] border-slate-700 bg-slate-900/60 pl-11 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-base font-semibold shadow-[0_0_0_1px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <LegalLinks className="mt-6" />
      </motion.div>
    </div>
  );
}