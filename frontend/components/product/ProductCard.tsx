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
          className="relative overflow-hidden bg-[#FAF8F5] border border-ink/5 rounded-md aspect-[4/5] flex items-center justify-center"
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
              className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-parchment">
              <ShoppingBag className="w-12 h-12 text-ink/20" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {isFeatured && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-amber text-ink px-2.5 py-1 rounded-sm shadow-xs">
                Featured
              </span>
            )}
            {discountPct > 0 && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-ink text-cream px-2 py-1 rounded-sm shadow-xs">
                -{discountPct}%
              </span>
            )}
            {product.stock === 0 && (
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-parchment text-ink/60 px-2 py-1 rounded-sm shadow-xs">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            aria-label="Add to wishlist"
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-cream/90 backdrop-blur-sm shadow-xs border border-ink/10 rounded-full flex items-center justify-center transition-all hover:bg-cream hover:scale-110 active:scale-95"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isInWishlist ? "fill-red-500 text-red-500" : "text-ink/60"
              }`}
            />
          </button>

          {/* Floating Quick Add */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            aria-label="Add to cart"
            title={product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            className="absolute bottom-3 right-3 z-10 w-9 h-9 bg-cream/95 hover:bg-ink text-ink hover:text-cream shadow-md border border-ink/10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
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
