"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, isTomorrow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { BellRing } from "lucide-react";

import { useAuthHasHydrated, useUser } from "@/stores/auth-store";
import { useAjandaHatirlatmalar } from "@/modules/core/hooks/use-ajanda";
import type { AjandaHatirlatma } from "@/modules/core/types/takvim";

// Gösterilmiş hatırlatmalar sayfa yenilense de tekrar çıkmasın diye.
const STORAGE_KEY = "ajanda-hatirlatma-gosterilen";
const SAKLAMA_SURESI = 3 * 24 * 60 * 60 * 1000; // 3 gün

type Kayit = Record<string, number>; // key → gösterilme zamanı

function oku(): Kayit {
  try {
    const kayit = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Kayit;
    const sinir = Date.now() - SAKLAMA_SURESI;
    return Object.fromEntries(Object.entries(kayit).filter(([, t]) => t > sinir));
  } catch {
    return {};
  }
}

function yaz(kayit: Kayit) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kayit));
  } catch {
    // depolama kapalıysa hatırlatma yalnızca bu sayfa ömrü boyunca tekil kalır
  }
}

function zaman(h: AjandaHatirlatma) {
  const gun = isToday(h.baslangic)
    ? "Bugün"
    : isTomorrow(h.baslangic)
      ? "Yarın"
      : format(h.baslangic, "d MMMM EEEE", { locale: tr });
  return h.tumGun ? `${gun} · Tüm gün` : `${gun} ${format(h.baslangic, "HH:mm")}`;
}

/**
 * Zamanı gelen ajanda hatırlatmalarını (uygulama içi kanal) hangi sayfada
 * olunursa olsun toast ile gösterir. DashboardShell içinde render edilir.
 */
export default function AjandaHatirlatici() {
  const router = useRouter();
  const user = useUser();
  const hasHydrated = useAuthHasHydrated();
  const aktif = hasHydrated && Boolean(user?.IDKullanici);

  const { hatirlatmalar } = useAjandaHatirlatmalar(aktif);

  useEffect(() => {
    if (!hatirlatmalar.length) return;
    const gosterilen = oku();
    let degisti = false;

    for (const h of hatirlatmalar) {
      const key = `${user?.IDKullanici}|${h.key}`;
      if (gosterilen[key]) continue;
      gosterilen[key] = Date.now();
      degisti = true;

      // warning: richColors ile amber zemin. Sallanma/zil animasyonu
      // globals.css'teki .ajanda-hatirlatma-toast'ta.
      toast.warning(h.baslik, {
        id: key,
        icon: <BellRing />,
        className: "ajanda-hatirlatma-toast",
        description: [zaman(h), h.konum].filter(Boolean).join(" · "),
        duration: Infinity,
        closeButton: true,
        action: {
          label: "Takvimde aç",
          onClick: () => router.push(
              `/takvim?gorunum=hafta&tarih=${format(h.baslangic, "yyyy-MM-dd")}&ajanda=${h.IDAjanda}`,
            ),
        },
      });
    }

    if (degisti) yaz(gosterilen);
  }, [hatirlatmalar, router, user?.IDKullanici]);

  return null;
}
