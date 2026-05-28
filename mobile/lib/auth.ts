import { tokenStorage } from "./storage";
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

export async function persistTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) await tokenStorage.setItem("accessToken", accessToken);
  if (refreshToken) await tokenStorage.setItem("refreshToken", refreshToken);
}

export async function clearTokens() {
  await tokenStorage.deleteItem("accessToken");
  await tokenStorage.deleteItem("refreshToken");
}

export async function getAccessToken(): Promise<string | null> {
  return tokenStorage.getItem("accessToken");
}

export async function getRefreshToken(): Promise<string | null> {
  return tokenStorage.getItem("refreshToken");
}
