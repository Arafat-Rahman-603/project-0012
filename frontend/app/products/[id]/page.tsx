"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Heart,
  Star,
  Minus,
  Plus,
  ChevronLeft,
  Truck,
  Shield,
  RotateCcw,
  Share2,
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { productsApi, usersApi } from "@/lib/api";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import Link from "next/link";
import { getProductRatings, getRatingDistribution } from "@/lib/productRatings";


export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem } = useCartStore();
  const { isAuthenticated, user, updateWishlist } = useAuthStore();
  const isInWishlist = user?.wishlist?.some((id) => id === product?._id);

  useEffect(() => {
    productsApi
      .get(id)
      .then(({ data }) => setProduct(data?.product || data))
      .catch(() => router.push("/products"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(product!._id, quantity);
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in");
      return;
    }
    try {
      const { data } = await usersApi.toggleWishlist(product!._id);
      updateWishlist((data.wishlist || []).map(String));
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to leave a review");
      return;
    }
    setSubmittingReview(true);
    try {
      const fd = new FormData();
      fd.append("rating", String(reviewRating));
      fd.append("comment", reviewText);
      if (reviewImage) fd.append("image", reviewImage);

      const { data } = await productsApi.addReview(product!._id, fd);
      if (data.reviews) {
        setProduct((p) => {
          if (!p) return p;
          const reviews = data.reviews;
          const avg =
            reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
            reviews.length;
          return {
            ...p,
            reviews,
            rating: data.rating ?? avg,
            numReviews: data.numReviews ?? reviews.length,
            ratings: {
              average: data.rating ?? avg,
              count: data.numReviews ?? reviews.length,
            },
          };
        });
      }
      setReviewText("");
      setReviewRating(5);
      setReviewImage(null);
      toast.success("Review submitted!");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to submit review";
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="skeleton aspect-square rounded-sm" />
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/3 rounded" />
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="skeleton h-6 w-1/4 rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const hasReviewed =
    isAuthenticated &&
    product.reviews?.some(
      (r) => (r.user?._id ?? r.user)?.toString() === user?._id
    );

  const price = product.discountPrice ?? product.price;
  const discountPct = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0;
  const { average: avgRating, count: totalReviews } = getProductRatings(product);
  const ratingDistribution = getRatingDistribution(product.reviews || []);

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink/40 mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-ink transition-colors">Products</Link>
          <span>/</span>
          <span className="text-ink line-clamp-1">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-parchment rounded-sm overflow-hidden relative"
            >
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-ink/20" />
                </div>
              )}
              {discountPct > 0 && (
                <div className="absolute top-4 left-4 bg-ink text-cream text-xs font-semibold px-2 py-1 rounded-sm">
                  -{discountPct}%
                </div>
              )}
            </motion.div>

            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-sm overflow-hidden shrink-0 border-2 transition-colors ${
                      selectedImage === i ? "border-ink" : "border-transparent"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {(product.category as { name: string })?.name && (
              <p className="text-xs font-semibold tracking-widest uppercase text-ink/40">
                {(product.category as { name: string }).name}
              </p>
            )}

            <h1
              className="text-3xl md:text-4xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {product.name}
            </h1>

            {totalReviews > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(avgRating)
                          ? "fill-amber text-amber"
                          : "text-ink/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-ink/60">
                  <span className="font-semibold text-ink">{avgRating.toFixed(1)}</span> avg ·{" "}
                  <span className="font-semibold text-ink">{totalReviews}</span> total reviews
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-4xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ৳{price.toLocaleString()}
              </span>
              {product.discountPrice && (
                <span className="text-xl text-ink/40 line-through">
                  ৳{product.price.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-ink/70 leading-relaxed">{product.description}</p>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {product.brand && (
                <div>
                  <span className="text-ink/40">Brand</span>
                  <p className="font-medium">{product.brand}</p>
                </div>
              )}
              {product.sku && (
                <div>
                  <span className="text-ink/40">SKU</span>
                  <p className="font-medium font-mono text-xs">{product.sku}</p>
                </div>
              )}
              <div>
                <span className="text-ink/40">Availability</span>
                <p
                  className={`font-medium ${
                    product.stock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-parchment border border-ink/10 px-2.5 py-1 rounded-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex gap-3">
              <div className="flex items-center border border-ink/20 rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-3 hover:bg-parchment transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3 py-3 hover:bg-parchment transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-ink text-cream py-3 rounded-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                {addingToCart ? "Adding…" : "Add to Cart"}
              </button>

              <button
                onClick={handleWishlist}
                className="p-3 border border-ink/20 rounded-sm hover:bg-parchment transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isInWishlist ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-ink/10">
              {[
                { icon: Truck, text: "Free delivery" },
                { icon: Shield, text: "Secure payment" },
                { icon: RotateCcw, text: "Easy returns" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <item.icon className="w-4 h-4 text-ink/40" />
                  <span className="text-xs text-ink/50">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 pt-12 border-t border-ink/10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Customer Reviews
            </h2>
            {totalReviews > 0 && (
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-ink/40">
                    Average rating
                  </p>
                  <p className="text-2xl font-bold text-amber-600" style={{ fontFamily: "var(--font-display)" }}>
                    {avgRating.toFixed(1)}
                    <span className="text-base text-ink/40 font-normal"> / 5</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-ink/40">
                    Total reviews
                  </p>
                  <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    {totalReviews}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-[280px_1fr] gap-12">
            {/* Summary */}
            <div className="space-y-4">
              <div className="text-center p-6 bg-parchment rounded-sm border border-ink/5">
                <p className="text-xs font-semibold tracking-wider uppercase text-ink/40 mb-1">
                  Average rating
                </p>
                <p
                  className="text-5xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
                </p>
                <div className="flex justify-center gap-0.5 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(avgRating)
                          ? "fill-amber text-amber"
                          : "text-ink/20"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold tracking-wider uppercase text-ink/40 mt-3">
                  Total reviews
                </p>
                <p className="text-lg font-bold mt-0.5">{totalReviews}</p>
              </div>

              {totalReviews > 0 && (
                <div className="space-y-2 p-4 bg-parchment/50 rounded-sm border border-ink/5">
                  <p className="text-xs font-semibold tracking-wider uppercase text-ink/40 mb-2">
                    Rating breakdown
                  </p>
                  {ratingDistribution.map(({ star, count, percent }) => (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-ink/50">{star}</span>
                      <Star className="w-3 h-3 fill-amber text-amber shrink-0" />
                      <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-ink/40">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Write review */}
              {isAuthenticated && !hasReviewed && (
                <form onSubmit={handleReview} className="space-y-3">
                  <h3 className="text-sm font-semibold">Write a Review</h3>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewRating(i + 1)}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            i < reviewRating
                              ? "fill-amber text-amber"
                              : "text-ink/20 hover:text-amber/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience…"
                    rows={3}
                    required
                    className="w-full text-sm bg-parchment border border-ink/10 rounded-sm px-3 py-2 focus:outline-none focus:border-amber resize-none"
                  />
                  
                  {/* Image upload */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-parchment border border-ink/10 px-3 py-1.5 rounded-sm hover:bg-ink/5 transition-colors">
                        <Camera className="w-4 h-4 text-ink/40" />
                        <span className="text-xs font-medium">Add Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => setReviewImage(e.target.files?.[0] || null)}
                        />
                      </label>
                      {reviewImage && (
                        <div className="flex items-center gap-2 bg-ink/5 px-2 py-1 rounded-sm">
                          <ImageIcon className="w-3.5 h-3.5 text-ink/40" />
                          <span className="text-[10px] font-medium max-w-[80px] truncate">{reviewImage.name}</span>
                          <button onClick={() => setReviewImage(null)} type="button">
                            <X className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview || !reviewText.trim()}
                    className="w-full py-2 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-60"
                  >
                    {submittingReview ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              )}
              {isAuthenticated && hasReviewed && (
                <p className="text-sm text-ink/50 bg-parchment px-3 py-2 rounded-sm">
                  You have already reviewed this product.
                </p>
              )}
            </div>

            {/* Reviews list */}
            <div className="space-y-6">
              {product.reviews?.length === 0 ? (
                <p className="text-ink/40">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                product.reviews?.map((review) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pb-6 border-b border-ink/10 last:border-none"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-ink text-cream flex items-center justify-center text-xs font-medium overflow-hidden">
                        {review.user?.avatar ? (
                          <img
                            src={review.user.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          review.user?.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.user?.name}</p>
                        <p className="text-xs text-ink/40">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? "fill-amber text-amber"
                                : "text-ink/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-ink/70 leading-relaxed">
                      {review.comment}
                    </p>
                    {review.image?.url &&
                      (() => {
                        const imageUrl = review.image.url;

                        return (
                          <div className="mt-3">
                            <img
                              src={imageUrl}
                              alt="Review"
                              className="w-24 h-24 object-cover rounded-sm border border-ink/10 cursor-zoom-in hover:opacity-90 transition-opacity"
                              onClick={() => window.open(imageUrl, "_blank")}
                            />
                          </div>
                        );
                      })()}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
