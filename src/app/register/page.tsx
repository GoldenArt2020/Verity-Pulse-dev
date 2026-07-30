"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { signUp, confirmSignUp, autoSignIn } from "aws-amplify/auth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import "../../../lib/amplify-config";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "confirm">("details");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Fill in all fields.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name },
          autoSignIn: true,
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        toast.success("Check your email for a confirmation code.");
        setStep("confirm");
      } else if (nextStep.signUpStep === "DONE") {
        toast.success("Account created.");
        router.push("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed. Try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!code) {
      toast.error("Enter the confirmation code.");
      return;
    }

    setLoading(true);
    try {
      const { nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      if (nextStep.signUpStep === "COMPLETE_AUTO_SIGN_IN") {
        const { isSignedIn } = await autoSignIn();
        if (isSignedIn) {
          toast.success("Welcome to VerityPulse.");
          router.push("/dashboard");
          return;
        }
      }

      toast.success("Account confirmed. Please sign in.");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Confirmation failed. Try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card w-full max-w-md rounded-[20px] p-10 shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
      >
        {step === "details" ? (
          <>
            <h1 className="font-display text-3xl font-bold text-white">
              Create Workspace
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Start your investigation.
            </p>

            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSignUp}>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-[14px] border-slate-700 bg-slate-900/60 pl-11 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-[14px] border-slate-700 bg-slate-900/60 pl-11 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-[14px] border-slate-700 bg-slate-900/60 pl-11 pr-11 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-base font-semibold shadow-[0_0_0_1px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Workspace"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-white">
              Confirm Your Email
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              We sent a code to {email}.
            </p>

            <form className="mt-8 flex flex-col gap-4" onSubmit={handleConfirm}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Confirmation code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 rounded-[14px] border-slate-700 bg-slate-900/60 text-center text-lg tracking-widest text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />

              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-base font-semibold shadow-[0_0_0_1px_rgba(59,130,246,0.4)] transition-transform hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <a href="/" className="text-blue-400 hover:text-blue-300">
            Sign In
          </a>
        </p>
      </motion.div>
    </div>
  );
}