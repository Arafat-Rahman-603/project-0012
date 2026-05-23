"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { persistTokens } from "@/lib/auth";
import { toast } from "sonner";

function OAuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuthFromResponse, fetchMe } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Google sign-in failed");
      router.replace("/login");
      return;
    }

    if (accessToken) {
      persistTokens(accessToken, refreshToken || undefined);
      setAuthFromResponse({ accessToken, refreshToken: refreshToken || undefined });
      fetchMe().then(() => {
        toast.success("Signed in with Google");
        router.replace("/");
      });
    } else {
      router.replace("/login");
    }
  }, [searchParams, router, setAuthFromResponse, fetchMe]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-amber" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      }
    >
      <OAuthCallback />
    </Suspense>
  );
}
