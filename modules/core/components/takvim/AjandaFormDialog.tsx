"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addHours,
  format,
  isToday,
  parse,
  setHours,
  startOfHour,
} from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

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
  FormInput,
  FormLabel,
  FormSelect,
  FormSubmitButton,
  FormSwitch,
} from "@/components/forms";
import { FormMultiSelect } from "@/components/forms/form-multi-select";
import { cn } from "@/lib/utils";
import { useUser } from "@/stores/auth-store";
import { useKullaniciList } from "@/modules/core/hooks/use-kullanici";
import {
  useAjandaDetay,
  useAjandaKategoriler,
  useInsertAjanda,
  useUpdateAjanda,
  useUpdateAjandaIstisna,
} from "@/modules/core/hooks/use-ajanda";
import { parseYerel } from "@/modules/core/lib/ajanda";
import {
  GUN_KISA,
  GUN_KODLARI,
  aylikSecenekleri,
  gunKodu,
  tekrarDegerleri,
  tekrarKuraliOlustur,
  tekrarOzeti,
} from "@/modules/core/lib/ajanda-tekrar";
import {
  AjandaForm,
  SECILMEDI,
  ajandaSchema,
} from "@/modules/core/schemas/ajanda.schema";
import type {
  AjandaDetay,
  AjandaKatilimci,
  AjandaKaydetParams,
  AjandaOlay,
} from "@/modules/core/types/takvim";

import { AjandaKategoriDialog } from "./AjandaKategoriDialog";
import { AjandaRenkSecici } from "./AjandaRenkSecici";
import { HATIRLATMA_SECENEKLERI } from "./takvim-utils";

/**
 * - yeni: verilen günde yeni kayıt
 * - tekil: tekrarsız kaydı düzenle
 * - tumu: tekrarlı serinin tamamını düzenle
 * - bu: serinin yalnızca tıklanan tekrarını düzenle (istisna)
 */
export type AjandaFormModu =
  | { tip: "yeni"; tarih: Date }
  | { tip: "tekil" | "tumu" | "bu"; olay: AjandaOlay };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: AjandaFormModu | null;
};

const TARIH = "yyyy-MM-dd";
const SAAT = "HH:mm";

const tarihSaat = (tarih: string, saat: string) =>
  parse(`${tarih} ${saat}`, `${TARIH} ${SAAT}`, new Date());

const TEKRAR_SECENEKLERI = [
  { value: "yok", label: "Tekrarlanmaz" },
  { value: "gunluk", label: "Günlük" },
  { value: "haftaici", label: "Hafta içi her gün" },
  { value: "haftalik", label: "Haftalık" },
  { value: "aylik", label: "Aylık" },
  { value: "yillik", label: "Yıllık" },
];

const ARALIK_BIRIM: Record<string, string> = {
  gunluk: "günde",
  haftalik: "haftada",
  aylik: "ayda",
  yillik: "yılda",
};

const BITIS_SECENEKLERI = [
  { value: "asla", label: "Hiçbir zaman" },
  { value: "tarih", label: "Belirli bir tarihte" },
  { value: "sayi", label: "Belirli sayıda tekrardan sonra" },
];

const HATIRLATMA_OPTIONS = [
  { value: SECILMEDI, label: "Hatırlatma yok" },
  ...HATIRLATMA_SECENEKLERI,
];

function bosForm(tarih: Date): AjandaForm {
  // Bugünse bir sonraki tam saat, değilse 09:00.
  const bas = isToday(tarih)
    ? addHours(startOfHour(new Date()), 1)
    : setHours(startOfHour(tarih), 9);
  const son = addHours(bas, 1);
  return {
    Baslik: "",
    IDAjandaKategori: SECILMEDI,
    Renk: "",
    TumGun: false,
    BaslangicTarih: format(bas, TARIH),
    BaslangicSaat: format(bas, SAAT),
    BitisTarih: format(son, TARIH),
    BitisSaat: format(son, SAAT),
    Konum: "",
    Aciklama: "",
    TekrarTip: "yok",
    TekrarAralik: "1",
    TekrarGunler: [],
    AylikTip: "gun",
    TekrarBitisTip: "asla",
    TekrarBitisTarih: "",
    TekrarSayi: "10",
    Katilimcilar: [],
    HatirlatmaDakika: "10",
    HatirlatmaEposta: false,
  };
}

function tarihAlanlari(bas: Date, son: Date | null, tumGun: boolean) {
  return {
    TumGun: tumGun,
    BaslangicTarih: format(bas, TARIH),
    BaslangicSaat: tumGun ? "09:00" : format(bas, SAAT),
    BitisTarih: son ? format(son, TARIH) : format(bas, TARIH),
    BitisSaat:
      son && !tumGun
        ? format(son, SAAT)
        : tumGun
          ? "10:00"
          : format(addHours(bas, 1), SAAT),
  };
}

function detaydanForm(
  d: AjandaDetay,
  katilimcilar: AjandaKatilimci[],
): AjandaForm {
  const bas = parseYerel(d.Baslangic);
  const t = tekrarDegerleri(d.TekrarKurali);
  return {
    ...bosForm(bas),
    Baslik: d.Baslik,
    IDAjandaKategori:
      d.IDAjandaKategori != null ? String(d.IDAjandaKategori) : SECILMEDI,
    Renk: d.Renk ?? "",
    Konum: d.Konum ?? "",
    Aciklama: d.Aciklama ?? "",
    ...tarihAlanlari(bas, parseYerel(d.Bitis), Boolean(d.TumGun)),
    TekrarTip: t.tip,
    TekrarAralik: String(t.aralik),
    TekrarGunler: t.gunler,
    AylikTip: t.aylikTip,
    TekrarBitisTip: t.bitisTip,
    TekrarBitisTarih: t.bitisTarih,
    TekrarSayi: String(t.sayi),
    Katilimcilar: katilimcilar.map((k) => String(k.IDKullanici)),
    HatirlatmaDakika:
      d.HatirlatmaDakika != null ? String(d.HatirlatmaDakika) : SECILMEDI,
    HatirlatmaEposta: d.HatirlatmaKanal === 2 || d.HatirlatmaKanal === 3,
  };
}

/** "Sadece bu" düzenleme: alanlar tıklanan tekrardan gelir. */
function olaydanForm(o: AjandaOlay): AjandaForm {
  return {
    ...bosForm(o.baslangic),
    Baslik: o.baslik,
    IDAjandaKategori: o.IDAjandaKategori ?? SECILMEDI,
    Renk: "",
    Konum: o.konum ?? "",
    Aciklama: o.aciklama ?? "",
    ...tarihAlanlari(o.baslangic, o.bitis, o.tumGun),
  };
}

/** Alanların altındaki açıklama metni — label sütununu atlayıp input hizasında. */
const ALT_NOT = "text-xs text-muted-foreground sm:pl-[calc(25%+0.75rem)]";

export function AjandaFormDialog({ open, onOpenChange, mod }: Props) {
  const user = useUser();
  const benimID = user?.IDKullanici != null ? String(user.IDKullanici) : null;

  const istisna = mod?.tip === "bu";
  const detayID =
    mod?.tip === "tekil"
      ? mod.olay.IDAjanda
      : mod?.tip === "tumu"
        ? (mod.olay.IDAjandaSeri ?? mod.olay.IDAjanda)
        : null;

  const detay = useAjandaDetay(open ? detayID : null);
  const kategoriler = useAjandaKategoriler();
  const kullanicilar = useKullaniciList(open && !istisna);

  const insert = useInsertAjanda();
  const update = useUpdateAjanda();
  const updateIstisna = useUpdateAjandaIstisna();
  const isPending =
    insert.isPending || update.isPending || updateIstisna.isPending;

  const form = useForm<AjandaForm>({
    resolver: zodResolver(ajandaSchema),
    defaultValues: bosForm(new Date()),
  });
  const { control, setValue } = form;
  const [kategoriDialog, setKategoriDialog] = useState(false);

  // Dialog açılınca / detay gelince formu doldur.
  const detayKayit = detay.data?.kayit;
  const detayKatilimcilar = detay.data?.katilimcilar;
  useEffect(() => {
    if (!open || !mod) return;
    if (mod.tip === "yeni") form.reset(bosForm(mod.tarih));
    else if (mod.tip === "bu") form.reset(olaydanForm(mod.olay));
    else if (detayKayit)
      form.reset(detaydanForm(detayKayit, detayKatilimcilar ?? []));
  }, [open, mod, detayKayit, detayKatilimcilar, form]);

  const [
    tumGun,
    baslangicTarih,
    bitisTarih,
    tekrarTip,
    tekrarBitisTip,
    renk,
    kategoriID,
    tekrarAlanlari,
  ] = useWatch({
    control,
    name: [
      "TumGun",
      "BaslangicTarih",
      "BitisTarih",
      "TekrarTip",
      "TekrarBitisTip",
      "Renk",
      "IDAjandaKategori",
      "TekrarAralik",
    ],
  });
  const hatirlatma = useWatch({ control, name: "HatirlatmaDakika" });
  const tekrarForm = useWatch({
    control,
    name: ["TekrarGunler", "AylikTip", "TekrarBitisTarih", "TekrarSayi"],
  });

  // Başlangıç tarihi bitişin ilerisine alınınca bitişi de taşı.
  useEffect(() => {
    if (baslangicTarih && bitisTarih && bitisTarih < baslangicTarih) {
      setValue("BitisTarih", baslangicTarih, { shouldValidate: true });
    }
  }, [baslangicTarih, bitisTarih, setValue]);

  const baslangicDate = useMemo(() => {
    const d = parse(baslangicTarih || "", TARIH, new Date());
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [baslangicTarih]);

  const kategoriOptions = useMemo(
    () => [
      { value: SECILMEDI, label: "Kategori yok" },
      ...(kategoriler.data ?? []).map((k) => ({
        value: String(k.IDAjandaKategori),
        label: k.Ad,
      })),
    ],
    [kategoriler.data],
  );
  const kategoriRengi =
    kategoriler.data?.find((k) => String(k.IDAjandaKategori) === kategoriID)
      ?.Renk ?? null;

  const katilimciOptions = useMemo(() => {
    const list = (kullanicilar.data ?? [])
      .filter((k) => String(k.IDKullanici) !== benimID && k.Durum !== false)
      .map((k) => ({
        value: String(k.IDKullanici),
        label: k.Ad || k.KullaniciAdi,
        Email: k.Email ?? "",
      }));
    // Listede olmayan (başka şirketten vb.) mevcut katılımcılar da görünsün.
    for (const k of detayKatilimcilar ?? []) {
      if (!list.some((x) => x.value === String(k.IDKullanici))) {
        list.push({
          value: String(k.IDKullanici),
          label: k.Email ?? `#${k.IDKullanici}`,
          Email: k.Email ?? "",
        });
      }
    }
    return list;
  }, [kullanicilar.data, detayKatilimcilar, benimID]);

  const ozet = useMemo(() => {
    if (tekrarTip === "yok") return null;
    const kural = tekrarKuraliOlustur(
      {
        tip: tekrarTip,
        aralik: Number(tekrarAlanlari) || 1,
        gunler: tekrarForm[0],
        aylikTip: tekrarForm[1],
        bitisTip: tekrarBitisTip,
        bitisTarih: tekrarForm[2],
        sayi: Number(tekrarForm[3]) || 1,
      },
      baslangicDate,
    );
    return tekrarOzeti(kural, baslangicDate);
  }, [tekrarTip, tekrarAlanlari, tekrarForm, tekrarBitisTip, baslangicDate]);

  const onSubmit = async (v: AjandaForm) => {
    if (!mod) return;

    const baslangic = tarihSaat(
      v.BaslangicTarih,
      v.TumGun ? "00:00" : v.BaslangicSaat,
    );
    const bitis = v.TumGun
      ? v.BitisTarih && v.BitisTarih !== v.BaslangicTarih
        ? tarihSaat(v.BitisTarih, "00:00")
        : null
      : v.BitisTarih
        ? tarihSaat(v.BitisTarih, v.BitisSaat || v.BaslangicSaat)
        : null;

    const ortak = {
      Baslik: v.Baslik,
      Aciklama: v.Aciklama,
      Konum: v.Konum,
      IDAjandaKategori:
        v.IDAjandaKategori === SECILMEDI ? null : v.IDAjandaKategori,
      Renk: v.Renk || null,
      TumGun: v.TumGun,
      Baslangic: baslangic,
      Bitis: bitis,
    };

    try {
      if (mod.tip === "bu") {
        await updateIstisna.mutateAsync({
          IDAjandaSeri: mod.olay.IDAjandaSeri!,
          OrijinalTarih: mod.olay.tekrarTarihi!,
          ...ortak,
        });
        toast.success("Etkinlik güncellendi.");
        onOpenChange(false);
        return;
      }

      const hatirlatmaDakika =
        v.HatirlatmaDakika === SECILMEDI ? null : Number(v.HatirlatmaDakika);
      const params: AjandaKaydetParams = {
        ...ortak,
        TekrarKurali: tekrarKuraliOlustur(
          {
            tip: v.TekrarTip,
            aralik: Number(v.TekrarAralik),
            gunler: v.TekrarGunler,
            aylikTip: v.AylikTip,
            bitisTip: v.TekrarBitisTip,
            bitisTarih: v.TekrarBitisTarih,
            sayi: Number(v.TekrarSayi),
          },
          baslangic,
        ),
        Katilimcilar: v.Katilimcilar,
        HatirlatmaDakika: hatirlatmaDakika,
        HatirlatmaKanal:
          hatirlatmaDakika == null ? null : v.HatirlatmaEposta ? 3 : 1,
      };

      if (mod.tip === "yeni") {
        await insert.mutateAsync(params);
        toast.success("Etkinlik eklendi.");
      } else {
        await update.mutateAsync({ ...params, IDAjanda: detayID! });
        toast.success(
          mod.tip === "tumu"
            ? "Tüm etkinlikler güncellendi."
            : "Etkinlik güncellendi.",
        );
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Etkinlik kaydedilemedi.");
    }
  };

  const yukleniyor = Boolean(detayID) && detay.isLoading;
  const baslik =
    mod?.tip === "yeni"
      ? "Yeni Etkinlik"
      : mod?.tip === "bu"
        ? "Bu Etkinliği Düzenle"
        : mod?.tip === "tumu"
          ? "Tüm Etkinlikleri Düzenle"
          : "Etkinliği Düzenle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{baslik}</DialogTitle>
          <DialogDescription>
            {istisna
              ? "Yalnızca bu tarihteki tekrar değişir; serinin diğer tekrarları aynı kalır."
              : "Etkinlik bilgilerini giriniz."}
          </DialogDescription>
        </DialogHeader>

        {yukleniyor ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col divide-y">
              {/* Etkinlik bilgileri */}
              <div className="flex flex-col gap-4 pb-4">
                <FormInput
                  control={control}
                  name="Baslik"
                  label="Başlık"
                  required
                  placeholder="Etkinlik başlığını giriniz"
                  maxLength={250}
                />
                <FormLabel label="Başlangıç" required>
                  <FormInput
                    control={control}
                    name="BaslangicTarih"
                    type="date"
                  />
                  {!tumGun && (
                    <FormInput
                      control={control}
                      name="BaslangicSaat"
                      type="time"
                    />
                  )}
                </FormLabel>
                <FormLabel label="Bitiş">
                  <FormInput control={control} name="BitisTarih" type="date" />
                  {!tumGun && (
                    <FormInput control={control} name="BitisSaat" type="time" />
                  )}
                </FormLabel>
                <FormSwitch control={control} name="TumGun" label="Tüm Gün" />
                <FormInput
                  control={control}
                  name="Konum"
                  label="Konum"
                  placeholder="Adres, salon veya online"
                  maxLength={250}
                />
                <FormInput
                  control={control}
                  name="Aciklama"
                  label="Açıklama"
                  type="textarea"
                  rows={3}
                  placeholder="Açıklama giriniz"
                />
              </div>

              {/* Tekrar — "sadece bu" düzenlemede yok */}
              {!istisna && (
                <div className="flex flex-col gap-4 py-4">
                  <FormLabel label="Tekrar">
                    <FormSelect
                      control={control}
                      name="TekrarTip"
                      options={TEKRAR_SECENEKLERI}
                    />
                    {tekrarTip !== "yok" && tekrarTip !== "haftaici" && (
                      <FormInput
                        control={control}
                        name="TekrarAralik"
                        format="number"
                        maxLength={2}
                        endIcon={
                          <span className="text-xs whitespace-nowrap text-muted-foreground">
                            {ARALIK_BIRIM[tekrarTip]} bir
                          </span>
                        }
                      />
                    )}
                  </FormLabel>

                  {tekrarTip === "haftalik" && (
                    <Controller
                      control={control}
                      name="TekrarGunler"
                      render={({ field }) => {
                        const secili = field.value.length
                          ? field.value
                          : [gunKodu(baslangicDate)];
                        return (
                          <FormLabel label="Günler">
                            <div className="flex flex-wrap gap-1.5">
                              {GUN_KODLARI.map((g) => {
                                const aktif = secili.includes(g);
                                return (
                                  <button
                                    key={g}
                                    type="button"
                                    aria-pressed={aktif}
                                    onClick={() => {
                                      const next = aktif
                                        ? secili.filter((x) => x !== g)
                                        : [...secili, g];
                                      field.onChange(
                                        next.length ? next : secili,
                                      );
                                    }}
                                    className={cn(
                                      "h-8 min-w-11 rounded-md border px-2 text-xs font-medium transition-colors",
                                      aktif
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "bg-background hover:bg-accent",
                                    )}
                                  >
                                    {GUN_KISA[g]}
                                  </button>
                                );
                              })}
                            </div>
                          </FormLabel>
                        );
                      }}
                    />
                  )}

                  {tekrarTip === "aylik" && (
                    <FormSelect
                      control={control}
                      name="AylikTip"
                      label="Ayın"
                      options={aylikSecenekleri(baslangicDate)}
                    />
                  )}

                  {tekrarTip !== "yok" && (
                    <FormLabel label="Tekrar Bitişi">
                      <FormSelect
                        control={control}
                        name="TekrarBitisTip"
                        options={BITIS_SECENEKLERI}
                      />
                      {tekrarBitisTip === "tarih" && (
                        <FormInput
                          control={control}
                          name="TekrarBitisTarih"
                          type="date"
                        />
                      )}
                      {tekrarBitisTip === "sayi" && (
                        <FormInput
                          control={control}
                          name="TekrarSayi"
                          format="number"
                          maxLength={3}
                          endIcon={
                            <span className="text-xs text-muted-foreground">
                              kez
                            </span>
                          }
                        />
                      )}
                    </FormLabel>
                  )}

                  {ozet && <p className={ALT_NOT}>{ozet}</p>}
                </div>
              )}

              {/* Kategori ve renk */}
              <div className="flex flex-col gap-4 py-4">
                <FormLabel label="Kategori">
                  <FormSelect
                    control={control}
                    name="IDAjandaKategori"
                    options={kategoriOptions}
                  />
                  <Button
                    type="button"
                    appearance="outline"
                    size="icon"
                    className="flex-none!"
                    title="Kategorileri yönet"
                    aria-label="Kategorileri yönet"
                    onClick={() => setKategoriDialog(true)}
                  >
                    <Plus />
                  </Button>
                </FormLabel>
                <Controller
                  control={control}
                  name="Renk"
                  render={({ field }) => (
                    <FormLabel label="Renk">
                      <AjandaRenkSecici
                        value={field.value}
                        onChange={field.onChange}
                        temizlenebilir
                      />
                    </FormLabel>
                  )}
                />
                <p className={ALT_NOT}>
                  {renk
                    ? "Seçili renge tekrar tıklarsanız kategori rengine döner."
                    : kategoriRengi
                      ? "Renk seçilmedi; kategorinin rengi kullanılır."
                      : "Renk seçilmezse varsayılan gri kullanılır."}
                </p>
              </div>

              {/* Katılımcılar ve hatırlatma — "sadece bu" düzenlemede yok */}
              {!istisna && (
                <div className="flex flex-col gap-4 pt-4">
                  <FormMultiSelect
                    control={control}
                    name="Katilimcilar"
                    label="Katılımcılar"
                    placeholder="Katılımcı seçiniz"
                    searchPlaceholder="Ad veya e-posta ara..."
                    options={katilimciOptions}
                    extraSearchKeys={["Email"]}
                  />
                  <FormLabel label="Hatırlatma ve E-posta">
                    <FormSwitch
                      control={control}
                      name="HatirlatmaEposta"
                      disabled={hatirlatma === SECILMEDI}
                      className="w-auto flex-none! self-center p-0"
                    />
                    <FormSelect
                      control={control}
                      name="HatirlatmaDakika"
                      options={HATIRLATMA_OPTIONS}
                    />
                  </FormLabel>
                  {mod?.tip !== "yeni" && (
                    <p className={ALT_NOT}>
                      Hatırlatma ayarı yalnızca sizin içindir; yeni eklenen
                      katılımcılar bu ayarla başlar.
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                appearance="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <FormSubmitButton loading={isPending} />
            </DialogFooter>
          </form>
        )}
      </DialogContent>

      <AjandaKategoriDialog
        open={kategoriDialog}
        onOpenChange={setKategoriDialog}
        onCreated={(id) =>
          setValue("IDAjandaKategori", String(id), { shouldDirty: true })
        }
      />
    </Dialog>
  );
}
