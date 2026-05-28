import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { usersApi, authApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";
import { Address } from "@/types";

interface AddressFormState {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const { toast, hide, success, error: showError } = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const [changingPwd, setChangingPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    fullName: user?.name || "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "BD",
  });

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone || ""); }
  }, [user]);

  function resetAddressForm(address?: Address) {
    setEditingAddressId(address?._id || null);
    setAddressForm({
      fullName: address?.fullName || user?.name || "",
      phone: address?.phone || user?.phone || "",
      addressLine1: address?.addressLine1 || "",
      addressLine2: address?.addressLine2 || "",
      city: address?.city || "",
      state: address?.state || "",
      postalCode: address?.postalCode || "",
      country: address?.country || "BD",
    });
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>You're not signed in</Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { data } = await usersApi.updateProfile({ name, phone });
      setUser(data.user || data);
      success("Profile updated!");
      setEditing(false);
    } catch {
      showError("Failed to update profile");
    } finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (!currentPwd || !newPwd) return;
    setSavingPwd(true);
    try {
      await authApi.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      success("Password changed!");
      setChangingPwd(false);
      setCurrentPwd(""); setNewPwd("");
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to change password");
    } finally { setSavingPwd(false); }
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  }

  async function handleDeleteAddress(id: string) {
    Alert.alert("Delete Address", "Remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await usersApi.deleteAddress(id);
            const { data } = await usersApi.profile();
            setUser(data.user || data);
            success("Address removed");
          } catch { showError("Failed to delete address"); }
        },
      },
    ]);
  }

  function handleStartAddAddress() {
    resetAddressForm();
    setShowAddressForm(true);
  }

  function handleStartEditAddress(address: Address) {
    resetAddressForm(address);
    setShowAddressForm(true);
  }

  async function handleSaveAddress() {
    if (!addressForm.fullName.trim()) return showError("Full name is required");
    if (!addressForm.phone.trim()) return showError("Phone is required");
    if (!addressForm.addressLine1.trim()) return showError("Address is required");
    if (!addressForm.city.trim()) return showError("City is required");
    if (!addressForm.state.trim()) return showError("State is required");
    if (!addressForm.postalCode.trim()) return showError("Postal code is required");

    setSavingAddress(true);
    try {
      const payload = {
        ...addressForm,
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postalCode: addressForm.postalCode.trim(),
        country: addressForm.country.trim() || "BD",
      };

      if (editingAddressId) {
        await usersApi.updateAddress(editingAddressId, payload);
      } else {
        await usersApi.addAddress(payload);
      }

      const { data } = await usersApi.profile();
      setUser(data.user || data);
      setShowAddressForm(false);
      resetAddressForm();
      success(editingAddressId ? "Address updated" : "Address added");
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  }

  const initials = user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {user?.role === "admin" && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.amber} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {!user?.isEmailVerified && (
            <View style={styles.unverifiedBadge}>
              <Ionicons name="warning-outline" size={12} color={Colors.warning} />
              <Text style={styles.unverifiedText}>Email not verified</Text>
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="receipt-outline" label="My Orders" onPress={() => router.push("/orders")} />
          <QuickAction icon="heart-outline" label="Wishlist" onPress={() => router.push("/(tabs)/wishlist")} />
          <QuickAction icon="location-outline" label="Addresses" onPress={handleStartAddAddress} />
          {user?.role === "admin" && (
            <QuickAction icon="grid-outline" label="Admin" onPress={() => router.push("/admin" as any)} />
          )}
        </View>

        {/* Profile info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={styles.editBtn}>{editing ? "Cancel" : "Edit"}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PHONE</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+880..."
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
              </View>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={saving}
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              >
                {saving ? <ActivityIndicator color={Colors.cream} size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              <InfoRow label="Name" value={user?.name} />
              <InfoRow label="Email" value={user?.email} />
              {user?.phone && <InfoRow label="Phone" value={user.phone} />}
              <InfoRow label="Member Since" value={new Date(user?.createdAt || "").toLocaleDateString("en-US", { month: "long", year: "numeric" })} />
            </View>
          )}
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            <TouchableOpacity onPress={handleStartAddAddress}>
              <Text style={styles.editBtn}>{showAddressForm ? "New Address" : "Add"}</Text>
            </TouchableOpacity>
          </View>

          {showAddressForm && (
            <View style={styles.editForm}>
              {[
                { label: "FULL NAME", key: "fullName", placeholder: "Recipient name", keyboardType: "default" as const },
                { label: "PHONE", key: "phone", placeholder: "+880...", keyboardType: "phone-pad" as const },
                { label: "ADDRESS LINE 1", key: "addressLine1", placeholder: "House, road, area", keyboardType: "default" as const },
                { label: "ADDRESS LINE 2", key: "addressLine2", placeholder: "Apartment, landmark (optional)", keyboardType: "default" as const },
                { label: "CITY", key: "city", placeholder: "Dhaka", keyboardType: "default" as const },
                { label: "STATE", key: "state", placeholder: "Dhaka", keyboardType: "default" as const },
                { label: "POSTAL CODE", key: "postalCode", placeholder: "1207", keyboardType: "numeric" as const },
                { label: "COUNTRY", key: "country", placeholder: "BD", keyboardType: "default" as const },
              ].map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={addressForm[field.key as keyof AddressFormState]}
                    onChangeText={(value) =>
                      setAddressForm((prev) => ({ ...prev, [field.key]: value }))
                    }
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textLight}
                    keyboardType={field.keyboardType}
                  />
                </View>
              ))}

              <View style={styles.addressFormActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddressForm(false);
                    resetAddressForm();
                  }}
                  style={styles.addressSecondaryBtn}
                >
                  <Text style={styles.addressSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveAddress}
                  disabled={savingAddress}
                  style={[styles.saveBtn, styles.addressPrimaryBtn, savingAddress && { opacity: 0.6 }]}
                >
                  {savingAddress ? (
                    <ActivityIndicator color={Colors.cream} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingAddressId ? "Update Address" : "Save Address"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {user?.addresses && user.addresses.length > 0 ? (
            user.addresses.map((addr: Address) => (
              <View key={addr._id} style={styles.addressCard}>
                <View style={styles.addressCardHeader}>
                  <Text style={styles.addressName}>{addr.fullName}</Text>
                  <View style={styles.addressActions}>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => handleStartEditAddress(addr)}>
                      <Ionicons name="create-outline" size={16} color={Colors.amberDark} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAddress(addr._id)}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addressLine}>{addr.addressLine1}</Text>
                {addr.addressLine2 && <Text style={styles.addressLine}>{addr.addressLine2}</Text>}
                <Text style={styles.addressLine}>{addr.city}, {addr.state} {addr.postalCode}</Text>
                <Text style={styles.addressLine}>{addr.phone}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.addressEmpty}>No saved addresses yet. Add one for faster checkout.</Text>
          )}
        </View>

        {/* Change password */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setChangingPwd(!changingPwd)}
            style={styles.collapsible}
          >
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Ionicons name={changingPwd ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          {changingPwd && (
            <View style={styles.editForm}>
              {[
                { label: "CURRENT PASSWORD", value: currentPwd, setter: setCurrentPwd },
                { label: "NEW PASSWORD", value: newPwd, setter: setNewPwd },
              ].map(({ label, value, setter }) => (
                <View key={label} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={value}
                    onChangeText={setter}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              ))}
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={savingPwd}
                style={[styles.saveBtn, savingPwd && { opacity: 0.6 }]}
              >
                {savingPwd ? <ActivityIndicator color={Colors.cream} size="small" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign out */}
        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.quickAction}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={20} color={Colors.amber} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream, padding: Spacing.xxl },
  emptyTitle: { fontSize: 18, fontFamily: Typography.bodySemibold, color: Colors.ink, marginTop: Spacing.lg, marginBottom: Spacing.xl },
  ctaBtn: { backgroundColor: Colors.ink, paddingHorizontal: Spacing.xxl, paddingVertical: 14, borderRadius: BorderRadius.sm },
  ctaBtnText: { color: Colors.cream, fontSize: 14, fontFamily: Typography.bodySemibold },

  profileHeader: {
    backgroundColor: Colors.ink, paddingTop: 36, paddingBottom: 10,
    paddingHorizontal: Spacing.lg, alignItems: "center",
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.amber, alignItems: "center", justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 3, borderColor: Colors.amberLight,
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarInitials: { fontSize: 28, fontFamily: Typography.bodySemibold, color: Colors.ink },
  profileName: { fontSize: 20, fontFamily: Typography.display, color: Colors.cream, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: "rgba(250,247,242,0.6)", fontFamily: Typography.body },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 8, backgroundColor: "rgba(201,168,76,0.15)",
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: "rgba(201,168,76,0.3)",
  },
  adminBadgeText: { fontSize: 11, color: Colors.amber, fontFamily: Typography.bodyMedium },
  unverifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 8, backgroundColor: "rgba(245,158,11,0.15)",
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  unverifiedText: { fontSize: 11, color: Colors.warning, fontFamily: Typography.body },

  quickActions: {
    flexDirection: "row", paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm, backgroundColor: Colors.cream,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  quickAction: { flex: 1, alignItems: "center", gap: 6 },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: "rgba(201,168,76,0.1)", alignItems: "center", justifyContent: "center",
  },
  quickActionLabel: { fontSize: 11, fontFamily: Typography.bodyMedium, color: Colors.text },

  section: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.ink },
  editBtn: { fontSize: 13, color: Colors.amber, fontFamily: Typography.bodyMedium },
  collapsible: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  editForm: { marginTop: Spacing.sm, gap: Spacing.sm },
  field: {},
  fieldLabel: { fontSize: 10, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 4 },
  input: {
    backgroundColor: Colors.parchment, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 11,
    fontSize: 14, fontFamily: Typography.body, color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.ink, paddingVertical: 13, borderRadius: BorderRadius.sm,
    alignItems: "center", marginTop: 4,
  },
  saveBtnText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.cream },

  infoGrid: { gap: Spacing.sm },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body },
  infoValue: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink, maxWidth: "60%", textAlign: "right" },

  addressCard: {
    backgroundColor: Colors.parchment, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, gap: 3,
  },
  addressCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  addressName: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  addressActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  defaultBadge: {
    backgroundColor: Colors.amber + "20", paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.amber + "40",
  },
  defaultBadgeText: { fontSize: 10, color: Colors.amberDark, fontFamily: Typography.bodyMedium },
  addressLine: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body },
  addressEmpty: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body },
  addressFormActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  addressSecondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 13,
  },
  addressSecondaryText: { fontSize: 14, fontFamily: Typography.bodyMedium, color: Colors.text },
  addressPrimaryBtn: { flex: 2, marginTop: 0 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  logoutText: { fontSize: 15, fontFamily: Typography.bodyMedium, color: Colors.error },
});
