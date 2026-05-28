import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "@/constants/Colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  containerStyle,
  rightIcon,
  onRightIconPress,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      )}
      <View style={[styles.inputRow, focused && styles.focused, error && styles.errored]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textLight}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.icon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    fontSize: 10,
    fontFamily: Typography.bodySemibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  focused: { borderColor: Colors.amber },
  errored: { borderColor: Colors.error },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    fontFamily: Typography.body,
    color: Colors.text,
  },
  icon: { padding: 4 },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.error,
    fontFamily: Typography.body,
  },
});
