import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { toast, hide, success, error: showError } = useToast();
  const [showPass, setShowPass] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.name, data.email, data.password);
      success("Account created! Please verify your email.");
      router.replace("/(auth)/login");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Toast {...toast} onHide={hide} />

        {/* Logo */}
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Ionicons name="bag-outline" size={20} color={Colors.cream} />
          </View>
          <Text style={styles.logoText}>Fancy Planet</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>
        <View style={styles.inlineRow}>
          <Text style={styles.subtitleCompact}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.link}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {[
          { name: "name" as const, label: "FULL NAME", placeholder: "Your name", keyboardType: "default" as const },
          { name: "email" as const, label: "EMAIL", placeholder: "you@example.com", keyboardType: "email-address" as const },
        ].map(({ name, label, placeholder, keyboardType }) => (
          <View key={name} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Controller
              control={control}
              name={name}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors[name] && styles.inputError]}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textLight}
                  keyboardType={keyboardType}
                  autoCapitalize={name === "email" ? "none" : "words"}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors[name] && <Text style={styles.errorText}>{errors[name]?.message}</Text>}
          </View>
        ))}

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
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPass}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        {/* Confirm password */}
        <View style={styles.field}>
          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Re-enter password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showPass}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
        </View>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.cream} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.termsRow}>
          <Text style={styles.terms}>By creating an account you agree to our</Text>
          <Text style={styles.link}>Terms of Service</Text>
          <Text style={styles.terms}>and</Text>
          <Text style={styles.link}>Privacy Policy</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: Spacing.xl, paddingTop: 72 },
  logo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.xxl },
  logoIcon: { width: 36, height: 36, borderRadius: 6, backgroundColor: Colors.ink, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 20, fontFamily: Typography.display, color: Colors.ink },
  title: { fontSize: 30, fontFamily: Typography.display, color: Colors.ink, marginBottom: 6 },
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
  primaryBtn: {
    backgroundColor: Colors.ink, paddingVertical: 15,
    borderRadius: BorderRadius.sm, alignItems: "center", marginTop: Spacing.sm, marginBottom: Spacing.lg,
  },
  primaryBtnText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.cream },
  termsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  terms: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, textAlign: "center", lineHeight: 18 },
});
