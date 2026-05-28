import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "@/constants/Colors";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const ICON: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

const BG: Record<ToastType, string> = {
  success: Colors.success,
  error: Colors.error,
  warning: Colors.warning,
  info: Colors.amber,
};

const shouldUseNativeDriver = Platform.OS !== "web";

export function Toast({ message, type = "info", visible, onHide, duration = 3000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: shouldUseNativeDriver }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: shouldUseNativeDriver }),
      ]).start();
      const t = setTimeout(() => {
        hide();
      }, duration);
      return () => clearTimeout(t);
    }
  }, [visible]);

  function hide() {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: shouldUseNativeDriver }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: shouldUseNativeDriver }),
    ]).start(() => onHide());
  }

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.toast, { backgroundColor: BG[type] }]}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{ICON[type]}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
        <TouchableOpacity onPress={hide} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Toast manager hook
import { useState, useCallback } from "react";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: "", type: "info", visible: false });

  const show = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type, visible: true });
  }, []);

  const hide = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error = useCallback((msg: string) => show(msg, "error"), [show]);
  const warning = useCallback((msg: string) => show(msg, "warning"), [show]);
  const info = useCallback((msg: string) => show(msg, "info"), [show]);

  return { toast, hide, show, success, error, warning, info };
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  icon: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  message: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    fontFamily: Typography.bodyMedium,
  },
  close: {
    marginLeft: Spacing.sm,
    padding: 4,
  },
  closeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
});
