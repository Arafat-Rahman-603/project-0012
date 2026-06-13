"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { SiteSettings } from "@/types";

export const defaultSiteSettings: SiteSettings = {
  siteName: "Next Shop",
  heroTitle: "",
  heroSubtitle: "",
  heroCtaText: "Shop Now",
  heroCtaHref: "/products",
  banners: [],
  logo: { url: "", publicId: "" },
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
          logo: next.logo || defaultSiteSettings.logo,
          contactPhone: next.contactPhone || defaultSiteSettings.contactPhone,
          contactEmail: next.contactEmail || defaultSiteSettings.contactEmail,
          contactAddress: next.contactAddress || defaultSiteSettings.contactAddress,
          facebookUrl: next.facebookUrl || defaultSiteSettings.facebookUrl,
          instagramUrl: next.instagramUrl || defaultSiteSettings.instagramUrl,
          whatsappNumber: next.whatsappNumber || defaultSiteSettings.whatsappNumber,
          announcementText: next.announcementText || defaultSiteSettings.announcementText,
          showAnnouncement: next.showAnnouncement ?? defaultSiteSettings.showAnnouncement,
          announcementBg: next.announcementBg || defaultSiteSettings.announcementBg,
          announcementColor: next.announcementColor || defaultSiteSettings.announcementColor,
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
