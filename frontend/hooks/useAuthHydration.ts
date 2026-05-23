"use client";
import { useAuthStore } from "@/store/authStore";

/** Wait for Zustand persist rehydration before auth-gated redirects. */
export function useAuthHydration() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return { hasHydrated, isAuthenticated, isReady: hasHydrated };
}
