import type { LucideIcon } from "lucide-react";

import type { KullaniciTipi } from "@/lib/roles";
import type { PerYetkiKey } from "@/lib/per-yetki";

export type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Bu menüyü görebilecek kullanıcı tipleri. */
  roles: KullaniciTipi[];
  /**
   * Personel için bu menüyü açan yetki bayrağı (Yetki Ayarları ekranından).
   * Admin/Yönetici'yi etkilemez.
   */
  yetki?: PerYetkiKey;
  /** true ise alt yollarda da (href/...) aktif görünür. */
  matchNested?: boolean;
  /**
   * Verilirse öğe link değil, tıklanınca açılıp kapanan bir grup olur;
   * alt öğeler altında listelenir.
   */
  children?: SubMenuItem[];
};

export type SubMenuItem = {
  href: string;
  label: string;
  roles: KullaniciTipi[];
};
