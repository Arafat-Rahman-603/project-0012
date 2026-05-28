import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "@/constants/Colors";

interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "amber";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={containerStyle}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "amber" ? Colors.cream : Colors.ink}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  fullWidth: { width: "100%" },
  disabled: { opacity: 0.6 },

  // Variants
  primary: { backgroundColor: Colors.ink },
  secondary: { backgroundColor: Colors.parchment },
  outline: { backgroundColor: Colors.transparent, borderWidth: 1.5, borderColor: Colors.ink },
  ghost: { backgroundColor: Colors.transparent },
  amber: { backgroundColor: Colors.amber },

  // Sizes
  size_sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md },
  size_md: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.xl },
  size_lg: { paddingVertical: Spacing.md + 2, paddingHorizontal: Spacing.xxl },

  // Labels
  label: { fontFamily: Typography.bodySemibold },
  label_primary: { color: Colors.cream },
  label_secondary: { color: Colors.ink },
  label_outline: { color: Colors.ink },
  label_ghost: { color: Colors.ink },
  label_amber: { color: Colors.ink },

  labelSize_sm: { fontSize: 12 },
  labelSize_md: { fontSize: 14 },
  labelSize_lg: { fontSize: 16 },
});
