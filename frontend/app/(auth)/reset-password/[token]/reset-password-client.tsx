"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Lock, ShoppingBag } from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success("Password reset! Please sign in.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Reset link may have expired");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-ink rounded-sm flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-cream" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Fancy Planet</span>
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>New Password</h1>
          <p className="text-sm text-ink/50 mt-2">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "New Password", value: password, setter: setPassword },
            { label: "Confirm Password", value: confirm, setter: setConfirm },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">{f.label}</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={f.value} required
                  onChange={e => f.setter(e.target.value)}
                  className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors pr-10" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-ink text-cream font-medium rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-60 text-sm">
            <Lock className="w-4 h-4" /> {loading ? "Resetting…" : "Reset Password"}
          </button>
          <Link href="/login" className="block text-center text-sm text-ink/50 hover:text-ink transition-colors">
            Back to Sign In
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
