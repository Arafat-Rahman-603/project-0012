import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { productsApi, categoriesApi } from "@/lib/api";
import { Category, Product } from "@/types";
import { extractList } from "@/lib/listResponse";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

interface LocalImage {
  uri: string;
  name: string;
  type: string;
  isExisting?: boolean;
}

export default function AdminProductFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const { toast, hide, success, error: showError } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [category, setCategory] = useState("");
  
  // Images
  const [images, setImages] = useState<LocalImage[]>([]);

  useEffect(() => {
    // Load categories
    categoriesApi.list()
      .then(({ data }) => setCategories(extractList<Category>(data, "categories")))
      .catch(() => {});

    // If editing, load product details
    if (!isNew && id) {
      productsApi.get(id)
        .then(({ data }) => {
          const p: Product = data.product || data.data || data;
          setName(p.name);
          setDescription(p.description || "");
          setPrice(String(p.price));
          setDiscountPrice(p.discountPrice ? String(p.discountPrice) : "");
          setStock(String(p.stock));
          setBrand(p.brand || "");
          setSku(p.sku || "");
          setTags(p.tags?.join(", ") || "");
          setIsFeatured(p.isFeatured ?? p.featured ?? false);
          
          if (p.category) {
            setCategory(typeof p.category === "object" ? p.category._id : p.category);
          }

          if (p.images && p.images.length > 0) {
            setImages(p.images.map(img => ({
              uri: img.url,
              name: img.public_id || "existing",
              type: "image/jpeg",
              isExisting: true,
            })));
          }
        })
        .catch(() => showError("Failed to load product details"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required to add product images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const selected: LocalImage[] = result.assets.map(asset => {
        const uri = asset.uri;
        const filename = uri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        return {
          uri,
          name: filename,
          type,
        };
      });

      setImages(prev => [...prev, ...selected]);
    }
  }

  function handleRemoveImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!name.trim()) return showError("Product Name is required");
    if (!price.trim()) return showError("Price is required");
    if (!stock.trim()) return showError("Stock is required");
    if (!category) return showError("Category is required");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("description", description.trim());
      fd.append("price", price.trim());
      if (discountPrice.trim()) fd.append("discountPrice", discountPrice.trim());
      fd.append("stock", stock.trim());
      fd.append("brand", brand.trim());
      fd.append("sku", sku.trim());
      fd.append("isFeatured", String(isFeatured));
      fd.append("category", category);

      // Append tags
      if (tags.trim()) {
        const tagArr = tags.split(",").map(t => t.trim()).filter(Boolean);
        tagArr.forEach(t => fd.append("tags[]", t)); // or append as comma string depending on API
      }

      // Append images
      images.forEach((img, idx) => {
        if (!img.isExisting) {
          fd.append("images", {
            uri: img.uri,
            name: img.name || `image_${idx}.jpg`,
            type: img.type || "image/jpeg",
          } as any);
        } else {
          // Send existing images back if API supports, or handle separately
          fd.append("existingImages[]", img.uri);
        }
      });

      if (isNew) {
        await productsApi.create(fd);
        success("Product created!");
      } else if (id) {
        await productsApi.update(id, fd);
        success("Product updated!");
      }

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to save product");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.amber} size="large" />
      </View>
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
        <Text style={styles.headerTitle}>{isNew ? "Add Product" : "Edit Product"}</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={saving} style={styles.saveHeaderBtn}>
          {saving ? (
            <ActivityIndicator color={Colors.amber} size="small" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Images section */}
        <View style={styles.imagesSection}>
          <Text style={styles.sectionHeading}>Product Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.thumb} contentFit="cover" />
                <TouchableOpacity onPress={() => handleRemoveImage(idx)} style={styles.removeImageBtn}>
                  <Ionicons name="close" size={12} color={Colors.cream} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity onPress={handlePickImage} style={styles.addImageBtn}>
                <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text style={styles.imageHint}>Upload up to 5 high quality images.</Text>
        </View>

        {/* Input Form Fields */}
        <View style={styles.formSection}>
          {[
            { label: "PRODUCT NAME", value: name, setter: setName, placeholder: "e.g. Premium Silk Saree" },
            { label: "BRAND / WEAVER", value: brand, setter: setBrand, placeholder: "e.g. Banarasi Heritage" },
            { label: "SKU CODE", value: sku, setter: setSku, placeholder: "e.g. SLK-BAN-01" },
            { label: "PRICE (৳)", value: price, setter: setPrice, placeholder: "0", keyboardType: "numeric" as const },
            { label: "DISCOUNT PRICE (৳)", value: discountPrice, setter: setDiscountPrice, placeholder: "Optional", keyboardType: "numeric" as const },
            { label: "STOCK QUANTITY", value: stock, setter: setStock, placeholder: "0", keyboardType: "numeric" as const },
            { label: "TAGS (comma-separated)", value: tags, setter: setTags, placeholder: "silk, wedding, red" },
          ].map((field) => (
            <View key={field.label} style={styles.field}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textLight}
                keyboardType={field.keyboardType || "default"}
              />
            </View>
          ))}

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide a detailed description of the saree weave, material, and design..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.dropdownWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChips}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    onPress={() => setCategory(cat._id)}
                    style={[styles.catChip, category === cat._id && styles.catChipActive]}
                  >
                    <Text style={[styles.catChipText, category === cat._id && styles.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Featured Toggle */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Featured Product</Text>
              <Text style={styles.toggleDesc}>Show this product in the homepage carousel</Text>
            </View>
            <Switch
              value={isFeatured}
              onValueChange={setIsFeatured}
              trackColor={{ false: Colors.border, true: Colors.amber }}
              thumbColor={Colors.cream}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={[styles.submitBtn, saving && { opacity: 0.7 }]}
          >
            {saving ? (
              <ActivityIndicator color={Colors.cream} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isNew ? "Create Product" : "Save Changes"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 54, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  saveHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveHeaderText: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.amber },
  body: { flex: 1 },
  imagesSection: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  sectionHeading: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: Spacing.md, textTransform: "uppercase" },
  imageList: { flexDirection: "row", gap: Spacing.sm },
  imageWrap: { position: "relative", width: 80, height: 96, borderRadius: BorderRadius.sm, overflow: "hidden", marginRight: Spacing.sm },
  thumb: { width: "100%", height: "100%" },
  removeImageBtn: {
    position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
  },
  addImageBtn: {
    width: 80, height: 96, borderRadius: BorderRadius.sm, borderWidth: 1, borderStyle: "dashed",
    borderColor: Colors.borderMed, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream,
  },
  addImageText: { fontSize: 10, color: Colors.textMuted, fontFamily: Typography.bodyMedium, marginTop: 4 },
  imageHint: { fontSize: 11, color: Colors.textLight, fontFamily: Typography.body, marginTop: Spacing.sm },
  formSection: { padding: Spacing.lg, gap: Spacing.lg },
  field: {},
  fieldLabel: { fontSize: 9, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 4 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: 14, fontFamily: Typography.body, color: Colors.text,
  },
  textarea: { minHeight: 90 },
  dropdownWrap: { marginTop: 4 },
  catChips: { flexDirection: "row", gap: 6 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, marginRight: 6,
  },
  catChipActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  catChipText: { fontSize: 12, color: Colors.text, fontFamily: Typography.bodyMedium },
  catChipTextActive: { color: Colors.cream },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  toggleLabel: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  toggleDesc: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  submitBtn: {
    backgroundColor: Colors.ink, paddingVertical: 14, borderRadius: BorderRadius.sm,
    alignItems: "center", marginTop: Spacing.md,
  },
  submitBtnText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.cream },
});
