"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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
import { FormInput, FormSelect } from "@/components/forms";
import type {
  PersonelSgkIslemPayload,
  PersonelSgkIslemType,
} from "@/hooks/use-personel";

type SgkPersonel = {
  IDSubePersonel: string;
  AdSoyad: string;
  TcKimlikNo: string;
  IseSonGirisTarihi: string;
  PersonelMeslekKodu: string;
  PersonelSgkBelgeTuru: string;
  PersonelKanunNo: string;
  IstihdamDurumu: string;
  SgkDurumu: string;
};

type SgkDialogFormValues = {
  GirisTarihi: string;
  CikisTarihi: string;
  PersonelAyrilisKodu: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personel: SgkPersonel | null;
  isActive: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: PersonelSgkIslemPayload) => Promise<void>;
};

const CIKIS_NEDENLERI = [
  {
    value: "03",
    label: "03 - Belirsiz süreli iş sözleşmesinin işçi tarafından feshi",
  },
  { value: "22", label: "22 - Diğer nedenler" },
];

function normalizeDate(value: string | undefined | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function PersonelSgkDialog({
  open,
  onOpenChange,
  personel,
  isActive,
  isSubmitting = false,
  onSubmit,
}: Props) {
  const defaultGirisTarihi = normalizeDate(personel?.IseSonGirisTarihi);

  const form = useForm<SgkDialogFormValues>({
    defaultValues: {
      GirisTarihi: "",
      CikisTarihi: "",
      PersonelAyrilisKodu: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      GirisTarihi: defaultGirisTarihi,
      CikisTarihi: "",
      PersonelAyrilisKodu: "",
    });
  }, [open, defaultGirisTarihi, form]);

  const modeLabel = isActive ? "Çıkış" : "Giriş";

  const infoFields = useMemo(
    () => [
      { label: "Adı Soyadı", value: personel?.AdSoyad || "-" },
      { label: "TC Kimlik No", value: personel?.TcKimlikNo || "-" },
      {
        label: "Giriş Tarihi",
        value: normalizeDate(personel?.IseSonGirisTarihi) || "-",
      },
      { label: "Meslek Kodu", value: personel?.PersonelMeslekKodu || "-" },
      { label: "Belge Türü", value: personel?.PersonelSgkBelgeTuru || "-" },
      { label: "Kanun No", value: personel?.PersonelKanunNo || "-" },
      { label: "İstihdam Durumu", value: personel?.IstihdamDurumu || "-" },
      { label: "SGK Durumu", value: personel?.SgkDurumu || "-" },
    ],
    [personel],
  );

  const runSubmit = async (type: PersonelSgkIslemType) => {
    if (!personel) return;

    const values = form.getValues();

    if (!values.GirisTarihi) {
      toast.error("Giriş tarihi zorunludur.");
      return;
    }

    if (isActive) {
      if (!values.PersonelAyrilisKodu) {
        toast.error("Çıkış nedeni zorunludur.");
        return;
      }
      if (!values.CikisTarihi) {
        toast.error("Çıkış tarihi zorunludur.");
        return;
      }
    }

    await onSubmit({
      type,
      IDSubePersonel: personel.IDSubePersonel,
      GirisTarihi: values.GirisTarihi,
      CikisTarihi: values.CikisTarihi,
      PersonelAyrilisKodu: values.PersonelAyrilisKodu,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personel SGK {modeLabel} İşlemi</DialogTitle>
          <DialogDescription>
            {isActive
              ? "Çıkış nedeni ve çıkış tarihi zorunludur."
              : "Giriş tarihi zorunludur."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
          {infoFields.map((field) => (
            <div key={field.label}>
              <p className="text-xs text-muted-foreground">{field.label}</p>
              <p className="font-medium text-foreground">{field.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            control={form.control}
            name="GirisTarihi"
            label="Giriş Tarihi"
            type="date"
          />

          {isActive && (
            <>
              <FormSelect
                control={form.control}
                name="PersonelAyrilisKodu"
                label="Çıkış Nedeni Seçiniz"
                options={CIKIS_NEDENLERI}
                valueKey="value"
                labelKey="label"
              />
              <FormInput
                control={form.control}
                name="CikisTarihi"
                label="Çıkış Tarihi"
                type="date"
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            color="secondary"
            appearance="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>

          {isActive ? (
            <>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => runSubmit("SGK_CIKIS")}
              >
                SGK Çıkış Onayla
              </Button>
              <Button
                type="button"
                color="secondary"
                disabled={isSubmitting}
                onClick={() => runSubmit("MANUEL_CIKIS")}
              >
                Manuel Çıkış Onayla
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => runSubmit("SGK_GIRIS")}
              >
                SGK Giriş Onayla
              </Button>
              <Button
                type="button"
                color="secondary"
                disabled={isSubmitting}
                onClick={() => runSubmit("MANUEL_GIRIS")}
              >
                Manuel Giriş Onayla
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
