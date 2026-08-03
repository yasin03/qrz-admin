// app/(dashboard)/kurumsal/subeler/[idSube]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/forms";

import { useSubeDetay, useUpdateSube } from "@/hooks/use-kurumsal-data";
import { subeSchema, SubeForm } from "@/schemas/kurumsal/sube.schema";
import { SubeFormFields } from "@/components/kurumsal/sube/SubeFormFields";

// Bkz. SubeEkle.tsx — formda gösterilmeyen proc alanları için aynı varsayılanlar.
const ADVANCED_DEFAULTS = {
  SgkMudurlugu: "",
  IskurSifresi: "",
  BesBaslangicTarihi: "",
  BesKesintiOrani: 0,
  SifreKullaniciAdi: "",
  SifreKullaniciKodu: "",
  SifreSistem: "",
  SifreIsyeri: "",
  IsyeriTehlikeSinifi: "",
  TehlikeDerecesi: "",
  NaceKodu: "",
  NaceKoduAciklama: "",
  KodSektor: "",
  KodIsKolu: "",
  KodYSube: "",
  KodESube: "",
  KodSiraNo: "",
  KodIl: "",
  KodIlce: "",
  KodKontrolNo: "",
  KodAraci: "",
  IskurBaslangicTarihi: "",
  IskurBitisTarihi: "",
  Statu: "",
  TesvikVermeDurumu: 0,
  StopajDurum: 0,
  stIsyeriAdi: "",
  stAd: "",
  stSoyad: "",
  stVergiNo: "",
  stTcKimlikNo: "",
  stUcretTipi: "",
  stUcret: 0,
  stAdresKodu: "",
  Cizelge15: "",
  MuhasebeBirimKodu: "",
  MuhasebeBirimAdi: "",
  KurumKodu: "",
  KurumAdi: "",
  SinifKodu: "",
  DuzenleyenAdSoyad: "",
  DuzenleyenUnvan: "",
  GerceklestirenAdSoyad: "",
  GerceklestirenUnvan: "",
  IsyeriSubeKodu: "",
  IsyeriTuru: "",
  BankaKurumKodu: "",
  BankaSubeKodu: "",
  BankaHesapNo: "",
  BankaIbanNo: "",
  IDBanka: "",
};

const DEFAULT_VALUES: SubeForm = {
  SubeAdi: "",
  SubeKodu: "",
  YetkiliKisi: "",
  TcKimlikNo: "",
  Tel: "",
  CepTel: "",
  Fax: "",
  EpostaAdresi: "",
  WebAdresi: "",
  SirketAdresi: "",
  Ulke: "Türkiye",
  IlKodu: "",
  IlceKodu: "",
  VergiDairesi: "",
  VergiNo: "",
  IsyeriSgkSicilNumarasi: "",
  IsyeriSgkIsKoluKodu: "",
  TicaretSicilNumarasi: "",
  IskurSubesi: "",
  IskurNumarasi: "",
  IsyeriAcilisTarihi: "",
  IsyeriKapanisTarihi: "",
  Durum: true,
  MulkiyetTuru: "",
  TicaretSicilMudurluk: "",
  IsyeriFaaliyetKodu: "",
  AdresKodu: "",
};

export default function SubeDetayPage() {
  const params = useParams<{ idSube: string }>();
  const router = useRouter();
  const idSube = Number(params.idSube);

  const { data: sube, isLoading, isError } = useSubeDetay(idSube);
  const { mutateAsync: updateSube, isPending } = useUpdateSube();

  const form = useForm<SubeForm>({
    resolver: zodResolver(subeSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!sube) return;

    form.reset({
      SubeAdi: sube.SubeAdi,
      SubeKodu: sube.SubeKodu ?? "",
      YetkiliKisi: sube.YetkiliKisi ?? "",
      TcKimlikNo: sube.TcKimlikNo ?? "",
      Tel: sube.Tel ?? "",
      CepTel: sube.CepTel ?? "",
      Fax: sube.Fax ?? "",
      EpostaAdresi: sube.EpostaAdresi ?? "",
      WebAdresi: sube.WebAdresi ?? "",
      SirketAdresi: sube.SirketAdresi ?? "",
      Ulke : sube.Ulke ?? "Türkiye",
      IlKodu: sube.IlKodu ?? "",
      IlceKodu: sube.IlceKodu ?? "",
      VergiDairesi: sube.VergiDairesi ?? "",
      VergiNo: sube.VergiNo ?? "",
      IsyeriSgkSicilNumarasi: sube.IsyeriSgkSicilNumarasi ?? "",
      IsyeriSgkIsKoluKodu: sube.IsyeriSgkIsKoluKodu ?? "",
      TicaretSicilNumarasi: sube.TicaretSicilNumarasi ?? "",
      IskurSubesi: sube.IskurSubesi ?? "",
      IskurNumarasi: sube.IskurNumarasi ?? "",
      IsyeriAcilisTarihi: sube.IsyeriAcilisTarihi?.slice(0, 10) ?? "",
      IsyeriKapanisTarihi: sube.IsyeriKapanisTarihi?.slice(0, 10) ?? "",
      Durum: sube.Durum === 1,
      MulkiyetTuru: sube.MulkiyetTuru ?? "",
      TicaretSicilMudurluk: sube.TicaretSicilMudurluk ?? "",
      IsyeriFaaliyetKodu: sube.IsyeriFaaliyetKodu ?? "",
      AdresKodu: sube.AdresKodu ?? "",
    });
  }, [sube, form]);

  const onSubmit = async (values: SubeForm) => {
    if (!sube) return;

    try {
      await updateSube({
        IDSube: sube.IDSube,
        IDSirket: sube.IDSirket,
        ...ADVANCED_DEFAULTS,
        ...values,
        Durum: values.Durum ? 1 : 0,
      });
      toast.success("Şube başarıyla güncellendi.");
    } catch (error: any) {
      toast.error(error?.message || "Şube güncellenemedi.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (isError || !sube) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          color="secondary"
          appearance="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Geri
        </Button>
        <p className="text-sm text-destructive">Şube bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          color="secondary"
          appearance="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Geri dön"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {sube.SubeAdi}
          </h1>
          <p className="text-sm text-muted-foreground">
            Şube bilgilerini görüntüle ve düzenle
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border border-border bg-card p-5"
      >
        <SubeFormFields control={form.control} setValue={form.setValue}/>

        <div className="flex justify-end border-t border-border pt-4">
          <FormSubmitButton loading={isPending}>
            <Save className="size-4" />
            Kaydet
          </FormSubmitButton>
        </div>
      </form>
    </div>
  );
}
