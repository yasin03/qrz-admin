"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FileText, Paperclip, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { FormInput, FormSelect } from "@/components/forms";
import { cn } from "@/lib/utils";
import { KULLANICI_TIPI } from "@/lib/roles";
import { useHasRole } from "@/stores/auth-store";
import {
  useGruplar,
  useSirketler,
} from "@/modules/core/hooks/use-kurumsal-data";
import {
  DESTEK_ANA_UYGULAMA,
  useDestekKonuList,
  useInsertDestekTalep,
} from "@/modules/core/hooks/use-destek";
import type {
  DestekDosyaType,
  DestekTalepOncelik,
} from "@/modules/core/types/destek";
import {
  DESTEK_TAKIP_BIRIMI,
  MAX_DOSYA_BOYUTU,
  MAX_DOSYA_SAYISI,
  ONCELIK_BUTTON_CLASS,
  ONCELIK_OPTIONS,
} from "./destek-options";
import { fileToBase64, formatFileSize } from "./destek-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const createSchema = (isAdmin: boolean) =>
  z
    .object({
      IDGurup: z.string(),
      IDSirket: z.string(),
      IDDestekTakipKonu: z.string().min(1, "Konu seçiniz"),
      Oncelik: z.enum(["Yüksek", "Orta", "Düşük"], {
        error: "Öncelik seçiniz",
      }),
      Baslik: z
        .string()
        .trim()
        .min(1, "Başlık giriniz")
        .max(200, "Başlık en fazla 200 karakter olabilir"),
      Mesaj: z.string().trim().min(1, "Mesaj giriniz"),
      Dosyalar: z.array(
        z.object({
          fileName: z.string(),
          fileSize: z.number(),
          base64: z.string(),
        }),
      ),
    })
    .superRefine((values, ctx) => {
      if (!isAdmin) return;
      if (!values.IDGurup) {
        ctx.addIssue({
          code: "custom",
          path: ["IDGurup"],
          message: "Grup seçiniz",
        });
      }
      if (!values.IDSirket) {
        ctx.addIssue({
          code: "custom",
          path: ["IDSirket"],
          message: "Şirket seçiniz",
        });
      }
    });

type DestekTalepForm = z.infer<ReturnType<typeof createSchema>>;

const DEFAULT_VALUES: DestekTalepForm = {
  IDGurup: "",
  IDSirket: "",
  IDDestekTakipKonu: "",
  Oncelik: "Orta",
  Baslik: "",
  Mesaj: "",
  Dosyalar: [],
};

const DestekTalepEkle = ({ open, onOpenChange }: Props) => {
  const isAdmin = useHasRole(KULLANICI_TIPI.ADMIN);
  const [isFileReading, setIsFileReading] = useState(false);

  const schema = useMemo(() => createSchema(isAdmin), [isAdmin]);
  const form = useForm<DestekTalepForm>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const { mutateAsync: insertTalep, isPending: isSaving } =
    useInsertDestekTalep();
  const { data: konuListesi = [], isLoading: isLoadingKonular } =
    useDestekKonuList(DESTEK_ANA_UYGULAMA, open);

  // ---- Admin: Grup → Şirket ----
  const idGurup = form.watch("IDGurup");
  const dosyalar = form.watch("Dosyalar");

  const { data: gruplar = [], isLoading: isLoadingGruplar } = useGruplar({
    enabled: isAdmin && open,
  });
  const { data: sirketler = [], isLoading: isLoadingSirketler } = useSirketler(
    Number(idGurup),
    { enabled: isAdmin && open },
  );

  const grupOptions = useMemo(
    () => gruplar.map((g) => ({ value: String(g.IDGurup), label: g.GurupAdi })),
    [gruplar],
  );
  const sirketOptions = useMemo(
    () =>
      sirketler.map((s) => ({
        value: String(s.IDSirket),
        label: s.SirketAdi,
      })),
    [sirketler],
  );
  const konuOptions = useMemo(
    () =>
      konuListesi.map((k) => ({
        value: String(k.IDDestekTakipKonu),
        label: k.Konu,
      })),
    [konuListesi],
  );

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Grup değişince şirket seçimi sıfırlansın.
      if (name === "IDGurup") {
        form.setValue("IDSirket", "");
      }

      // Konu seçilince başlık konu adıyla dolsun; kullanıcı başlığı
      // elle değiştirdiyse dokunmuyoruz.
      if (name === "IDDestekTakipKonu") {
        const konu = konuListesi.find(
          (k) => String(k.IDDestekTakipKonu) === values.IDDestekTakipKonu,
        );
        if (konu && !form.getFieldState("Baslik").isDirty) {
          form.setValue("Baslik", konu.Konu, { shouldValidate: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, konuListesi]);

  // ---- Dosyalar ----
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // aynı dosyayı tekrar seçebilmek için
    if (files.length === 0) return;

    const mevcut = form.getValues("Dosyalar");
    const kalanHak = MAX_DOSYA_SAYISI - mevcut.length;

    if (kalanHak <= 0) {
      toast.error(`En fazla ${MAX_DOSYA_SAYISI} dosya ekleyebilirsiniz.`);
      return;
    }
    if (files.length > kalanHak) {
      toast.warning(
        `En fazla ${MAX_DOSYA_SAYISI} dosya eklenebilir, ilk ${kalanHak} dosya alındı.`,
      );
    }

    const buyukler = files.filter((f) => f.size > MAX_DOSYA_BOYUTU);
    if (buyukler.length > 0) {
      toast.error(
        `${buyukler.map((f) => f.name).join(", ")} ${formatFileSize(MAX_DOSYA_BOYUTU)} sınırını aşıyor.`,
      );
    }

    const eklenecekler = files
      .filter((f) => f.size <= MAX_DOSYA_BOYUTU)
      .slice(0, kalanHak);
    if (eklenecekler.length === 0) return;

    setIsFileReading(true);
    try {
      const yeniDosyalar: DestekDosyaType[] = await Promise.all(
        eklenecekler.map(async (file) => ({
          fileName: file.name,
          fileSize: file.size,
          base64: await fileToBase64(file),
        })),
      );
      form.setValue("Dosyalar", [...mevcut, ...yeniDosyalar]);
    } catch {
      toast.error("Dosya okunamadı, lütfen tekrar deneyin.");
    } finally {
      setIsFileReading(false);
    }
  };

  const handleFileRemove = (index: number) => {
    form.setValue(
      "Dosyalar",
      form.getValues("Dosyalar").filter((_, i) => i !== index),
    );
  };

  // ---- Kaydet ----
  const handleSubmit = async (values: DestekTalepForm) => {
    try {
      await insertTalep({
        DestekTakipBirimi: DESTEK_TAKIP_BIRIMI,
        IDAnaUygulama: DESTEK_ANA_UYGULAMA,
        IDDestekTakipKonu: values.IDDestekTakipKonu,
        // Admin dışında şirket route'ta session'dan alınıyor.
        IDSirket: isAdmin ? values.IDSirket : undefined,
        Oncelik: values.Oncelik,
        Baslik: values.Baslik.trim(),
        Mesaj: values.Mesaj.trim(),
        Dosya: JSON.stringify(values.Dosyalar),
      });

      toast.success("Destek talebiniz oluşturuldu.");
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Destek talebi oluşturulamadı.",
      );
    }
  };

  const isBusy = isSaving || isFileReading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Yeni Destek Talebi</DialogTitle>
          <DialogDescription>
            Yaşadığınız sorunu veya talebinizi bize iletin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            {isAdmin && (
              <>
                <FormSelect
                  control={form.control}
                  name="IDGurup"
                  label="Grup"
                  required
                  options={grupOptions}
                  placeholder={
                    isLoadingGruplar ? "Yükleniyor..." : "Grup seçiniz"
                  }
                  disabled={isLoadingGruplar || isSaving}
                />
                <FormSelect
                  control={form.control}
                  name="IDSirket"
                  label="Şirket"
                  required
                  options={sirketOptions}
                  placeholder={
                    !idGurup
                      ? "Önce grup seçiniz"
                      : isLoadingSirketler
                        ? "Yükleniyor..."
                        : "Şirket seçiniz"
                  }
                  disabled={!idGurup || isLoadingSirketler || isSaving}
                />
              </>
            )}

            <FormSelect
              control={form.control}
              name="IDDestekTakipKonu"
              label="Konu"
              required
              options={konuOptions}
              placeholder={isLoadingKonular ? "Yükleniyor..." : "Konu seçiniz"}
              disabled={isLoadingKonular || isSaving}
            />

            <Controller
              control={form.control}
              name="Oncelik"
              render={({ field, fieldState }) => (
                <Field>
                  <div className="flex items-center gap-3">
                    <Label className="w-1/4 shrink-0">
                      Öncelik
                      <span className="ml-1 text-destructive">*</span>
                    </Label>
                    <div
                      role="radiogroup"
                      aria-label="Öncelik"
                      className="grid flex-1 grid-cols-3 gap-2"
                    >
                      {ONCELIK_OPTIONS.map((option) => {
                        const isActive = field.value === option.value;
                        const classes =
                          ONCELIK_BUTTON_CLASS[
                            option.value as DestekTalepOncelik
                          ];
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            disabled={isSaving}
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                              isActive ? classes.active : classes.idle,
                            )}
                          >
                            <span
                              className={cn(
                                "size-2 rounded-full bg-current",
                                !isActive && "opacity-50",
                              )}
                            />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <FormInput
              control={form.control}
              name="Baslik"
              label="Başlık"
              required
              placeholder="Talebiniz için kısa bir başlık"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="Mesaj"
              label="Mesaj"
              required
              type="textarea"
              rows={5}
              placeholder="Sorununuzu veya talebinizi detaylı olarak açıklayınız"
              disabled={isSaving}
            />

            <Field>
              <div className="flex items-start gap-3">
                <Label className="w-1/4 shrink-0 pt-2">Dosyalar</Label>
                <div className="min-w-0 flex-1 space-y-2">
                  {dosyalar.map((dosya, index) => (
                    <div
                      key={`${dosya.fileName}-${index}`}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {dosya.fileName}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(dosya.fileSize)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(index)}
                        disabled={isSaving}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={`${dosya.fileName} dosyasını kaldır`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}

                  {dosyalar.length < MAX_DOSYA_SAYISI && (
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                        isBusy && "pointer-events-none opacity-50",
                      )}
                    >
                      <Paperclip className="size-4" />
                      {isFileReading ? "Yükleniyor..." : "Dosya ekle"}
                      <span className="ml-auto text-xs">
                        En fazla {MAX_DOSYA_SAYISI} dosya,{" "}
                        {formatFileSize(MAX_DOSYA_BOYUTU)}
                      </span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isBusy}
                      />
                    </label>
                  )}
                </div>
              </div>
            </Field>
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
            <Button type="submit" disabled={isBusy}>
              {isSaving ? "Gönderiliyor..." : "Talep Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DestekTalepEkle;
