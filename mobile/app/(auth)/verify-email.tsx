import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token, email: emailParam } = useLocalSearchParams<{
    token?: string;
    email?: string;
  }>();
  const { toast, hide, success, error: showError } = useToast();

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "code">("verifying");
  const [email, setEmail] = useState(emailParam || "");
  const [code, setCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (token) {
      verifyWithToken();
    } else if (emailParam) {
      setStatus("code");
    } else {
      setStatus("error");
    }
  }, [token, emailParam]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  async function verifyWithToken() {
    if (!token) return;
    try {
      await authApi.verifyEmail(token);
      setStatus("success");
      success("Email verified successfully!");
    } catch (err: any) {
      setStatus("error");
      showError(err?.response?.data?.message || "Failed to verify email");
    }
  }

  async function verifyWithCode() {
    if (!email || !code) {
      showError("Please enter email and verification code");
      return;
    }
    try {
      await authApi.verifyEmailCode(email, code);
      setStatus("success");
      success("Email verified successfully!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Invalid verification code");
    }
  }

  async function resendCode() {
    if (!email) {
      showError("Please enter your email");
      return;
    }
    try {
      await authApi.resendVerification(email);
      setResendTimer(60);
      success("Verification code sent!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to resend code");
    }
  }

  function goToLogin() {
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {status === "verifying" && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.amber} />
            <Text style={styles.message}>Verifying your email...</Text>
          </View>
        )}

        {status === "success" && (
          <View style={styles.center}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Email Verified!</Text>
            <Text style={styles.message}>
              Your email has been successfully verified. You can now sign in to your account.
            </Text>
            <TouchableOpacity onPress={goToLogin} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "error" && !token && (
          <View style={styles.center}>
            <View style={[styles.iconContainer, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
              <Ionicons name="alert-circle" size={64} color={Colors.error} />
            </View>
            <Text style={styles.successTitle}>Invalid Link</Text>
            <Text style={styles.message}>
              The verification link is invalid or has expired. Please request a new verification code.
            </Text>
            <TouchableOpacity onPress={() => setStatus("code")} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Enter Verification Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "code" && (
          <View style={styles.codeContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={64} color={Colors.amber} />
            </View>
            <Text style={styles.successTitle}>Enter Verification Code</Text>
            <Text style={styles.message}>
              Enter your email and the verification code we sent you.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity onPress={verifyWithCode} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Verify Email</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={resendCode} disabled={resendTimer > 0} style={styles.resendBtn}>
              <Text style={[styles.resendBtnText, resendTimer > 0 && { opacity: 0.5 }]}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 20,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.cream,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.parchment,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Typography.bodySemibold,
    color: Colors.ink,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(201,168,76,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: Typography.display,
    color: Colors.ink,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    backgroundColor: Colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.sm,
    minWidth: 200,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: Typography.bodySemibold,
    color: Colors.cream,
  },
  codeContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: Typography.bodySemibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Typography.body,
    color: Colors.text,
  },
  resendBtn: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  resendBtnText: {
    fontSize: 13,
    fontFamily: Typography.body,
    color: Colors.amber,
  },
});
