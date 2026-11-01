"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import { useDeleteTatil, useTatilList } from "@/hooks/sistem/use-sgk-bordro";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import { TatilFilters, TatilType } from "@/types/sistem/sgk-bordro";
import { getGunAdi, toDurumValue } from "./tatil-options";
import TatilFiltre from "./TatilFiltre";
import TatilEkle from "./TatilEkle";

const INITIAL_FILTERS: TatilFilters = { Durum: "ALL", ResmiDini: "ALL" };

// Gelecek yılın tatilleri önceden girilebilsin diye bir sonraki yıl da listede.
const YIL_OPTIONS = (() => {
  const nextYear = new Date().getFullYear() + 1;
  return Array.from({ length: 12 }, (_, i) => String(nextYear - i));
})();

type Props = {
  enabled: boolean;
};

const TatilListesi = ({ enabled }: Props) => {
  const { data: savedContext } = useCurrentContext();
  const sessionYil = String(
    savedContext?.Yil || new Date().getFullYear().toString(),
  );
  const deleteTatil = useDeleteTatil();

  // null → session yılı kullanılır (context sonradan gelse de doğru yıl seçilir)
  const [seciliYil, setSeciliYil] = useState<string | null>(null);
  const yil = seciliYil ?? sessionYil;

  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openTatilEkle, setOpenTatilEkle] = useState(false);
  const [duzenlenecekTatil, setDuzenlenecekTatil] = useState<TatilType | null>(
    null,
  );
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("tatil-kolonlar");
  const [filters, setFilters] = useState<TatilFilters>(INITIAL_FILTERS);

  const { data: tatilListesi = [], isLoading } = useTatilList(yil, enabled);

  const yilOptions = useMemo(
    () =>
      YIL_OPTIONS.includes(yil)
        ? YIL_OPTIONS
        : [...YIL_OPTIONS, yil].sort((a, b) => Number(b) - Number(a)),
    [yil],
  );

  // Durum, Resmi/Dini ve açıklama proc parametresi olmadığı için
  // client-side filtreleniyor.
  const filteredData = useMemo(() => {
    let data = tatilListesi;

    if (filters.Durum !== "ALL") {
      data = data.filter((t) => toDurumValue(t.Durum) === filters.Durum);
    }

    if (filters.ResmiDini !== "ALL") {
      data = data.filter((t) => t.ResmiDini === filters.ResmiDini);
    }

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((t) =>
      t.Aciklama?.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [tatilListesi, searchText, filters.Durum, filters.ResmiDini]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteTatil.mutate(
      { IDTatil: silinecekId },
      {
        onSuccess: (result) => {
          if (result && Number(result.test) !== 1) {
            toast.error("Tatil kaydı silinemedi");
            return;
          }
          toast.success("Tatil kaydı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Tatil kaydı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<TatilType>[] = [
    { header: "Tarih", accessorKey: "Tarih" },
    { header: "Gün", accessorKey: getGunAdi },
    { header: "Açıklama", accessorKey: "Aciklama" },
    { header: "Durum", accessorKey: "Durum" },
    { header: "Resmi / Dini", accessorKey: "ResmiDini" },
  ];

  const columns: ColumnDef<TatilType>[] = useMemo(
    () => [
      {
        id: "actions",
        size: 50,
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            actions={[
              {
                label: "Düzenle",
                icon: Pencil,
                onClick: (r) => setDuzenlenecekTatil(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekId(Number(r.IDTatil)),
              },
            ]}
          />
        ),
      },
      {
        accessorKey: "Tarih2",
        header: "Tarih",
        cell: ({ row }) => row.original.Tarih,
      },
      {size:300, accessorKey: "Aciklama", header: "Açıklama" },
      {
        id: "gun",
        header: "Gün",
        cell: ({ row }) => getGunAdi(row.original),
      },
      {
        accessorKey: "Durum",
        header: "Durum",
        cell: ({ row }) =>
          toDurumValue(row.original.Durum) === "Y" ? (
            <Badge variant="warning">{row.original.Durum}</Badge>
          ) : (
            <Badge variant="success">{row.original.Durum}</Badge>
          ),
      },
      {
        accessorKey: "ResmiDini",
        header: "Resmi / Dini",
        cell: ({ row }) =>
          row.original.ResmiDini === "Dini" ? (
            <Badge variant="purple">Dini</Badge>
          ) : (
            <Badge variant="info">{row.original.ResmiDini}</Badge>
          ),
      },
    ],
    [],
  );

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <TatilFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />

          <Button type="button" size="sm" onClick={() => setOpenTatilEkle(true)}>
            <Plus className="size-4" />
            Tatil Ekle
          </Button>
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title={`Tatil Listesi ${yil}`}
            fileName={`tatil-listesi-${yil}`}
          />
          <CustomColumnVisibility
            columns={columns}
            value={columnVisibility}
            onChange={setColumnVisibility}
          />

          <Select value={yil} onValueChange={setSeciliYil}>
            <SelectTrigger size="sm" className="w-24" aria-label="Yıl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yilOptions.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CustomDataTable
        data={filteredData}
        columns={columns}
        loading={isLoading}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
      />

      <ConfirmDialog
        open={!!silinecekId}
        onOpenChange={(open) => !open && setSilinecekId(null)}
        title="Tatil kaydını sil"
        description="Bu tatil kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteTatil.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openTatilEkle && (
        <TatilEkle open={openTatilEkle} onOpenChange={setOpenTatilEkle} />
      )}

      {duzenlenecekTatil && (
        <TatilEkle
          open={Boolean(duzenlenecekTatil)}
          onOpenChange={(open) => !open && setDuzenlenecekTatil(null)}
          tatil={duzenlenecekTatil}
        />
      )}
    </div>
  );
};

export default TatilListesi;
