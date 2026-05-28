import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found" }} />
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="compass-outline" size={48} color={Colors.amber} />
        </View>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/")}>
          <Ionicons name="home-outline" size={16} color={Colors.ink} />
          <Text style={styles.btnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cream,
    padding: Spacing.xxl,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(201,168,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  code: {
    fontSize: 64,
    fontFamily: Typography.display,
    color: Colors.ink,
    lineHeight: 72,
  },
  title: {
    fontSize: 22,
    fontFamily: Typography.display,
    color: Colors.ink,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Typography.body,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: Spacing.xxl,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.amber,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
  },
  btnText: {
    fontSize: 14,
    fontFamily: Typography.bodySemibold,
    color: Colors.ink,
  },
});
