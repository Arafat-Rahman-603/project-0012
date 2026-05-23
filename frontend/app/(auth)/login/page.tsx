"use client";
import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid credentials");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      toast.success("Reset email sent! Check your inbox.");
      setForgotMode(false);
    } catch {
      toast.error("Email not found");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative */}
      <div className="hidden lg:flex w-1/2 bg-ink text-cream flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 stripe-bg opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full border-[50px] border-amber/10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border-[36px] border-white/5 -translate-x-1/3 translate-y-1/3" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-amber rounded-sm flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-ink" />
            </div>
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              EcomStore
            </span>
          </Link>
        </div>

        <div className="relative space-y-6">
          <p
            className="text-5xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome
            <br />
            <em className="text-amber not-italic">Back.</em>
          </p>
          <p className="text-cream/60 text-lg max-w-xs">
            Sign in to continue your shopping journey and discover something
            extraordinary.
          </p>
        </div>

        <div className="relative flex gap-6">
          {[
            { value: "10K+", label: "Products" },
            { value: "50K+", label: "Customers" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {s.value}
              </p>
              <p className="text-xs text-cream/40 tracking-wider uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-ink rounded-sm flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-cream" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                EcomStore
              </span>
            </Link>
          </div>

          {!forgotMode ? (
            <>
              <h2
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign In
              </h2>
              <p className="text-ink/50 text-sm mb-8">
                Don't have an account?{" "}
                <Link href="/register" className="text-amber-500 hover:text-amber-600 font-medium">
                  Create one
                </Link>
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">
                    Email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-ink/50 hover:text-ink transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-ink text-cream font-medium rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-60 text-sm"
                >
                  {isLoading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-ink/10" />
                </div>
                <div className="relative text-center">
                  <span className="bg-cream px-3 text-xs text-ink/40">or continue with</span>
                </div>
              </div>

              <button
                onClick={authApi.googleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 border border-ink/15 rounded-sm text-sm font-medium hover:bg-parchment transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          ) : (
            <>
              <h2
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Reset Password
              </h2>
              <p className="text-ink/50 text-sm mb-8">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleForgot} className="space-y-4">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors"
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 bg-ink text-cream font-medium rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-60 text-sm"
                >
                  {forgotLoading ? "Sending…" : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full text-sm text-ink/50 hover:text-ink transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
