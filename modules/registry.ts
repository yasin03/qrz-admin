import { BriefcaseBusiness, Handshake, type LucideIcon } from "lucide-react";

import { KULLANICI_TIPI, type KullaniciTipi } from "@/lib/roles";
import type { MenuItem } from "@/types/navigation";
import { BORDRO_NAV } from "@/modules/bordro/navigation";
import { CRM_NAV } from "@/modules/crm/navigation";

const { ADMIN, YONETICI, PERSONEL, BAYI, DESTEK } = KULLANICI_TIPI;

export const MODULE_IDS = ["bordro", "crm"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export type AppModule = {
  id: ModuleId;
  label: string;
  /** Header'daki seçici butonunda görünen kısa ad. */
  shortLabel: string;
  icon: LucideIcon;
  /**
   * Modülün URL prefix'i (ör. "/crm"). Bordro kökte durduğu için yok;
   * yeni modüller (POS, ön muhasebe...) mutlaka kendi prefix'iyle eklenmeli.
   */
  basePath?: string;
  /** Header'daki seçiciden modüle geçince gidilecek sayfa. */
  homeHref: string;
  /** Bu modülü seçebilecek kullanıcı tipleri. */
  roles: KullaniciTipi[];
  /** Modül seçiliyken sidebar'da görünen menü. */
  nav: MenuItem[];
};

export const MODULES: AppModule[] = [
  {
    id: "bordro",
    label: "Bordro Yönetimi",
    shortLabel: "Bordro",
    icon: BriefcaseBusiness,
    homeHref: "/",
    roles: [ADMIN, YONETICI, PERSONEL],
    nav: BORDRO_NAV,
  },
  {
    id: "crm",
    label: "Müşteri İşleri Yönetimi (CRM)",
    shortLabel: "CRM",
    icon: Handshake,
    basePath: "/crm",
    homeHref: "/crm",
    roles: [ADMIN, BAYI],
    nav: CRM_NAV,
  },
];

export const DEFAULT_MODULE_ID: ModuleId = "bordro";

/** Header'daki modül seçiciyi görebilen kullanıcı tipleri. */
export const MODULE_SWITCHER_ROLES: KullaniciTipi[] = [ADMIN, BAYI];

/** Son seçilen modülü tutan cookie (ortak sayfalarda sidebar'ı korumak için). */
export const ACTIVE_MODULE_COOKIE = "active_module";

/**
 * Hiçbir modüle ait olmayan ortak sayfalar (profil, kurumsal, sistem).
 * Bu sayfalarda sidebar son seçilen modülün menüsünü göstermeye devam eder.
 */
export const SHARED_PATHS = ["/profile", "/kurumsal", "/sistem"];

export function isModuleId(value: unknown): value is ModuleId {
  return MODULE_IDS.includes(value as ModuleId);
}

export function getModule(id: ModuleId): AppModule {
  return MODULES.find((m) => m.id === id)!;
}

const matchesPath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Pathname'in ait olduğu modül. Ortak sayfalarda null döner (karar son
 * seçilen modüle bırakılır); prefix'i olmayan her sayfa Bordro'dur.
 */
export function getModuleIdFromPath(pathname: string): ModuleId | null {
  const prefixed = MODULES.find(
    (m) => m.basePath && matchesPath(pathname, m.basePath),
  );
  if (prefixed) return prefixed.id;
  if (SHARED_PATHS.some((p) => matchesPath(pathname, p))) return null;
  return DEFAULT_MODULE_ID;
}
