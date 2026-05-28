import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const tokenStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      console.warn("[Storage] SecureStore not available, falling back:", e);
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {}
    }
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (e) {
      console.warn("[Storage] SecureStore set failed, falling back:", e);
    }
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
        return;
      } catch {}
    }
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
    } catch (e) {
      console.warn("[Storage] SecureStore delete failed, falling back:", e);
    }
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
