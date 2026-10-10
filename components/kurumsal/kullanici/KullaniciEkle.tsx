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
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { FormInput, FormSwitch } from "../../forms";
import { useCreateKullanici, useUpdateKullanici } from "@/hooks/use-kullanici";
import { SelectKullaniciResponseType } from "@/types/kullanici";
import KullaniciYetkileri from "./KullaniciYetkileri";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { UserShield } from "lucide-react";

const FORM_ID = "kullanici-form";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

// FormInput'un "tel" formatıyla aynı gruplama: "555 444 22 33"
const formatTel = (value: string | null | undefined) => {
  let digits = onlyDigits(value ?? "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  return [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ]
    .filter(Boolean)
    .join(" ");
};

const createSchema = (isEditMode: boolean) =>
  z
    .object({
      KullaniciAdi: z.string().trim().min(1, "Kullanıcı adı zorunludur"),
      Ad: z.string().trim().min(1, "Ad zorunludur"),
      Sifre: z.string(),
      SifreTekrar: z.string(),
      Tel: z
        .string()
        .refine(
          (value) => value === "" || onlyDigits(value).length === 10,
          "Telefon 10 haneli olmalıdır",
        ),
      Email: z
        .string()
        .trim()
        .refine(
          (value) => value === "" || z.email().safeParse(value).success,
          "Geçerli bir e-posta giriniz",
        ),
      Durum: z.boolean(),
      YetkiKullanici: z.boolean(),
      YetkiGrup: z.boolean(),
      YetkiSirket: z.boolean(),
      YetkiSube: z.boolean(),
    })
    .superRefine((values, ctx) => {
      // Düzenlemede şifre boş bırakılabilir; yeni kullanıcıda zorunlu.
      if (!isEditMode && values.Sifre.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["Sifre"],
          message: "Şifre zorunludur",
        });
      }
      if (values.Sifre.length > 0 && values.Sifre.length < 6) {
        ctx.addIssue({
          code: "custom",
          path: ["Sifre"],
          message: "Şifre en az 6 karakter olmalıdır",
        });
      }
      if (values.Sifre !== values.SifreTekrar) {
        ctx.addIssue({
          code: "custom",
          path: ["SifreTekrar"],
          message: "Şifreler eşleşmiyor",
        });
      }
    });

type KullaniciForm = z.infer<ReturnType<typeof createSchema>>;

const DEFAULT_VALUES: KullaniciForm = {
  KullaniciAdi: "",
  Ad: "",
  Sifre: "",
  SifreTekrar: "",
  Tel: "",
  Email: "",
  Durum: true,
  YetkiKullanici: false,
  YetkiGrup: false,
  YetkiSirket: false,
  YetkiSube: false,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse düzenleme modu. */
  kullanici?: SelectKullaniciResponseType | null;
  onSuccess?: () => void;
};

const KullaniciEkle = ({ open, onOpenChange, kullanici, onSuccess }: Props) => {
  const isEditMode = Boolean(kullanici);
  const { mutateAsync: createKullanici, isPending: isCreating } =
    useCreateKullanici();
  const { mutateAsync: updateKullanici, isPending: isUpdating } =
    useUpdateKullanici();

  const isSaving = isEditMode ? isUpdating : isCreating;
  const schema = useMemo(() => createSchema(isEditMode), [isEditMode]);

  const form = useForm<KullaniciForm>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (kullanici) {
      form.reset({
        ...DEFAULT_VALUES,
        KullaniciAdi: kullanici.KullaniciAdi ?? "",
        Ad: kullanici.Ad ?? "",
        Tel: formatTel(kullanici.Tel),
        Email: kullanici.Email ?? "",
        Durum: Boolean(kullanici.Durum),
        YetkiKullanici: Boolean(kullanici.YetkiKullanici),
        YetkiGrup: Boolean(kullanici.YetkiGrup),
        YetkiSirket: Boolean(kullanici.YetkiSirket),
        YetkiSube: Boolean(kullanici.YetkiSube),
      });
      return;
    }

    form.reset(DEFAULT_VALUES);
  }, [open, kullanici, form]);

  const handleSubmit = async (values: KullaniciForm) => {
    const ortak = {
      Ad: values.Ad.trim(),
      Sifre: values.Sifre,
      Tel: onlyDigits(values.Tel),
      Email: values.Email.trim(),
    };

    try {
      if (isEditMode && kullanici) {
        await updateKullanici({
          IDKullanici: kullanici.IDKullanici,
          ...ortak,
          Durum: values.Durum ? 1 : 0,
          YetkiKullanici: values.YetkiKullanici ? 1 : 0,
          YetkiGrup: values.YetkiGrup ? 1 : 0,
          YetkiSirket: values.YetkiSirket ? 1 : 0,
          YetkiSube: values.YetkiSube ? 1 : 0,
        });
        toast.success("Kullanıcı başarıyla güncellendi.");
      } else {
        await createKullanici({
          KullaniciAdi: values.KullaniciAdi.trim(),
          ...ortak,
        });
        toast.success("Kullanıcı başarıyla oluşturuldu.");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        (error instanceof Error && error.message) ||
          (isEditMode
            ? "Kullanıcı güncellenemedi."
            : "Kullanıcı oluşturulamadı."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          "sm:max-w-2xl md:max-w-4xl",
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? ""
              : "Yeni kullanıcı bilgilerini girin ve kaydedin. Yetki alanları kayıttan sonra düzenlemeden eklenebilir."}
          </DialogDescription>
        </DialogHeader>

        {/* Kullanıcı bilgileri — footer'daki Kaydet bu forma "form" id'si ile bağlı */}
        {/* relative: Radix Select'in gizli (position: absolute) native
            <select>'leri bu scroll alanının içinde kalsın — yoksa dialog'u
            taşırıp footer'ın altında boşluk oluşturuyorlar. */}
        <div className="relative -mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <Card className="shadow-lg p-0 my-3">
            <CardHeader className="bg-gray-100 dark:bg-gray-700 p-2 px-4">
              <UserShield />
              <h3 className="text-sm font-semibold text-foreground">
                Kullanıcı ve Yetkileri
              </h3>
              <p className="text-xs text-muted-foreground">
                Kullanıcı bilgilerini ve yetkilerini yönetin.
              </p>
            </CardHeader>
            <form
              id={FORM_ID}
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4 p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormInput
                  control={form.control}
                  name="KullaniciAdi"
                  label="Kullanıcı Adı"
                  autoComplete="off"
                  vertical={false}
                  disabled={isEditMode || isSaving}
                />

                <FormInput
                  control={form.control}
                  name="Ad"
                  label="Ad Soyad"
                  vertical={false}
                  disabled={isSaving}
                />

                <FormInput
                  control={form.control}
                  name="Tel"
                  label="Telefon"
                  placeholder="555 444 22 33"
                  format="tel"
                  vertical={false}
                  disabled={isSaving}
                />

                <FormInput
                  control={form.control}
                  name="Email"
                  label="E-posta"
                  type="email"
                  placeholder="ornek@firma.com"
                  vertical={false}
                  disabled={isSaving}
                />

                <FormInput
                  control={form.control}
                  name="Sifre"
                  label="Şifre"
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    isEditMode ? "Değiştirmek istemiyorsanız boş bırakın" : ""
                  }
                  vertical={false}
                  disabled={isSaving}
                />

                <FormInput
                  control={form.control}
                  name="SifreTekrar"
                  label="Şifre Tekrar"
                  type="password"
                  autoComplete="new-password"
                  vertical={false}
                  disabled={isSaving}
                />
              </div>

              {isEditMode && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    Durum ve Yetkiler
                  </p>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-5">
                    <FormSwitch
                      control={form.control}
                      name="Durum"
                      label="Aktif"
                      vertical={false}
                      disabled={isSaving}
                    />
                    <FormSwitch
                      control={form.control}
                      name="YetkiKullanici"
                      label="Kullanıcı Yetkisi"
                      vertical={false}
                      disabled={isSaving}
                    />
                    <FormSwitch
                      control={form.control}
                      name="YetkiGrup"
                      label="Grup Yetkisi"
                      vertical={false}
                      disabled={isSaving}
                    />
                    <FormSwitch
                      control={form.control}
                      name="YetkiSirket"
                      label="Şirket Yetkisi"
                      vertical={false}
                      disabled={isSaving}
                    />
                    <FormSwitch
                      control={form.control}
                      name="YetkiSube"
                      label="Şube Yetkisi"
                      vertical={false}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <Button type="submit" form={FORM_ID} disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Yetki alanları kendi <form>'una sahip, bu yüzden üstteki formun dışında */}
          {isEditMode && (
            <KullaniciYetkileri open={open} kullanici={kullanici ?? null} />
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            appearance="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {isEditMode ? "Kapat" : "İptal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KullaniciEkle;
