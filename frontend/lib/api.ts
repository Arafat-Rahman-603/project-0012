import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );
        const accessToken = data.accessToken || data.token;
        if (!accessToken) throw new Error("No access token");
        localStorage.setItem("accessToken", accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
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
  googleLogin: () => {
    window.location.href = `${BASE_URL}/auth/google`;
  },
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
  create: (data: unknown | FormData) => {
    const isFormData = data instanceof FormData;
    return api.post("/orders", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
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
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
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
