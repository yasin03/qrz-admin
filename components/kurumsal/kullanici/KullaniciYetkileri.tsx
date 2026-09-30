import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, ShieldUser, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { FormInput, FormSelect } from "@/components/forms";
import {
  useCreateKullaniciYetki,
  useDeleteKullaniciYetki,
  useKullaniciYetkiList,
} from "@/hooks/use-kullanici";
import {
  useKurumsalData,
  useSirketler,
  useSubeler,
} from "@/hooks/use-kurumsal-data";
import {
  SelectKullaniciResponseType,
  SelectKullaniciYetkiResponseType,
} from "@/types/kullanici";
import { Card, CardHeader } from "@/components/ui/card";

// Kullanıcı düzenleme modalının alt bölümü olarak kullanılıyor
// (KullaniciEkle). Kendi <form>'u olduğu için üstteki formun DIŞINDA
// render edilmeli — form içinde form olamaz.
type Props = {
  /** Modal açık mı — kapalıyken sorgu atılmaz ve form sıfırlanır. */
  open: boolean;
  kullanici: SelectKullaniciResponseType | null;
};

type Option = { value: string; label: string };

// "Tümü" seçimi API'ye "0" olarak gidiyor.
const TUMU = "0";
const TUMU_LABEL = "TÜMÜ";

type EkleForm = { IDGurup: string; IDSirket: string; IDSube: string };

const EKLE_DEFAULTS: EkleForm = {
  IDGurup: TUMU,
  IDSirket: TUMU,
  IDSube: TUMU,
};

type ListeForm = {
  yetkiler: Array<{ GurupAdi: string; SirketAdi: string; SubeAdi: string }>;
};

const toOptions = <T extends object>(
  items: T[],
  valueKey: keyof T,
  labelKey: keyof T,
): Option[] => [
  { value: TUMU, label: "Tümü" },
  ...items.map((item) => ({
    value: String(item[valueKey]),
    label: String(item[labelKey]),
  })),
];

const labelOf = (options: Option[], value: string) =>
  value === TUMU
    ? TUMU_LABEL
    : (options.find((o) => o.value === value)?.label ?? TUMU_LABEL);

const idOf = (value: unknown) =>
  value === null || value === undefined || value === "" ? TUMU : String(value);

const KullaniciYetkileri = ({ open, kullanici }: Props) => {
  const [silinecek, setSilinecek] =
    useState<SelectKullaniciYetkiResponseType | null>(null);

  const { data: yetkiListesi = [], isLoading } = useKullaniciYetkiList(
    kullanici?.IDKullanici,
    open,
  );
  const createYetki = useCreateKullaniciYetki();
  const deleteYetki = useDeleteKullaniciYetki();

  // ---- Yeni yetki formu (Grup → Şirket → Şube) ----
  const form = useForm<EkleForm>({ defaultValues: EKLE_DEFAULTS });
  const idGurup = form.watch("IDGurup");
  const idSirket = form.watch("IDSirket");
  const idSube = form.watch("IDSube");

  const { gruplar, isLoadingGruplar } = useKurumsalData();
  const { data: sirketler = [], isLoading: isLoadingSirketler } = useSirketler(
    Number(idGurup),
  );
  const { data: subeler = [], isLoading: isLoadingSubeler } = useSubeler(
    Number(idSirket),
  );

  const grupOptions = useMemo(
    () => toOptions(gruplar, "IDGurup", "GurupAdi"),
    [gruplar],
  );
  const sirketOptions = useMemo(
    () => toOptions(sirketler, "IDSirket", "SirketAdi"),
    [sirketler],
  );
  const subeOptions = useMemo(
    () => toOptions(subeler, "IDSube", "SubeAdi"),
    [subeler],
  );

  // Üst seviye değişince alt seviyeler "Tümü"ye dönsün.
  useEffect(() => {
    const subscription = form.watch((_values, { name }) => {
      if (name === "IDGurup") {
        form.setValue("IDSirket", TUMU);
        form.setValue("IDSube", TUMU);
      } else if (name === "IDSirket") {
        form.setValue("IDSube", TUMU);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (!open) form.reset(EKLE_DEFAULTS);
  }, [open, form]);

  // ---- Mevcut yetkiler (salt okunur) ----
  const listeForm = useForm<ListeForm>({
    values: {
      yetkiler: yetkiListesi.map((y) => ({
        GurupAdi: y.GurupAdi || TUMU_LABEL,
        SirketAdi: y.SirketAdi || TUMU_LABEL,
        SubeAdi: y.SubeAdi || TUMU_LABEL,
      })),
    },
  });

  const isDuplicate = yetkiListesi.some(
    (y) =>
      idOf(y.IDGurup) === idGurup &&
      idOf(y.IDSirket) === idSirket &&
      idOf(y.IDSube) === idSube,
  );

  const handleEkle = async (values: EkleForm) => {
    if (!kullanici) return;
    if (isDuplicate) {
      toast.error("Bu yetki alanı zaten tanımlı.");
      return;
    }

    try {
      await createYetki.mutateAsync({
        IDKullanici: kullanici.IDKullanici,
        IDGurup: values.IDGurup,
        IDSirket: values.IDSirket,
        IDSube: values.IDSube,
        IDBolum: TUMU,
        GurupAdi: labelOf(grupOptions, values.IDGurup),
        SirketAdi: labelOf(sirketOptions, values.IDSirket),
        SubeAdi: labelOf(subeOptions, values.IDSube),
        BolumAdi: TUMU_LABEL,
      });
      toast.success("Yetki alanı eklendi.");
      form.reset(EKLE_DEFAULTS);
    } catch {
      toast.error("Yetki alanı eklenemedi.");
    }
  };

  const handleSilConfirm = () => {
    if (!silinecek || !kullanici) return;

    deleteYetki.mutate(
      {
        IDKullaniciAlan: silinecek.IDKullaniciAlan,
        IDKullanici: kullanici.IDKullanici,
      },
      {
        onSuccess: () => {
          toast.success("Yetki alanı silindi.");
          setSilinecek(null);
        },
        onError: () => toast.error("Yetki alanı silinemedi."),
      },
    );
  };

  return (
    <Card className="shadow-lg my-4 p-0">
      <CardHeader className="bg-gray-100 dark:bg-gray-700 p-2 px-4">
        <ShieldUser />
        <h3 className="text-sm font-semibold text-foreground">
          Kullanıcı Yetki Alanları
        </h3>
        <p className="text-xs text-muted-foreground">
          Kullanıcının erişebileceği grup, şirket ve şubeleri seçerek yetkilerini tanımlayabilirsiniz.
        </p>
      </CardHeader>
      <div className="p-4">
        {/* Yeni yetki alanı */}
        <form
          onSubmit={form.handleSubmit(handleEkle)}
          className="space-y-3 rounded-lg border border-border p-3 mb-4"
        >
          <p className="text-sm font-semibold text-foreground">
            Yeni Yetki Alanı
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <FormSelect
              control={form.control}
              name="IDGurup"
              label="Grup"
              options={grupOptions}
              disabled={isLoadingGruplar || createYetki.isPending}
              vertical={false}
            />
            <FormSelect
              control={form.control}
              name="IDSirket"
              label="Şirket"
              options={sirketOptions}
              disabled={
                idGurup === TUMU || isLoadingSirketler || createYetki.isPending
              }
              vertical={false}
            />
            <FormSelect
              control={form.control}
              name="IDSube"
              label="Şube"
              options={subeOptions}
              disabled={
                idSirket === TUMU || isLoadingSubeler || createYetki.isPending
              }
              vertical={false}
            />
            <Button
              type="submit"
              disabled={!kullanici || isDuplicate || createYetki.isPending}
            >
              <Plus className="size-4" />
              {createYetki.isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
          {isDuplicate && (
            <p className="text-xs text-muted-foreground">
              Bu yetki alanı zaten tanımlı.
            </p>
          )}
        </form>

        {/* Mevcut yetkiler */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {isLoading
              ? "Yükleniyor..."
              : `Mevcut Yetkiler (${yetkiListesi.length})`}
          </p>

          {!isLoading && yetkiListesi.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Bu kullanıcıya tanımlı yetki alanı yok.
            </div>
          )}

          {yetkiListesi.length > 0 && (
            <>
              <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid">
                <span>Grup</span>
                <span>Şirket</span>
                <span>Şube</span>
                <span className="w-9" />
              </div>
              {yetkiListesi.map((yetki, index) => (
                <div
                  key={yetki.IDKullaniciAlan}
                  className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:gap-3 sm:border-0 sm:p-0"
                >
                  <div className="contents max-sm:col-span-1 max-sm:flex max-sm:flex-col max-sm:gap-2">
                    <FormInput
                      control={listeForm.control}
                      name={`yetkiler.${index}.GurupAdi`}
                      readOnly
                    />
                    <FormInput
                      control={listeForm.control}
                      name={`yetkiler.${index}.SirketAdi`}
                      readOnly
                    />
                    <FormInput
                      control={listeForm.control}
                      name={`yetkiler.${index}.SubeAdi`}
                      readOnly
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="danger"
                    appearance="outline"
                    aria-label="Yetki alanını sil"
                    onClick={() => setSilinecek(yetki)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!silinecek}
        onOpenChange={(o) => !o && setSilinecek(null)}
        title="Yetki alanını sil"
        description={
          silinecek
            ? `"${[silinecek.GurupAdi, silinecek.SirketAdi, silinecek.SubeAdi].join(" / ")}" yetki alanı silinecek. Onaylıyor musunuz?`
            : ""
        }
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteYetki.isPending}
        onConfirm={handleSilConfirm}
      />
    </Card>
  );
};

export default KullaniciYetkileri;
