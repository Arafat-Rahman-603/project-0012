"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, ShoppingBag } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

export default function VerifyEmailClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { setAuthFromResponse } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    authApi
      .verifyEmail(token)
      .then(({ data }) => {
        setAuthFromResponse(data);
        setStatus("success");
        setTimeout(() => router.push("/"), 3000);
      })
      .catch(() => setStatus("error"));
  }, [token, setAuthFromResponse, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-ink rounded-sm flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-cream" />
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Fancy Planet</span>
        </Link>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-amber animate-spin mx-auto" />
            <p className="text-lg font-semibold">Verifying your email…</p>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Email Verified!</h2>
            <p className="text-ink/60">Your account has been verified. Redirecting to home…</p>
            <Link href="/" className="inline-block px-6 py-2.5 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors">Go to Home</Link>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Verification Failed</h2>
            <p className="text-ink/60">The link may be invalid or expired.</p>
            <Link href="/login" className="inline-block px-6 py-2.5 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors">Back to Login</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
