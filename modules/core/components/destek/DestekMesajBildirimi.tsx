"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowRight, Headset } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KULLANICI_TIPI } from "@/lib/roles";
import { useAuthHasHydrated, useHasRole, useUser } from "@/stores/auth-store";
import { useDestekMesajKontrol } from "@/modules/core/hooks/use-destek";

// Kapatılan bildirim aynı oturumda (sayfa yenilense de) tekrar çıkmasın diye
// son mesajın anahtarı burada tutulur. Yeni bir mesaj gelince anahtar
// değişir ve bildirim yeniden gösterilir.
const KAPATILAN_STORAGE_KEY = "destek-bildirim-kapatilan";

function okuKapatilan() {
  try {
    return sessionStorage.getItem(KAPATILAN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function yazKapatilan(value: string) {
  try {
    sessionStorage.setItem(KAPATILAN_STORAGE_KEY, value);
  } catch {
    // depolama kapalıysa bildirim yalnızca bu sayfa ömrü boyunca gizlenir
  }
}

// "2026-09-18 18:53:34.157" → yerel saat (SQL'den yerel olarak geliyor).
function formatTarih(value: string | null) {
  if (!value) return null;
  const date = parseISO(value.replace(" ", "T").replace("Z", ""));
  return isValid(date)
    ? format(date, "d MMMM yyyy, HH:mm", { locale: tr })
    : null;
}

/**
 * Kullanıcıya destek ekibinden okunmamış mesaj geldiyse (KONTROL_MESAJ)
 * hangi sayfada olursa olsun modal ile haber verir. DashboardShell içinde
 * render edilir; Personel'de (destek kapalı) hiç istek atılmaz.
 */
const DestekMesajBildirimi = () => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const hasHydrated = useAuthHasHydrated();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const IDKullanici = user?.IDKullanici ? String(user.IDKullanici) : undefined;

  // Login/logout geçişlerinde istek atılmasın: store localStorage'dan
  // yüklenmeden ve kullanıcı yokken (çıkış yapılırken clearUser sonrası)
  // kontrol kapalı.
  const aktif = hasHydrated && Boolean(IDKullanici) && !isPersonel;

  const { data: kontrol, isError } = useDestekMesajKontrol(IDKullanici, aktif);
  const [kapatilan, setKapatilan] = useState<string | null>(okuKapatilan);

  const okunmamis = Number(kontrol?.Okunmamis ?? 0);
  // Anahtar kullanıcıya özel: aynı sekmede başka kullanıcıyla girilirse
  // önceki kullanıcının "kapattım" bilgisi onu etkilemesin.
  const anahtar = kontrol
    ? `${IDKullanici}|${kontrol.Tarih ?? ""}|${kontrol.Mesaj ?? ""}`
    : "";
  const isDestekSayfasi =
    pathname === "/destek" || pathname.startsWith("/destek/");

  const open =
    aktif &&
    !isError &&
    okunmamis > 0 &&
    anahtar !== kapatilan &&
    !isDestekSayfasi;

  const kapat = () => {
    yazKapatilan(anahtar);
    setKapatilan(anahtar);
  };

  const mesajlaraGit = () => {
    kapat();
    router.push("/destek");
  };

  const tarih = formatTarih(kontrol?.Tarih ?? null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && kapat()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-700 to-sky-500 text-white shadow-md shadow-blue-700/25 dark:from-primary dark:to-sky-700 dark:text-primary-foreground dark:shadow-primary/20">
            <Headset className="size-7" />
          </div>
          <DialogTitle className="text-lg">
            Destek Merkezi&apos;nden yeni mesaj
          </DialogTitle>
          <DialogDescription>
            {okunmamis > 1
              ? `Destek taleplerinizle ilgili ${okunmamis} okunmamış mesajınız var.`
              : "Destek talebinizle ilgili okunmamış bir mesajınız var."}
          </DialogDescription>
        </DialogHeader>

        {kontrol?.Mesaj && (
          <figure className="rounded-xl border border-blue-700/15 bg-linear-to-br from-blue-700/8 to-sky-500/5 p-4 dark:border-primary/20 dark:from-primary/12 dark:to-primary/5">
            <blockquote className="line-clamp-5 text-sm whitespace-pre-wrap text-foreground">
              {kontrol.Mesaj}
            </blockquote>
            {tarih && (
              <figcaption className="mt-2 text-right text-xs text-muted-foreground">
                {tarih}
              </figcaption>
            )}
          </figure>
        )}

        <DialogFooter>
          <Button type="button" appearance="outline" onClick={kapat}>
            Daha Sonra
          </Button>
          <Button type="button" onClick={mesajlaraGit}>
            Mesajlara Git
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DestekMesajBildirimi;
