"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import z from "zod";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { User } from "@/stores/auth-store";
import { CustomDatePicker } from "../customs/CustomDatePicker";
import { FormInput, FormSelect } from "../forms";
import { Field } from "../ui/field";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useInsertTalep, useIzinSure } from "@/hooks/use-izin";
import { clampNumberString } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

const YILLIK_IZIN_KODU = "YI";
const SAATLIK_IZIN_KODU = "SI";

const izinTalepSchema = z
  .object({
    izinTipi: z.string().min(1, "İzin tipi seçiniz"),
    tarihAraligi: z.custom<DateRange>().optional(),
    tarihTekil: z.date().optional(),
    saat: z.string().optional(),
    adres: z.string().optional(),
    mesaj: z.string().optional(),
    dosya: z
      .object({
        base64: z.string(),
        name: z.string(),
      })
      .nullable()
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.izinTipi === SAATLIK_IZIN_KODU) {
      if (!values.tarihTekil) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tarihTekil"],
          message: "Tarih seçiniz",
        });
      }
      const saatSayi = Number(values.saat);
      if (!values.saat || Number.isNaN(saatSayi) || saatSayi < 1 || saatSayi > 23) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["saat"],
          message: "1 ile 23 arasında bir saat giriniz",
        });
      }
      return;
    }

    if (!values.tarihAraligi?.from || !values.tarihAraligi?.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tarihAraligi"],
        message: "Başlangıç ve bitiş tarihi seçiniz",
      });
    }
  });

type IzinTalepForm = z.infer<typeof izinTalepSchema>;

const DEFAULT_VALUES: IzinTalepForm = {
  izinTipi: "",
  tarihAraligi: undefined,
  tarihTekil: undefined,
  saat: "",
  adres: "",
  mesaj: "",
  dosya: null,
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

const TalepEkle = ({ open, onOpenChange, user }: Props) => {
  const { izinTipleri } = usePersonelSabitTanimlar();
  const { mutateAsync: insertTalep, isPending: isSaving } = useInsertTalep();
  const [isFileReading, setIsFileReading] = useState(false);

  const form = useForm<IzinTalepForm>({
    resolver: zodResolver(izinTalepSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, form]);

  const izinTipi = form.watch("izinTipi");
  const tarihAraligi = form.watch("tarihAraligi");
  const dosya = form.watch("dosya");
  const isYillikIzin = izinTipi === YILLIK_IZIN_KODU;
  const isSaatlikIzin = izinTipi === SAATLIK_IZIN_KODU;

  // İzin tipi değişince diğer moda ait alanları temizle (SI <-> diğerleri
  // geçişinde eski tarih/saat verisinin yanlışlıkla submit edilmemesi için).
  useEffect(() => {
    if (isSaatlikIzin) {
      form.setValue("tarihAraligi", undefined);
    } else {
      form.setValue("tarihTekil", undefined);
      form.setValue("saat", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaatlikIzin]);

  const gunSayisi = useMemo(() => {
    if (isSaatlikIzin) return null;
    if (!tarihAraligi?.from || !tarihAraligi?.to) return null;
    return differenceInCalendarDays(tarihAraligi.to, tarihAraligi.from) + 1;
  }, [tarihAraligi, isSaatlikIzin]);

  const izinTipiOptions = useMemo(
    () => izinTipleri.map((t) => ({ value: t.value, label: t.label })),
    [izinTipleri],
  );

  const bugun = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: izinSure, isFetching: isLoadingIzinSure } = useIzinSure(
    {
      IDSubePersonel: String(user?.IDSubePersonel ?? ""),
      Tarih: bugun,
    },
    isYillikIzin,
  );

  useEffect(() => {
    if (izinSure?.Adres && !form.getValues("adres")) {
      form.setValue("adres", izinSure.Adres);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [izinSure]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // aynı dosyayı tekrar seçebilmek için input'u sıfırla
    if (!file) return;

    setIsFileReading(true);
    try {
      const base64 = await fileToBase64(file);
      form.setValue("dosya", { base64, name: file.name });
    } catch {
      toast.error("Dosya okunamadı, lütfen tekrar deneyin.");
    } finally {
      setIsFileReading(false);
    }
  };

  const handleSubmit = async (values: IzinTalepForm) => {
    if (!user?.IDSubePersonel) {
      toast.error("Kullanıcı bilgisi bulunamadı.");
      return;
    }

    try {
      const izinTipiLabel =
        izinTipleri.find((t) => t.value === values.izinTipi)?.label ??
        values.izinTipi;

      let baslangic: string;
      let bitis: string;
      let gun: string;

      if (values.izinTipi === SAATLIK_IZIN_KODU) {
        const tekilTarih = format(values.tarihTekil as Date, "yyyy-MM-dd");
        baslangic = tekilTarih;
        bitis = tekilTarih;
        gun = String(values.saat);
      } else {
        baslangic = format(values.tarihAraligi!.from as Date, "yyyy-MM-dd");
        bitis = format(values.tarihAraligi!.to as Date, "yyyy-MM-dd");
        gun = String(gunSayisi ?? 0);
      }

      await insertTalep({
        IDSubePersonel: String(user.IDSubePersonel),
        BaslangicTarihi: baslangic,
        BitisTarihi: bitis,
        Gun: gun,
        Aciklama: izinTipiLabel,
        AitOlduguYil: "0",
        Adres: values.adres ?? "",
        Mesaj: values.mesaj ?? "",
        Dosyalar: values.dosya?.base64 ?? "",
      });

      toast.success("İzin talebiniz oluşturuldu.");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "İzin talebi oluşturulamadı.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni İzin Talebi</DialogTitle>
          <DialogDescription>
            {user?.Ad} için izin talebi oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <FormSelect
              control={form.control}
              name="izinTipi"
              label="İzin Tipi"
              options={izinTipiOptions}
              valueKey="value"
              labelKey="label"
              placeholder="İzin tipi seçiniz"
              disabled={isSaving}
            />

            {isSaatlikIzin ? (
              <>
                <CustomDatePicker
                  control={form.control}
                  name="tarihTekil"
                  label="Tarih"
                  mode="single"
                  disabled={isSaving}
                />

                <FormInput
                  control={form.control}
                  name="saat"
                  label="Saat"
                  placeholder="1-23 arası saat giriniz"
                  format="number"
                  transform={(v) => clampNumberString(v, 1, 23)}
                  disabled={isSaving}
                />
              </>
            ) : (
              <>
                <CustomDatePicker
                  control={form.control}
                  name="tarihAraligi"
                  label="Tarih Aralığı"
                  mode="range"
                  disabled={isSaving}
                />

                {gunSayisi !== null && (
                  <Field>
                    <div className="flex items-center gap-3">
                      <Label className="w-1/4 shrink-0">Gün</Label>
                      <div className="flex-1 text-sm text-muted-foreground">
                        {gunSayisi} gün
                      </div>
                    </div>
                  </Field>
                )}
              </>
            )}

            <FormInput
              control={form.control}
              name="adres"
              label="Adres"
              type="textarea"
              rows={2}
              placeholder="İzin süresince ulaşılabilecek adres"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="mesaj"
              label="Mesaj"
              type="textarea"
              placeholder="Eklemek istediğiniz bir not varsa yazınız"
              disabled={isSaving}
            />

            <Field>
              <div className="flex items-center gap-3">
                <Label className="w-1/4 shrink-0">Dosya</Label>
                <div className="flex-1">
                  {dosya ? (
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      <span className="truncate">{dosya.name}</span>
                      <button
                        type="button"
                        onClick={() => form.setValue("dosya", null)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Dosyayı kaldır"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                        (isSaving || isFileReading) &&
                          "pointer-events-none opacity-50",
                      )}
                    >
                      <Paperclip className="size-4" />
                      {isFileReading ? "Yükleniyor..." : "Dosya seç"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isSaving || isFileReading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </Field>

            {isYillikIzin && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  Yıllık İzin Durumu
                </p>

                {isLoadingIzinSure ? (
                  <p className="text-sm text-muted-foreground">
                    Yükleniyor...
                  </p>
                ) : izinSure ? (
                  <div className="grid grid-cols-3 gap-2">
                    <IzinStat label="Kıdem Yılı" value={izinSure.IzinKidemYili} />
                    <IzinStat label="Toplam Hak" value={izinSure.ToplamIzinHakki} />
                    <IzinStat label="Bu Yıl Kullanılan" value={izinSure.KullanilanIzin} />
                    <IzinStat label="Geçmiş Yıl Kullanılan" value={izinSure.oKullanilanIzin} />
                    <IzinStat label="Toplam Kullanılan" value={izinSure.ToplamKullanilanIzin} />
                    <IzinStat label="Kalan İzin" value={izinSure.ToplamKalanIzin} highlight />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    İzin bilgisi bulunamadı.
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
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSaving || isFileReading}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

type IzinStatProps = {
  label: string;
  value: number | string;
  highlight?: boolean;
};

function IzinStat({ label, value, highlight }: IzinStatProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background px-2.5 py-2",
        highlight && "border-primary/40 bg-primary/5",
      )}
    >
      <p className="text-[11px] leading-tight text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-base font-semibold leading-tight",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default TalepEkle;