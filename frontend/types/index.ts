export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  wishlist: string[];
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: Category | string;
  images: { url: string; public_id: string }[];
  stock: number;
  brand?: string;
  sku?: string;
  tags?: string[];
  sizes?: string[];
  featured?: boolean;
  isFeatured?: boolean;
  rating?: number;
  numReviews?: number;
  ratings?: { average: number; count: number };
  reviews: Review[];
  createdAt: string;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  rating: number;
  comment: string;
  image?: { url: string; publicId?: string };
  createdAt: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
}

export interface Order {
  _id: string;
  user: string;
  items: {
    product: Product | string;
    name?: string;
    image?: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: Address;
  paymentMethod: string;
  totalPrice: number;
  /** API field name from MongoDB */
  orderStatus?: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  notes?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  refreshToken?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  inStock?: boolean;
  featured?: boolean;
}

export interface BannerImage {
  _id?: string;
  url: string;
  publicId?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  textColor?: string;
  buttonBg?: string;
  buttonColor?: string;
}

export interface SiteSettings {
  _id?: string;
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaHref: string;
  banners: BannerImage[];
  logo?: {
    url: string;
    publicId?: string;
  };
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappNumber?: string;
  announcementText?: string;
  showAnnouncement?: boolean;
  announcementBg?: string;
  announcementColor?: string;
}
