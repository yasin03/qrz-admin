"use client";
import { CustomDataTable } from "../customs/CustomDataTable";
import { Button } from "../ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { RowAction, RowActions } from "../customs/RowActions";
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Hospital,
  UserCog,
} from "lucide-react";
import PersonelEkle from "./PersonelEkle";
import { Input } from "../ui/input";
import {
  useDeletePersonel,
  usePersonelSgkIslem,
  usePersonelListesi,
  type PersonelSgkIslemPayload,
  type PersonelFilters,
} from "@/hooks/use-personel";
import PersonelFiltre from "./PersonelFiltre";
import { Badge } from "../ui/badge";
import { useCurrentContext } from "@/hooks/use-context";
import { useEffect } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import PersonelSgkDialog from "./PersonelSgkDialog";
import PersonelSettingsDialog, {
  PersonelSettingsPersonel,
} from "./PersonelSettingsDialog";

type Personel = {
  SicilNo: string;
  TcKimlikNo: string;
  BolumAdi: string;
  Telefon: string;
  KullaniciAktif: boolean;
  AdSoyad: string;
  AdSoyad2: string;
  Ucret: number;
  OdemeSekli: string;
  UcretTipi: string;
  SendikaDurumu: boolean;
  DayanismaDurumu: boolean;
  Cinsiyet: string;
  DogumTarihi: string;
  IseSonGirisTarihi2: string;
  CikisTarihi2: string;
  IseSonGirisTarihi: string;
  CikisTarihi: string;
  PersonelKanunNo: string;
  PersonelSgkBelgeTuru: string;
  PersonelMeslekKodu: string;
  MedeniDurum: string;
  IstihdamDurumu: string;
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;
  SgkDurumu: string;
  CalismaDurumu: string;
  AgiAlmazDurumu: boolean;
  OzurlulukDerecesi: number;
  Durum: boolean;
  Durum2: string;
  SgkGirisDurum: string | null;
  SgkCikisDurum: string | null;
};

type SgkDialogState = {
  personel: Personel;
  isActive: boolean;
};

const Personel = () => {
  const [filters, setFilters] = useState<PersonelFilters | null>(null);
  const [searchText, setSearchText] = useState("");
  const { data: context } = useCurrentContext();
  const deletePersonel = useDeletePersonel();
  const sgkIslem = usePersonelSgkIslem();
  const [openPersonelEkle, setOpenPersonelEkle] = useState(false);
  const [duzenlenecekId, setDuzenlenecekId] = useState<string | number | null>(
    null,
  );
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [sgkDialog, setSgkDialog] = useState<SgkDialogState | null>(null);
  const [settingsPersonel, setSettingsPersonel] =
    useState<PersonelSettingsPersonel | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const filteredPersonelListesi = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    const selectedUcretTipi = filters?.UcretTipi || "";
    const selectedCinsiyet = filters?.Cinsiyet || "";
    const selectedMedeniDurum = filters?.MedeniDurum || "";
    const selectedCalismaDurumu = filters?.CalismaDurumu || "";

    const hasTextFilter = Boolean(query);
    const hasSelectFilter = Boolean(
      selectedUcretTipi ||
      selectedCinsiyet ||
      selectedMedeniDurum ||
      selectedCalismaDurumu,
    );

    if (!hasTextFilter && !hasSelectFilter) {
      return personelListesi;
    }

    return personelListesi.filter((personel: Personel) => {
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

      return (
        (!hasTextFilter || textMatch) &&
        ucretTipiMatch &&
        cinsiyetMatch &&
        medeniDurumMatch &&
        calismaDurumuMatch
      );
    });
  }, [personelListesi, searchText, filters]);

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

  // ---- 3. Kolon tanımları ----------------------------------------------
  const columns: ColumnDef<Personel>[] = [
    {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const personel = row.original;

        const actions: RowAction<Personel>[] = [
          {
            label: "Düzenle",
            icon: Pencil,
            onClick: (r) => setDuzenlenecekId(r.IDSubePersonel),
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
            label: personel.Durum ? "SGK İşten Çıkış Yap" : "SGK İşe Giriş Yap",
            icon: Hospital,
            onClick: (r) => handleSgkAction(r, r.Durum),
          },
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            separatorBefore: true,
            onClick: (r) => setSilinecekId(r.IDSubePersonel),
          },
        ];

        return (
          <div className="flex justify-end">
            <RowActions row={personel} actions={actions} />
          </div>
        );
      },
    },

    {
      accessorKey: "AdSoyad",
      header: "Ad Soyad",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {row.original.AdSoyad}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.SicilNo}
          </span>
        </div>
      ),
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
      accessorKey: "IseSonGirisTarihi",
      header: "İşe Giriş Tarihi",
      cell: ({ row }) => {
        const value = row.original.IseSonGirisTarihi;

        if (!value) return "-";

        return new Intl.DateTimeFormat("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(value));
      },
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
  ];

  const expandedRowContent = (row: Personel) => {
    const personel = row;

    return (
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 p-4 md:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">TC Kimlik No</p>
          <p className="font-medium">{personel.TcKimlikNo}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Cinsiyet</p>
          <Badge variant={personel.Cinsiyet === "ERKEK" ? "blue" : "pink"}>
            {personel.Cinsiyet}
          </Badge>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Medeni Durum</p>
          <p className="font-medium">{personel.MedeniDurum}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">SGK Durumu</p>
          <p className="font-medium">{personel.SgkDurumu}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Meslek Kodu</p>
          <p className="font-medium">{personel.PersonelMeslekKodu}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">İstihdam Durumu</p>
          <p className="font-medium">{personel.IstihdamDurumu}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Doğum Tarihi</p>
          <p className="font-medium">{personel.DogumTarihi}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Çıkış Tarihi</p>
          <p className="font-medium">{personel.CikisTarihi2 || "-"}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personel Yönetimi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Sicil No, TC Kimlik No veya Ad Soyad ara..."
            className="w-48"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <PersonelFiltre onApply={setFilters} />
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenPersonelEkle(true)}
          >
            <UserPlus className="size-4" />
            Yeni Personel Ekle
          </Button>
        </div>
      </div>
      <CustomDataTable
        data={filteredPersonelListesi}
        columns={columns}
        loading={isLoadingPersonel}
        getRowId={(row) => row.id}
        pagination
        onRowClick={(row) => console.log("satıra tıklandı", row)}
        emptyMessage="Personel bulunamadı."
        expandable
        expandedRowContent={(row) => {
          const personel = row.original;
          return expandedRowContent(personel);
        }}
      />

      <PersonelEkle
        open={openPersonelEkle || duzenlenecekId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenPersonelEkle(false);
            setDuzenlenecekId(null);
          }
        }}
        id={duzenlenecekId}
      />

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
    </div>
  );
};

export default Personel;
