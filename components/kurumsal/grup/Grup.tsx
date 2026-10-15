"use client";

import { useCallback, useMemo, useState } from "react";
import {
  UserPlus,
  FileText,
  Merge,
  Pencil,
  Power,
  Trash2,
  Loader2,
  Plus,
  PlusCircleIcon,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, normalize } from "@/lib/utils";
import {
  useAktifPasifGrup,
  useDeleteGrup,
  useKurumsalData,
} from "@/hooks/use-kurumsal-data";
import GrupEkle from "./GrupEkle";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ColumnDef } from "@tanstack/react-table";
import { GrupFilters, GrupType } from "@/types/kurumsal/grup";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { useRole } from "@/stores/auth-store";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import Filtre from "./Filtre";
import SirketEkle from "../sirket/SirketEkle";
import Sirket from "../sirket/Sirket";

const INITIAL_FILTERS: GrupFilters = {
  Durum: null,
  Sirket: "",
};

const grupExportColumns: ExportColumn<GrupType>[] = [
  { header: "Grup Adı", accessorKey: "GurupAdi" },
  { header: "Tel", accessorKey: (r) => r.Tel || "-" },
  { header: "Durum", accessorKey: (r) => (r.Durum ? "Aktif" : "Pasif") },
  {
    header: "Oluşturma Tarihi",
    accessorKey: (r) => formatDate(r.CreatedDate),
  },
  { header: "Şirket Sayısı", accessorKey: "SirketSayisi" },
];

export default function Grup() {
  const { gruplar, isLoadingGruplar, createGrup } = useKurumsalData();
  const deleteGrup = useDeleteGrup();
  const aktifPasifGrup = useAktifPasifGrup();
  const { isAdmin } = useRole();

  const [openGrup, setOpenGrup] = useState(false);
  const [openSirketEkle, setOpenSirketEkle] = useState(false);

  const [secilenGrup, setSecilenGrup] = useState<GrupType | null>(null);
  const [silinecekGrup, setSilinecekGrup] = useState<GrupType | null>(null);
  const [duzenlenecekGrup, setDuzenlenecekGrup] = useState<GrupType | null>(
    null,
  );
  const [searchText, setSearchText] = useState<string>("");
  const [filters, setFilters] = useState<GrupFilters>(INITIAL_FILTERS);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("grup-kolonlar");

  const filteredGruplar = useMemo(() => {
    const search = normalize(searchText.trim());

    return gruplar.filter((grup) => {
      const matchesDurum =
        filters.Durum === null || Number(grup.Durum) === filters.Durum;
      const sirketSayisi = Number(grup.SirketSayisi) || 0;
      const matchesSirket =
        filters.Sirket === "" ||
        (filters.Sirket === "VAR" ? sirketSayisi > 0 : sirketSayisi === 0);
      const matchesSearch =
        !search ||
        [grup.GurupAdi, grup.Tel]
          .filter(Boolean)
          .some((value) => normalize(String(value)).includes(search));

      return matchesDurum && matchesSirket && matchesSearch;
    });
  }, [gruplar, searchText, filters]);

  const handleFilterChange = useCallback(
    (next: GrupFilters) => setFilters(next),
    [],
  );
  const handleFilterReset = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const handleEdit = (grup: GrupType) => {
    setDuzenlenecekGrup(grup);
    setOpenGrup(true);
  };

  const handleEkleSirket = (grup: GrupType) => {
    setSecilenGrup(grup);
    setOpenSirketEkle(true);
  };

  const handleDeleteConfirm = () => {
    if (!silinecekGrup) return;

    deleteGrup.mutate(
      { IDGurup: silinecekGrup.IDGurup },
      {
        onSuccess: () => {
          toast.success("Grup silindi");
          setSilinecekGrup(null);
        },
        onError: (err) => {
          console.error("Grup silinemedi", err);
          toast.error("Grup silinemedi", {
            description: err.message || "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const handleToggleDurum = (grup: GrupType) => {
    const yeniDurum = grup.Durum ? 0 : 1;

    aktifPasifGrup.mutate(
      { IDGurup: grup.IDGurup, Durum: yeniDurum },
      {
        onSuccess: () => {
          toast.success(
            yeniDurum ? "Grup aktif yapıldı" : "Grup pasif yapıldı",
          );
        },
        onError: (err) => {
          console.error("Grup durumu değiştirilemedi", err);
          toast.error("Grup durumu değiştirilemedi", {
            description: err.message || "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<GrupType>[]>(
    () => [
      {
        id: "actions",
        size: 20,
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const grup = row.original;

          return (
            <RowActions
              row={grup}
              actions={[
                {
                  label: "Düzenle",
                  icon: Pencil,
                  onClick: (r) => handleEdit(r),
                },
                {
                  label: "Şirket Ekle",
                  icon: PlusCircleIcon,
                  onClick: (r) => handleEkleSirket(r),
                },
                {
                  label: grup.Durum ? "Pasif Yap" : "Aktif Yap",
                  icon: Power,
                  onClick: (r) => handleToggleDurum(r),
                },
                { divider: true },
                {
                  label: "Sil",
                  icon: Trash2,
                  variant: "danger",
                  onClick: (r) => setSilinecekGrup(r),
                },
              ]}
            />
          );
        },
      },
      {
        accessorKey: "GurupAdi",
        header: "Grup Adı",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.GurupAdi}
          </span>
        ),
      },
      {
        accessorKey: "Tel",
        header: "Tel",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.Tel ? row.original.Tel : "-"}
          </span>
        ),
      },
      {
        accessorKey: "Durum",
        header: "Durum",
        cell: ({ row }) => {
          const status = row.original.Durum;
          return (
            <Badge variant={status ? "success" : "danger"}>
              {status ? "Aktif" : "Pasif"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "CreatedDate",
        header: "Oluşturma Tarihi",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {formatDate(row.original.CreatedDate)}
          </span>
        ),
      },
      {
        accessorKey: "SirketSayisi",
        header: "Şirket Sayısı",
        cell: ({ row }) => <Badge>{row.original.SirketSayisi}</Badge>,
      },
    ],
    [],
  );

  if (isLoadingGruplar) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Kurumsal Yönetim</h1>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-end">
          <div className="w-full sm:w-48 sm:shrink-0">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Grup Ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Filtre
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />
            {isAdmin && (
              <Button type="button" size="sm" onClick={() => setOpenGrup(true)}>
                <Plus className="size-4" />
                Yeni Grup Ekle
              </Button>
            )}
            <ExportMenu
              data={filteredGruplar}
              exportColumns={grupExportColumns}
              title="Grup Listesi"
              fileName="grup-listesi"
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

        <CustomDataTable
          data={filteredGruplar}
          columns={columns}
          columnVisibilityValue={columnVisibility}
          onColumnVisibilityValueChange={setColumnVisibility}
          expandable
          expandedRowContent={(row) => (
            <Sirket idGurup={row.original.IDGurup} />
          )}
        />
      </div>
      <GrupEkle
        open={openGrup}
        onOpenChange={setOpenGrup}
        grup={duzenlenecekGrup}
      />

      <SirketEkle
        open={!!secilenGrup}
        onOpenChange={(open) => !open && setSecilenGrup(null)}
        idGurup={secilenGrup?.IDGurup ?? 0}
      />

      <ConfirmDialog
        open={!!silinecekGrup}
        onOpenChange={(open) => !open && setSilinecekGrup(null)}
        title="Grubu sil"
        description={`"${silinecekGrup?.GurupAdi}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteGrup.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
