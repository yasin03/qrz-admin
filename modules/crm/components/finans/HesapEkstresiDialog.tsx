"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { FormInput, FormSelect } from "@/components/forms";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCrmFinansAlacaklar, useCrmTahsilatlar } from "@/modules/crm/hooks/use-finans";
import { useBelgePdfKisiEk, useTeklifKisi } from "@/modules/crm/hooks/use-teklif";
import {
  TAHSILAT_DONEMLERI,
  donemAraligi,
  ekstreDonemMetni,
  hesapEkstresi,
  type TahsilatDonem,
} from "@/modules/crm/lib/finans";
import { pdfDosyaAdi, pdfKisi } from "@/modules/crm/lib/teklif";
import type { DbId, EkstrePdfVeri } from "@/modules/crm/types/finans";

import { TeklifPdfOnizleme } from "../teklifler/TeklifPdfOnizleme";

/** Ekstresi alınacak müşteri (Müşteri bakiyeleri satırı ya da Alacaklar'daki kişi filtresi). */
export type EkstreKisi = { IDCrmKisi: DbId; KisiAdi: string | null };

type Props = {
  /** Verilince açılır. */
  kisi: EkstreKisi | null;
  onOpenChange: (open: boolean) => void;
};

type FormValues = { Donem: TahsilatDonem; Baslangic: string; Bitis: string };

const DONEM_OPTIONS = [...TAHSILAT_DONEMLERI];
// Kullanıcı kararı: varsayılan dönem "tümü" (devreden yok, tüm hareketler).
const VARSAYILAN: FormValues = { Donem: "tumu", Baslangic: "", Bitis: "" };

/** Dosya adında Türkçe harf / boşluk kalmasın: "Ahmet Yılmaz" → "Ahmet-Yilmaz". */
const dosyaParcasi = (s: string) =>
  s
    .replace(/[ıİ]/g, (c) => (c === "ı" ? "i" : "I"))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Müşteri hesap ekstresi: dönem seçimi + PDF önizleme / indir / yazdır.
 * Hareketler müşterinin satış ve tahsilat listelerinden FE'de hesaplanır
 * (lib/finans.ts → hesapEkstresi); iptal edilmiş satışlar yazılmaz.
 */
export function HesapEkstresiDialog({ kisi, onOpenChange }: Props) {
  const acik = kisi != null;
  const IDCrmKisi = kisi?.IDCrmKisi ?? null;

  const form = useForm<FormValues>({ defaultValues: VARSAYILAN });
  const [donem, baslangic, bitis] = useWatch({ control: form.control, name: ["Donem", "Baslangic", "Bitis"] });

  // Ödenmişler dahil tüm satışlar ve tüm tahsilat / iadeler; dönem FE'de uygulanır
  // (devreden bakiye için başlangıç öncesi hareketler de gerekir).
  const satislar = useCrmFinansAlacaklar({ IDCrmKisi, SadeceAcik: false }, acik);
  const tahsilatlar = useCrmTahsilatlar({ IDCrmKisi }, acik);
  const kisiKart = useTeklifKisi(IDCrmKisi != null ? String(IDCrmKisi) : null, acik);
  const kisiEk = useBelgePdfKisiEk(IDCrmKisi != null ? String(IDCrmKisi) : null, acik);

  const aralik = useMemo(
    () => (donem === "ozel" ? { Baslangic: baslangic, Bitis: bitis } : donemAraligi(donem)),
    [donem, baslangic, bitis],
  );

  const yukleniyor = satislar.isLoading || tahsilatlar.isLoading;
  const hata = satislar.isError || tahsilatlar.isError;
  const ozelEksik = donem === "ozel" && !!baslangic && !!bitis && bitis < baslangic;

  const veri = useMemo<EkstrePdfVeri | null>(() => {
    if (!kisi || !satislar.data || !tahsilatlar.data || ozelEksik) return null;
    return {
      // Kişi kartı bulunamazsa (ör. pasif kişi listede yoksa) sadece adla.
      Kisi: pdfKisi(kisiKart, kisiEk, kisi.KisiAdi),
      Donem: ekstreDonemMetni(aralik),
      DevredenVar: !!aralik.Baslangic,
      Tarih: format(new Date(), "yyyy-MM-dd"),
      Hesaplar: hesapEkstresi(satislar.data, tahsilatlar.data, aralik),
    };
  }, [kisi, satislar.data, tahsilatlar.data, ozelEksik, kisiKart, kisiEk, aralik]);

  const dosyaAdi = pdfDosyaAdi(
    "Hesap-Ekstresi",
    `${dosyaParcasi(kisi?.KisiAdi ?? "") || "musteri"}-${format(new Date(), "yyyy-MM-dd")}`,
  );

  const kapat = (v: boolean) => {
    if (!v) form.reset(VARSAYILAN);
    onOpenChange(v);
  };

  return (
    <Dialog open={acik} onOpenChange={kapat}>
      <DialogContent className="max-h-[95svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Hesap Ekstresi{kisi?.KisiAdi ? ` — ${kisi.KisiAdi}` : ""}</DialogTitle>
          <DialogDescription>
            Satışlar borç, tahsilatlar alacak olarak yazılır. İptal edilmiş satışlar ekstrede yer almaz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FormSelect control={form.control} name="Donem" label="Dönem" options={DONEM_OPTIONS} className="sm:w-48" />
          {donem === "ozel" && (
            <>
              <FormInput control={form.control} name="Baslangic" label="Başlangıç" type="date" className="sm:w-44" />
              <FormInput control={form.control} name="Bitis" label="Bitiş" type="date" className="sm:w-44" />
            </>
          )}
        </div>
        {ozelEksik && <p className="text-sm text-destructive">Bitiş tarihi başlangıçtan önce olamaz.</p>}

        {yukleniyor ? (
          <div className="flex h-60 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : hata ? (
          <p className="py-8 text-center text-sm text-destructive">Hesap hareketleri getirilemedi.</p>
        ) : (
          <TeklifPdfOnizleme ekstre={veri} dosyaAdi={dosyaAdi} yukseklik="h-[65svh]" />
        )}
      </DialogContent>
    </Dialog>
  );
}
