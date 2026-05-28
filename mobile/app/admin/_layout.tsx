import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout() {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    if (user?.role !== "admin") {
      router.replace("/(tabs)/profile");
    }
  }, [hasHydrated, isAuthenticated, router, user?.role]);

  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cream },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="users/index" />
      <Stack.Screen name="settings/index" />
    </Stack>
  );
}
