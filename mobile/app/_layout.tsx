import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { useAuthStore } from "@/store/authStore";
import { persistTokens, normalizeUser } from "@/lib/auth";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
  });
  
  const { hasHydrated, accessToken, user, fetchMe } = useAuthStore();
  const hasBootstrappedAuth = useRef(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || !accessToken || user || hasBootstrappedAuth.current) {
      return;
    }

    hasBootstrappedAuth.current = true;
    fetchMe().catch(() => {});
  }, [accessToken, fetchMe, hasHydrated, user]);

  // Handle deep links for auth callbacks
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      
      // Handle Google OAuth callback
      if (url.includes("/auth/google/callback") || url.includes("token=")) {
        try {
          // Parse tokens from URL
          const urlObj = new URL(url);
          const params = new URLSearchParams(urlObj.search);
          
          const token = params.get("token");
          const accessToken = params.get("accessToken");
          const refreshToken = params.get("refreshToken");
          const userStr = params.get("user");
          
          if (token || accessToken) {
            // Persist tokens (convert null to undefined)
            await persistTokens(accessToken || token || undefined, refreshToken ?? undefined);
            
            // Parse and normalize user
            let userData = null;
            if (userStr) {
              try {
                userData = normalizeUser(JSON.parse(userStr));
              } catch (e) {
                console.error("Failed to parse user:", e);
              }
            }
            
            // Update auth state
            const { useAuthStore } = await import("@/store/authStore");
            const store = useAuthStore.getState();
            store.setAuthFromResponse({
              accessToken: accessToken || token || undefined,
              refreshToken: refreshToken ?? undefined,
              user: userData ?? undefined,
            });
            
            // Navigate to home
            const { router } = await import("expo-router");
            router.replace("/(tabs)");
          }
        } catch (err) {
          console.error("Failed to handle auth callback:", err);
        }
      }
      
      // Handle email verification
      if (url.includes("/verify-email/")) {
        const match = url.match(/\/verify-email\/([^?]+)/);
        if (match && match[1]) {
          const token = match[1];
          const { router } = await import("expo-router");
          router.push(`/(auth)/verify-email?token=${token}`);
        }
      }
      
      // Handle password reset
      if (url.includes("/reset-password/")) {
        const match = url.match(/\/reset-password\/([^?]+)/);
        if (match && match[1]) {
          const token = match[1];
          const { router } = await import("expo-router");
          router.push({ pathname: "/reset-password/[token]", params: { token } });
        }
      }
    };

    // Subscribe to incoming links
    const subscription = Linking.addEventListener("url", handleDeepLink);
    
    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
