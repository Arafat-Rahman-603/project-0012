"use client";
import { useState, Suspense } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { setAuthFromResponse } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || code.length !== 6) {
      toast.error("Enter your email and 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyEmailCode(email.trim(), code.trim());
      setAuthFromResponse(data);
      toast.success("Email verified! Welcome.");
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid or expired code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    setResending(true);
    try {
      await authApi.resendVerification(email.trim());
      toast.success("New code sent to your email");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not resend code";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-6"
      >
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-ink rounded-sm flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-cream" />
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            EcomStore
          </span>
        </Link>

        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Verify your email
          </h2>
          <p className="text-ink/60 text-sm">
            We sent a 6-digit code to your inbox. Enter it below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
              className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:border-amber"
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-ink text-cream font-medium rounded-sm hover:bg-ink/90 disabled:opacity-60 text-sm"
          >
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full text-sm text-amber-500 hover:text-amber-600 disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>

        <p className="text-center text-sm text-ink/50">
          <Link href="/login" className="text-ink hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
