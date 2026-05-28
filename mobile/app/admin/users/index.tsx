import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usersApi } from "@/lib/api";
import { User } from "@/types";
import { extractList } from "@/lib/listResponse";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

interface UserDetails {
  user: User;
  stats: {
    totalOrders: number;
    cancelledOrders: number;
    totalBill: number;
  };
  orders: Array<{
    _id: string;
    orderNumber?: string;
    totalPrice: number;
    orderStatus: string;
    createdAt: string;
  }>;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { toast, hide, success, error: showError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal details state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  function fetchUsers() {
    setIsLoading(true);
    usersApi.all({ search, limit: 100 })
      .then(({ data }) => {
        setUsers(extractList<User>(data, "users"));
      })
      .catch(() => showError("Failed to load users"))
      .finally(() => setIsLoading(false));
  }

  async function handleOpenDetails(userId: string) {
    setSelectedUserId(userId);
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      const { data } = await usersApi.details(userId);
      setUserDetails(data);
    } catch {
      showError("Failed to fetch user details");
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleToggleRole(userId: string, currentRole: string) {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    Alert.alert(
      "Change User Role",
      `Change this user's role to ${nextRole.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: async () => {
            try {
              await usersApi.update(userId, { role: nextRole });
              setUsers(prev =>
                prev.map(u => u._id === userId ? { ...u, role: nextRole as any } : u)
              );
              success(`Role updated to ${nextRole}`);
            } catch {
              showError("Failed to update role");
            }
          },
        },
      ]
    );
  }

  async function handleDeleteUser(userId: string, name: string) {
    Alert.alert(
      "Delete User",
      `Delete user "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await usersApi.delete(userId);
              setUsers(prev => prev.filter(u => u._id !== userId));
              success("User deleted");
            } catch {
              showError("Failed to delete user");
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.amber} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const initials = item.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
            return (
              <View style={styles.userCard}>
                <TouchableOpacity onPress={() => handleOpenDetails(item._id)} style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName}>{item.name}</Text>
                      {item.role === "admin" && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => handleOpenDetails(item._id)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={Colors.text} />
                    <Text style={styles.actionBtnText}>Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleRole(item._id, item.role)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="shield-outline" size={16} color={Colors.amberDark} />
                    <Text style={[styles.actionBtnText, { color: Colors.amberDark }]}>Toggle Role</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteUser(item._id, item.name)}
                    style={[styles.actionBtn, styles.deleteBtn]}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* User Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Ionicons name="close" size={24} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          {loadingDetails ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.amber} size="large" />
            </View>
          ) : userDetails ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* User Identity */}
              <View style={styles.modalProfileCard}>
                <View style={styles.profileAvatar}>
                  {userDetails.user.avatar ? (
                    <Image source={{ uri: userDetails.user.avatar }} style={styles.profileAvatarImg} />
                  ) : (
                    <Text style={styles.profileInitials}>
                      {userDetails.user.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </Text>
                  )}
                </View>
                <Text style={styles.profileName}>{userDetails.user.name}</Text>
                <Text style={styles.profileEmail}>{userDetails.user.email}</Text>
                {userDetails.user.phone && <Text style={styles.profilePhone}>{userDetails.user.phone}</Text>}
              </View>

              {/* User Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Orders</Text>
                  <Text style={styles.statValue}>{userDetails.stats.totalOrders}</Text>
                </View>
                <View style={[styles.statBox, { borderColor: Colors.error + "20" }]}>
                  <Text style={[styles.statLabel, { color: Colors.error }]}>Cancelled</Text>
                  <Text style={[styles.statValue, { color: Colors.error }]}>{userDetails.stats.cancelledOrders}</Text>
                </View>
                <View style={[styles.statBox, { borderColor: Colors.success + "20" }]}>
                  <Text style={[styles.statLabel, { color: Colors.success }]}>Total Spent</Text>
                  <Text style={[styles.statValue, { color: Colors.success }]}>৳{userDetails.stats.totalBill.toLocaleString()}</Text>
                </View>
              </View>

              {/* Order History */}
              <View style={styles.historySection}>
                <Text style={styles.sectionHeading}>Order History</Text>
                {userDetails.orders.length === 0 ? (
                  <Text style={styles.noHistoryText}>No orders placed yet.</Text>
                ) : (
                  userDetails.orders.map((o) => (
                    <View key={o._id} style={styles.historyItem}>
                      <View>
                        <Text style={styles.historyId}>#{o.orderNumber?.slice(-8).toUpperCase() || o._id.slice(-8).toUpperCase()}</Text>
                        <Text style={styles.historyDate}>{new Date(o.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.historyPrice}>৳{o.totalPrice.toLocaleString()}</Text>
                        <View style={[styles.historyBadge, o.orderStatus === "delivered" ? styles.deliveredBadge : o.orderStatus === "cancelled" ? styles.cancelledBadge : null]}>
                          <Text style={[styles.historyBadgeText, o.orderStatus === "delivered" ? styles.deliveredText : o.orderStatus === "cancelled" ? styles.cancelledText : null]}>
                            {o.orderStatus}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 54, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.cream,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  searchSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.cream },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: Typography.body, color: Colors.text },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.sm },
  userCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.amber,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarInitials: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  adminBadge: {
    backgroundColor: Colors.amber + "20", paddingHorizontal: 6, paddingVertical: 1.5,
    borderRadius: BorderRadius.full, borderWidth: 0.5, borderColor: Colors.amber,
  },
  adminBadgeText: { fontSize: 9, fontFamily: Typography.bodyBold, color: Colors.amberDark },
  userEmail: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  cardActions: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.parchment + "35",
  },
  actionBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 10, borderRightWidth: 1, borderRightColor: Colors.border,
  },
  actionBtnText: { fontSize: 12, fontFamily: Typography.bodyMedium, color: Colors.text },
  deleteBtn: { flex: 1, borderRightWidth: 0 },
  modalContainer: { flex: 1, backgroundColor: Colors.cream },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  modalBody: { flex: 1, padding: Spacing.lg },
  modalProfileCard: { alignItems: "center", paddingVertical: Spacing.xl },
  profileAvatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.amber,
    alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: Spacing.md,
  },
  profileAvatarImg: { width: 72, height: 72, borderRadius: 36 },
  profileInitials: { fontSize: 24, fontFamily: Typography.bodySemibold, color: Colors.ink },
  profileName: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  profileEmail: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  profilePhone: { fontSize: 13, color: Colors.amberDark, fontFamily: Typography.bodyMedium, marginTop: 2 },
  statsGrid: { flexDirection: "row", gap: Spacing.sm, marginVertical: Spacing.md },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center",
  },
  statLabel: { fontSize: 10, fontFamily: Typography.bodySemibold, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontFamily: Typography.bodyBold, color: Colors.ink, marginTop: 4 },
  historySection: { marginTop: Spacing.lg },
  sectionHeading: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink, marginBottom: Spacing.md },
  noHistoryText: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body, fontStyle: "italic" },
  historyItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 6,
  },
  historyId: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.ink },
  historyDate: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  historyPrice: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  historyBadge: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4, backgroundColor: Colors.amber + "15", marginTop: 4 },
  historyBadgeText: { fontSize: 9, fontFamily: Typography.bodyMedium, color: Colors.amberDark, textTransform: "capitalize" },
  deliveredBadge: { backgroundColor: Colors.success + "15" },
  deliveredText: { color: Colors.success },
  cancelledBadge: { backgroundColor: Colors.error + "15" },
  cancelledText: { color: Colors.error },
});
