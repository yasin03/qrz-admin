"use client";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowAction, RowActions } from "@/components/customs/RowActions";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useDeleteKullanici, useKullaniciList } from "@/hooks/use-kullanici";
import { formatDate } from "@/lib/format";
import { useUser } from "@/stores/auth-store";
import {
  KullaniciFilters,
  SelectKullaniciResponseType,
} from "@/types/kullanici";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, ShieldUser, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import Filtre from "./Filtre";
import KullaniciEkle from "./KullaniciEkle";

const INITIAL_FILTERS: KullaniciFilters = {
  KullaniciTipi: "",
  Durum: null,
  Yetki: "",
};

const YETKI_LABELS = [
  { key: "YetkiKullanici", label: "Kullanıcı" },
  { key: "YetkiGrup", label: "Grup" },
  { key: "YetkiSirket", label: "Şirket" },
  { key: "YetkiSube", label: "Şube" },
] as const;

const formatDateTime = (value: string | null) =>
  value ? formatDate(value, "dd.MM.yyyy HH:mm") : "-";

const KullaniciListesi = () => {
  const user = useUser();
  const [filters, setFilters] = useState<KullaniciFilters>(INITIAL_FILTERS);
  const [searchText, setSearchText] = useState("");
  const [openKullaniciEkle, setOpenKullaniciEkle] = useState(false);
  const [duzenlenecekId, setDuzenlenecekId] = useState<string | null>(null);
  const [silinecek, setSilinecek] =
    useState<SelectKullaniciResponseType | null>(null);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("kullanici-kolonlar");

  const { data: kullaniciListesi = [], isLoading } = useKullaniciList();
  const deleteKullanici = useDeleteKullanici();

  const kullaniciTipiOptions = useMemo(
    () =>
      Array.from(
        new Set(kullaniciListesi.map((k) => k.KullaniciTipi).filter(Boolean)),
      ).map((tip) => ({ value: tip, label: tip })),
    [kullaniciListesi],
  );

  const seciliKullanici = useMemo(
    () =>
      duzenlenecekId === null
        ? null
        : (kullaniciListesi.find(
            (k) => String(k.IDKullanici) === duzenlenecekId,
          ) ?? null),
    [duzenlenecekId, kullaniciListesi],
  );

  const filteredKullaniciListesi = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");

    return kullaniciListesi.filter((k) => {
      const matchesTip =
        filters.KullaniciTipi === "" ||
        k.KullaniciTipi === filters.KullaniciTipi;
      const matchesDurum = filters.Durum === null || k.Durum === filters.Durum;
      const matchesYetki = filters.Yetki === "" || Boolean(k[filters.Yetki]);

      const matchesSearch =
        query.length === 0 ||
        [k.KullaniciAdi, k.Ad, k.Email, k.Tel, k.Aciklama]
          .filter(Boolean)
          .some((v) => String(v).toLocaleLowerCase("tr-TR").includes(query));

      return matchesTip && matchesDurum && matchesYetki && matchesSearch;
    });
  }, [kullaniciListesi, searchText, filters]);

  const handleFilterChange = useCallback(
    (next: KullaniciFilters) => setFilters(next),
    [],
  );
  const handleFilterReset = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const handleDeleteConfirm = () => {
    if (!silinecek) return;

    deleteKullanici.mutate(
      { IDKullanici: silinecek.IDKullanici },
      {
        onSuccess: () => {
          toast.success("Kullanıcı silindi");
          setSilinecek(null);
        },
        onError: () => {
          toast.error("Kullanıcı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const kullaniciExportColumns: ExportColumn<SelectKullaniciResponseType>[] = [
    { header: "Kullanıcı Adı", accessorKey: "KullaniciAdi" },
    { header: "Ad Soyad", accessorKey: "Ad" },
    { header: "Kullanıcı Tipi", accessorKey: "KullaniciTipi" },
    { header: "Telefon", accessorKey: "Tel" },
    { header: "E-posta", accessorKey: "Email" },
    { header: "Durum", accessorKey: "Durum" },
    { header: "Son Giriş", accessorKey: "LastLoginDate" },
  ];

  // ---- Kolon tanımları -------------------------------------------------
  const columns: ColumnDef<SelectKullaniciResponseType>[] = [
    {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const rowdata = row.original;
        const isSelf =
          String(rowdata.IDKullanici) === String(user?.IDKullanici);

        const actions: RowAction<SelectKullaniciResponseType>[] = [
          {
            label: "Düzenleme & Yetkiler",
            icon: ShieldUser,
            onClick: (r) => setDuzenlenecekId(String(r.IDKullanici)),
          },
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            separatorBefore: true,
            // Kişi kendi hesabını silemesin.
            disabled: isSelf,
            onClick: (r) => setSilinecek(r),
          },
        ];

        return (
          <div className="flex justify-end">
            <RowActions row={rowdata} actions={actions} />
          </div>
        );
      },
    },
    {
      accessorKey: "Ad",
      header: "Ad Soyad / E-posta",
      cell: ({ row }) => (
        <span className="flex flex-col gap-0.5">
          <span>{row.original.Ad || "-"}</span>
          <span className="text-sm text-gray-400 ">{row.original.Email || "-"}</span>
        </span>
      ),
    },
    {
      accessorKey: "KullaniciAdi",
      header: "Kullanıcı Adı",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.KullaniciAdi}</span>
      ),
    },
    {
      accessorKey: "KullaniciTipi",
      header: "Rol",
      cell: ({ row }) => {
        const tip = row.original.KullaniciTipi;
        return (
          <Badge variant={tip === "Admin" ? "purple" : "blue"}>{tip}</Badge>
        );
      },
    },
    {
      accessorKey: "Tel",
      header: "Telefon",
      cell: ({ row }) => <span>{row.original.Tel || "-"}</span>,
    },
    {
      id: "Yetkiler",
      header: "Yetkiler",
      enableSorting: false,
      cell: ({ row }) => {
        const yetkiler = YETKI_LABELS.filter((y) => row.original[y.key]);
        if (yetkiler.length === 0)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {yetkiler.map((y) => (
              <Badge key={y.key} variant="cyan">
                {y.label}
              </Badge>
            ))}
          </div>
        );
      },
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
    {
      accessorKey: "LastLoginDate",
      header: "Son Giriş",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDateTime(row.original.LastLoginDate)}
        </span>
      ),
    },
    {
      accessorKey: "CreatedDate",
      header: "Oluşturma",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDateTime(row.original.CreatedDate)}
        </span>
      ),
    },
    {
      accessorKey: "Aciklama",
      header: "Açıklama",
      cell: ({ row }) => <span>{row.original.Aciklama || "-"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Kullanıcı Yönetimi</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-48 sm:shrink-0">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Kullanıcı Ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Filtre
              filters={filters}
              kullaniciTipiOptions={kullaniciTipiOptions}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenKullaniciEkle(true)}
            >
              <Plus className="size-4" />
              Kullanıcı Ekle
            </Button>
            <ExportMenu
              data={filteredKullaniciListesi}
              exportColumns={kullaniciExportColumns}
              title="Kullanıcı Listesi"
              fileName="kullanici-listesi"
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
        data={filteredKullaniciListesi}
        columns={columns}
        loading={isLoading}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
      />

      <KullaniciEkle
        open={openKullaniciEkle || duzenlenecekId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenKullaniciEkle(false);
            setDuzenlenecekId(null);
          }
        }}
        kullanici={seciliKullanici}
      />

      <ConfirmDialog
        open={!!silinecek}
        onOpenChange={(open) => !open && setSilinecek(null)}
        title="Kullanıcıyı sil"
        description={`"${silinecek?.KullaniciAdi ?? ""}" kullanıcısı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteKullanici.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default KullaniciListesi;
