import { Product, Review } from "@/types";

type ProductWithLegacyRating = Product & {
  rating?: number;
  numReviews?: number;
};

export function getProductRatings(product: ProductWithLegacyRating) {
  const reviews = product.reviews || [];
  const fromReviews =
    reviews.length > 0
      ? {
          average:
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
          count: reviews.length,
        }
      : { average: 0, count: 0 };

  const average =
    product.ratings?.average ??
    product.rating ??
    fromReviews.average;
  const count =
    product.ratings?.count ?? product.numReviews ?? fromReviews.count;

  return {
    average: Math.round((Number(average) || 0) * 10) / 10,
    count: Number(count) || 0,
  };
}

export function getRatingDistribution(reviews: Review[]) {
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return {
      star,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    };
  });
}
