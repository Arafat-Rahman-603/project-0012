"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchMe, isAuthenticated, hasHydrated, accessToken, clearAuth, setHasHydrated } =
    useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, [setHasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    const token =
      accessToken ||
      (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
    if (token) {
      fetchMe();
    } else if (isAuthenticated) {
      clearAuth();
    }
  }, [hasHydrated, accessToken, isAuthenticated, fetchMe, clearAuth]);

  useEffect(() => {
    if (isAuthenticated && hasHydrated) {
      fetchCart();
    }
  }, [isAuthenticated, hasHydrated, fetchCart]);

  return <>{children}</>;
}
