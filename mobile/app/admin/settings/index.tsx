import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { settingsApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

export default function AdminSettings() {
  const router = useRouter();
  const { toast, hide, success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteName, setSiteName] = useState("Fancy Planet");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("");
  const [heroCtaHref, setHeroCtaHref] = useState("/products");
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    settingsApi.get()
      .then(({ data }) => {
        const s = data.settings || data.data || data;
        if (s) {
          setSiteName(s.siteName || "Fancy Planet");
          setHeroTitle(s.heroTitle || "");
          setHeroSubtitle(s.heroSubtitle || "");
          setHeroCtaText(s.heroCtaText || "");
          setHeroCtaHref(s.heroCtaHref || "/products");
          setBanners(s.banners || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("siteName", siteName);
      fd.append("heroTitle", heroTitle);
      fd.append("heroSubtitle", heroSubtitle);
      fd.append("heroCtaText", heroCtaText);
      fd.append("heroCtaHref", heroCtaHref);
      fd.append("existingBanners", JSON.stringify(banners));
      await settingsApi.update(fd);
      success("Settings saved!");
    } catch {
      showError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const FIELDS = [
    { label: "SITE NAME", value: siteName, setter: setSiteName, placeholder: "e.g. Fancy Planet" },
    { label: "HERO TITLE", value: heroTitle, setter: setHeroTitle, placeholder: "e.g. Discover Sarees" },
    { label: "HERO SUBTITLE", value: heroSubtitle, setter: setHeroSubtitle, placeholder: "e.g. Hand-picked sarees..." },
    { label: "CTA BUTTON TEXT", value: heroCtaText, setter: setHeroCtaText, placeholder: "e.g. Shop Now" },
    { label: "CTA BUTTON LINK", value: heroCtaHref, setter: setHeroCtaHref, placeholder: "e.g. /products" },
  ];

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.cream} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>ADMIN</Text>
          <Text style={styles.headerTitle}>Site Settings</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.amber} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionDesc}>
              Configure your store's branding and homepage content.
            </Text>

            {FIELDS.map((field) => (
              <View key={field.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            >
              {saving ? (
                <ActivityIndicator color={Colors.ink} size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color={Colors.ink} />
                  <Text style={styles.saveBtnText}>Save Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: Colors.ink, paddingTop: 54, paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg, flexDirection: "row", alignItems: "center", gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerLabel: { fontSize: 9, color: Colors.amber, fontFamily: Typography.bodySemibold, letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontFamily: Typography.display, color: Colors.cream },
  section: { padding: Spacing.lg },
  sectionDesc: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body, marginBottom: Spacing.xl, lineHeight: 20 },
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: 10, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 11,
    fontSize: 14, fontFamily: Typography.body, color: Colors.text,
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.amber, paddingVertical: 15,
    borderRadius: BorderRadius.sm,
  },
  saveBtnText: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.ink },
});
