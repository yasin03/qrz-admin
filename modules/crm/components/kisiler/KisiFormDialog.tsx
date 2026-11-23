"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormCheckbox,
  FormInput,
  FormLabel,
  FormSelect,
  FormSubmitButton,
  FormSwitch,
} from "@/components/forms";
import { useIller } from "@/modules/core/hooks/use-il-ilce-vergi-data";
import {
  useInsertCrmKisi,
  useUpdateCrmKisi,
} from "@/modules/crm/hooks/use-crm";
import {
  KISI_TIP_ETIKET,
  KISI_TURU_SECENEKLERI,
  kisiFormVarsayilan,
  kisiFormdanParams,
} from "@/modules/crm/lib/crm";
import {
  SECILMEDI,
  kisiSchema,
  type KisiForm,
} from "@/modules/crm/schemas/crm.schema";
import type { CrmKisiRow, CrmKisiTip } from "@/modules/crm/types/crm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Yeni kayıtta hangi listeye ekleneceği. Düzenlemede kaydın kendi tipi kullanılır. */
  tip: CrmKisiTip;
  /** Verilirse düzenleme modu. */
  kisi?: CrmKisiRow | null;
};

export function KisiFormDialog({ open, onOpenChange, tip, kisi }: Props) {
  const duzenle = !!kisi;
  const insert = useInsertCrmKisi();
  const update = useUpdateCrmKisi();
  const isPending = insert.isPending || update.isPending;
  const { data: iller = [], isLoading: illerYukleniyor } = useIller();
  const ilOptions = useMemo(
    () => [{ IlKodu: SECILMEDI, IlAdi: "Belirtilmedi" }, ...iller],
    [iller],
  );

  const form = useForm<KisiForm>({
    resolver: zodResolver(kisiSchema),
    defaultValues: kisiFormVarsayilan(),
  });
  const { control } = form;

  useEffect(() => {
    if (open) form.reset(kisiFormVarsayilan(kisi));
  }, [open, kisi, form]);

  const kisiTuru = useWatch({ control, name: "KisiTuru" });
  const tuzel = kisiTuru === "2";
  const etiket = KISI_TIP_ETIKET[kisi?.Tip ?? tip];

  const onSubmit = async (v: KisiForm) => {
    const params = kisiFormdanParams(v);
    try {
      if (kisi) {
        await update.mutateAsync({ ...params, IDCrmKisi: kisi.IDCrmKisi });
        toast.success(`${etiket} güncellendi.`);
      } else {
        await insert.mutateAsync({ ...params, Tip: tip });
        toast.success(`${etiket} eklendi.`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || `${etiket} kaydedilemedi.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {duzenle ? `${etiket} Düzenle` : `Yeni ${etiket}`}
          </DialogTitle>
          <DialogDescription>{etiket} bilgilerini giriniz.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col divide-y">
            {/* Temel bilgiler */}
            <div className="flex flex-col gap-4 pb-4">
              <FormSelect
                control={control}
                name="KisiTuru"
                label="Kişi Türü"
                options={KISI_TURU_SECENEKLERI}
              />
              {tuzel ? (
                <>
                  <FormInput
                    control={control}
                    name="Kurum"
                    label="Kurum"
                    required
                    placeholder="Firma / kurum adı"
                    maxLength={200}
                  />
                  <FormInput
                    control={control}
                    name="VergiNo"
                    label="Vergi No"
                    format="vergino"
                  />
                  <FormLabel label="Yetkili Kişi">
                    <FormInput
                      control={control}
                      name="YetkiliKisi"
                      placeholder="Ad soyad"
                      maxLength={200}
                    />
                    <FormInput
                      control={control}
                      name="YetkiliKisiPozisyonu"
                      placeholder="Pozisyon"
                      maxLength={100}
                    />
                  </FormLabel>
                </>
              ) : (
                <>
                  <FormInput
                    control={control}
                    name="YetkiliKisi"
                    label="Ad Soyad"
                    required
                    placeholder="Ad soyad"
                    maxLength={200}
                  />
                  <FormInput
                    control={control}
                    name="TcKimlikNo"
                    label="TC Kimlik No"
                    format="tcno"
                  />
                  <FormLabel label="Çalıştığı Kurum">
                    <FormInput
                      control={control}
                      name="Kurum"
                      placeholder="Kurum (opsiyonel)"
                      maxLength={200}
                    />
                    <FormInput
                      control={control}
                      name="YetkiliKisiPozisyonu"
                      placeholder="Pozisyon"
                      maxLength={100}
                    />
                  </FormLabel>
                </>
              )}
            </div>

            {/* İletişim */}
            <div className="flex flex-col gap-4 py-4">
              <FormLabel label="Telefon">
                <FormInput
                  control={control}
                  name="CepTelefon"
                  format="tel"
                  placeholder="Cep telefonu"
                />
                <FormInput
                  control={control}
                  name="YetkiliKisiTel"
                  format="tel"
                  placeholder="İş telefonu"
                />
              </FormLabel>
              <FormInput
                control={control}
                name="YetkiliKisiEPostaAdresi"
                label="E-posta"
                type="email"
                placeholder="ornek@firma.com"
                maxLength={200}
              />
              <FormLabel label="Web / Faks">
                <FormInput
                  control={control}
                  name="WebSitesi"
                  placeholder="Web sitesi"
                  maxLength={200}
                />
                <FormInput
                  control={control}
                  name="Fax"
                  format="tel"
                  placeholder="Faks"
                />
              </FormLabel>
              <FormSelect
                control={control}
                name="IlKodu"
                label="Şehir"
                disabled={illerYukleniyor}
                placeholder={illerYukleniyor ? "Yükleniyor..." : "Şehir seçin"}
                options={ilOptions}
                valueKey="IlKodu"
                labelKey="IlAdi"
              />
              <FormInput
                control={control}
                name="Adres"
                label="Adres"
                type="textarea"
                rows={2}
                placeholder="Adres"
                maxLength={300}
              />
            </div>

            {/* Sosyal medya */}
            <div className="flex flex-col gap-4 py-4">
              <FormLabel label="LinkedIn / Facebook">
                <FormInput
                  control={control}
                  name="Linkedin"
                  placeholder="LinkedIn"
                  maxLength={200}
                />
                <FormInput
                  control={control}
                  name="Facebook"
                  placeholder="Facebook"
                  maxLength={200}
                />
              </FormLabel>
              <FormLabel label="X / Instagram">
                <FormInput
                  control={control}
                  name="Twitter"
                  placeholder="X (Twitter)"
                  maxLength={200}
                />
                <FormInput
                  control={control}
                  name="Instagram"
                  placeholder="Instagram"
                  maxLength={200}
                />
              </FormLabel>
            </div>

            {/* İletişim izinleri */}
            <div className="flex flex-col gap-3 py-4">
              <p className="text-sm font-medium">İletişim İzinleri</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <FormCheckbox
                  control={control}
                  name="EmailKabul"
                  label="E-posta"
                />
                <FormCheckbox control={control} name="SmsKabul" label="SMS" />
                <FormCheckbox
                  control={control}
                  name="AramaKabul"
                  label="Telefon araması"
                />
                <FormCheckbox
                  control={control}
                  name="WhatsappKabul"
                  label="WhatsApp"
                />
              </div>
            </div>

            {/* Diğer */}
            <div className="flex flex-col gap-4 pt-4">
              <FormInput
                control={control}
                name="Kaynak"
                label="Kaynak"
                placeholder="Örn. Referans, fuar, web sitesi"
                maxLength={100}
              />
              <FormInput
                control={control}
                name="Notlar"
                label="Notlar"
                type="textarea"
                rows={3}
                placeholder="Not"
                maxLength={500}
              />
              <FormSwitch control={control} name="Durum" label="Aktif" />
            </div>
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
      </DialogContent>
    </Dialog>
  );
}
