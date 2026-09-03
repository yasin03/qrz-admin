import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { FormInput, FormSelect, FormSwitch } from "../forms";
import { useCreateLokasyon, useUpdateLokasyon } from "@/hooks/use-lokasyon";
import { LokasyonType } from "@/types/lokasyon";

function normalizeCoordinate(value: string): string {
  return value.trim().replace(",", ".");
}

function parseCoordinate(value: string): number | null {
  const normalized = normalizeCoordinate(value);
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;

  return numeric;
}

const lokasyonSchema = z.object({
  IDBolum: z.string().min(1, "Bölüm seçiniz"),
  LokasyonAdi: z.string().trim().min(1, "Lokasyon adı zorunludur"),
  Enlem: z
    .string()
    .trim()
    .min(1, "Enlem zorunludur")
    .refine((value) => parseCoordinate(value) !== null, {
      message: "Enlem sayısal olmalı (örn: 37.785834)",
    })
    .refine((value) => {
      const numeric = parseCoordinate(value);
      return numeric !== null && numeric >= -90 && numeric <= 90;
    }, "Enlem -90 ile 90 arasında olmalıdır"),
  Boylam: z
    .string()
    .trim()
    .min(1, "Boylam zorunludur")
    .refine((value) => parseCoordinate(value) !== null, {
      message: "Boylam sayısal olmalı (örn: -122.406417)",
    })
    .refine((value) => {
      const numeric = parseCoordinate(value);
      return numeric !== null && numeric >= -180 && numeric <= 180;
    }, "Boylam -180 ile 180 arasında olmalıdır"),
  Aktif: z.boolean(),
});

type LokasyonForm = z.infer<typeof lokasyonSchema>;

const DEFAULT_VALUES: LokasyonForm = {
  IDBolum: "",
  LokasyonAdi: "",
  Enlem: "",
  Boylam: "",
  Aktif: true,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse düzenleme modu. */
  id?: string | number | null;
  lokasyon?: LokasyonType | null;
  bolumOptions: Array<{ value: string; label: string }>;
  defaultIDBolum?: string | number;
  onSuccess?: () => void;
};

const LokasyonEkle = ({
  open,
  onOpenChange,
  id,
  lokasyon,
  bolumOptions,
  defaultIDBolum,
  onSuccess,
}: Props) => {
  const isEditMode = Boolean(id);
  const { mutateAsync: createLokasyon, isPending: isCreating } =
    useCreateLokasyon();
  const { mutateAsync: updateLokasyon, isPending: isUpdating } =
    useUpdateLokasyon();

  const isSaving = isEditMode ? isUpdating : isCreating;

  const firstBolumValue = useMemo(
    () => bolumOptions[0]?.value ?? "",
    [bolumOptions],
  );

  const form = useForm<LokasyonForm>({
    resolver: zodResolver(lokasyonSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (isEditMode && lokasyon) {
      form.reset({
        IDBolum: String(lokasyon.IDBolum ?? ""),
        LokasyonAdi: lokasyon.LokasyonAdi ?? "",
        Enlem: String(lokasyon.Enlem ?? ""),
        Boylam: String(lokasyon.Boylam ?? ""),
        Aktif: Boolean(lokasyon.Aktif),
      });
      return;
    }

    form.reset({
      ...DEFAULT_VALUES,
      IDBolum: String(defaultIDBolum ?? firstBolumValue ?? ""),
    });
  }, [open, isEditMode, lokasyon, form, defaultIDBolum, firstBolumValue]);

  const handleSubmit = async (values: LokasyonForm) => {
    try {
      const payload = {
        IDBolum: values.IDBolum,
        LokasyonAdi: values.LokasyonAdi.trim(),
        Enlem: String(parseCoordinate(values.Enlem)),
        Boylam: String(parseCoordinate(values.Boylam)),
        Aktif: values.Aktif ? 1 : 0,
      } as const;

      if (isEditMode && id) {
        await updateLokasyon({
          IDBolumLokasyon: String(id),
          ...payload,
        });
        toast.success("Lokasyon başarıyla güncellendi.");
      } else {
        await createLokasyon(payload);
        toast.success("Lokasyon başarıyla oluşturuldu.");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isEditMode ? "Lokasyon güncellenemedi." : "Lokasyon oluşturulamadı."),
      );
    }
  };

  const isBolumDisabled = isSaving || bolumOptions.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Lokasyonu Düzenle" : "Yeni Lokasyon Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Lokasyon bilgilerini güncelleyip kaydedin."
              : "Yeni lokasyon bilgilerini girin ve kaydedin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2 py-1">
            <FormSelect
              control={form.control}
              name="IDBolum"
              label="Bölüm"
              options={bolumOptions}
              valueKey="value"
              labelKey="label"
              placeholder="Bölüm seçiniz"
              disabled={isBolumDisabled}
            />

            <FormInput
              control={form.control}
              name="LokasyonAdi"
              label="Lokasyon Adı"
            />

            <FormInput
              control={form.control}
              name="Enlem"
              label="Enlem"
              placeholder="Örn: 37.785834"
              format="decimal"
            />

            <FormInput
              control={form.control}
              name="Boylam"
              label="Boylam"
              placeholder="Örn: -122.406417"
              format="decimal"
            />

            <FormSwitch control={form.control} name="Aktif" label="Durum" />
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LokasyonEkle;
