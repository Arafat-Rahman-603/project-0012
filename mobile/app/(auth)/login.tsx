import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string; verified?: string }>();
  const { login, isLoading } = useAuthStore();
  const { toast, hide, success, error: showError, info } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Handle params
  useEffect(() => {
    if (params.error) {
      showError(decodeURIComponent(params.error));
    }
    if (params.verified) {
      success("Email verified successfully! Please sign in.");
    }
  }, [params]);

  // Handle deep links for Google OAuth
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      
      // Only handle auth callback URLs
      if (!url.includes("auth/callback") && !url.includes("token=")) {
        return;
      }

      try {
        setGoogleLoading(true);
        
        // Parse URL
        const urlObj = new URL(url);
        const searchParams = new URLSearchParams(urlObj.search);
        
        // Extract tokens and user data
        const token = searchParams.get("token");
        const accessToken = searchParams.get("accessToken") || token;
        const refreshToken = searchParams.get("refreshToken");
        const userStr = searchParams.get("user");
        const error = searchParams.get("error");
        
        if (error) {
          throw new Error(error);
        }
        
        if (!accessToken) {
          throw new Error("No access token received from server");
        }

        // Import auth utilities dynamically
        const { persistTokens, normalizeUser } = await import("@/lib/auth");
        const { useAuthStore } = await import("@/store/authStore");
        
        // Persist tokens (convert null to undefined)
        await persistTokens(accessToken ?? undefined, refreshToken ?? undefined);
        
        // Parse and normalize user data
        let userData = null;
        if (userStr) {
          try {
            userData = normalizeUser(JSON.parse(userStr));
          } catch (e) {
            console.error("Failed to parse user data:", e);
          }
        }
        
        // Update auth state
        const store = useAuthStore.getState();
        store.setAuthFromResponse({
          accessToken: accessToken ?? undefined,
          refreshToken: refreshToken ?? undefined,
          user: userData ?? undefined,
        });
        
        success("Signed in successfully!");
        router.replace("/(tabs)");
      } catch (err: any) {
        console.error("Google auth error:", err);
        showError(err?.message || "Google sign-in failed. Please try again.");
      } finally {
        setGoogleLoading(false);
        // Close the web browser
        await WebBrowser.dismissBrowser();
      }
    };

    // Subscribe to deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);
    
    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      success("Welcome back!");
      router.replace("/(tabs)");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Invalid credentials");
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      success("Reset email sent! Check your inbox.");
      setForgotMode(false);
      setForgotEmail("");
    } catch {
      showError("Email not found");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      // Build the Google OAuth URL with redirect
      const apiUrl = authApi.googleLoginUrl();
      
      // Add mobile callback URL
      const redirectUrl = Linking.createURL("auth/callback");
      const authUrl = `${apiUrl}?mobile_redirect=${encodeURIComponent(redirectUrl)}`;
      
      info("Opening Google sign-in...");
      
      // Open the browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      // Handle result
      if (result.type === "success" && result.url) {
        // The URL handler will process this
        console.log("[GoogleAuth] Browser returned success:", result.url);
      } else if (result.type === "cancel") {
        info("Sign-in was cancelled");
      } else if (result.type === "dismiss") {
        info("Sign-in was dismissed");
      } else {
        showError("Sign-in was interrupted. Please try again.");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      showError("Failed to open Google sign-in. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Toast {...toast} onHide={hide} />

        {/* Logo */}
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Ionicons name="bag-outline" size={20} color={Colors.cream} />
          </View>
          <Text style={styles.logoText}>Fancy Planet</Text>
        </View>

        {!forgotMode ? (
          <>
            <Text style={styles.title}>Sign In</Text>
            <View style={styles.inlineRow}>
              <Text style={styles.subtitleCompact}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.link}>Create one</Text>
              </TouchableOpacity>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordRow}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textLight}
                      secureTextEntry={!showPass}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              onPress={() => setForgotMode(true)}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.cream} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity 
              onPress={handleGoogleLogin} 
              style={[styles.googleBtn, googleLoading && { opacity: 0.6 }]}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.ink} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={Colors.ink} />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={forgotEmail}
                onChangeText={setForgotEmail}
              />
            </View>

            <TouchableOpacity
              onPress={handleForgot}
              disabled={forgotLoading}
              style={[styles.primaryBtn, forgotLoading && { opacity: 0.6 }]}
            >
              {forgotLoading ? (
                <ActivityIndicator color={Colors.cream} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setForgotMode(false)} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: Spacing.xl, paddingTop: 72 },
  logo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.xxl },
  logoIcon: {
    width: 36, height: 36, borderRadius: 6,
    backgroundColor: Colors.ink, alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 20, fontFamily: Typography.display, color: Colors.ink },
  title: { fontSize: 30, fontFamily: Typography.display, color: Colors.ink, marginBottom: 6 },
  subtitle: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body, marginBottom: Spacing.xxl },
  subtitleCompact: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    marginBottom: Spacing.xxl,
  },
  link: { color: Colors.amber, fontFamily: Typography.bodyMedium },
  field: { marginBottom: Spacing.md },
  label: { fontSize: 10, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  input: {
    backgroundColor: Colors.parchment, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: 14, fontFamily: Typography.body, color: Colors.text,
  },
  inputError: { borderColor: Colors.error },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 44 },
  eyeBtn: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  errorText: { fontSize: 11, color: Colors.error, fontFamily: Typography.body, marginTop: 4 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: Spacing.lg },
  forgotText: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body },
  primaryBtn: {
    backgroundColor: Colors.ink, paddingVertical: 15,
    borderRadius: BorderRadius.sm, alignItems: "center", marginBottom: Spacing.lg,
  },
  primaryBtnText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.cream },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 13,
    borderRadius: BorderRadius.sm,
  },
  googleIcon: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  googleText: { fontSize: 14, fontFamily: Typography.bodyMedium, color: Colors.ink },
});
