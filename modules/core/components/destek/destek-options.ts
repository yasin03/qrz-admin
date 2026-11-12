import type {
  DestekTalepDurumu,
  DestekTalepOncelik,
} from "@/modules/core/types/destek";

type BadgeVariant = "success" | "gray" | "danger" | "warning" | "info";

export const DURUM_OPTIONS: { value: DestekTalepDurumu; label: string }[] = [
  { value: "AÇIK", label: "Açık" },
  { value: "KAPALI", label: "Kapalı" },
];

export const ONCELIK_OPTIONS: { value: DestekTalepOncelik; label: string }[] = [
  { value: "Yüksek", label: "Yüksek" },
  { value: "Orta", label: "Orta" },
  { value: "Düşük", label: "Düşük" },
];

export const DURUM_BADGE: Record<DestekTalepDurumu, BadgeVariant> = {
  AÇIK: "success",
  KAPALI: "gray",
};

export const ONCELIK_BADGE: Record<DestekTalepOncelik, BadgeVariant> = {
  Yüksek: "danger",
  Orta: "warning",
  Düşük: "info",
};

/** Talebin yönlendirildiği birim (şimdilik sabit). */
export const DESTEK_TAKIP_BIRIMI = "TEKNİK SERVİS";

/** Öncelik radio butonlarının renkleri (badge renkleriyle uyumlu). */
export const ONCELIK_BUTTON_CLASS: Record<
  DestekTalepOncelik,
  { idle: string; active: string }
> = {
  Yüksek: {
    idle: "text-red-700 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
    active:
      "border-red-500 bg-red-100 text-red-700 ring-2 ring-red-500/20 dark:border-red-500/70 dark:bg-red-900/30 dark:text-red-400",
  },
  Orta: {
    idle: "text-yellow-700 hover:border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20",
    active:
      "border-yellow-500 bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500/20 dark:border-yellow-500/70 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  Düşük: {
    idle: "text-sky-700 hover:border-sky-300 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20",
    active:
      "border-sky-500 bg-sky-100 text-sky-700 ring-2 ring-sky-500/20 dark:border-sky-500/70 dark:bg-sky-900/30 dark:text-sky-400",
  },
};

/** Dosya limitleri — base64 olarak SQL'e gittiği için sınırlı tutuluyor. */
export const MAX_DOSYA_SAYISI = 5;
export const MAX_DOSYA_BOYUTU = 10 * 1024 * 1024; // 10 MB
