"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Bell, Clock, Loader2, MapPin, Pencil, Repeat, Tag, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAjandaDetay,
  useAjandaHatirlatmaAyari,
  useAjandaKatilimDurumu,
  useDeleteAjanda,
  useUpdateAjandaIstisna,
} from "@/modules/core/hooks/use-ajanda";
import { tekrarOzeti } from "@/modules/core/lib/ajanda-tekrar";
import { parseYerel } from "@/modules/core/lib/ajanda";
import { SECILMEDI } from "@/modules/core/schemas/ajanda.schema";
import type { AjandaKatilimDurumu, AjandaOlay } from "@/modules/core/types/takvim";

import type { AjandaFormModu } from "./AjandaFormDialog";
import { TekrarKapsamDialog, type TekrarKapsam } from "./TekrarKapsamDialog";
import { AJANDA_VARSAYILAN_RENK, HATIRLATMA_SECENEKLERI } from "./takvim-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  olay: AjandaOlay | null;
  /** Düzenle seçilince (kapsam belirlenmiş olarak) formu açar. */
  onDuzenle: (mod: AjandaFormModu) => void;
};

const DURUM: Record<AjandaKatilimDurumu, { label: string; variant: "warning" | "success" | "danger" }> = {
  0: { label: "Bekliyor", variant: "warning" },
  1: { label: "Katılıyor", variant: "success" },
  2: { label: "Katılmıyor", variant: "danger" },
};

function zamanMetni(o: AjandaOlay) {
  const gun = (d: Date) => format(d, "d MMMM yyyy, EEEE", { locale: tr });
  if (o.tumGun) {
    return o.bitis && !isSameDay(o.baslangic, o.bitis)
      ? `${format(o.baslangic, "d MMMM", { locale: tr })} – ${gun(o.bitis)} · Tüm gün`
      : `${gun(o.baslangic)} · Tüm gün`;
  }
  if (!o.bitis) return `${gun(o.baslangic)} · ${format(o.baslangic, "HH:mm")}`;
  if (isSameDay(o.baslangic, o.bitis)) {
    return `${gun(o.baslangic)} · ${format(o.baslangic, "HH:mm")} – ${format(o.bitis, "HH:mm")}`;
  }
  return `${format(o.baslangic, "d MMM yyyy HH:mm", { locale: tr })} – ${format(o.bitis, "d MMM yyyy HH:mm", { locale: tr })}`;
}

export function AjandaDetayDialog({ open, onOpenChange, olay, onDuzenle }: Props) {
  const detay = useAjandaDetay(open && olay ? olay.IDAjanda : null);
  const katilimDurumu = useAjandaKatilimDurumu();
  const hatirlatmaAyari = useAjandaHatirlatmaAyari();
  const silTumu = useDeleteAjanda();
  const silBu = useUpdateAjandaIstisna();

  const [kapsamIslem, setKapsamIslem] = useState<"duzenle" | "sil" | null>(null);
  const [silOnay, setSilOnay] = useState(false);

  if (!olay) return null;

  const IDSeri = olay.IDAjandaSeri ?? olay.IDAjanda;
  const katilimcilar = detay.data?.katilimcilar ?? [];
  const serininIlki = detay.data?.kayit ? parseYerel(detay.data.kayit.Baslangic) : olay.baslangic;
  const siliniyor = silTumu.isPending || silBu.isPending;

  const sil = async (kapsam: TekrarKapsam | "tekil") => {
    try {
      if (kapsam === "bu") {
        await silBu.mutateAsync({ IDAjandaSeri: IDSeri, OrijinalTarih: olay.tekrarTarihi!, Iptal: true });
      } else {
        await silTumu.mutateAsync(kapsam === "tumu" ? IDSeri : olay.IDAjanda);
      }
      toast.success("Etkinlik silindi.");
      setKapsamIslem(null);
      setSilOnay(false);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Etkinlik silinemedi.");
    }
  };

  const duzenle = (kapsam: TekrarKapsam | "tekil") => {
    setKapsamIslem(null);
    onOpenChange(false);
    onDuzenle({ tip: kapsam, olay });
  };

  const yanitla = async (Durum: AjandaKatilimDurumu) => {
    try {
      await katilimDurumu.mutateAsync({ IDAjanda: IDSeri, Durum });
      toast.success(Durum === 1 ? "Katılımınız kaydedildi." : "Davet reddedildi.");
      if (Durum === 2) onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Yanıt kaydedilemedi.");
    }
  };

  const hatirlatmaDegistir = async (value: string) => {
    try {
      await hatirlatmaAyari.mutateAsync({
        IDAjanda: IDSeri,
        Dakika: value === SECILMEDI ? null : Number(value),
        Kanal: olay.hatirlatmaKanal ?? 1,
      });
      toast.success("Hatırlatma güncellendi.");
    } catch (error) {
      toast.error((error as Error)?.message || "Hatırlatma güncellenemedi.");
    }
  };

  const renk = olay.renk ?? AJANDA_VARSAYILAN_RENK;

  return (
    <>
      <Dialog open={open && !kapsamIslem && !silOnay} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span className="mt-1.5 size-3 shrink-0 rounded-sm" style={{ backgroundColor: renk }} />
              <div className="min-w-0">
                <DialogTitle className="leading-snug break-words">{olay.baslik}</DialogTitle>
                <DialogDescription className="mt-1">{zamanMetni(olay)}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 text-sm">
            {olay.tekrarli && (
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <Repeat className="mt-0.5 size-4 shrink-0" />
                <span>
                  {olay.tekrarKurali
                    ? tekrarOzeti(olay.tekrarKurali, serininIlki)
                    : "Tekrarlanan etkinlik · bu tekrar değiştirildi"}
                </span>
              </div>
            )}
            {olay.konum && (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="break-words">{olay.konum}</span>
              </div>
            )}
            {olay.kategoriAd && (
              <div className="flex items-start gap-2.5">
                <Tag className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>{olay.kategoriAd}</span>
              </div>
            )}
            {olay.aciklama && (
              <p className="rounded-md bg-muted/50 p-3 whitespace-pre-wrap break-words">{olay.aciklama}</p>
            )}

            {(olay.katilimciSayisi > 0 || !olay.sahip) && (
              <div className="flex items-start gap-2.5">
                <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {detay.isLoading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {!olay.sahip && <span className="text-xs text-muted-foreground">Size davet gönderildi.</span>}
                      {katilimcilar.map((k) => (
                        <div key={String(k.IDAjandaKatilimci)} className="flex items-center justify-between gap-2">
                          <span className="truncate">{k.Email ?? `Kullanıcı #${k.IDKullanici}`}</span>
                          <Badge variant={DURUM[k.Durum].variant}>{DURUM[k.Durum].label}</Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Katılımcı: yanıt ve kişisel hatırlatma */}
            {!olay.sahip && (
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Katılacak mısınız?</span>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="success"
                      appearance={olay.durum === 1 ? "solid" : "outline"}
                      disabled={katilimDurumu.isPending}
                      onClick={() => yanitla(1)}
                    >
                      Evet
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      appearance="outline"
                      disabled={katilimDurumu.isPending}
                      onClick={() => yanitla(2)}
                    >
                      Hayır
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <Clock className="size-4 text-muted-foreground" /> Hatırlatma
                  </span>
                  <Select
                    value={olay.hatirlatmaDakika != null ? String(olay.hatirlatmaDakika) : SECILMEDI}
                    onValueChange={hatirlatmaDegistir}
                    disabled={hatirlatmaAyari.isPending}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SECILMEDI}>Hatırlatma yok</SelectItem>
                      {HATIRLATMA_SECENEKLERI.map((h) => (
                        <SelectItem key={h.value} value={h.value}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {olay.sahip && olay.hatirlatmaDakika != null && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Bell className="size-4 shrink-0" />
                <span>
                  {HATIRLATMA_SECENEKLERI.find((h) => h.value === String(olay.hatirlatmaDakika))?.label ??
                    `${olay.hatirlatmaDakika} dakika önce`}
                  {olay.hatirlatmaKanal === 3 && " · e-posta ile de"}
                </span>
              </div>
            )}
          </div>

          {olay.sahip && (
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="danger"
                appearance="ghost"
                onClick={() => (olay.tekrarli ? setKapsamIslem("sil") : setSilOnay(true))}
              >
                <Trash2 /> Sil
              </Button>
              <Button onClick={() => (olay.tekrarli ? setKapsamIslem("duzenle") : duzenle("tekil"))}>
                <Pencil /> Düzenle
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Tekrarlı: kapsam seçimi */}
      <TekrarKapsamDialog
        open={open && Boolean(kapsamIslem)}
        onOpenChange={(v) => !v && setKapsamIslem(null)}
        islem={kapsamIslem ?? "duzenle"}
        loading={siliniyor}
        onSec={(k) => (kapsamIslem === "sil" ? sil(k) : duzenle(k))}
      />

      {/* Tekrarsız: silme onayı */}
      <Dialog open={open && silOnay} onOpenChange={setSilOnay}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Etkinliği sil</DialogTitle>
            <DialogDescription>
              &quot;{olay.baslik}&quot; silinecek
              {olay.katilimciSayisi > 0 && " ve katılımcıların takviminden de kaldırılacak"}. Emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" appearance="outline" onClick={() => setSilOnay(false)}>
              İptal
            </Button>
            <Button variant="danger" disabled={siliniyor} onClick={() => sil("tekil")}>
              {siliniyor && <Loader2 className="size-4 animate-spin" />}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
