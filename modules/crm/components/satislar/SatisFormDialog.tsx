"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FormCheckbox, FormInput, FormLabel, FormSearchSelect, FormSelect } from "@/components/forms";
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
import { useInsertCrmTahsilat } from "@/modules/crm/hooks/use-finans";
import { useCrmSatisDetay, useInsertCrmSatis, useUpdateCrmSatis } from "@/modules/crm/hooks/use-satis";
import { useTeklifKisiSecenekleri } from "@/modules/crm/hooks/use-teklif";
import { ODEME_SEKLI_SECENEKLERI } from "@/modules/crm/lib/finans";
import {
  SATIS_TIPI_SECENEKLERI,
  abonelikMi,
  bitisOner,
  odemeFormdanTahsilat,
  satisFormTekliften,
  satisFormVarsayilan,
  satisFormdanParams,
} from "@/modules/crm/lib/satis";
import { formKalemGirdileri, paraFormat, teklifHesapla } from "@/modules/crm/lib/teklif";
import { SATIS_STEPS, satisSchema, type SatisForm } from "@/modules/crm/schemas/satis.schema";
import { sayiOku } from "@/modules/crm/schemas/teklif.schema";
import type { DbId } from "@/modules/crm/types/satis";
import type { TeklifDetay } from "@/modules/crm/types/teklif";

import { TeklifKalemTablosu } from "../teklifler/TeklifKalemTablosu";
import { TeklifToplamPaneli } from "../teklifler/TeklifToplamPaneli";

/**
 * - yeni: kişi verilirse seçili gelir ve değiştirilemez.
 * - teklif: kabul edilmiş tekliften dönüşüm (kişi teklifinki, kalemler kopyalanır).
 * - duzenle: geçerli satış; ödeme adımı yok.
 */
export type SatisFormModu =
  | { tip: "yeni"; IDCrmKisi?: DbId | null }
  | { tip: "teklif"; teklif: TeklifDetay }
  | { tip: "duzenle"; IDCrmSatis: DbId };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: SatisFormModu | null;
  /** Kayıttan sonra (yeni kayıtta yeni ID ile). */
  onKaydedildi?: (IDCrmSatis: DbId) => void;
};

const sayiVeyaSifir = (v: string | undefined) => {
  const n = sayiOku(v);
  return Number.isFinite(n) ? n : 0;
};

export function SatisFormDialog({ open, onOpenChange, mod, onKaydedildi }: Props) {
  const insert = useInsertCrmSatis();
  const update = useUpdateCrmSatis();
  const tahsilat = useInsertCrmTahsilat();
  const isPending = insert.isPending || update.isPending || tahsilat.isPending;

  const duzenle = mod?.tip === "duzenle";
  const duzenleID = mod?.tip === "duzenle" ? mod.IDCrmSatis : null;
  const { data: detay, isLoading: detayYukleniyor, isError: detayHata } = useCrmSatisDetay(
    open ? duzenleID : null,
  );
  const sabitKisi = mod?.tip === "teklif" || (mod?.tip === "yeni" && mod.IDCrmKisi != null) || duzenle;

  // Düzenlemede ödeme adımı yok: tahsilat Finans'tan girilir.
  const adimlar = duzenle ? SATIS_STEPS.slice(0, 2) : SATIS_STEPS;
  const sonAdim = adimlar.length - 1;
  const adimHatali = (index: number, errs: FieldErrors<SatisForm>) =>
    adimlar[index].fields.some((f) => Boolean(errs[f]));

  const form = useForm<SatisForm>({
    resolver: zodResolver(satisSchema),
    defaultValues: satisFormVarsayilan(),
  });
  const { control } = form;
  const { errors } = form.formState;

  // Açılınca mod'a göre, düzenlemede detay gelince form doldurulur.
  useEffect(() => {
    if (!open || !mod) return;
    if (mod.tip === "yeni") form.reset(satisFormVarsayilan(null, mod.IDCrmKisi));
    else if (mod.tip === "teklif") form.reset(satisFormTekliften(mod.teklif));
    else if (detay) form.reset(satisFormVarsayilan(detay));
  }, [open, mod, detay, form]);

  // Kullanıcı tipi / başlangıcı değiştirince bitiş önerilir (reset'te name yok → dokunulmaz).
  // Ödeme alındı işaretlenince tutar boşsa satış toplamı önerilir.
  useEffect(
    () =>
      form.subscribe({
        name: ["SatisTipi", "BaslangicTarihi", "OdemeAlindi"],
        formState: { values: true },
        callback: ({ values, name }) => {
          if (name === "SatisTipi" || name === "BaslangicTarihi") {
            if (!abonelikMi(values.SatisTipi)) return;
            if (name === "SatisTipi" && !values.BaslangicTarihi) {
              form.setValue("BaslangicTarihi", values.SatisTarihi);
            }
            const bas = form.getValues("BaslangicTarihi");
            form.setValue("BitisTarihi", bitisOner(values.SatisTipi, bas), { shouldValidate: !!bas });
          } else if (name === "OdemeAlindi" && values.OdemeAlindi && !values.OdemeTutari) {
            const h = teklifHesapla(formKalemGirdileri(values.Kalemler), sayiVeyaSifir(values.GenelIskontoOrani));
            if (h.GenelToplam > 0) form.setValue("OdemeTutari", String(h.GenelToplam));
          }
        },
      }),
    [form],
  );

  /* ---------------- Adımlar (TeklifFormDialog ile aynı davranış) ---------------- */
  const [aktifAdim, setAktifAdim] = useState(0);
  const [enIleriAdim, setEnIleriAdim] = useState(0);
  const [oncekiOpen, setOncekiOpen] = useState(open);
  if (open !== oncekiOpen) {
    setOncekiOpen(open);
    if (!open) {
      setAktifAdim(0);
      setEnIleriAdim(0);
    }
  }
  const sonAdimda = aktifAdim === sonAdim;

  const adimaGit = (index: number) => {
    setAktifAdim(index);
    setEnIleriAdim((max) => Math.max(max, index));
  };

  const dogrulaVeGit = async (index: number) => {
    const gecerli = await form.trigger([...adimlar[aktifAdim].fields]);
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
  const genelIskonto = useWatch({ control, name: "GenelIskontoOrani" });
  const paraBirimi = useWatch({ control, name: "ParaBirimi" });
  const kur = useWatch({ control, name: "Kur" });
  const satisTipi = useWatch({ control, name: "SatisTipi" });
  const odemeAlindi = useWatch({ control, name: "OdemeAlindi" });

  const genelOran = sayiVeyaSifir(genelIskonto);
  const hesap = useMemo(() => teklifHesapla(formKalemGirdileri(kalemler), genelOran), [kalemler, genelOran]);
  const kurSayi = paraBirimi === "TRY" ? 1 : sayiOku(kur);
  const abonelik = abonelikMi(satisTipi);

  /* ---------------- Kayıt ---------------- */
  const onSubmit = async (v: SatisForm) => {
    const params = satisFormdanParams(v, mod?.tip === "teklif" ? mod.teklif.IDCrmTeklif : null);

    // Şema toplamı bilmez; ödeme tutarı satış toplamını aşamaz (SP de reddeder).
    if (!duzenle && v.OdemeAlindi && sayiVeyaSifir(v.OdemeTutari) > params.GenelToplam) {
      form.setError("OdemeTutari", { message: `En fazla ${paraFormat(params.GenelToplam, v.ParaBirimi)}.` });
      setAktifAdim(sonAdim);
      return;
    }

    try {
      if (mod?.tip === "duzenle") {
        await update.mutateAsync({ ...params, IDCrmSatis: mod.IDCrmSatis });
        toast.success("Satış güncellendi.");
        onKaydedildi?.(mod.IDCrmSatis);
        onOpenChange(false);
        return;
      }

      const sonuc = await insert.mutateAsync(params);
      const no = sonuc.SatisNo ? `Satış ${sonuc.SatisNo}` : "Satış";
      const odeme = sonuc.IDCrmSatis != null ? odemeFormdanTahsilat(v, sonuc.IDCrmSatis) : null;

      // Tahsilat finans kaydıdır, ayrı çağrı: başarısız olsa da satış kalır.
      if (odeme) {
        try {
          await tahsilat.mutateAsync(odeme);
          toast.success(`${no} oluşturuldu, ödeme kaydedildi.`);
        } catch (error) {
          toast.warning(`${no} oluşturuldu ama ödeme kaydedilemedi.`, {
            description: `${(error as Error)?.message ?? ""} Tahsilatı Finans sekmesinden ekleyin.`.trim(),
          });
        }
      } else {
        toast.success(`${no} oluşturuldu.`);
      }

      if (sonuc.IDCrmSatis != null) onKaydedildi?.(sonuc.IDCrmSatis);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Satış kaydedilemedi.");
    }
  };

  const onInvalid = (hatalar: FieldErrors<SatisForm>) => {
    const ilkHatali = adimlar.findIndex((_, i) => adimHatali(i, hatalar));
    if (ilkHatali !== -1) setAktifAdim(ilkHatali);
    toast.error("Lütfen zorunlu alanları kontrol edin.");
  };

  const yukleniyor = duzenle && detayYukleniyor;

  const baslik =
    mod?.tip === "duzenle"
      ? `Satış Düzenle${detay ? ` — ${detay.SatisNo}` : ""}`
      : mod?.tip === "teklif"
        ? `Satışa Dönüştür — ${mod.teklif.TeklifNoTam}`
        : "Yeni Satış";

  const aciklama =
    mod?.tip === "duzenle"
      ? "Sadece geçerli satışlar düzenlenebilir. Kişi ve kaynak teklif değiştirilemez."
      : mod?.tip === "teklif"
        ? "Teklifin kalemleri kopyalandı. Satış tipini ve dönemi seçin; kişi kontak ise müşteri olur."
        : "Numara otomatik verilir. Satış kaydedildiği anda Finans'ta alacak olarak görünür.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{baslik}</DialogTitle>
          <DialogDescription>{aciklama}</DialogDescription>
        </DialogHeader>

        {yukleniyor ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : duzenle && detayHata ? (
          <p className="py-8 text-center text-sm text-destructive">Satış bilgileri getirilemedi.</p>
        ) : (
          <form onKeyDown={formKeyDown} onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Stepper
                className="sm:max-w-md"
                steps={adimlar.map((s, i) => ({ id: s.id, label: s.label, hasError: adimHatali(i, errors) }))}
                activeStep={aktifAdim}
                onStepClick={adimaTikla}
                isStepClickable={(i) => duzenle || i <= enIleriAdim}
              />
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
                  placeholder="Müşteri veya kontak seçin"
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
                  placeholder="Örn. Bordro + CRM yıllık lisans"
                  maxLength={250}
                />
                <FormLabel label="Satış Tipi / Tarih" required>
                  <FormSelect control={control} name="SatisTipi" options={SATIS_TIPI_SECENEKLERI} />
                  <FormInput control={control} name="SatisTarihi" type="date" />
                </FormLabel>
                {abonelik && (
                  <FormLabel label="Dönem (Başlangıç / Bitiş)" required>
                    <FormInput control={control} name="BaslangicTarihi" type="date" />
                    <FormInput control={control} name="BitisTarihi" type="date" />
                  </FormLabel>
                )}
                <FormLabel label="Para Birimi / Kur">
                  <FormSelect control={control} name="ParaBirimi" options={PARA_BIRIMI_DATA} />
                  <FormInput
                    control={control}
                    name="Kur"
                    format="decimal"
                    disabled={paraBirimi === "TRY"}
                    placeholder="TL kuru"
                    endIcon={<span className="text-xs text-muted-foreground">₺</span>}
                  />
                </FormLabel>
                <FormInput
                  control={control}
                  name="Aciklama"
                  label="Açıklama"
                  type="textarea"
                  rows={3}
                  placeholder="Satış notları..."
                />
              </div>
            )}

            {/* 2. Kalemler */}
            {aktifAdim === 1 && (
              <div className="space-y-4">
                <TeklifKalemTablosu form={form} kalemler={hesap.kalemler} paraBirimi={paraBirimi} />
                <div className="ml-auto flex w-full flex-col gap-3 lg:w-80">
                  <FormInput
                    control={control}
                    name="GenelIskontoOrani"
                    label="Genel İskonto"
                    format="oran"
                    placeholder="0"
                    className="[&_label]:w-30"
                    endIcon={<span className="text-xs text-muted-foreground">%</span>}
                  />
                  <TeklifToplamPaneli
                    {...hesap}
                    ParaBirimi={paraBirimi}
                    Kur={Number.isFinite(kurSayi) ? kurSayi : 0}
                    GenelIskontoOrani={genelOran}
                  />
                </div>
              </div>
            )}

            {/* 3. Ödeme (sadece yeni satış) */}
            {!duzenle && aktifAdim === 2 && (
              <div className="mx-auto flex max-w-xl flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Ödeme satışla birlikte alındıysa işaretleyin; Finans&apos;a tahsilat olarak kaydedilir. Sonradan
                  gelen ödemeler Finans → Alacaklar&apos;dan girilir.
                </p>
                <FormCheckbox control={control} name="OdemeAlindi" label="Ödeme alındı" />
                {odemeAlindi && (
                  <>
                    <FormInput control={control} name="OdemeTarihi" label="Ödeme Tarihi" type="date" required />
                    <FormInput
                      control={control}
                      name="OdemeTutari"
                      label="Tutar"
                      format="money"
                      required
                      description={`Satış toplamı: ${paraFormat(hesap.GenelToplam, paraBirimi)}. Kısmi ödeme girilebilir.`}
                      endIcon={<span className="text-xs text-muted-foreground">{paraBirimi}</span>}
                    />
                    <FormSelect
                      control={control}
                      name="OdemeSekli"
                      label="Ödeme Şekli"
                      options={ODEME_SEKLI_SECENEKLERI}
                    />
                    <FormInput
                      control={control}
                      name="OdemeFaturaNo"
                      label="Fatura No"
                      placeholder="Opsiyonel"
                      maxLength={50}
                    />
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" appearance="outline" onClick={() => onOpenChange(false)} className="sm:mr-auto">
                İptal
              </Button>
              {aktifAdim > 0 && (
                <Button type="button" appearance="outline" onClick={() => adimaGit(aktifAdim - 1)}>
                  <ChevronLeft />
                  Geri
                </Button>
              )}
              {/* İleri ve Kaydet'e ayrı key (bkz. TeklifFormDialog). */}
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
