import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/types";
import { authApi, usersApi } from "@/lib/api";
import {
  normalizeUser,
  getTokensFromResponse,
  persistTokens,
  clearTokens,
  AuthResponse,
} from "@/lib/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setAuthFromResponse: (data: AuthResponse) => void;
  setUser: (user: User) => void;
  updateWishlist: (wishlist: string[]) => void;
  clearAuth: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      setAuthFromResponse: (data) => {
        const { accessToken, refreshToken } = getTokensFromResponse(data);
        persistTokens(accessToken, refreshToken);
        const user = data.user ? normalizeUser(data.user) : get().user;
        set({
          user,
          accessToken: accessToken || get().accessToken,
          isAuthenticated: !!(accessToken || get().accessToken || user),
          isLoading: false,
        });
      },

      clearAuth: () => {
        clearTokens();
        void import("@/store/cartStore").then(({ useCartStore }) => {
          useCartStore.getState().resetCart();
        });
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          get().setAuthFromResponse(data);
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          await authApi.register({ name, email, password });
          set({ isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {}
        get().clearAuth();
      },

      fetchMe: async () => {
        try {
          const { data } = await usersApi.profile();
          const user = normalizeUser(data.user || data);
          set({ user, isAuthenticated: true });
        } catch {
          get().clearAuth();
        }
      },

      setUser: (user) => set({ user: normalizeUser(user) }),

      updateWishlist: (wishlist) => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, wishlist } });
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
