"use client";

import { useMemo, useState } from "react";
import { CopyPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import {
  useAktarKidemIhbar,
  useDeleteKidemIhbar,
  useKidemIhbarList,
} from "@/hooks/sistem/use-sgk-bordro";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import { formatMoney } from "@/lib/format";
import { KidemIhbarFilters, KidemIhbarType } from "@/types/sistem/sgk-bordro";
import { getAyAdi } from "../katsayi-oranlari/katsayi-oran-options";
import { toTipValue } from "./kidem-ihbar-options";
import KidemIhbarFiltre from "./KidemIhbarFiltre";
import KidemIhbarEkle from "./KidemIhbarEkle";
import YilSecici from "../YilSecici";
import SonrakiYilaAktar from "../SonrakiYilaAktar";

const INITIAL_FILTERS: KidemIhbarFilters = { Tip: "ALL" };

type Props = {
  enabled: boolean;
};

const KidemIhbarListesi = ({ enabled }: Props) => {
  const { data: savedContext } = useCurrentContext();
  const sessionYil = String(
    savedContext?.Yil || new Date().getFullYear().toString(),
  );
  const deleteKidemIhbar = useDeleteKidemIhbar();
  const aktarKidemIhbar = useAktarKidemIhbar();

  // null → session yılı kullanılır (context sonradan gelse de doğru yıl seçilir)
  const [seciliYil, setSeciliYil] = useState<string | null>(null);
  const yil = seciliYil ?? sessionYil;

  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openKidemIhbarEkle, setOpenKidemIhbarEkle] = useState(false);
  const [openAktar, setOpenAktar] = useState(false);
  const [duzenlenecekKidemIhbar, setDuzenlenecekKidemIhbar] =
    useState<KidemIhbarType | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "kidem-ihbar-kolonlar",
  );
  const [filters, setFilters] = useState<KidemIhbarFilters>(INITIAL_FILTERS);

  const { data: kidemIhbarListesi = [], isLoading } = useKidemIhbarList(
    yil,
    enabled,
  );

  // Tip proc parametresi olmadığı için client-side filtreleniyor.
  // Arama açıklama, tip, gün değerleri ve ay adlarında yapılıyor.
  const filteredData = useMemo(() => {
    let data = kidemIhbarListesi;

    if (filters.Tip !== "ALL") {
      data = data.filter((k) => toTipValue(k.Tip) === filters.Tip);
    }

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((k) =>
      [
        k.Aciklama,
        toTipValue(k.Tip),
        k.BaslangicGun,
        k.BitisGun,
        k.HesaplanacakGun,
        getAyAdi(k.BaslangicAy),
        getAyAdi(k.BitisAy),
      ].some((v) =>
        String(v ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(query),
      ),
    );
  }, [kidemIhbarListesi, searchText, filters.Tip]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteKidemIhbar.mutate(
      { IDPersonelKidemSure: silinecekId },
      {
        onSuccess: (result) => {
          if (result && Number(result.test) !== 1) {
            toast.error("Kıdem ihbar tanımı silinemedi");
            return;
          }
          toast.success("Kıdem ihbar tanımı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Kıdem ihbar tanımı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<KidemIhbarType>[] = [
    { header: "Yıl", accessorKey: "Yil" },
    { header: "Tip", accessorKey: (row) => toTipValue(row.Tip) },
    { header: "Açıklama", accessorKey: "Aciklama" },
    { header: "Başlangıç Gün", accessorKey: "BaslangicGun" },
    { header: "Bitiş Gün", accessorKey: "BitisGun" },
    { header: "Hesaplanacak Gün", accessorKey: "HesaplanacakGun" },
    { header: "Başlangıç Ay", accessorKey: (row) => getAyAdi(row.BaslangicAy) },
    { header: "Bitiş Ay", accessorKey: (row) => getAyAdi(row.BitisAy) },
    { header: "Maksimum Değer", accessorKey: "MaksimumDeger", format: "money" },
  ];

  const columns: ColumnDef<KidemIhbarType>[] = useMemo(
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
                onClick: (r) => setDuzenlenecekKidemIhbar(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekId(Number(r.IDPersonelKidemSure)),
              },
            ]}
          />
        ),
      },
      { accessorKey: "Yil", header: "Yıl" },
      {
        accessorKey: "Tip",
        header: "Tip",
        cell: ({ row }) =>
          toTipValue(row.original.Tip) === "Kıdem" ? (
            <Badge variant="purple">Kıdem</Badge>
          ) : (
            <Badge variant="info">İhbar</Badge>
          ),
      },
      { accessorKey: "Aciklama", header: "Açıklama" },
      { accessorKey: "BaslangicGun", header: "Başlangıç Gün" },
      { accessorKey: "BitisGun", header: "Bitiş Gün" },
      { accessorKey: "HesaplanacakGun", header: "Hesaplanacak Gün" },
      {
        accessorKey: "BaslangicAy",
        header: "Başlangıç Ay",
        cell: ({ row }) => getAyAdi(row.original.BaslangicAy),
      },
      {
        accessorKey: "BitisAy",
        header: "Bitiş Ay",
        cell: ({ row }) => getAyAdi(row.original.BitisAy),
      },
      {
        accessorKey: "MaksimumDeger",
        header: "Maksimum Değer",
        cell: ({ row }) => formatMoney(row.original.MaksimumDeger),
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
          <KidemIhbarFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />
          <YilSecici value={yil} onChange={setSeciliYil} />

          <Button
            type="button"
            size="sm"
            onClick={() => setOpenKidemIhbarEkle(true)}
          >
            <Plus className="size-4" />
            Kıdem İhbar Ekle
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
            title={`Kıdem İhbar Tanımları ${yil}`}
            fileName={`kidem-ihbar-tanimlari-${yil}`}
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
        title="Kıdem ihbar tanımını sil"
        description="Bu kıdem/ihbar tanımı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteKidemIhbar.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openKidemIhbarEkle && (
        <KidemIhbarEkle
          open={openKidemIhbarEkle}
          onOpenChange={setOpenKidemIhbarEkle}
          defaultYil={yil}
        />
      )}

      {duzenlenecekKidemIhbar && (
        <KidemIhbarEkle
          open={Boolean(duzenlenecekKidemIhbar)}
          onOpenChange={(open) => !open && setDuzenlenecekKidemIhbar(null)}
          defaultYil={yil}
          kidemIhbar={duzenlenecekKidemIhbar}
        />
      )}

      {openAktar && (
        <SonrakiYilaAktar
          open={openAktar}
          onOpenChange={setOpenAktar}
          mevcutYil={yil}
          onAktarildi={setSeciliYil}
          konu="Kıdem ihbar tanımları"
          aktar={aktarKidemIhbar.mutateAsync}
          isPending={aktarKidemIhbar.isPending}
        />
      )}
    </div>
  );
};

export default KidemIhbarListesi;
