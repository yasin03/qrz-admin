import {
  ChartColumn,
  FileText,
  HandCoins,
  ListTodo,
  Settings,
  Users,
} from "lucide-react";

import { KULLANICI_TIPI, type KullaniciTipi } from "@/lib/roles";
import type { MenuItem } from "@/types/navigation";

const { ADMIN, BAYI } = KULLANICI_TIPI;
const TUMU: KullaniciTipi[] = [ADMIN, BAYI];

// CRM dashboard'u (/crm) menüde yok; sidebar logosu oraya gider.
export const CRM_NAV: MenuItem[] = [
  { href: "/crm/kisiler", label: "Kişiler", icon: Users, roles: TUMU },
  { href: "/crm/satislar", label: "Satışlar", icon: HandCoins, roles: TUMU },
  { href: "/crm/teklifler", label: "Teklifler", icon: FileText, roles: TUMU },
  { href: "/crm/gorevler", label: "Görevler", icon: ListTodo, roles: TUMU },
  {
    href: "/crm/raporlar",
    label: "Raporlar",
    icon: ChartColumn,
    roles: TUMU,
    matchNested: true,
  },
  {
    href: "/crm/ayarlar",
    label: "Ayarlar",
    icon: Settings,
    roles: TUMU,
    matchNested: true,
  },
];
