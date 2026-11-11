"use client";

import { useMemo, useState } from "react";
import { CopyPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import {
  useAktarVergiOran,
  useDeleteVergiOran,
  useVergiOranList,
} from "@/hooks/sistem/use-sgk-bordro";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import { formatMoney } from "@/lib/format";
import { VergiOranFilters, VergiOranType } from "@/types/sistem/sgk-bordro";
import { formatYuzde } from "./vergi-oran-options";
import VergiOranFiltre from "./VergiOranFiltre";
import VergiOranEkle from "./VergiOranEkle";
import YilSecici from "@/components/sistem/sgk-bordro-parametreleri/YilSecici";
import SonrakiYilaAktar from "@/components/sistem/sgk-bordro-parametreleri/SonrakiYilaAktar";

const INITIAL_FILTERS: VergiOranFilters = { Yuzde: "ALL" };

type Props = {
  enabled: boolean;
};

const VergiOranListesi = ({ enabled }: Props) => {
  const { data: savedContext } = useCurrentContext();
  const sessionYil = String(
    savedContext?.Yil || new Date().getFullYear().toString(),
  );
  const deleteVergiOran = useDeleteVergiOran();
  const aktarVergiOran = useAktarVergiOran();

  // null → session yılı kullanılır (context sonradan gelse de doğru yıl seçilir)
  const [seciliYil, setSeciliYil] = useState<string | null>(null);
  const yil = seciliYil ?? sessionYil;

  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openVergiOranEkle, setOpenVergiOranEkle] = useState(false);
  const [openAktar, setOpenAktar] = useState(false);
  const [duzenlenecekVergiOran, setDuzenlenecekVergiOran] =
    useState<VergiOranType | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "vergi-oran-kolonlar",
  );
  const [filters, setFilters] = useState<VergiOranFilters>(INITIAL_FILTERS);

  const { data: vergiOranListesi = [], isLoading } = useVergiOranList(
    yil,
    enabled,
  );

  const yuzdeOptions = useMemo(
    () =>
      Array.from(new Set(vergiOranListesi.map((v) => String(v.Yuzde)))).sort(
        (a, b) => Number(a) - Number(b),
      ),
    [vergiOranListesi],
  );

  // Yüzde proc parametresi olmadığı için client-side filtreleniyor.
  // Arama tutar ve yüzdede, hem ham ("190000") hem formatlı ("190.000,01") yapılıyor.
  const filteredData = useMemo(() => {
    let data = vergiOranListesi;

    if (filters.Yuzde !== "ALL") {
      data = data.filter((v) => String(v.Yuzde) === filters.Yuzde);
    }

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((v) =>
      [
        v.Baslangic,
        v.Bitis,
        formatMoney(v.Baslangic),
        formatMoney(v.Bitis),
        formatYuzde(v.Yuzde),
      ].some((value) => String(value ?? "").includes(query)),
    );
  }, [vergiOranListesi, searchText, filters.Yuzde]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteVergiOran.mutate(
      { IDVergiYuzde: silinecekId },
      {
        onSuccess: (result) => {
          if (result && Number(result.test) !== 1) {
            toast.error("Vergi oranı silinemedi");
            return;
          }
          toast.success("Vergi oranı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Vergi oranı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<VergiOranType>[] = [
    { header: "Yıl", accessorKey: "Yil" },
    { header: "Başlangıç", accessorKey: "Baslangic", format: "money" },
    { header: "Bitiş", accessorKey: "Bitis", format: "money" },
    { header: "Yüzde", accessorKey: (row) => formatYuzde(row.Yuzde) },
  ];

  const columns: ColumnDef<VergiOranType>[] = useMemo(
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
                onClick: (r) => setDuzenlenecekVergiOran(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekId(Number(r.IDVergiYuzde)),
              },
            ]}
          />
        ),
      },
      { accessorKey: "Yil", header: "Yıl" },
      {
        accessorKey: "Baslangic",
        header: "Başlangıç",
        cell: ({ row }) => formatMoney(row.original.Baslangic),
      },
      {
        accessorKey: "Bitis",
        header: "Bitiş",
        cell: ({ row }) => formatMoney(row.original.Bitis),
      },
      {
        accessorKey: "Yuzde",
        header: "Yüzde",
        cell: ({ row }) => formatYuzde(row.original.Yuzde),
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
          <VergiOranFiltre
            filters={filters}
            yuzdeOptions={yuzdeOptions}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />
          <YilSecici value={yil} onChange={setSeciliYil} />

          <Button
            type="button"
            size="sm"
            onClick={() => setOpenVergiOranEkle(true)}
          >
            <Plus className="size-4" />
            Vergi Oranı Ekle
          </Button>
          <Button
            type="button"
            variant="success"
            appearance="solid"
            size="sm"
            onClick={() => setOpenAktar(true)}
          >
            <CopyPlus className="size-4" />
            Sonraki Yıla Aktar
          </Button>
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title={`Vergi Yüzde Oranları ${yil}`}
            fileName={`vergi-yuzde-oranlari-${yil}`}
          />
          <CustomColumnVisibility
            columns={columns}
            value={columnVisibility}
            onChange={setColumnVisibility}
          />
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
        title="Vergi oranını sil"
        description="Bu vergi dilimi kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteVergiOran.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openVergiOranEkle && (
        <VergiOranEkle
          open={openVergiOranEkle}
          onOpenChange={setOpenVergiOranEkle}
          defaultYil={yil}
        />
      )}

      {duzenlenecekVergiOran && (
        <VergiOranEkle
          open={Boolean(duzenlenecekVergiOran)}
          onOpenChange={(open) => !open && setDuzenlenecekVergiOran(null)}
          defaultYil={yil}
          vergiOran={duzenlenecekVergiOran}
        />
      )}

      {openAktar && (
        <SonrakiYilaAktar
          open={openAktar}
          onOpenChange={setOpenAktar}
          mevcutYil={yil}
          onAktarildi={setSeciliYil}
          konu="Vergi oranları"
          aktar={aktarVergiOran.mutateAsync}
          isPending={aktarVergiOran.isPending}
        />
      )}
    </div>
  );
};

export default VergiOranListesi;
