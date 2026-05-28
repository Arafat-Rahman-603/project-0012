import axios from "axios";
import { tokenStorage } from "./storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  let url = "";

  // If explicitly configured in env, use that
  if (process.env.EXPO_PUBLIC_API_URL) {
    url = process.env.EXPO_PUBLIC_API_URL;
    console.log("[API] Found EXPO_PUBLIC_API_URL in env:", url);
  } else {
    // Auto-detect host IP in development
    const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.0.101:8081"
    console.log("[API] Auto-detecting host IP. hostUri is:", hostUri);
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      url = `http://${ip}:5000/api`;
    } else {
      url = "http://localhost:5000/api";
    }
  }

  // On Android emulator, localhost/127.0.0.1 refers to the emulator itself.
  // We must map it to 10.0.2.2 which is the host gateway IP.
  if (Platform.OS === "android") {
    if (url.includes("localhost")) {
      url = url.replace("localhost", "10.0.2.2");
      console.log("[API] Android emulator detected, mapped 'localhost' to '10.0.2.2':", url);
    } else if (url.includes("127.0.0.1")) {
      url = url.replace("127.0.0.1", "10.0.2.2");
      console.log("[API] Android emulator detected, mapped '127.0.0.1' to '10.0.2.2':", url);
    }
  }

  return url;
};

const BASE_URL = getBaseUrl();
console.log("[API] Final BASE_URL resolved to:", BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  console.log(`[API Request] --> ${config.method?.toUpperCase()} ${config.url}`, {
    params: config.params,
  });
  const token = await tokenStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log(`[API Response] <-- ${res.config.method?.toUpperCase()} ${res.config.url} [Status ${res.status}]`);
    return res;
  },
  async (err) => {
    console.error(`[API Error] !!! ${err.config?.method?.toUpperCase()} ${err.config?.url}: ${err.message}`, {
      response: err.response?.data,
      status: err.response?.status,
    });
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await tokenStorage.getItem("refreshToken");
        console.log("[API] 401 Unauthorized. Attempting token refresh...");
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );
        const accessToken = data.accessToken || data.token;
        if (!accessToken) throw new Error("No access token");
        await tokenStorage.setItem("accessToken", accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        console.log("[API] Token refreshed successfully. Retrying original request...");
        return api(original);
      } catch (refreshErr: any) {
        console.error("[API] Token refresh failed:", refreshErr.message);
        await tokenStorage.deleteItem("accessToken");
        await tokenStorage.deleteItem("refreshToken");
        // Navigation is handled at the store level
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.put(`/auth/reset-password/${token}`, { password }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  verifyEmailCode: (email: string, code: string) =>
    api.post("/auth/verify-email-code", { email, code }),
  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }),
  googleLoginUrl: () => `${BASE_URL}/auth/google`,
};

// Products
export const productsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/products", { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData) =>
    api.post("/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/products/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/products/${id}`),
  addReview: (id: string, data: FormData) =>
    api.post(`/products/${id}/reviews`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteReview: (id: string, reviewId: string) =>
    api.delete(`/products/${id}/reviews/${reviewId}`),
};

// Categories
export const categoriesApi = {
  list: () => api.get("/categories"),
  get: (slug: string) => api.get(`/categories/${slug}`),
  create: (data: unknown) => api.post("/categories", data),
  update: (id: string, data: unknown) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Site settings
export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data: FormData) =>
    api.put("/settings", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Cart
export const cartApi = {
  get: () => api.get("/cart"),
  add: (productId: string, quantity: number) =>
    api.post("/cart", { productId, quantity }),
  update: (itemId: string, quantity: number) =>
    api.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId: string) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart"),
};

// Orders
export const ordersApi = {
  create: (data: unknown) => api.post("/orders", data),
  myOrders: () => api.get("/orders/my"),
  get: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
  all: (params?: Record<string, unknown>) => api.get("/orders", { params }),
  stats: () => api.get("/orders/admin/stats"),
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// Users
export const usersApi = {
  profile: () => api.get("/users/profile"),
  updateProfile: (data: unknown) => api.put("/users/profile", data),
  uploadAvatar: (uri: string) => {
    const fd = new FormData();
    const filename = uri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    fd.append("avatar", { uri, name: filename, type } as unknown as Blob);
    return api.put("/users/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  toggleWishlist: (productId: string) =>
    api.post(`/users/wishlist/${productId}`),
  addAddress: (data: unknown) => api.post("/users/addresses", data),
  updateAddress: (id: string, data: unknown) =>
    api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  all: (params?: Record<string, unknown>) => api.get("/users", { params }),
  details: (id: string) => api.get(`/users/${id}/details`),
  update: (id: string, data: unknown) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
