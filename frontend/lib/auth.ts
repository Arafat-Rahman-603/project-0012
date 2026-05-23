import { User } from "@/types";

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: User;
}

export function normalizeUser(user: User & { isVerified?: boolean }): User {
  return {
    ...user,
    isEmailVerified: user.isEmailVerified ?? user.isVerified ?? false,
    wishlist: (user.wishlist || []).map((w) =>
      typeof w === "string" ? w : (w as { _id?: string })._id || String(w)
    ),
  };
}

export function getTokensFromResponse(data: AuthResponse) {
  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  return { accessToken, refreshToken };
}

export function persistTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
