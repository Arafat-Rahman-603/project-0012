"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Users, TrendingUp,
  Plus, Pencil, Trash2, Check, X, Search, ChevronDown,
  DollarSign, BarChart3, AlertCircle, Images, Save, Upload,
  Globe, Mail
} from "lucide-react";

const Facebook = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const MessageCircle = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
import { useAuthStore } from "@/store/authStore";
import { productsApi, ordersApi, usersApi, categoriesApi, settingsApi } from "@/lib/api";
import { Product, Order, User, Category, SiteSettings } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { extractList } from "@/lib/listResponse";
import { formatBdt, getOrderStatus, normalizeOrder } from "@/lib/orderUtils";

type AdminTab = "overview" | "products" | "orders" | "users" | "categories" | "settings";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<AdminTab>("overview");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "admin") { router.push("/"); toast.error("Admin access required"); }
  }, [isAuthenticated, user]);

  if (!user || user.role !== "admin") return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="font-semibold">Admin access required</p>
      </div>
    </div>
  );

  const TABS: { id: AdminTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "users", label: "Users", icon: Users },
    { id: "categories", label: "Categories", icon: BarChart3 },
    { id: "settings", label: "Site Settings", icon: Images },
  ];

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Admin Panel</h1>
            <p className="text-sm text-ink/50 mt-1">Manage your store</p>
          </div>
          <div className="text-xs bg-amber/10 text-amber-600 border border-amber/20 px-3 py-1.5 rounded-sm font-semibold tracking-wider uppercase">
            Admin
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-ink/10 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all ${
                tab === t.id ? "border-ink text-ink" : "border-transparent text-ink/40 hover:text-ink/70"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "overview" && <OverviewTab />}
            {tab === "products" && <ProductsTab />}
            {tab === "orders" && <OrdersTab />}
            {tab === "users" && <UsersTab />}
            {tab === "categories" && <CategoriesTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.stats()
      .then(({ data }) => {
        const body = data as { stats?: Record<string, unknown>; recentOrders?: Order[] };
        setStats({
          ...(body?.stats || {}),
          recentOrders: (body?.recentOrders || []).map((o) => normalizeOrder(o)),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards: {
    label: string;
    value: string | number;
    icon: typeof DollarSign;
    color: string;
    bg: string;
    hint?: string;
  }[] = [
    {
      label: "Delivered revenue",
      hint: "Paid orders marked delivered",
      value: stats ? `৳${(stats.deliveredRevenue || 0).toLocaleString()}` : "—",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending revenue",
      hint: "Awaiting delivery",
      value: stats ? `৳${(stats.pendingRevenue || 0).toLocaleString()}` : "—",
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber/10",
    },
    { label: "Total orders", value: stats?.totalOrders ?? "—", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending orders", value: stats?.pendingOrders ?? "—", icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Delivered orders", value: stats?.deliveredOrders ?? "—", icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total users", value: stats?.totalUsers ?? "—", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total products", value: stats?.totalProducts ?? "—", icon: BarChart3, color: "text-ink/70", bg: "bg-parchment" },
    { label: "Cancelled orders", value: stats?.cancelledOrders ?? "—", icon: X, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="border border-ink/10 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-ink/40">{card.label}</p>
                {card.hint && <p className="text-[10px] text-ink/30 mt-0.5">{card.hint}</p>}
              </div>
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            {loading
              ? <div className="skeleton h-8 w-24 rounded" />
              : <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{card.value}</p>
            }
          </motion.div>
        ))}
      </div>

      {stats?.recentOrders?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Recent Orders</h2>
          <div className="border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-parchment/50 border-b border-ink/10">
                <tr>
                  {["Order ID", "Status", "Total", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-ink/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {stats.recentOrders.slice(0, 8).map((order: Order) => {
                  const status = getOrderStatus(order);
                  return (
                  <tr key={order._id} className="hover:bg-parchment/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className={`text-xs px-2 py-0.5 rounded-sm ${
                        status === "delivered" ? "bg-green-50 text-green-600" :
                        status === "cancelled" ? "bg-red-50 text-red-500" :
                        "bg-amber/10 text-amber-600"
                      }`}>{status}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatBdt(order.totalPrice)}</td>
                    <td className="px-4 py-3 text-ink/50">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const fetch = () => {
    setLoading(true);
    productsApi.list({ limit: 50, search }).then(({ data }) => setProducts(extractList<Product>(data, "products"))).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await productsApi.delete(id); fetch(); toast.success("Product deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 bg-parchment border border-ink/10 rounded-sm text-sm focus:outline-none focus:border-amber transition-colors" />
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={fetch}
        />
      )}

      <div className="border border-ink/10 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-parchment/50 border-b border-ink/10">
            <tr>
              {["Product", "Price", "Stock", "Featured", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-ink/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
              ))
              : products.map(product => (
                <tr key={product._id} className="hover:bg-parchment/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-parchment rounded-sm overflow-hidden shrink-0">
                         {product.images?.[0] && <Image src={product.images[0].url} alt="" width={40} height={40} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1 max-w-[200px]">{product.name}</p>
                        {product.brand && <p className="text-xs text-ink/40">{product.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">৳{(product.discountPrice ?? product.price).toLocaleString()}</p>
                    {product.discountPrice && <p className="text-xs text-ink/40 line-through">৳{product.price.toLocaleString()}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-sm ${product.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(product.isFeatured ?? product.featured)
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <X className="w-4 h-4 text-ink/20" />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditProduct(product); setShowForm(true); }}
                        className="p-1.5 hover:bg-parchment rounded-sm transition-colors text-ink/50 hover:text-ink">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(product._id)}
                        className="p-1.5 hover:bg-red-50 rounded-sm transition-colors text-ink/50 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && products.length === 0 && (
          <div className="text-center py-12 text-ink/40">No products found</div>
        )}
      </div>
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    discountPrice: product?.discountPrice || "",
    stock: product?.stock || "",
    brand: product?.brand || "",
    sku: product?.sku || "",
    tags: product?.tags?.join(", ") || "",
    isFeatured: product?.isFeatured ?? product?.featured ?? false,
    category: typeof product?.category === "object" ? (product.category as any)._id : product?.category || "",
  });
  const [sizes, setSizes] = useState<string[]>(product?.sizes || []);
  const [sizeInput, setSizeInput] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(extractList<Category>(data, "categories"))).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append("sizes", JSON.stringify(sizes));
      if (images) Array.from(images).forEach(f => fd.append("images", f));
      if (product) {
        await productsApi.update(product._id, fd);
        toast.success("Product updated!");
      } else {
        await productsApi.create(fd);
        toast.success("Product created!");
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save product");
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="border border-amber/30 bg-amber/5 rounded-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
          {product ? "Edit Product" : "New Product"}
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-parchment rounded-sm transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {[
          { key: "name", label: "Name", col: 2, type: "text", placeholder: "Product name" },
          { key: "brand", label: "Brand", col: 1, type: "text", placeholder: "Brand name" },
          { key: "sku", label: "SKU", col: 1, type: "text", placeholder: "SKU-001" },
          { key: "price", label: "Price (৳)", col: 1, type: "number", placeholder: "0" },
          { key: "discountPrice", label: "Discount Price (৳)", col: 1, type: "number", placeholder: "0 (optional)" },
          { key: "stock", label: "Stock", col: 1, type: "number", placeholder: "0" },
          { key: "tags", label: "Tags (comma-separated)", col: 1, type: "text", placeholder: "tag1, tag2" },
        ].map(f => (
          <div key={f.key} className={f.col === 2 ? "col-span-2" : ""}>
            <label className="block text-xs font-semibold tracking-wider uppercase mb-1 text-ink/50">{f.label}</label>
            <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber transition-colors" />
          </div>
        ))}

        <div className="col-span-2">
          <label className="block text-xs font-semibold tracking-wider uppercase mb-1 text-ink/50">Description</label>
          <textarea value={form.description} rows={3} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber transition-colors resize-none" />
        </div>

        {/* Sizes chip input */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold tracking-wider uppercase mb-1 text-ink/50">Available Sizes <span className="normal-case font-normal text-ink/30">(optional — press Enter or comma to add)</span></label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {sizes.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-ink text-cream text-xs font-medium px-2.5 py-1 rounded-sm">
                {s}
                <button type="button" onClick={() => setSizes(prev => prev.filter(x => x !== s))} className="hover:text-red-300 transition-colors">&times;</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={sizeInput}
            placeholder="e.g. S, M, L, XL, 38, 40…"
            onChange={e => setSizeInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                const val = sizeInput.trim().replace(/,$/, "");
                if (val && !sizes.includes(val)) setSizes(prev => [...prev, val]);
                setSizeInput("");
              } else if (e.key === "Backspace" && sizeInput === "" && sizes.length > 0) {
                setSizes(prev => prev.slice(0, -1));
              }
            }}
            onBlur={() => {
              const val = sizeInput.trim().replace(/,$/, "");
              if (val && !sizes.includes(val)) setSizes(prev => [...prev, val]);
              setSizeInput("");
            }}
            className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase mb-1 text-ink/50">Category</label>
          <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber transition-colors">
            <option value="">Select category</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase mb-1 text-ink/50">Images (up to 5)</label>
          <input type="file" accept="image/*" multiple onChange={e => setImages(e.target.files)}
            className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-medium file:bg-ink file:text-cream hover:file:bg-ink/90 cursor-pointer" />
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
            className="accent-amber w-4 h-4" />
          <label htmlFor="featured" className="text-sm font-medium cursor-pointer">Mark as Featured</label>
        </div>

        <div className="col-span-2 flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-60">
            {saving ? "Saving…" : product ? "Update Product" : "Create Product"}
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 border border-ink/15 text-sm rounded-sm hover:bg-parchment transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.all()
      .then(({ data }) => setOrders(extractList<Order>(data, "orders").map(normalizeOrder)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: status as Order["status"], orderStatus: status } : o));
      toast.success("Status updated");
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="border border-ink/10 rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-parchment/50 border-b border-ink/10">
          <tr>
            {["Order ID", "Items", "Total", "Status", "Date", "Action"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-ink/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
            ))
            : orders.map(order => {
              const status = getOrderStatus(order);
              return (
              <tr key={order._id} className="hover:bg-parchment/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">#{order._id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3 text-ink/60">{(order.items?.length ?? 0)} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}</td>
                <td className="px-4 py-3 font-semibold">{formatBdt(order.totalPrice)}</td>
                <td className="px-4 py-3">
                  <select value={status} onChange={e => updateStatus(order._id, e.target.value)}
                    className="text-xs bg-parchment border border-ink/10 rounded-sm px-2 py-1 focus:outline-none focus:border-amber capitalize">
                    {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-ink/50">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${order._id}`} className="text-xs text-amber-500 hover:text-amber-600 transition-colors">View</Link>
                </td>
              </tr>
              );
            })}
        </tbody>
      </table>
      {!loading && orders.length === 0 && <div className="text-center py-12 text-ink/40">No orders yet</div>}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    setLoading(true);
    usersApi
      .all({ search, limit: 100 })
      .then(({ data }) => setUsers(extractList<User>(data, "users")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const fetchDetails = async (id: string) => {
    setLoadingDetails(true);
    setSelectedUser(id);
    try {
      const { data } = await usersApi.details(id);
      setUserDetails(data);
    } catch {
      toast.error("Failed to fetch details");
      setSelectedUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await usersApi.update(id, { role });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: role as any } : u));
      toast.success("Role updated");
    } catch { toast.error("Failed to update"); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await usersApi.delete(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success("User deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full pl-9 pr-4 py-2.5 bg-parchment border border-ink/10 rounded-sm text-sm focus:outline-none focus:border-amber transition-colors"
        />
      </div>

      <div className="border border-ink/10 rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-parchment/50 border-b border-ink/10">
          <tr>
            {["User", "Email", "Role", "Verified", "Joined", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-ink/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
            ))
            : users.map(u => (
              <tr key={u._id} className="hover:bg-parchment/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-ink text-cream flex items-center justify-center text-xs font-medium overflow-hidden">
                       {u.avatar ? <Image src={u.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                    </div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink/60 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={e => updateRole(u._id, e.target.value)}
                    className="text-xs bg-parchment border border-ink/10 rounded-sm px-2 py-1 focus:outline-none focus:border-amber capitalize">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {(u.isEmailVerified ?? (u as { isVerified?: boolean }).isVerified)
                    ? <Check className="w-4 h-4 text-green-500" />
                    : <X className="w-4 h-4 text-ink/20" />
                  }
                </td>
                <td className="px-4 py-3 text-ink/50 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => fetchDetails(u._id)}
                      className="text-xs font-medium px-2 py-1 bg-amber/10 text-amber-600 rounded-sm hover:bg-amber/20 transition-colors">
                      Details
                    </button>
                    <button onClick={() => deleteUser(u._id)}
                      className="p-1.5 hover:bg-red-50 rounded-sm transition-colors text-ink/30 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
      {!loading && users.length === 0 && <div className="text-center py-12 text-ink/40">No users found</div>}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-cream rounded-sm shadow-2xl overflow-hidden border border-ink/10">
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10 bg-parchment/30">
                <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>User Details</h3>
                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-ink/5 rounded-sm transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6">
                {loadingDetails ? (
                  <div className="space-y-4 py-8">
                    <div className="skeleton h-12 w-full rounded" />
                    <div className="skeleton h-24 w-full rounded" />
                    <div className="skeleton h-24 w-full rounded" />
                  </div>
                ) : userDetails ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-ink text-cream flex items-center justify-center text-2xl font-bold overflow-hidden">
                         {userDetails.user.avatar ? <Image src={userDetails.user.avatar} alt="" width={64} height={64} className="w-full h-full object-cover" /> : userDetails.user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xl">{userDetails.user.name}</h4>
                        <p className="text-sm text-ink/50">{userDetails.user.email}</p>
                        <p className="text-sm text-amber-600 font-medium mt-0.5">{userDetails.user.phone || "No phone provided"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-parchment p-3 rounded-sm border border-ink/5 text-center">
                        <p className="text-[10px] font-semibold tracking-wider uppercase text-ink/40 mb-1">Total Orders</p>
                        <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{userDetails.stats.totalOrders}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-sm border border-red-100 text-center">
                        <p className="text-[10px] font-semibold tracking-wider uppercase text-red-400 mb-1">Cancelled</p>
                        <p className="text-xl font-bold text-red-600" style={{ fontFamily: "var(--font-display)" }}>{userDetails.stats.cancelledOrders}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-sm border border-green-100 text-center">
                        <p className="text-[10px] font-semibold tracking-wider uppercase text-green-500 mb-1">Total Bill</p>
                        <p className="text-xl font-bold text-green-700" style={{ fontFamily: "var(--font-display)" }}>৳{userDetails.stats.totalBill.toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold tracking-wider uppercase text-ink/40 mb-3">Order History</h5>
                      {userDetails.orders.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {userDetails.orders.map((o: any) => (
                            <div key={o._id} className="flex items-center justify-between p-2.5 bg-parchment/50 rounded-sm border border-ink/5 text-sm">
                              <div>
                                <p className="font-mono text-xs text-ink/70">#{o.orderNumber?.slice(-8).toUpperCase() || o._id.slice(-8).toUpperCase()}</p>
                                <p className="text-[10px] text-ink/40">{new Date(o.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">৳{o.totalPrice.toLocaleString()}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm capitalize ${
                                  o.orderStatus === "delivered" ? "bg-green-100 text-green-700" :
                                  o.orderStatus === "cancelled" ? "bg-red-100 text-red-600" :
                                  "bg-amber-100 text-amber-700"
                                }`}>{o.orderStatus}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-ink/30 italic">No orders yet</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    categoriesApi.list().then(({ data }) => setCategories(extractList<Category>(data, "categories"))).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) { await categoriesApi.update(editId, form); toast.success("Updated!"); }
      else { await categoriesApi.create(form); toast.success("Category created!"); }
      setShowForm(false); setForm({ name: "", description: "" }); setEditId(null); fetch();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try { await categoriesApi.delete(id); fetch(); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>Categories ({categories.length})</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", description: "" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border border-amber/30 bg-amber/5 rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editId ? "Edit" : "New"} Category</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-ink/40" /></button>
          </div>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Category name"
            className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber" />
          <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)"
            className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-amber" />
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.name}
              className="px-5 py-2 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-ink/15 text-sm rounded-sm hover:bg-parchment transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-sm" />)
          : categories.map(cat => (
            <div key={cat._id} className="border border-ink/10 rounded-sm p-4 flex items-center gap-3 hover:border-ink/20 transition-colors group">
              <div className="w-10 h-10 bg-parchment rounded-sm flex items-center justify-center text-lg shrink-0 overflow-hidden">
                 {cat.image ? <Image src={cat.image} alt="" width={40} height={40} className="w-full h-full object-cover" /> : "🏷"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{cat.name}</p>
                <p className="text-xs text-ink/40 truncate">{cat.slug}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setForm({ name: cat.name, description: cat.description || "" }); setEditId(cat._id); setShowForm(true); }}
                  className="p-1.5 hover:bg-parchment rounded-sm text-ink/40 hover:text-ink transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat._id)}
                  className="p-1.5 hover:bg-red-50 rounded-sm text-ink/40 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
interface NewBanner {
  file: File;
  previewUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  textColor: string;
  buttonBg: string;
  buttonColor: string;
}

function SettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "Next Shop",
    heroTitle: "",
    heroSubtitle: "",
    heroCtaText: "Shop Now",
    heroCtaHref: "/products",
    banners: [],
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    facebookUrl: "",
    instagramUrl: "",
    whatsappNumber: "",
    announcementText: "",
    showAnnouncement: false,
    announcementBg: "#D97706",
    announcementColor: "#FFFFFF",
  });

  const [subTab, setSubTab] = useState<"general" | "contact" | "social" | "announcement" | "banners">("general");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [newBanners, setNewBanners] = useState<NewBanner[]>([]);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .get()
      .then(({ data }) => {
        const next = data?.data as SiteSettings | undefined;
        if (next) {
          setSettings({
            siteName: next.siteName || "Next Shop",
            heroTitle: next.heroTitle || "",
            heroSubtitle: next.heroSubtitle || "",
            heroCtaText: next.heroCtaText || "Shop Now",
            heroCtaHref: next.heroCtaHref || "/products",
            banners: Array.isArray(next.banners) ? next.banners : [],
            logo: next.logo || { url: "", publicId: "" },
            contactPhone: next.contactPhone || "",
            contactEmail: next.contactEmail || "",
            contactAddress: next.contactAddress || "",
            facebookUrl: next.facebookUrl || "",
            instagramUrl: next.instagramUrl || "",
            whatsappNumber: next.whatsappNumber || "",
            announcementText: next.announcementText || "",
            showAnnouncement: next.showAnnouncement ?? false,
            announcementBg: next.announcementBg || "#D97706",
            announcementColor: next.announcementColor || "#FFFFFF",
          });
        }
      })
      .catch(() => toast.error("Failed to load site settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleBannerFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const banners: NewBanner[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      title: "",
      subtitle: "",
      ctaText: "Shop Now",
      ctaHref: "/products",
      textColor: "#F8F6F0",
      buttonBg: "#D97706",
      buttonColor: "#0A0A0A",
    }));
    setNewBanners((prev) => [...prev, ...banners]);
  };

  const removeExistingBanner = (url: string, index: number) => {
    setSettings((prev) => ({
      ...prev,
      banners: prev.banners.filter((banner) => banner.url !== url),
    }));
    if (previewSlideIndex >= index && previewSlideIndex > 0) {
      setPreviewSlideIndex((prev) => prev - 1);
    }
  };

  const removeNewBanner = (index: number) => {
    setNewBanners((prev) => prev.filter((_, i) => i !== index));
    const absoluteIndex = settings.banners.length + index;
    if (previewSlideIndex >= absoluteIndex && previewSlideIndex > 0) {
      setPreviewSlideIndex((prev) => prev - 1);
    }
  };

  const updateExistingBannerField = (index: number, field: string, value: string) => {
    setSettings((prev) => {
      const nextBanners = [...prev.banners];
      nextBanners[index] = { ...nextBanners[index], [field]: value };
      return { ...prev, banners: nextBanners };
    });
  };

  const updateNewBannerField = (index: number, field: string, value: string) => {
    setNewBanners((prev) => {
      const nextBanners = [...prev];
      nextBanners[index] = { ...nextBanners[index], [field]: value } as any;
      return nextBanners;
    });
  };

  useEffect(() => {
    return () => {
      newBanners.forEach((b) => URL.revokeObjectURL(b.previewUrl));
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [newBanners, logoPreviewUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("siteName", settings.siteName);
      fd.append("heroTitle", settings.heroTitle);
      fd.append("heroSubtitle", settings.heroSubtitle);
      fd.append("heroCtaText", settings.heroCtaText);
      fd.append("heroCtaHref", settings.heroCtaHref);
      
      fd.append("contactPhone", settings.contactPhone || "");
      fd.append("contactEmail", settings.contactEmail || "");
      fd.append("contactAddress", settings.contactAddress || "");
      fd.append("facebookUrl", settings.facebookUrl || "");
      fd.append("instagramUrl", settings.instagramUrl || "");
      fd.append("whatsappNumber", settings.whatsappNumber || "");
      fd.append("announcementText", settings.announcementText || "");
      fd.append("showAnnouncement", String(settings.showAnnouncement));
      fd.append("announcementBg", settings.announcementBg || "#D97706");
      fd.append("announcementColor", settings.announcementColor || "#FFFFFF");

      fd.append("existingBanners", JSON.stringify(settings.banners));

      if (logoFile) {
        fd.append("logoImage", logoFile);
      }
      if (removeLogo) {
        fd.append("removeLogo", "true");
      }

      newBanners.forEach((b) => {
        fd.append("bannerImages", b.file);
      });
      
      const newBannersMeta = newBanners.map(({ file, previewUrl, ...rest }) => rest);
      fd.append("newBanners", JSON.stringify(newBannersMeta));

      const { data } = await settingsApi.update(fd);
      const saved = data?.data as SiteSettings | undefined;
      if (saved) {
        setSettings({
          siteName: saved.siteName || "Next Shop",
          heroTitle: saved.heroTitle || "",
          heroSubtitle: saved.heroSubtitle || "",
          heroCtaText: saved.heroCtaText || "Shop Now",
          heroCtaHref: saved.heroCtaHref || "/products",
          banners: Array.isArray(saved.banners) ? saved.banners : [],
          logo: saved.logo || { url: "", publicId: "" },
          contactPhone: saved.contactPhone || "",
          contactEmail: saved.contactEmail || "",
          contactAddress: saved.contactAddress || "",
          facebookUrl: saved.facebookUrl || "",
          instagramUrl: saved.instagramUrl || "",
          whatsappNumber: saved.whatsappNumber || "",
          announcementText: saved.announcementText || "",
          showAnnouncement: saved.showAnnouncement ?? false,
          announcementBg: saved.announcementBg || "#D97706",
          announcementColor: saved.announcementColor || "#FFFFFF",
        });
        setLogoFile(null);
        setLogoPreviewUrl("");
        setRemoveLogo(false);
        setNewBanners([]);
        setPreviewSlideIndex(0);
      }
      toast.success("Site settings updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update site settings");
    } finally {
      setSaving(false);
    }
  };

  const totalSlides = settings.banners.length + newBanners.length;
  let previewBannerImage: any = null;

  if (totalSlides > 0) {
    const safeIndex = Math.min(previewSlideIndex, totalSlides - 1);
    if (safeIndex < settings.banners.length) {
      previewBannerImage = settings.banners[safeIndex];
    } else {
      const newIndex = safeIndex - settings.banners.length;
      const newB = newBanners[newIndex];
      if (newB) {
        previewBannerImage = {
          url: newB.previewUrl,
          title: newB.title,
          subtitle: newB.subtitle,
          ctaText: newB.ctaText,
          ctaHref: newB.ctaHref,
          textColor: newB.textColor,
          buttonBg: newB.buttonBg,
          buttonColor: newB.buttonColor,
        };
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-full rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="skeleton h-64 md:col-span-2 rounded" />
          <div className="skeleton h-64 rounded" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Settings Form Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sub-Tabs Navigation */}
          <div className="flex gap-1 border-b border-ink/10 pb-2 overflow-x-auto scrollbar-thin">
            {[
              { id: "general", label: "General Branding" },
              { id: "contact", label: "Contact & Support" },
              { id: "social", label: "Social Networks" },
              { id: "announcement", label: "Announcement Bar" },
              { id: "banners", label: "Dynamic Slideshow" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-sm transition-all border ${
                  subTab === tab.id
                    ? "bg-ink text-cream border-ink"
                    : "bg-parchment/30 text-ink/60 border-transparent hover:bg-parchment/60 hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content Cards */}
          <div className="border border-ink/10 rounded-sm p-6 bg-parchment/20 min-h-[300px]">
            
            {/* SUBTAB: GENERAL BRANDING */}
            {subTab === "general" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>Store Branding</h3>
                  <p className="text-xs text-ink/50 mb-4">Set your brand name and logo image displayed in the header and footer.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">Store Name</label>
                    <input
                      value={settings.siteName}
                      onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
                      placeholder="e.g. Next Shop"
                      className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2 text-ink/50">Store Logo</label>
                    {logoPreviewUrl ? (
                      <div className="flex items-center gap-4 p-4 border border-dashed border-amber bg-amber/5 rounded-sm">
                         <Image src={logoPreviewUrl} width={120} height={48} className="h-12 w-auto object-contain bg-ink p-1.5 rounded-sm shadow" alt="Logo Preview" unoptimized />
                        <div>
                          <p className="text-xs font-semibold">New logo selected</p>
                          <button
                            type="button"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreviewUrl("");
                            }}
                            className="text-[10px] text-red-500 font-semibold hover:underline mt-1 block"
                          >
                            Cancel Selection
                          </button>
                        </div>
                      </div>
                    ) : !removeLogo && settings.logo?.url ? (
                      <div className="flex items-center gap-4 p-4 border border-ink/10 bg-cream rounded-sm">
                         <Image src={settings.logo.url} width={120} height={48} className="h-12 w-auto object-contain bg-ink p-1.5 rounded-sm shadow" alt="Current Logo" />
                        <div>
                          <p className="text-xs font-semibold">Active Store Logo</p>
                          <button
                            type="button"
                            onClick={() => setRemoveLogo(true)}
                            className="text-[10px] text-red-500 font-semibold hover:underline mt-1 block"
                          >
                            Remove Logo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border border-dashed border-ink/15 rounded-sm p-8 flex flex-col items-center justify-center hover:bg-cream/50 transition-all cursor-pointer">
                        <Upload className="w-6 h-6 text-ink/40 mb-2" />
                        <span className="text-xs font-semibold text-ink/70">Upload Logo Image</span>
                        <span className="text-[10px] text-ink/40 mt-0.5">PNG or JPG, transparent background recommended</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoFile(file);
                              setLogoPreviewUrl(URL.createObjectURL(file));
                              setRemoveLogo(false);
                            }
                          }}
                        />
                      </label>
                    )}
                    
                    {removeLogo && (
                      <div className="mt-3 text-xs text-red-500 font-semibold flex items-center gap-1.5 bg-red-50 p-2.5 rounded-sm border border-red-100">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Logo will be removed when settings are saved.</span>
                        <button
                          type="button"
                          onClick={() => setRemoveLogo(false)}
                          className="underline text-ink hover:text-amber ml-auto text-[10px] uppercase font-bold"
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: CONTACT INFO */}
            {subTab === "contact" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>Store Contact Details</h3>
                  <p className="text-xs text-ink/50 mb-4">Enter support contact info to render in the website footer dynamically.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="support@sareeshop.com"
                        className="w-full bg-cream border border-ink/10 rounded-sm pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">Support Phone</label>
                    <div className="relative">
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input
                        type="text"
                        value={settings.contactPhone}
                        onChange={(e) => setSettings((prev) => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+880 1712-345678"
                        className="w-full bg-cream border border-ink/10 rounded-sm pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">Physical Store Address</label>
                    <textarea
                      rows={3}
                      value={settings.contactAddress}
                      onChange={(e) => setSettings((prev) => ({ ...prev, contactAddress: e.target.value }))}
                      placeholder="123 Saree Mansion, Banani, Dhaka, Bangladesh"
                      className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: SOCIAL LINKS */}
            {subTab === "social" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>Social Media Networks</h3>
                  <p className="text-xs text-ink/50 mb-4">Connect your store with social accounts. Icons will automatically render in the footer.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">Facebook Page URL</label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input
                        type="url"
                        value={settings.facebookUrl}
                        onChange={(e) => setSettings((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full bg-cream border border-ink/10 rounded-sm pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">Instagram Profile URL</label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input
                        type="url"
                        value={settings.instagramUrl}
                        onChange={(e) => setSettings((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                        placeholder="https://instagram.com/yourhandle"
                        className="w-full bg-cream border border-ink/10 rounded-sm pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">WhatsApp Business Number</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input
                        type="text"
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                        placeholder="+8801700000000 (include country code)"
                        className="w-full bg-cream border border-ink/10 rounded-sm pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-ink/40 mt-1">Allows users to tap to directly chat with you on WhatsApp.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: ANNOUNCEMENT BAR */}
            {subTab === "announcement" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>Announcement Bar</h3>
                  <p className="text-xs text-ink/50 mb-4">Display promotional notifications, discounts, or delivery details at the top of every page.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-cream border border-ink/5 rounded-sm">
                    <input
                      type="checkbox"
                      id="showAnnouncement"
                      checked={settings.showAnnouncement}
                      onChange={(e) => setSettings((prev) => ({ ...prev, showAnnouncement: e.target.checked }))}
                      className="w-4 h-4 accent-amber cursor-pointer rounded-xs"
                    />
                    <label htmlFor="showAnnouncement" className="text-sm font-semibold cursor-pointer select-none">
                      Enable announcement bar on storefront
                    </label>
                  </div>

                  {settings.showAnnouncement && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50">Announcement Message</label>
                        <input
                          value={settings.announcementText}
                          onChange={(e) => setSettings((prev) => ({ ...prev, announcementText: e.target.value }))}
                          placeholder="e.g. Free delivery on orders over ৳2,000! Shop Saree Festives now."
                          className="w-full bg-cream border border-ink/10 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50 font-mono">Background Color</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={settings.announcementBg || "#D97706"}
                              onChange={(e) => setSettings((prev) => ({ ...prev, announcementBg: e.target.value }))}
                              className="w-10 h-10 border border-ink/15 rounded-sm cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={settings.announcementBg || "#D97706"}
                              onChange={(e) => setSettings((prev) => ({ ...prev, announcementBg: e.target.value }))}
                              className="bg-cream border border-ink/10 rounded-sm px-2.5 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-amber w-28 text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/50 font-mono">Text Color</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={settings.announcementColor || "#FFFFFF"}
                              onChange={(e) => setSettings((prev) => ({ ...prev, announcementColor: e.target.value }))}
                              className="w-10 h-10 border border-ink/15 rounded-sm cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={settings.announcementColor || "#FFFFFF"}
                              onChange={(e) => setSettings((prev) => ({ ...prev, announcementColor: e.target.value }))}
                              className="bg-cream border border-ink/10 rounded-sm px-2.5 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-amber w-28 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB: SLIDESHOW BANNERS */}
            {subTab === "banners" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>Dynamic Slider Slides</h3>
                    <p className="text-xs text-ink/50">Each banner slide can support distinct overlays, titles, button destinations, and colors.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-ink text-cream text-xs font-bold rounded-sm hover:bg-ink/90 transition-colors cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" /> Add New Banner
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleBannerFilesChange}
                    />
                  </label>
                </div>

                {/* Banners List */}
                <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  
                  {/* Render Existing Banners */}
                  {settings.banners.map((banner, index) => (
                    <div key={banner.url} className="p-4 border border-ink/10 rounded-sm bg-parchment/40 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-28 bg-parchment rounded-sm overflow-hidden shrink-0 border border-ink/10 relative shadow-sm">
                           <Image src={banner.url} alt="" width={240} height={120} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingBanner(banner.url, index)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-cream flex items-center justify-center shadow"
                            aria-label="Remove banner"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-ink/50 uppercase mb-0.5">Slide Title Overlay</label>
                            <input
                              value={banner.title || ""}
                              onChange={(e) => updateExistingBannerField(index, "title", e.target.value)}
                              className="w-full bg-cream border border-ink/10 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                              placeholder="e.g. Luxurious silk sarees"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-ink/50 uppercase mb-0.5">Slide Subtitle Overlay</label>
                            <input
                              value={banner.subtitle || ""}
                              onChange={(e) => updateExistingBannerField(index, "subtitle", e.target.value)}
                              className="w-full bg-cream border border-ink/10 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                              placeholder="e.g. Elegant collection for weddings"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-ink/50 uppercase mb-0.5">CTA Button Text</label>
                            <input
                              value={banner.ctaText || "Shop Now"}
                              onChange={(e) => updateExistingBannerField(index, "ctaText", e.target.value)}
                              className="w-full bg-cream border border-ink/10 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-ink/50 uppercase mb-0.5">CTA Button Link</label>
                            <input
                              value={banner.ctaHref || "/products"}
                              onChange={(e) => updateExistingBannerField(index, "ctaHref", e.target.value)}
                              className="w-full bg-cream border border-ink/10 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visual styling tools */}
                      <div className="grid grid-cols-3 gap-3 border-t border-ink/5 pt-3">
                        <div>
                          <label className="block text-[9px] font-bold text-ink/50 uppercase mb-1">Text Color</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={banner.textColor || "#F8F6F0"}
                              onChange={(e) => updateExistingBannerField(index, "textColor", e.target.value)}
                              className="w-6 h-6 border border-ink/10 rounded-xs cursor-pointer p-0"
                            />
                            <span className="text-[9px] font-mono uppercase">{banner.textColor || "#F8F6F0"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-ink/50 uppercase mb-1">Btn Background</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={banner.buttonBg || "#D97706"}
                              onChange={(e) => updateExistingBannerField(index, "buttonBg", e.target.value)}
                              className="w-6 h-6 border border-ink/10 rounded-xs cursor-pointer p-0"
                            />
                            <span className="text-[9px] font-mono uppercase">{banner.buttonBg || "#D97706"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-ink/50 uppercase mb-1">Btn Text Color</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={banner.buttonColor || "#0A0A0A"}
                              onChange={(e) => updateExistingBannerField(index, "buttonColor", e.target.value)}
                              className="w-6 h-6 border border-ink/10 rounded-xs cursor-pointer p-0"
                            />
                            <span className="text-[9px] font-mono uppercase">{banner.buttonColor || "#0A0A0A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-cream/50 p-2 rounded-xs border border-ink/5">
                        <span className="text-[9px] text-green-600 font-semibold uppercase">Cloudinary Banner</span>
                        <button
                          type="button"
                          onClick={() => setPreviewSlideIndex(index)}
                          className={`text-[9px] px-2.5 py-1 rounded-xs font-bold border transition-all uppercase ${
                            previewSlideIndex === index
                              ? "bg-amber text-ink border-amber"
                              : "bg-cream text-ink/50 border-ink/10 hover:bg-parchment"
                          }`}
                        >
                          {previewSlideIndex === index ? "Previewing" : "Show Preview"}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Render Newly Uploaded but Unsaved Banners */}
                  {newBanners.map((banner, index) => {
                    const absoluteIndex = settings.banners.length + index;
                    return (
                      <div key={banner.previewUrl} className="p-4 border border-dashed border-amber bg-amber/5 space-y-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-28 bg-parchment rounded-sm overflow-hidden shrink-0 border border-amber/30 relative shadow-sm">
                             <Image src={banner.previewUrl} alt="" width={240} height={120} className="w-full h-full object-cover" unoptimized />
                            <button
                              type="button"
                              onClick={() => removeNewBanner(index)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-cream flex items-center justify-center shadow"
                              aria-label="Remove banner"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-semibold text-amber-600/70 uppercase mb-0.5">New Slide Title</label>
                              <input
                                value={banner.title}
                                onChange={(e) => updateNewBannerField(index, "title", e.target.value)}
                                className="w-full bg-cream border border-amber/20 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                                placeholder="Enter title for slide..."
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] font-semibold text-amber-600/70 uppercase mb-0.5">New Slide Subtitle</label>
                              <input
                                value={banner.subtitle}
                                onChange={(e) => updateNewBannerField(index, "subtitle", e.target.value)}
                                className="w-full bg-cream border border-amber/20 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                                placeholder="Enter subtitle for slide..."
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-amber-600/70 uppercase mb-0.5">Button Text</label>
                              <input
                                value={banner.ctaText}
                                onChange={(e) => updateNewBannerField(index, "ctaText", e.target.value)}
                                className="w-full bg-cream border border-amber/20 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-amber-600/70 uppercase mb-0.5">Button Link</label>
                              <input
                                value={banner.ctaHref}
                                onChange={(e) => updateNewBannerField(index, "ctaHref", e.target.value)}
                                className="w-full bg-cream border border-amber/20 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Styling tools */}
                        <div className="grid grid-cols-3 gap-3 border-t border-amber/20 pt-3">
                          <div>
                            <label className="block text-[9px] font-bold text-amber-600/70 uppercase mb-1">Text Color</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={banner.textColor}
                                onChange={(e) => updateNewBannerField(index, "textColor", e.target.value)}
                                className="w-6 h-6 border border-amber/20 rounded-xs cursor-pointer p-0"
                              />
                              <span className="text-[9px] font-mono uppercase">{banner.textColor}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-amber-600/70 uppercase mb-1">Btn Background</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={banner.buttonBg}
                                onChange={(e) => updateNewBannerField(index, "buttonBg", e.target.value)}
                                className="w-6 h-6 border border-amber/20 rounded-xs cursor-pointer p-0"
                              />
                              <span className="text-[9px] font-mono uppercase">{banner.buttonBg}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-amber-600/70 uppercase mb-1">Btn Text Color</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={banner.buttonColor}
                                onChange={(e) => updateNewBannerField(index, "buttonColor", e.target.value)}
                                className="w-6 h-6 border border-amber/20 rounded-xs cursor-pointer p-0"
                              />
                              <span className="text-[9px] font-mono uppercase">{banner.buttonColor}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-amber/5 p-2 rounded-xs border border-amber/10">
                          <span className="text-[9px] text-amber-600 font-bold uppercase animate-pulse">Unsaved Slide (Ready to Upload)</span>
                          <button
                            type="button"
                            onClick={() => setPreviewSlideIndex(absoluteIndex)}
                            className={`text-[9px] px-2.5 py-1 rounded-xs font-bold border transition-all uppercase ${
                              previewSlideIndex === absoluteIndex
                                ? "bg-amber text-ink border-amber"
                                : "bg-cream text-ink/50 border-ink/10 hover:bg-parchment"
                            }`}
                          >
                            {previewSlideIndex === absoluteIndex ? "Previewing" : "Show Preview"}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {totalSlides === 0 && (
                    <div className="border border-dashed border-ink/15 rounded-sm p-12 text-center text-ink/40">
                      No banner image slides configured. Add image slides to customize store banners.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Visual Preview Sticky Column */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 border border-ink/10 bg-cream rounded-sm p-4 shadow-sm overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Visual Preview Mockup</span>
              <span className="text-[9px] bg-green-50 text-green-600 border border-green-150 px-2 py-0.5 rounded-full font-bold animate-pulse">Live</span>
            </div>
            
            <div className="border border-ink/10 rounded-sm overflow-hidden aspect-[4/3] bg-parchment relative flex flex-col shadow-inner">
              {/* 1. Announcement Bar Mockup */}
              {settings.showAnnouncement && settings.announcementText ? (
                <div 
                  style={{ backgroundColor: settings.announcementBg, color: settings.announcementColor }}
                  className="text-[7px] py-1 text-center font-bold tracking-wide select-none"
                >
                  {settings.announcementText}
                </div>
              ) : null}
              
              {/* 2. Header Navbar Mockup */}
              <div className="bg-cream/90 backdrop-blur-xs border-b border-ink/5 px-2 py-1.5 flex items-center justify-between text-[7px] select-none">
                <div className="flex items-center gap-1 font-bold">
                  {logoPreviewUrl ? (
                     <Image src={logoPreviewUrl} width={24} height={12} className="h-3 w-auto object-contain bg-ink/5 p-[1px]" alt="Logo Preview" unoptimized />
                  ) : !removeLogo && settings.logo?.url ? (
                     <Image src={settings.logo.url} width={24} height={12} className="h-3 w-auto object-contain bg-ink/5 p-[1px]" alt="Active Logo" />
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 bg-ink rounded-xs flex items-center justify-center text-cream text-[5px]">🛍</div>
                      <span>{settings.siteName}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2 text-ink/30 font-medium">
                  <span>Shop</span>
                  <span>Orders</span>
                  <span>About</span>
                </div>
                <div className="w-6" />
              </div>

              {/* 3. Hero Active Slide Mockup */}
              {previewBannerImage ? (
                <div 
                  style={{ backgroundImage: `url(${previewBannerImage.url})` }}
                  className="flex-1 bg-cover bg-center relative flex items-center p-3.5 overflow-hidden transition-all duration-300"
                >
                  {/* Dark overlay to make text readable */}
                  <div className="absolute inset-0 bg-ink/40" />
                  
                  <div className="relative text-left max-w-[80%] space-y-1">
                    <h2 
                      style={{ color: previewBannerImage.textColor }} 
                      className="text-[10px] sm:text-xs font-bold leading-tight drop-shadow-sm font-display truncate"
                    >
                      {previewBannerImage.title || "Set slide title"}
                    </h2>
                    <p 
                      style={{ color: previewBannerImage.textColor }} 
                      className="text-[6.5px] opacity-80 leading-normal line-clamp-2"
                    >
                      {previewBannerImage.subtitle || "Set slide subtitle"}
                    </p>
                    <div className="pt-1 select-none">
                      <span 
                        style={{ backgroundColor: previewBannerImage.buttonBg, color: previewBannerImage.buttonColor }}
                        className="text-[5.5px] px-1.5 py-0.5 font-bold rounded-xs shadow-xs"
                      >
                        {previewBannerImage.ctaText || "Shop Now"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-parchment flex flex-col items-center justify-center text-center p-4">
                  <p className="text-[10px] text-ink/40 font-semibold uppercase tracking-wider">No Banners Added</p>
                  <p className="text-[8px] text-ink/30 mt-0.5">Go to dynamic slides sub-tab and select images.</p>
                </div>
              )}
            </div>

            {/* Mockup Specs info card */}
            <div className="bg-parchment/30 p-3 rounded-sm border border-ink/5 space-y-2 text-[10px] text-ink/50 select-none">
              <div className="flex justify-between">
                <span className="font-semibold text-ink/70">Selected Preview Slide:</span>
                <span className="font-mono text-ink/80">{totalSlides > 0 ? `#${Math.min(previewSlideIndex, totalSlides - 1) + 1} of ${totalSlides}` : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-ink/70">Store Phone:</span>
                <span className="truncate max-w-[140px] text-ink/80">{settings.contactPhone || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-ink/70">Store Email:</span>
                <span className="truncate max-w-[140px] text-ink/80">{settings.contactEmail || "Not set"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Save Button Floating Panel */}
      <div className="flex items-center gap-3 border-t border-ink/10 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-cream text-sm font-semibold rounded-sm hover:bg-ink/90 disabled:opacity-60 transition-all shadow hover:shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving site settings…" : "Save Site Settings"}
        </button>
        {totalSlides > 0 && (
          <span className="text-xs text-ink/40">
            Currently compiling {settings.banners.length} existing and {newBanners.length} new banner uploads.
          </span>
        )}
      </div>
    </form>
  );
}
