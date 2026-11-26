"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  FormInput,
  FormLabel,
  FormSearchSelect,
  FormSelect,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stepper } from "@/components/ui/stepper";
import { PARA_BIRIMI_DATA } from "@/constants/data";
import {
  useInsertTeklif,
  useTeklifDetay,
  useTeklifKisi,
  useBelgePdfKisiEk,
  useTeklifKisiSecenekleri,
  useUpdateTeklif,
} from "@/modules/crm/hooks/use-teklif";
import {
  formGenelIskonto,
  formKalemGirdileri,
  paraFormat,
  teklifFormVarsayilan,
  teklifFormdanParams,
  teklifHesapla,
  teklifPdfDosyaAdi,
  teklifPdfVerisiFormdan,
} from "@/modules/crm/lib/teklif";
import {
  TEKLIF_STEPS,
  sayiOku,
  teklifSchema,
  type TeklifForm,
} from "@/modules/crm/schemas/teklif.schema";
import type { DbId } from "@/modules/crm/types/teklif";

import { TeklifKalemTablosu } from "./TeklifKalemTablosu";
import { TeklifPdfOnizleme } from "./TeklifPdfOnizleme";
import { IskontoInput } from "./IskontoInput";
import { TeklifToplamPaneli } from "./TeklifToplamPaneli";

/** Yeni teklif (kişi verilirse seçili gelir ve değiştirilemez) veya taslak düzenleme. */
export type TeklifFormModu =
  | { tip: "yeni"; IDCrmKisi?: DbId | null }
  | { tip: "duzenle"; IDCrmTeklif: DbId };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: TeklifFormModu | null;
  /** Kayıttan sonra (yeni kayıtta yeni ID ile). */
  onKaydedildi?: (IDCrmTeklif: DbId) => void;
};

const SON_ADIM = TEKLIF_STEPS.length - 1;

const adimHatali = (index: number, errs: FieldErrors<TeklifForm>) =>
  TEKLIF_STEPS[index].fields.some((f) => Boolean(errs[f]));

export function TeklifFormDialog({
  open,
  onOpenChange,
  mod,
  onKaydedildi,
}: Props) {
  const insert = useInsertTeklif();
  const update = useUpdateTeklif();
  const isPending = insert.isPending || update.isPending;

  const duzenle = mod?.tip === "duzenle";
  const duzenleID = mod?.tip === "duzenle" ? mod.IDCrmTeklif : null;
  const {
    data: detay,
    isLoading: detayYukleniyor,
    isError: detayHata,
  } = useTeklifDetay(open ? duzenleID : null);
  const sabitKisi = mod?.tip === "yeni" && mod.IDCrmKisi != null;

  const form = useForm<TeklifForm>({
    resolver: zodResolver(teklifSchema),
    defaultValues: teklifFormVarsayilan(),
  });
  const { control } = form;
  const { errors } = form.formState;

  // Yeni kayıtta açılınca, düzenlemede detay gelince form doldurulur.
  useEffect(() => {
    if (!open || !mod) return;
    if (mod.tip === "yeni")
      form.reset(teklifFormVarsayilan(null, mod.IDCrmKisi));
    else if (detay) form.reset(teklifFormVarsayilan(detay));
  }, [open, mod, detay, form]);

  /* ---------------- Adımlar ----------------
     Yeni kayıtta: İleri'de o adım doğrulanır, stepper'dan sadece ulaşılmış
     adımlara gidilir, Kaydet son adımda çıkar.
     Düzenlemede: adımlar serbest, Kaydet her adımda görünür. */
  const [aktifAdim, setAktifAdim] = useState(0);
  const [enIleriAdim, setEnIleriAdim] = useState(0);
  // Dialog kapanınca ilk adıma dön (render sırasında, effect'siz).
  const [oncekiOpen, setOncekiOpen] = useState(open);
  if (open !== oncekiOpen) {
    setOncekiOpen(open);
    if (!open) {
      setAktifAdim(0);
      setEnIleriAdim(0);
    }
  }
  const sonAdimda = aktifAdim === SON_ADIM;

  const adimaGit = (index: number) => {
    setAktifAdim(index);
    setEnIleriAdim((max) => Math.max(max, index));
  };

  /** Aktif adımı doğrular; geçerliyse hedef adıma geçer. */
  const dogrulaVeGit = async (index: number) => {
    const gecerli = await form.trigger([...TEKLIF_STEPS[aktifAdim].fields]);
    if (!gecerli) {
      toast.error("Lütfen bu adımdaki zorunlu alanları kontrol edin.");
      return;
    }
    adimaGit(index);
  };

  const adimaTikla = (index: number) => {
    if (duzenle || index < aktifAdim) adimaGit(index);
    else dogrulaVeGit(index);
  };

  // Yeni kayıtta son adıma kadar Enter formu kaydetmesin, İleri gibi çalışsın.
  // Kalem tablosundaki input'larda (son adım) Enter zaten kaydetmez.
  const formKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    const target = event.target;
    if (
      event.key !== "Enter" ||
      event.defaultPrevented ||
      !(target instanceof HTMLInputElement) ||
      target.form !== event.currentTarget
    ) {
      return;
    }
    event.preventDefault();
    if (!duzenle && !sonAdimda) dogrulaVeGit(aktifAdim + 1);
  };

  /* ---------------- Canlı hesap ---------------- */
  const kalemler = useWatch({ control, name: "Kalemler" });
  const genelIskonto = useWatch({ control, name: "GenelIskonto" });
  const genelIskontoTipi = useWatch({ control, name: "GenelIskontoTipi" });
  const paraBirimi = useWatch({ control, name: "ParaBirimi" });
  const kur = useWatch({ control, name: "Kur" });

  const hesap = useMemo(
    () =>
      teklifHesapla(
        formKalemGirdileri(kalemler),
        formGenelIskonto({ GenelIskontoTipi: genelIskontoTipi, GenelIskonto: genelIskonto }),
      ),
    [kalemler, genelIskontoTipi, genelIskonto],
  );

  // Tip değişince eski değer (ör. %30 → 30 ₺) yanlış anlamla kalmasın diye temizlenir.
  const genelIskontoTipiDegistir = () => {
    form.setValue("GenelIskontoTipi", genelIskontoTipi === "2" ? "1" : "2", { shouldDirty: true });
    form.setValue("GenelIskonto", "", { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  };
  const kurSayi = paraBirimi === "TRY" ? 1 : sayiOku(kur);

  /* ---------------- PDF önizleme (3. adım) ----------------
     Kaydedilmemiş formdan üretilir; numara yeni kayıtta "Taslak". */
  const tumDegerler = useWatch({ control }) as TeklifForm;
  // Form kapalıyken kişi listeleri çekilmez.
  const seciliKisi = useTeklifKisi(tumDegerler.IDCrmKisi, open);
  const kisiEk = useBelgePdfKisiEk(tumDegerler.IDCrmKisi, open);
  const onizlemeAdimi = aktifAdim === SON_ADIM;
  const pdfVeri = useMemo(
    () =>
      onizlemeAdimi
        ? teklifPdfVerisiFormdan(tumDegerler, {
            TeklifNoTam: detay?.TeklifNoTam,
            kisi: seciliKisi ?? detay ?? null,
            kisiEk,
          })
        : null,
    [onizlemeAdimi, tumDegerler, detay, seciliKisi, kisiEk],
  );

  /* ---------------- Kayıt ---------------- */
  const onSubmit = async (v: TeklifForm) => {
    const params = teklifFormdanParams(v);
    try {
      if (mod?.tip === "duzenle") {
        await update.mutateAsync({ ...params, IDCrmTeklif: mod.IDCrmTeklif });
        toast.success("Teklif güncellendi.");
        onKaydedildi?.(mod.IDCrmTeklif);
      } else {
        const sonuc = await insert.mutateAsync(params);
        toast.success(
          sonuc.TeklifNo
            ? `Teklif ${sonuc.TeklifNo} oluşturuldu.`
            : "Teklif oluşturuldu.",
          {
            description:
              "Taslak olarak kaydedildi. Hazır olduğunda gönderildi olarak işaretleyin.",
          },
        );
        if (sonuc.IDCrmTeklif != null) onKaydedildi?.(sonuc.IDCrmTeklif);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Teklif kaydedilemedi.");
    }
  };

  const onInvalid = (hatalar: FieldErrors<TeklifForm>) => {
    // Hatalı ilk adıma götür ki kullanıcı hatayı görsün.
    const ilkHatali = TEKLIF_STEPS.findIndex((_, i) => adimHatali(i, hatalar));
    if (ilkHatali !== -1) setAktifAdim(ilkHatali);
    toast.error("Lütfen zorunlu alanları kontrol edin.");
  };

  const yukleniyor = duzenle && detayYukleniyor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {duzenle
              ? `Teklif Düzenle${detay ? ` — ${detay.TeklifNoTam}` : ""}`
              : "Yeni Teklif"}
          </DialogTitle>
          <DialogDescription>
            {duzenle
              ? "Sadece taslak teklifler düzenlenebilir."
              : "Teklif taslak olarak kaydedilir, numarası otomatik verilir."}
          </DialogDescription>
        </DialogHeader>

        {yukleniyor ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : duzenle && detayHata ? (
          <p className="py-8 text-center text-sm text-destructive">
            Teklif bilgileri getirilemedi.
          </p>
        ) : (
          <form
            onKeyDown={formKeyDown}
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Stepper
                className="sm:max-w-md"
                steps={TEKLIF_STEPS.map((s, i) => ({
                  id: s.id,
                  label: s.label,
                  hasError: adimHatali(i, errors),
                }))}
                activeStep={aktifAdim}
                onStepClick={adimaTikla}
                isStepClickable={(i) => duzenle || i <= enIleriAdim}
              />
              {/* Bilgiler adımında da toplam görünsün. */}
              <p className="shrink-0 text-sm text-muted-foreground">
                Genel Toplam:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {paraFormat(hesap.GenelToplam, paraBirimi)}
                </span>
              </p>
            </div>

            {/* 1. Bilgiler */}
            {aktifAdim === 0 && (
              <div className="flex flex-col gap-4">
                <FormSearchSelect
                  control={control}
                  name="IDCrmKisi"
                  label="Kişi"
                  required
                  placeholder="Kontak veya müşteri seçin"
                  searchPlaceholder="Ad veya kurum ara..."
                  useOptions={useTeklifKisiSecenekleri}
                  minSearchLength={0}
                  debounceMs={0}
                  disabled={sabitKisi}
                />
                <FormInput
                  control={control}
                  name="Konu"
                  label="Konu"
                  required
                  placeholder="Örn. Yıllık lisans teklifi"
                  maxLength={250}
                />
                <FormLabel label="Tarih / Geçerlilik" required>
                  <FormInput
                    control={control}
                    name="TeklifTarihi"
                    type="date"
                  />
                  <FormInput
                    control={control}
                    name="GecerlilikTarihi"
                    type="date"
                  />
                </FormLabel>
                <FormLabel label="Para Birimi / Kur">
                  <FormSelect
                    control={control}
                    name="ParaBirimi"
                    options={PARA_BIRIMI_DATA}
                    // Önceki para biriminin kuru yenisine taşınmasın:
                    // TL'de kur her zaman 1, dövize geçişte yeniden girilir.
                    onValueChange={(v) =>
                      form.setValue("Kur", v === "TRY" ? "1" : "", {
                        shouldDirty: true,
                        shouldValidate: form.formState.isSubmitted,
                      })
                    }
                  />
                  <FormInput
                    control={control}
                    name="Kur"
                    format="decimal"
                    disabled={paraBirimi === "TRY"}
                    placeholder="TL kuru"
                    endIcon={
                      <span className="text-xs text-muted-foreground">₺</span>
                    }
                  />
                </FormLabel>
                <FormInput
                  control={control}
                  name="Aciklama"
                  label="Açıklama"
                  type="textarea"
                  rows={3}
                  placeholder="Teklif detayları... "
                />
                <FormInput
                  control={control}
                  name="Kosullar"
                  label="Koşullar"
                  type="textarea"
                  rows={3}
                  placeholder="Ödeme, teslim ve garanti şartları"
                />
              </div>
            )}

            {/* 2. Kalemler */}
            {aktifAdim === 1 && (
              <div className="space-y-4">
                <TeklifKalemTablosu
                  form={form}
                  kalemler={hesap.kalemler}
                  paraBirimi={paraBirimi}
                />
                {/* İskonto toplamı doğrudan etkilediği için toplam panelinin
                    üstünde, aynı dar sağ sütunda */}
                <div className="ml-auto flex w-full flex-col gap-3 lg:w-80">
                  <div className="flex items-start gap-3">
                    <span className="w-30 shrink-0 pt-1.5 text-sm font-medium">Genel İskonto</span>
                    <IskontoInput
                      control={control}
                      name="GenelIskonto"
                      tutar={genelIskontoTipi === "2"}
                      paraBirimi={paraBirimi}
                      onTipDegistir={genelIskontoTipiDegistir}
                      className="flex-1"
                    />
                  </div>
                  <TeklifToplamPaneli
                    {...hesap}
                    ParaBirimi={paraBirimi}
                    Kur={Number.isFinite(kurSayi) ? kurSayi : 0}
                  />
                </div>
              </div>
            )}

            {/* 3. Önizleme */}
            {onizlemeAdimi && (
              <TeklifPdfOnizleme
                veri={pdfVeri}
                dosyaAdi={teklifPdfDosyaAdi(detay?.TeklifNoTam ?? "Taslak")}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                appearance="outline"
                onClick={() => onOpenChange(false)}
                className="sm:mr-auto"
              >
                İptal
              </Button>
              {aktifAdim > 0 && (
                <Button
                  type="button"
                  appearance="outline"
                  onClick={() => adimaGit(aktifAdim - 1)}
                >
                  <ChevronLeft />
                  Geri
                </Button>
              )}
              {/* İleri ve Kaydet'e ayrı key: aynı DOM butonu type="button"dan
                  "submit"e dönerse İleri tıklaması formu submit edebiliyor. */}
              {!sonAdimda && (
                <Button
                  key="ileri"
                  type="button"
                  appearance={duzenle ? "outline" : undefined}
                  onClick={() => dogrulaVeGit(aktifAdim + 1)}
                >
                  İleri
                  <ChevronRight />
                </Button>
              )}
              {(duzenle || sonAdimda) && (
                <Button key="kaydet" type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin" />}
                  Kaydet
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
