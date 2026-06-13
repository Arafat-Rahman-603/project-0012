"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { SiteSettings } from "@/types";

export const defaultSiteSettings: SiteSettings = {
  siteName: "Next Shop",
  heroTitle: "Timeless Sarees for Every Celebration",
  heroSubtitle:
    "Discover elegant silk, jamdani, katan, and festive sarees curated for modern women.",
  heroCtaText: "Shop Sarees",
  heroCtaHref: "/products",
  banners: [],
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    settingsApi
      .get()
      .then(({ data }) => {
        if (!active) return;
        const next = (data?.data ?? defaultSiteSettings) as Partial<SiteSettings>;
        setSettings({
          siteName: next.siteName || defaultSiteSettings.siteName,
          heroTitle: next.heroTitle || defaultSiteSettings.heroTitle,
          heroSubtitle: next.heroSubtitle || defaultSiteSettings.heroSubtitle,
          heroCtaText: next.heroCtaText || defaultSiteSettings.heroCtaText,
          heroCtaHref: next.heroCtaHref || defaultSiteSettings.heroCtaHref,
          banners: Array.isArray(next.banners) ? next.banners : [],
        });
      })
      .catch(() => {
        if (active) setSettings(defaultSiteSettings);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { settings, isLoading };
}
