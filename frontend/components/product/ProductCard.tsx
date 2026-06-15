"use client";
import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";
import { useState, memo } from "react";
import { getProductRatings } from "@/lib/productRatings";

const ProductCardImageSwiper = dynamic(
  () => import("@/components/product/ProductCardImageSwiper"),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-parchment animate-pulse" />,
  }
);

interface Props {
  product: Product;
  index?: number;
}

const ProductCard = memo(function ProductCard({ product, index = 0 }: Props) {
  const { addItem } = useCartStore();
  const { isAuthenticated, user, updateWishlist } = useAuthStore();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isInWishlist = user?.wishlist?.some((id) => id === product._id);
  const { average: avgRating, count: totalReviews } = getProductRatings(product);
  const discountPct =
    product.discountPrice && product.price
      ? Math.round((1 - product.discountPrice / product.price) * 100)
      : 0;
  const isFeatured = product.isFeatured ?? product.featured ?? false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(product._id, 1);
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to use wishlist");
      return;
    }
    try {
      const { data } = await usersApi.toggleWishlist(product._id);
      updateWishlist((data.wishlist || []).map(String));
      toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/products/${product.slug || product._id}`} className="group block">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative overflow-hidden bg-parchment rounded-sm aspect-[4/5]"
        >
          {isHovered && product.images && product.images.length > 1 ? (
            <ProductCardImageSwiper images={product.images} alt={product.name} />
          ) : product.images?.[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={index < 4}
              fetchPriority={index < 4 ? "high" : "low"}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-parchment">
              <ShoppingBag className="w-12 h-12 text-ink/20" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isFeatured && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-amber text-ink px-2 py-1 rounded-sm">
                Featured
              </span>
            )}
            {discountPct > 0 && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-ink text-cream px-2 py-1 rounded-sm">
                -{discountPct}%
              </span>
            )}
            {product.stock === 0 && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-parchment text-ink/60 px-2 py-1 rounded-sm">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 bg-cream/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-cream hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isInWishlist ? "fill-red-500 text-red-500" : "text-ink/60"
              }`}
            />
          </button>

          {/* Quick Add */}
          <motion.button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            className="absolute bottom-0 left-0 right-0 py-2.5 bg-ink/95 text-cream text-xs font-medium tracking-wide translate-y-full group-hover:translate-y-0 transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {addingToCart ? "Adding…" : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </motion.button>
        </div>

        {/* Info */}
        <div className="pt-3 space-y-1.5 px-0.5">
          {(product.category as { name: string })?.name && (
            <p className="text-[10px] font-semibold tracking-widest uppercase text-ink/40">
              {(product.category as { name: string }).name}
            </p>
          )}
          <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 min-h-[18px]">
            {totalReviews > 0 ? (
              <>
                <Star className="w-3 h-3 fill-amber text-amber" />
                <span className="text-xs text-ink/60">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-ink/30">({totalReviews})</span>
              </>
            ) : (
              <span className="text-xs text-ink/30">No reviews yet</span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              ৳{(product.discountPrice ?? product.price).toLocaleString()}
            </span>
            {product.discountPrice && (
              <span className="text-sm text-ink/40 line-through">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

export default ProductCard;
