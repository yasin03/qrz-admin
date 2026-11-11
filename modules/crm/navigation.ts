import { LayoutDashboard } from "lucide-react";

import { KULLANICI_TIPI } from "@/lib/roles";
import type { MenuItem } from "@/types/navigation";

const { ADMIN, YONETICI } = KULLANICI_TIPI;

// CRM sayfaları eklendikçe buraya yeni öğeler gelecek (/crm/musteriler vb.).
export const CRM_NAV: MenuItem[] = [
  {
    href: "/crm",
    label: "Genel Bakış",
    icon: LayoutDashboard,
    roles: [ADMIN, YONETICI],
  },
];
