"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User, MapPin, Heart, Lock, Camera, Plus, Pencil, Trash2,
  CheckCircle2, ShoppingBag, Save, X
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usersApi, authApi } from "@/lib/api";
import { Address, Product, User as UserType } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthHydration } from "@/hooks/useAuthHydration";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "security", label: "Security", icon: Lock },
];

export default function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, setUser, fetchMe, updateWishlist } = useAuthStore();
  const { isReady, isAuthenticated: authOk } = useAuthHydration();
  const tabParam = searchParams.get("tab") || "profile";
  const [tab, setTab] = useState(tabParam);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (!isReady) return;
    if (!authOk) {
      router.push("/login");
      return;
    }
    fetchMe();
  }, [isReady, authOk]);

  useEffect(() => {
    if (tab !== "wishlist") return;
    if (!user?.wishlist?.length) {
      setWishlistProducts([]);
      return;
    }
    setLoadingWishlist(true);
    usersApi
      .profile()
      .then(({ data }) => {
        const profileUser = data.user || data;
        const populated = (profileUser.wishlist || []) as Product[];
        const products = populated.filter(
          (w): w is Product => typeof w === "object" && w !== null && "_id" in w
        );
        setWishlistProducts(products);
        if (profileUser.wishlist) {
          const ids = profileUser.wishlist.map((w: Product | string) =>
            typeof w === "string" ? w : w._id
          );
          updateWishlist(ids);
        }
      })
      .catch(() => {
        setWishlistProducts([]);
        toast.error("Failed to load wishlist");
      })
      .finally(() => setLoadingWishlist(false));
  }, [tab, user?.wishlist?.length]);

  const handleTabChange = (id: string) => {
    setTab(id);
    router.replace(`/profile?tab=${id}`, { scroll: false });
  };

  const handleResendCode = async () => {
    if (!user?.email) return;
    setResendingCode(true);
    try {
      await authApi.resendVerification(user.email);
      toast.success("Verification code sent");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not resend code";
      toast.error(msg);
    } finally {
      setResendingCode(false);
    }
  };

  if (!isReady || (!user && authOk)) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-ink text-cream flex items-center justify-center text-3xl font-bold overflow-hidden">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : user.name?.charAt(0).toUpperCase()
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 bg-ink/50 text-cream rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              try {
                const { data } = await usersApi.uploadAvatar(file);
                if (data.user) setUser(data.user);
                else if (data.avatar) setUser({ ...user, avatar: data.avatar });
                toast.success("Avatar updated!");
              } catch { toast.error("Upload failed"); }
            }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{user.name}</h1>
            <p className="text-sm text-ink/50">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {user.isEmailVerified
                ? <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-sm"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                : (
                  <>
                    <span className="text-xs text-amber-500 bg-amber/10 px-2 py-0.5 rounded-sm">Email not verified</span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendingCode}
                      className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                    >
                      {resendingCode ? "Sending…" : "Resend code"}
                    </button>
                    <Link href={`/verify-email?email=${encodeURIComponent(user.email)}`} className="text-xs text-ink/60 hover:underline">
                      Enter code
                    </Link>
                  </>
                )}
              <span className="text-xs text-ink/30 bg-parchment px-2 py-0.5 rounded-sm capitalize">{user.role}</span>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 border-b border-ink/10 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px ${
                tab === t.id ? "border-ink text-ink" : "border-transparent text-ink/40 hover:text-ink/70"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "profile" && <ProfileTab user={user} setUser={setUser} />}
            {tab === "addresses" && <AddressesTab user={user} setUser={setUser} />}
            {tab === "wishlist" && (
              <WishlistTab
                products={wishlistProducts}
                loading={loadingWishlist}
                user={user}
                onRemove={(productId) => {
                  setWishlistProducts((prev) => prev.filter((p) => p._id !== productId));
                }}
              />
            )}
            {tab === "security" && <SecurityTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProfileTab({ user, setUser }: { user: UserType; setUser: (u: UserType) => void }) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await usersApi.updateProfile({ name, phone });
      if (data.user) setUser(data.user);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">Full Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">Email</label>
        <input value={user.email} disabled
          className="w-full bg-parchment/50 border border-ink/10 rounded-sm px-4 py-3 text-sm text-ink/40 cursor-not-allowed" />
      </div>
      <div>
        <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">Phone</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
          className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors" />
      </div>
      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-60">
        <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

function AddressesTab({ user, setUser }: { user: UserType; setUser: (u: UserType) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Address>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = editingId
        ? await usersApi.updateAddress(editingId, form)
        : await usersApi.addAddress(form);
      if (data.user) setUser(data.user);
      else if (data.addresses) setUser({ ...user, addresses: data.addresses });
      toast.success(editingId ? "Address updated!" : "Address added!");
      setShowForm(false); setEditingId(null); setForm({});
    } catch { toast.error("Failed to save address"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data } = await usersApi.deleteAddress(id);
      if (data.user) setUser(data.user);
      else if (data.addresses) setUser({ ...user, addresses: data.addresses });
      toast.success("Address removed");
    } catch { toast.error("Failed to delete"); }
  };

  const startEdit = (addr: Address) => {
    setForm(addr); setEditingId(addr._id); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>Shipping Addresses</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({}); }}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-ink text-cream rounded-sm hover:bg-ink/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {user.addresses?.length === 0 && !showForm && (
        <div className="text-center py-16 border border-dashed border-ink/20 rounded-sm">
          <MapPin className="w-10 h-10 text-ink/20 mx-auto mb-3" />
          <p className="text-ink/50 text-sm">No addresses saved yet</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {user.addresses?.map((addr) => (
          <div key={addr._id} className="border border-ink/10 rounded-sm p-4">
            <p className="font-semibold text-sm">{addr.fullName}</p>
            <p className="text-sm text-ink/60 mt-1">{addr.addressLine1}</p>
            <p className="text-sm text-ink/60">{addr.city}, {addr.state} {addr.postalCode}</p>
            <div className="flex gap-2 mt-3 pt-3 border-t border-ink/10">
              <button onClick={() => startEdit(addr)} className="flex items-center gap-1 text-xs text-ink/50 hover:text-ink">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(addr._id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 ml-auto">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="border border-ink/15 rounded-sm p-5 bg-parchment/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{editingId ? "Edit Address" : "New Address"}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm({}); }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "fullName", label: "Full Name", col: 2 },
                { key: "phone", label: "Phone", col: 1 },
                { key: "addressLine1", label: "Address Line 1", col: 2 },
                { key: "city", label: "City", col: 1 },
                { key: "state", label: "State", col: 1 },
                { key: "postalCode", label: "Postal Code", col: 1 },
                { key: "country", label: "Country", col: 1 },
              ].map((f) => (
                <div key={f.key} className={f.col === 2 ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold uppercase mb-1 text-ink/50">{f.label}</label>
                  <input value={(form as Record<string, string>)[f.key] || ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber" />
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving} className="mt-4 px-5 py-2 bg-ink text-cream text-sm rounded-sm">
              {saving ? "Saving…" : "Save Address"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WishlistTab({
  products,
  loading,
  user,
  onRemove,
}: {
  products: Product[];
  loading: boolean;
  user: UserType;
  onRemove: (id: string) => void;
}) {
  const { updateWishlist } = useAuthStore();

  const handleRemove = async (productId: string) => {
    try {
      const { data } = await usersApi.toggleWishlist(productId);
      updateWishlist((data.wishlist || []).map(String));
      onRemove(productId);
      toast.success("Removed from wishlist");
    } catch { toast.error("Failed to remove"); }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[4/5] rounded-sm" />)}
      </div>
    );
  }

  if (!user.wishlist?.length) {
    return (
      <div className="text-center py-20 border border-dashed border-ink/20 rounded-sm">
        <Heart className="w-12 h-12 text-ink/20 mx-auto mb-3" />
        <p className="text-ink/50">Your wishlist is empty</p>
        <Link href="/products" className="text-sm text-amber-500 hover:text-amber-600 mt-2 inline-block">Browse products →</Link>
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-ink/50 text-sm">Could not load wishlist items. Try refreshing.</p>;
  }

  return (
    <div>
      <p className="text-sm text-ink/50 mb-5">{products.length} saved item{products.length !== 1 ? "s" : ""}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((product) => (
          <div key={product._id} className="group relative">
            <Link href={`/products/${product.slug || product._id}`}>
              <div className="aspect-[4/5] bg-parchment rounded-sm overflow-hidden mb-3">
                {product.images?.[0]
                  ? <img src={typeof product.images[0] === "string" ? product.images[0] : product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-ink/20" /></div>
                }
              </div>
              <p className="text-sm font-medium line-clamp-2">{product.name}</p>
              <p className="text-sm font-semibold mt-1">৳{(product.discountPrice ?? product.price).toLocaleString()}</p>
            </Link>
            <button onClick={() => handleRemove(product._id)}
              className="absolute top-2 right-2 w-7 h-7 bg-cream/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
              <X className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      const { authApi } = await import("@/lib/api");
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success("Password changed successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {["currentPassword", "newPassword", "confirmPassword"].map((key) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase mb-1.5 text-ink/60">{key.replace(/([A-Z])/g, " $1")}</label>
            <input type="password" value={(form as Record<string, string>)[key]} required
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              className="w-full bg-parchment border border-ink/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber" />
          </div>
        ))}
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-ink text-cream text-sm rounded-sm">
          <Lock className="w-4 h-4" /> {saving ? "Changing…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}
