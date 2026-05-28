import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/constants/Colors";
import { normalizeUser } from "@/lib/auth";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: string;
    error?: string;
    type?: string;
  }>();
  const { setAuthFromResponse, clearAuth } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check for error
        if (params.error) {
          console.error("[AuthCallback] Error:", params.error);
          clearAuth();
          router.replace({ pathname: "/(auth)/login", params: { error: params.error } });
          return;
        }

        // Parse user data
        let userData = null;
        if (params.user) {
          try {
            userData = JSON.parse(params.user);
          } catch (e) {
            console.error("[AuthCallback] Failed to parse user:", e);
          }
        }

        // Get tokens
        const accessToken = params.accessToken || params.token;
        const refreshToken = params.refreshToken;

        if (!accessToken) {
          console.error("[AuthCallback] No access token received");
          clearAuth();
          router.replace("/(auth)/login?error=auth_failed");
          return;
        }

        setAuthFromResponse({
          accessToken,
          refreshToken,
          user: userData ? normalizeUser(userData) : undefined,
        });

        // Handle different callback types
        const callbackType = params.type;
        
        if (callbackType === "email_verification") {
          // Email was verified
          router.replace("/(tabs)?verified=true");
        } else if (callbackType === "password_reset") {
          // Password was reset
          router.replace("/(auth)/login?message=password_reset_success");
        } else {
          // Regular login/signup (Google OAuth or regular)
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        clearAuth();
        router.replace("/(auth)/login?error=auth_failed");
      }
    }

    // Small delay to ensure the component is fully mounted
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.amber} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.cream,
  },
});
