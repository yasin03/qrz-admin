import {
  CalendarRange,
  ChartColumn,
  ContactRound,
  FileText,
  FileUser,
  Fingerprint,
  GitMergeConflict,
  HandCoins,
  MapPinned,
  Parasol,
  Settings,
  Users,
} from "lucide-react";

import { KULLANICI_TIPI, type KullaniciTipi } from "@/lib/roles";
import type { MenuItem } from "@/types/navigation";

const { ADMIN, YONETICI, PERSONEL } = KULLANICI_TIPI;
const TUMU: KullaniciTipi[] = [ADMIN, YONETICI, PERSONEL];

export const BORDRO_NAV: MenuItem[] = [
  {
    href: "/personel",
    label: "Personel",
    icon: Users,
    roles: [ADMIN, YONETICI],
  },
  {
    href: "/lokasyon",
    label: "Lokasyon",
    icon: MapPinned,
    roles: [ADMIN, YONETICI],
  },
  { href: "/ozluk", label: "Özlük", icon: FileUser, roles: TUMU },
  { href: "/izin", label: "İzin", icon: Parasol, roles: TUMU },
  { href: "/avans", label: "Avans", icon: HandCoins, roles: TUMU },
  {
    href: "/bordro/parametre",
    label: "Eklenti & Kesinti",
    icon: GitMergeConflict,
    roles: TUMU,
  },
  {
    href: "/pdks",
    label: "PDKS",
    icon: Fingerprint,
    roles: TUMU,
    yetki: "PersonelPdksGorur",
  },
  {
    href: "/puantaj",
    label: "Puantaj",
    icon: CalendarRange,
    roles: TUMU,
    yetki: "PersonelPuantajGorur",
  },
  {
    href: "/bordro",
    label: "Bordro",
    icon: ContactRound,
    roles: TUMU,
    yetki: "PersonelBordroGorur",
  },
  { href: "/belgeler", label: "Belgeler", icon: FileText, roles: TUMU },
  {
    href: "/raporlar",
    label: "Raporlar",
    icon: ChartColumn,
    roles: [ADMIN, YONETICI],
    // Alt sayfalar (PDKS raporu vb.) Raporlar'ın kendi iç menüsünde.
    matchNested: true,
  },
  {
    href: "/ayarlar",
    label: "Ayarlar",
    icon: Settings,
    roles: [ADMIN, YONETICI],
    // Alt sayfalar (şirket bilgileri, yetkiler, tanımlamalar) Ayarlar'ın
    // kendi iç menüsünde; ana sidebar'da tek öğe olarak seçili kalsın.
    matchNested: true,
  },
];
