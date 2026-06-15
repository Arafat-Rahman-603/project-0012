import { ImageLoaderProps } from "next/image";

/**
 * Custom Next.js Image loader for Cloudinary.
 * Automatically injects auto-format (f_auto), auto-quality (q_auto), and limits width/height for responsive layout.
 */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src) return "";
  
  // Only process Cloudinary URLs
  if (!src.includes("cloudinary.com")) {
    return src;
  }

  // Example URL format:
  // https://res.cloudinary.com/cloud_name/image/upload/v1234567/path/to/image.jpg
  const parts = src.split("/image/upload/");
  if (parts.length !== 2) {
    return src;
  }

  const baseUrl = parts[0];
  const imagePath = parts[1];

  // Configure parameters
  const params = [
    `w_${width}`,
    `q_${quality || "auto"}`,
    "f_auto",
    "c_limit", // Do not upscale if original image is smaller
  ].join(",");

  return `${baseUrl}/image/upload/${params}/${imagePath}`;
}
