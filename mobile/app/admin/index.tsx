import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ordersApi, usersApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ordersApi.stats()
      .then(({ data }) => {
        const s = data.stats || data.data || data;
        setStats({
          totalOrders: s.totalOrders ?? 0,
          totalRevenue: s.totalRevenue ?? 0,
          pendingOrders: s.pendingOrders ?? 0,
          deliveredOrders: s.deliveredOrders ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: "Total Orders", value: stats?.totalOrders ?? "-", icon: "receipt-outline", color: Colors.amber },
    { label: "Revenue", value: stats ? `৳${stats.totalRevenue.toLocaleString()}` : "-", icon: "cash-outline", color: Colors.success },
    { label: "Pending", value: stats?.pendingOrders ?? "-", icon: "time-outline", color: Colors.warning },
    { label: "Delivered", value: stats?.deliveredOrders ?? "-", icon: "checkmark-circle-outline", color: Colors.info },
  ];

  const MENU = [
    { label: "Manage Products", icon: "cube-outline", route: "/admin/products" },
    { label: "Manage Orders", icon: "receipt-outline", route: "/admin/orders" },
    { label: "Manage Users", icon: "people-outline", route: "/admin/users" },
    { label: "Site Settings", icon: "settings-outline", route: "/admin/settings" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.cream} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>ADMIN</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <View key={i} style={styles.statSkeleton} />)
            : STAT_CARDS.map((card) => (
              <View key={card.label} style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: card.color + "20" }]}>
                  <Ionicons name={card.icon as any} size={20} color={card.color} />
                </View>
                <Text style={styles.statValue}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </View>
            ))
          }
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={styles.menuItem}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon as any} size={20} color={Colors.amber} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    backgroundColor: Colors.ink, paddingTop: 54, paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg, flexDirection: "row", alignItems: "center", gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerLabel: { fontSize: 9, color: Colors.amber, fontFamily: Typography.bodySemibold, letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontFamily: Typography.display, color: Colors.cream },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, padding: Spacing.lg },
  statCard: {
    width: "47%", backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statSkeleton: {
    width: "47%", height: 100, backgroundColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontFamily: Typography.bodySemibold, color: Colors.ink },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  section: { padding: Spacing.lg },
  sectionTitle: { fontSize: 11, fontFamily: Typography.bodySemibold, color: Colors.textMuted, marginBottom: Spacing.sm, letterSpacing: 0.5, textTransform: "uppercase" },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuIconBox: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: "rgba(201,168,76,0.1)", alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: Typography.bodyMedium, color: Colors.ink },
});
