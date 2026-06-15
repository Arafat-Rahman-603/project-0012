"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import "swiper/css";
import "swiper/css/effect-fade";

interface Props {
  images: { url: string }[];
  alt: string;
  className?: string;
}

export default function ProductCardImageSwiper({ images, alt, className = "" }: Props) {
  if (!images?.length) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-parchment ${className}`}>
        <ShoppingBag className="w-12 h-12 text-ink/20" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <Image
        src={images[0].url}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
      />
    );
  }

  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      autoplay={{
        delay: 2800,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      loop
      speed={600}
      className={`w-full h-full product-card-swiper ${className}`}
    >
      {images.map((img, i) => (
        <SwiperSlide key={i}>
          <Image
            src={img.url}
            alt={`${alt} ${i + 1}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
