import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { toast, hide, success, error: showError } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      showError("Please enter both passwords");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    if (!token) {
      showError("Invalid reset token");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
      success("Password reset successfully!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  }

  function goToLogin() {
    router.replace("/(auth)/login");
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <Toast {...toast} onHide={hide} />
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={64} color={Colors.error} />
          </View>
          <Text style={styles.title}>Invalid Reset Link</Text>
          <Text style={styles.message}>
            The password reset link is invalid or has expired. Please request a new password reset.
          </Text>
          <TouchableOpacity onPress={goToLogin} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <Toast {...toast} onHide={hide} />
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.title}>Password Reset!</Text>
          <Text style={styles.message}>
            Your password has been reset successfully. You can now sign in with your new password.
          </Text>
          <TouchableOpacity onPress={goToLogin} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.iconContainerSmall}>
            <Ionicons name="lock-closed" size={40} color={Colors.amber} />
          </View>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Enter a new password for your account. Make sure it's at least 6 characters long.
          </Text>

          {/* New Password */}
          <View style={styles.field}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Min. 6 characters"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Re-enter password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showConfirmPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                <Ionicons
                  name={showConfirmPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={isLoading}
            style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.cream} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  form: {
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(201,168,76,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    alignSelf: "center",
  },
  iconContainerSmall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(201,168,76,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.display,
    color: Colors.ink,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Typography.body,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  message: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Typography.body,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
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
  passwordRow: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: Colors.ink,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: Typography.bodySemibold,
    color: Colors.cream,
  },
});
