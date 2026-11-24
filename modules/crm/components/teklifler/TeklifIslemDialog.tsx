"use client";

import { useId, useState } from "react";
import { Ban, CircleCheck, CircleX, CopyPlus, Eye, FileDown, Pencil, RotateCcw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import type { RowAction } from "@/components/customs/RowActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteTeklif,
  useGonderTeklif,
  useIptalGeriAlTeklif,
  useIptalTeklif,
  useKabulTeklif,
  useRedTeklif,
  useRevizyonTeklif,
} from "@/modules/crm/hooks/use-teklif";
import { teklifIzin } from "@/modules/crm/lib/teklif";
import type { DbId, TeklifRow } from "@/modules/crm/types/teklif";

export type TeklifIslemTipi = "gonder" | "kabul" | "red" | "iptal" | "iptalGeriAl" | "revize" | "sil";

export type TeklifIslem = {
  tip: TeklifIslemTipi;
  teklif: Pick<TeklifRow, "IDCrmTeklif" | "TeklifNoTam" | "KisiAdi" | "KisiTip">;
};

type Props = {
  islem: TeklifIslem | null;
  onOpenChange: (open: boolean) => void;
  /** Revizyonda yeni sürümün ID'si, silmede null. */
  onTamamlandi?: (tip: TeklifIslemTipi, yeniID: DbId | null) => void;
};

const METIN: Record<
  TeklifIslemTipi,
  {
    baslik: string;
    aciklama: (t: TeklifIslem["teklif"]) => string;
    onay: string;
    variant: "danger" | "primary" | "warning" | "success";
    basari: string;
  }
> = {
  gonder: {
    baslik: "Teklifi gönderildi olarak işaretle",
    aciklama: (t) =>
      `"${t.TeklifNoTam}" gönderildi olarak işaretlenecek ve artık düzenlenemeyecek. Değişiklik gerekirse revizyon oluşturabilirsiniz.`,
    onay: "Gönderildi",
    variant: "primary",
    basari: "Teklif gönderildi olarak işaretlendi.",
  },
  kabul: {
    baslik: "Teklif kabul edildi",
    aciklama: (t) => `"${t.TeklifNoTam}" kabul edildi olarak işaretlenecek.`,
    onay: "Kabul Edildi",
    variant: "success",
    basari: "Teklif kabul edildi.",
  },
  red: {
    baslik: "Teklif reddedildi",
    aciklama: (t) => `"${t.TeklifNoTam}" reddedildi olarak işaretlenecek. Daha sonra revize edip yeniden gönderebilirsiniz.`,
    onay: "Reddedildi",
    variant: "danger",
    basari: "Teklif reddedildi olarak işaretlendi.",
  },
  iptal: {
    baslik: "Teklifi iptal et",
    aciklama: (t) => `"${t.TeklifNoTam}" iptal edilecek. İptal edilen teklif değiştirilemez.`,
    onay: "İptal Et",
    variant: "warning",
    basari: "Teklif iptal edildi.",
  },
  iptalGeriAl: {
    baslik: "İptali geri al",
    aciklama: (t) =>
      `"${t.TeklifNoTam}" iptalden önceki durumuna dönecek: hiç gönderilmediyse taslak (düzenlenebilir), gönderildiyse gönderildi.`,
    onay: "Geri Al",
    variant: "danger",
    basari: "Teklifin iptali geri alındı.",
  },
  revize: {
    baslik: "Revizyon oluştur",
    aciklama: (t) =>
      `"${t.TeklifNoTam}" kopyalanarak aynı numarayla yeni bir taslak sürüm açılacak. Mevcut sürüm "Revize edildi" olarak saklanır.`,
    onay: "Revizyon Oluştur",
    variant: "primary",
    basari: "Yeni sürüm taslak olarak oluşturuldu.",
  },
  sil: {
    baslik: "Teklifi sil",
    aciklama: (t) => `"${t.TeklifNoTam}" taslağı kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
    onay: "Sil",
    variant: "danger",
    basari: "Teklif silindi.",
  },
};

/** Teklif durum işlemleri için tek onay dialog'u (red nedeni, kabulde müşteriye dönüştürme). */
export function TeklifIslemDialog({ islem, onOpenChange, onTamamlandi }: Props) {
  const gonder = useGonderTeklif();
  const kabul = useKabulTeklif();
  const red = useRedTeklif();
  const iptal = useIptalTeklif();
  const iptalGeriAl = useIptalGeriAlTeklif();
  const revizyon = useRevizyonTeklif();
  const sil = useDeleteTeklif();
  const isLoading = [gonder, kabul, red, iptal, iptalGeriAl, revizyon, sil].some((m) => m.isPending);

  const [redNedeni, setRedNedeni] = useState("");
  const [musteriyeDonustur, setMusteriyeDonustur] = useState(true);
  const checkboxId = useId();

  // Yeni işlem açılınca alanlar sıfırlanır (render sırasında, effect'siz).
  const [oncekiIslem, setOncekiIslem] = useState(islem);
  if (islem !== oncekiIslem) {
    setOncekiIslem(islem);
    if (islem) {
      setRedNedeni("");
      setMusteriyeDonustur(true);
    }
  }

  const metin = islem ? METIN[islem.tip] : null;

  const onayla = async () => {
    if (!islem || !metin) return;
    const id = islem.teklif.IDCrmTeklif;
    try {
      let yeniID: DbId | null = null;
      switch (islem.tip) {
        case "gonder":
          await gonder.mutateAsync(id);
          break;
        case "kabul":
          await kabul.mutateAsync({ IDCrmTeklif: id, MusteriyeDonustur: musteriyeDonustur });
          break;
        case "red":
          await red.mutateAsync({ IDCrmTeklif: id, RedNedeni: redNedeni });
          break;
        case "iptal":
          await iptal.mutateAsync(id);
          break;
        case "iptalGeriAl":
          await iptalGeriAl.mutateAsync(id);
          break;
        case "revize":
          yeniID = (await revizyon.mutateAsync(id)).IDCrmTeklif;
          break;
        case "sil":
          await sil.mutateAsync(id);
          break;
      }
      const donustu = islem.tip === "kabul" && musteriyeDonustur && islem.teklif.KisiTip === "Kontak";
      toast.success(metin.basari, donustu ? { description: "Kişi müşteriye dönüştürüldü." } : undefined);
      onTamamlandi?.(islem.tip, yeniID);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "İşlem yapılamadı.");
    }
  };

  const icerik =
    islem?.tip === "red" ? (
      <div className="space-y-1.5">
        <Label htmlFor={checkboxId}>Red nedeni (opsiyonel)</Label>
        <Textarea
          id={checkboxId}
          value={redNedeni}
          onChange={(e) => setRedNedeni(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Örn. Fiyat yüksek bulundu"
        />
      </div>
    ) : islem?.tip === "kabul" && islem.teklif.KisiTip === "Kontak" ? (
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkboxId}
          checked={musteriyeDonustur}
          onCheckedChange={(v) => setMusteriyeDonustur(v === true)}
        />
        <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
          {islem.teklif.KisiAdi ?? "Kişi"} müşteriye dönüştürülsün
        </Label>
      </div>
    ) : undefined;

  return (
    <ConfirmDialog
      open={!!islem}
      onOpenChange={onOpenChange}
      title={metin?.baslik ?? ""}
      description={islem && metin ? metin.aciklama(islem.teklif) : undefined}
      confirmLabel={metin?.onay}
      variant={metin?.variant ?? "primary"}
      isLoading={isLoading}
      onConfirm={onayla}
    >
      {icerik}
    </ConfirmDialog>
  );
}

/** Liste satırı menüsü — duruma göre uygun işlemler görünür. */
export function teklifSatirAksiyonlari<T extends TeklifRow>(h: {
  /** Detay drawer'ını açar. */
  onGoruntule: (t: T) => void;
  /** PDF önizleme (indir / yazdır). */
  onPdf: (t: T) => void;
  onDuzenle: (t: T) => void;
  onIslem: (tip: TeklifIslemTipi, t: T) => void;
}): RowAction<T>[] {
  return [
    { label: "Görüntüle", icon: Eye, onClick: h.onGoruntule },
    { label: "PDF Önizle / İndir", icon: FileDown, onClick: h.onPdf },
    { divider: true },
    { label: "Düzenle", icon: Pencil, hidden: (t) => !teklifIzin.duzenle(t.Durum), onClick: h.onDuzenle },
    {
      label: "Gönderildi İşaretle",
      icon: Send,
      hidden: (t) => !teklifIzin.gonder(t.Durum),
      onClick: (t) => h.onIslem("gonder", t),
    },
    {
      label: "Kabul Edildi",
      icon: CircleCheck,
      hidden: (t) => !teklifIzin.kabul(t.Durum),
      onClick: (t) => h.onIslem("kabul", t),
    },
    {
      label: "Reddedildi",
      icon: CircleX,
      hidden: (t) => !teklifIzin.red(t.Durum),
      onClick: (t) => h.onIslem("red", t),
    },
    {
      label: "İptali Geri Al",
      icon: RotateCcw,
      hidden: (t) => !teklifIzin.iptalGeriAl(t.Durum),
      onClick: (t) => h.onIslem("iptalGeriAl", t),
    },
    {
      label: "Revize Et",
      icon: CopyPlus,
      hidden: (t) => !teklifIzin.revize(t.Durum),
      onClick: (t) => h.onIslem("revize", t),
    },
    { divider: true },
    {
      label: "İptal Et",
      icon: Ban,
      hidden: (t) => !teklifIzin.iptal(t.Durum),
      onClick: (t) => h.onIslem("iptal", t),
    },
    {
      label: "Sil",
      icon: Trash2,
      variant: "danger",
      hidden: (t) => !teklifIzin.sil(t.Durum),
      onClick: (t) => h.onIslem("sil", t),
    },
  ];
}
