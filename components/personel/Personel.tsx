"use client";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { RowActions } from "@/components/customs/RowActions";
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Hospital,
  UserCog,
  Smartphone,
  ListChevronsUpDown,
} from "lucide-react";
import PersonelEkle from "./PersonelEkle";
import { Input } from "@/components/ui/input";
import {
  useDeletePersonel,
  usePersonelSgkIslem,
  usePersonelListesi,
  type PersonelSgkIslemPayload,
  type PersonelFilters,
} from "@/hooks/use-personel";
import PersonelFiltre from "./PersonelFiltre";
import { Badge } from "@/components/ui/badge";
import { useCurrentContext } from "@/hooks/use-context";
import { useEffect } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import PersonelSgkDialog from "./PersonelSgkDialog";
import PersonelSettingsDialog, {
  PersonelSettingsPersonel,
} from "./PersonelSettingsDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { ApiClientError } from "@/lib/axios";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import PersonelDetayDialog from "./PersonelDetayDialog";
import PersonelImportDialog from "./PersonelImportDialog";
import { usePersonelGrupList } from "@/hooks/use-personel-grup";
import type { PersonelListItem } from "@/types/personel";
import PersonelDrawer from "./PersonelDrawer";

type Personel = PersonelListItem;

type SgkDialogState = {
  personel: Personel;
  isActive: boolean;
};

const Personel = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PersonelFilters | null>(null);
  const [searchText, setSearchText] = useState("");
  const { data: context } = useCurrentContext();
  const deletePersonel = useDeletePersonel();
  const sgkIslem = usePersonelSgkIslem();
  const [openPersonelEkle, setOpenPersonelEkle] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [secilenPersonel, setSecilenPersonel] = useState<{
    id: string | number;
    tip: "duzenle" | "detay";
  } | null>(null);
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("personel-kolonlar");
  const [sgkDialog, setSgkDialog] = useState<SgkDialogState | null>(null);
  const [settingsPersonel, setSettingsPersonel] =
    useState<PersonelSettingsPersonel | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetlenecekPersonel, setResetlenecekPersonel] =
    useState<Personel | null>(null);
  useEffect(() => {
    if (filters || !context?.IDSube) return;

    setFilters({
      IDSube: context.IDSube,
      IDBolum: "",
      Durum: "",
      DurumTarihi: "",
    });
  }, [context, filters]);

  const {
    data: personelListesi = [],
    isLoading: isLoadingPersonel,
    refetch: refetchPersonelListesi,
  } = usePersonelListesi(filters);

  // Personel listesi grup id'sini döndürüyor; adı tanımlardan eşleştiriyoruz.
  const { data: personelGruplari = [] } = usePersonelGrupList();
  const grupAdlari = useMemo(
    () =>
      new Map(
        personelGruplari.map((grup) => [
          String(grup.IDSirketPersonelGrup),
          grup.Adi,
        ]),
      ),
    [personelGruplari],
  );
  const getGrupAdi = (personel: Personel) =>
    grupAdlari.get(String(personel.IDSirketPersonelGrup ?? "")) ?? "";

  const drawerPersonel = useMemo(
    () =>
      drawerId === null
        ? null
        : ((personelListesi as Personel[]).find(
            (item) => String(item.IDSubePersonel) === drawerId,
          ) ?? null),
    [drawerId, personelListesi],
  );

  // Aktif (Durum = true) personel başta, pasifler sonda; grup içinde API sırası korunur
  const siraliPersonelListesi = useMemo(
    () =>
      [...(personelListesi as Personel[])].sort(
        (a, b) => Number(Boolean(b.Durum)) - Number(Boolean(a.Durum)),
      ),
    [personelListesi],
  );

  const filteredPersonelListesi = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    const selectedUcretTipi = filters?.UcretTipi || "";
    const selectedCinsiyet = filters?.Cinsiyet || "";
    const selectedMedeniDurum = filters?.MedeniDurum || "";
    const selectedCalismaDurumu = filters?.CalismaDurumu || "";
    const selectedGrup = filters?.IDSirketPersonelGrup || "";

    const hasTextFilter = Boolean(query);
    const hasSelectFilter = Boolean(
      selectedUcretTipi ||
      selectedCinsiyet ||
      selectedMedeniDurum ||
      selectedCalismaDurumu ||
      selectedGrup,
    );

    if (!hasTextFilter && !hasSelectFilter) {
      return siraliPersonelListesi;
    }

    return siraliPersonelListesi.filter((personel: Personel) => {
      const sicilNo = String(personel.SicilNo ?? "").toLocaleLowerCase("tr-TR");
      const tcKimlikNo = String(personel.TcKimlikNo ?? "").toLocaleLowerCase(
        "tr-TR",
      );
      const adSoyad = String(personel.AdSoyad ?? "").toLocaleLowerCase("tr-TR");

      const textMatch =
        sicilNo.includes(query) ||
        tcKimlikNo.includes(query) ||
        adSoyad.includes(query);

      const ucretTipiMatch =
        !selectedUcretTipi || personel.UcretTipi === selectedUcretTipi;
      const cinsiyetMatch =
        !selectedCinsiyet || personel.Cinsiyet === selectedCinsiyet;
      const medeniDurumMatch =
        !selectedMedeniDurum || personel.MedeniDurum === selectedMedeniDurum;
      const calismaDurumuMatch =
        !selectedCalismaDurumu ||
        personel.CalismaDurumu === selectedCalismaDurumu;
      const grupMatch =
        !selectedGrup ||
        String(personel.IDSirketPersonelGrup ?? "") === selectedGrup;

      return (
        (!hasTextFilter || textMatch) &&
        ucretTipiMatch &&
        cinsiyetMatch &&
        medeniDurumMatch &&
        calismaDurumuMatch &&
        grupMatch
      );
    });
  }, [siraliPersonelListesi, searchText, filters]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deletePersonel.mutate(
      { IDSubePersonel: silinecekId },
      {
        onSuccess: () => {
          toast.success("Personel silindi");
          refetchPersonelListesi();
          setSearchText("");
          setSilinecekId(null);
          setDrawerId(null);
        },
        onError: () => {
          toast.error("Personel silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const handleSgkAction = (personel: Personel, isActive: boolean) => {
    setSgkDialog({ personel, isActive });
  };

  const handleSgkSubmit = async (payload: PersonelSgkIslemPayload) => {
    await sgkIslem.mutateAsync(payload, {
      onSuccess: () => {
        const isCikis =
          payload.type === "SGK_CIKIS" || payload.type === "MANUEL_CIKIS";
        const isManuel =
          payload.type === "MANUEL_GIRIS" || payload.type === "MANUEL_CIKIS";

        toast.success(
          isCikis
            ? isManuel
              ? "Manuel çıkış işlemi tamamlandı"
              : "SGK çıkış işlemi tamamlandı"
            : isManuel
              ? "Manuel giriş işlemi tamamlandı"
              : "SGK giriş işlemi tamamlandı",
        );
        setSgkDialog(null);
        refetchPersonelListesi();
      },
      onError: (error) => {
        toast.error(error?.message || "SGK işlemi başarısız oldu.");
      },
    });
  };

  const resetAktivasyonMutation = useMutation({
    mutationFn: async (personel: Personel) => {
      const response = await api.post("/api/personel", {
        type: "RESET_PHONE_AKTIVASYON",
        IDSubePersonel: personel.IDSubePersonel,
      });
      return response.data;
    },
    onSuccess: (data, personel) => {
      toast.success(
        data?.message ||
          `Telefon aktivasyonu ${personel.AdSoyad} için resetlendi.`,
      );
      queryClient.invalidateQueries({ queryKey: ["personel"] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Telefon aktivasyonu resetlenemedi.";
      toast.error(message);
    },
  });

  const handleAktivasyonResetle = (personel: Personel) => {
    setResetlenecekPersonel(personel);
  };

  const handleAktivasyonResetConfirm = () => {
    if (!resetlenecekPersonel) return;

    resetAktivasyonMutation.mutate(resetlenecekPersonel, {
      onSettled: () => {
        setResetlenecekPersonel(null);
      },
    });
  };

  const exportColumns: ExportColumn<Personel>[] = [
    { header: "Sicil No", accessorKey: "SicilNo" },
    { header: "TC Kimlik No", accessorKey: "TcKimlikNo" },
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Bölüm", accessorKey: "BolumAdi" },
    { header: "Personel Grubu", accessorKey: getGrupAdi },
    { header: "Cinsiyet", accessorKey: "Cinsiyet" },
    { header: "Doğum Tarihi", accessorKey: "DogumTarihi" },
    { header: "Medeni Durum", accessorKey: "MedeniDurum" },
    { header: "İşe Giriş Tarihi", accessorKey: "IseSonGirisTarihi2" },
    { header: "Çıkış Tarihi", accessorKey: "CikisTarihi2" },
    { header: "İstihdam Durumu", accessorKey: "IstihdamDurumu" },
    { header: "Çalışma Durumu", accessorKey: "CalismaDurumu" },
    { header: "Durum", accessorKey: "Durum2" },
    { header: "Ödeme Şekli", accessorKey: "OdemeSekli" },
    { header: "Ücret Tipi", accessorKey: "UcretTipi" },
    { header: "Ücret", accessorKey: "Ucret", format: "money" as const },
    { header: "Sendika Durumu", accessorKey: "SendikaDurumu" },
    { header: "Özürlülük Derecesi", accessorKey: "OzurlulukDerecesi" },
    { header: "Telefon", accessorKey: "Telefon" },
  ];

  // ---- 3. Kolon tanımları ----------------------------------------------
  const columns: ColumnDef<Personel>[] = [
    {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const personel = row.original;

        return (
          <RowActions
            row={personel}
            actions={[
              {
                label: "Düzenle",
                icon: Pencil,
                onClick: (r) =>
                  setSecilenPersonel({ id: r.IDSubePersonel, tip: "duzenle" }),
              },
              {
                label: "Personel Detayı",
                icon: ListChevronsUpDown,
                onClick: (r) =>
                  setSecilenPersonel({ id: r.IDSubePersonel, tip: "detay" }),
              },
              {
                label: "Kullanıcı Ayarları",
                icon: UserCog,
                onClick: (r) => {
                  setSettingsPersonel({
                    IDSubePersonel: r.IDSubePersonel,
                    AdSoyad: r.AdSoyad,
                    Telefon: r.Telefon,
                    KullaniciAktif: r.KullaniciAktif,
                  });
                  setSettingsOpen(true);
                },
              },
              {
                label: personel.Durum
                  ? "SGK İşten Çıkış Yap"
                  : "SGK İşe Giriş Yap",
                icon: Hospital,
                onClick: (r) => handleSgkAction(r, r.Durum),
              },
              { divider: true },
              {
                label: "Telefon Aktivasyon Resetle",
                icon: Smartphone,
                onClick: (r) => handleAktivasyonResetle(r),
              },
              { divider: true },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekId(r.IDSubePersonel),
              },
            ]}
          />
        );
      },
    },

    {
      accessorKey: "AdSoyad",
      header: "Ad Soyad",
      cell: ({ row }) => (
        <div className="flex flex-col items-start">
          <Button
            variant="primary"
            appearance="link"
            className="h-auto justify-start px-0 underline text-blue-900 cursor-pointer decoration-primary/40 decoration-dotted hover:decoration-primary hover:decoration-solid"
            title="Detayları aç"
            onClick={() => setDrawerId(String(row.original.IDSubePersonel))}
          >
            {row.original.AdSoyad}
          </Button>
          <span className="text-xs text-muted-foreground">
            {row.original.SicilNo}
          </span>
        </div>
      ),
    },
    {
      id: "personelGrubu",
      header: "Personel Grubu",
      accessorFn: getGrupAdi,
      cell: ({ getValue }) => getValue<string>() || "-",
    },
    {
      accessorKey: "Cinsiyet",
      header: "Cinsiyet",
      cell: ({ row }) => {
        const cinsiyet = row.original.Cinsiyet;

        return (
          <Badge variant={cinsiyet === "ERKEK" ? "blue" : "pink"}>
            {cinsiyet}
          </Badge>
        );
      },
    },
    {
      accessorKey: "CalismaDurumu",
      header: "Çalışma Durumu",
      cell: ({ row }) => {
        const durum = row.original.CalismaDurumu;

        return (
          <Badge variant={durum === "ÇALISIYOR" ? "success" : "gray"}>
            {durum}
          </Badge>
        );
      },
    },

    {
      accessorKey: "Ucret",
      header: "Ücret",

      cell: ({ row }) =>
        new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
          maximumFractionDigits: 2,
        }).format(row.original.Ucret),
    },

    {
      accessorKey: "OdemeSekli",
      header: "Ödeme Şekli",
      cell: ({ row }) => <span>{row.original.OdemeSekli}</span>,
    },

    {
      accessorKey: "UcretTipi",
      header: "Ücret Tipi",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.UcretTipi}</Badge>
      ),
    },

    {
      accessorKey: "Durum",
      header: "Durum",
      cell: ({ row }) => {
        const durum = row.original.Durum;

        return (
          <Badge variant={durum ? "success" : "danger"}>
            {durum ? "Aktif" : "Pasif"}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Personel Yönetimi</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-48 sm:shrink-0">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Sicil No, TC Kimlik No veya Ad Soyad ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <PersonelFiltre onApply={setFilters} />
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenPersonelEkle(true)}
            >
              <UserPlus className="size-4" />
              Personel Ekle
            </Button>
            <ExportMenu
              data={filteredPersonelListesi}
              exportColumns={exportColumns}
              title="Personel Listesi"
              fileName="personel-listesi"
              showImport
              onImportClick={() => setOpenImport(true)}
            />
            <div className="shrink-0">
              <CustomColumnVisibility
                columns={columns}
                value={columnVisibility}
                onChange={setColumnVisibility}
              />
            </div>
          </div>
        </div>
      </div>
      <CustomDataTable
        data={filteredPersonelListesi}
        columns={columns}
        loading={isLoadingPersonel}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        pagination
        emptyMessage="Personel bulunamadı."
      />

      <PersonelDrawer
        personel={drawerPersonel}
        grupAdi={drawerPersonel ? getGrupAdi(drawerPersonel) : undefined}
        onOpenChange={(open) => !open && setDrawerId(null)}
        onDelete={setSilinecekId}
      />

      <PersonelEkle
        open={openPersonelEkle || secilenPersonel?.tip === "duzenle"}
        onOpenChange={(open) => {
          if (!open) {
            setOpenPersonelEkle(false);
            setSecilenPersonel(null);
          }
        }}
        id={secilenPersonel?.tip === "duzenle" ? secilenPersonel.id : null}
      />

      <PersonelDetayDialog
        open={secilenPersonel?.tip === "detay"}
        onOpenChange={(open) => {
          if (!open) {
            setSecilenPersonel(null);
          }
        }}
        id={secilenPersonel?.tip === "detay" ? secilenPersonel.id : null}
      />

      <PersonelImportDialog open={openImport} onOpenChange={setOpenImport} />

      <PersonelSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        personel={settingsPersonel}
      />

      <PersonelSgkDialog
        open={Boolean(sgkDialog)}
        onOpenChange={(open) => !open && setSgkDialog(null)}
        personel={sgkDialog?.personel ?? null}
        isActive={Boolean(sgkDialog?.isActive)}
        isSubmitting={sgkIslem.isPending}
        onSubmit={handleSgkSubmit}
      />

      <ConfirmDialog
        open={!!silinecekId}
        onOpenChange={(open) => !open && setSilinecekId(null)}
        title="Şubeyi sil"
        description={`Bu personel kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deletePersonel.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={!!resetlenecekPersonel}
        onOpenChange={(open) => !open && setResetlenecekPersonel(null)}
        title="Telefon aktivasyonunu resetle"
        description={`"${resetlenecekPersonel?.AdSoyad}" adlı personelin telefon aktivasyonu resetlenecek. Personel bir sonraki girişte telefonunu yeniden eşleştirmek zorunda kalacak.`}
        variant="warning"
        confirmLabel="Resetle"
        isLoading={resetAktivasyonMutation.isPending}
        onConfirm={handleAktivasyonResetConfirm}
      />
    </div>
  );
};

export default Personel;
