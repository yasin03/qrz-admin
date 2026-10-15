"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormInput } from "@/components/forms";
import { YASAL } from "@/constants/yasal";

const hesapSilmeSchema = z.object({
  adSoyad: z.string().trim().min(3, "Ad soyad zorunlu"),
  kullaniciAdi: z.string().trim().min(1, "Kullanıcı adı veya telefon zorunlu"),
  sirket: z.string().trim().min(2, "Çalıştığınız şirket zorunlu"),
  eposta: z.email("Geçerli bir e-posta adresi girin"),
  telefon: z
    .string()
    .refine((v) => v === "" || v.length === 10, "Telefon 10 haneli olmalı"),
  aciklama: z.string().max(1000, "En fazla 1000 karakter").optional(),
  onay: z.boolean().refine((v) => v, "Devam etmek için onay vermelisiniz"),
});

type HesapSilmeFormValues = z.infer<typeof hesapSilmeSchema>;

// Sunucu tarafı yok: talep, kullanıcının e-posta uygulamasında dolu bir taslak olarak kvkk adresine açılır
function mailtoAdresi(v: HesapSilmeFormValues) {
  const konu = `Hesap Silme Talebi - ${v.adSoyad}`;
  const govde = [
    "Merhaba,",
    "",
    "QR Zaman mobil uygulama hesabımın ve ilişkili kişisel verilerimin silinmesini talep ediyorum.",
    "",
    `Ad Soyad: ${v.adSoyad}`,
    `Kullanıcı Adı / Telefon: ${v.kullaniciAdi}`,
    `Şirket: ${v.sirket}`,
    `E-posta: ${v.eposta}`,
    `Telefon: ${v.telefon || "-"}`,
    `Açıklama: ${v.aciklama?.trim() || "-"}`,
    "",
    "Bilgilerimin doğru olduğunu ve yasal saklama yükümlülüğü olan verilerin süre sonuna kadar saklanacağını okudum, anladım.",
  ].join("\n");

  return `mailto:${YASAL.KVKK_EPOSTA}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`;
}

export function HesapSilmeFormu() {
  const [gonderildi, setGonderildi] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<HesapSilmeFormValues>({
    resolver: zodResolver(hesapSilmeSchema),
    defaultValues: {
      adSoyad: "",
      kullaniciAdi: "",
      sirket: "",
      eposta: "",
      telefon: "",
      aciklama: "",
      onay: false,
    },
  });

  const onSubmit = (values: HesapSilmeFormValues) => {
    window.location.assign(mailtoAdresi(values));
    setGonderildi(true);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border p-4 sm:p-6"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            control={control}
            name="adSoyad"
            label="Ad Soyad"
            autoComplete="name"
            vertical={false}
            required
          />
          <FormInput
            control={control}
            name="kullaniciAdi"
            label="Kullanıcı Adı veya Telefon"
            autoComplete="username"
            vertical={false}
            required
          />
          <FormInput
            control={control}
            name="sirket"
            label="Çalıştığınız Şirket"
            autoComplete="organization"
            vertical={false}
            required
          />
          <FormInput
            control={control}
            name="telefon"
            label="Telefon"
            format="tel"
            placeholder="5xx xxx xx xx"
            autoComplete="tel-national"
            vertical={false}
          />
          <FormInput
            control={control}
            name="eposta"
            label="E-posta"
            type="email"
            autoComplete="email"
            description="Talebinizin sonucu bu adrese bildirilecek."
            vertical={false}
            required
          />
        </div>

        <FormInput
          control={control}
          name="aciklama"
          label="Açıklama"
          type="textarea"
          rows={4}
          placeholder="Eklemek istediğiniz bir not varsa yazabilirsiniz."
          vertical={false}
        />

        <Controller
          control={control}
          name="onay"
          render={({ field, fieldState }) => (
            <div className="space-y-1">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  aria-invalid={!!fieldState.error}
                  className="mt-0.5"
                />
                <span className="text-foreground/90">
                  Bilgilerimin doğru olduğunu ve yasal saklama yükümlülüğü olan
                  verilerin süre sonuna kadar saklanacağını okudum, anladım.
                </span>
              </label>
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Button
          type="submit"
          size="lg"
          color="primary"
          appearance="solid"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          E-posta ile Gönder
        </Button>
      </form>

      <AlertDialog open={gonderildi} onOpenChange={setGonderildi}>
        <AlertDialogContent className="data-[size=default]:sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-info/10 text-info">
              <Mail />
            </AlertDialogMedia>
            <AlertDialogTitle>Son bir adım kaldı</AlertDialogTitle>
          <AlertDialogDescription>
            Bilgileriniz dolu bir e-posta taslağı olarak e-posta uygulamanızda
            açıldı. Talebinizin işleme alınması için e-postayı göndermeyi
            unutmayın. Talebiniz en geç 30 gün içinde sonuçlandırılır.
          </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Header grid'inin dışında: içine konunca medya/başlık hizası bozuluyor */}
          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            E-posta uygulamanız açılmadıysa bilgilerinizi doğrudan{" "}
            <a
              href={`mailto:${YASAL.KVKK_EPOSTA}`}
              className="font-medium text-info hover:underline"
            >
              {YASAL.KVKK_EPOSTA}
            </a>{" "}
            adresine gönderebilirsiniz.
          </p>

          <AlertDialogFooter>
            <AlertDialogAction>Tamam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
