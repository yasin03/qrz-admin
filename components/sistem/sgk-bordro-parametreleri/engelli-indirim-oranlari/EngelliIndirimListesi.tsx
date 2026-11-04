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
  useAktarEngelliIndirim,
  useDeleteEngelliIndirim,
  useEngelliIndirimList,
} from "@/hooks/sistem/use-sgk-bordro";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import { formatMoney } from "@/lib/format";
import {
  EngelliIndirimFilters,
  EngelliIndirimType,
} from "@/types/sistem/sgk-bordro";
import EngelliIndirimFiltre from "./EngelliIndirimFiltre";
import EngelliIndirimEkle from "./EngelliIndirimEkle";
import YilSecici from "../YilSecici";
import SonrakiYilaAktar from "../SonrakiYilaAktar";

const INITIAL_FILTERS: EngelliIndirimFilters = { Derece: "ALL" };

type Props = {
  enabled: boolean;
};

const EngelliIndirimListesi = ({ enabled }: Props) => {
  const { data: savedContext } = useCurrentContext();
  const sessionYil = String(
    savedContext?.Yil || new Date().getFullYear().toString(),
  );
  const deleteEngelliIndirim = useDeleteEngelliIndirim();
  const aktarEngelliIndirim = useAktarEngelliIndirim();

  // null → session yılı kullanılır (context sonradan gelse de doğru yıl seçilir)
  const [seciliYil, setSeciliYil] = useState<string | null>(null);
  const yil = seciliYil ?? sessionYil;

  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openEngelliIndirimEkle, setOpenEngelliIndirimEkle] = useState(false);
  const [openAktar, setOpenAktar] = useState(false);
  const [duzenlenecekEngelliIndirim, setDuzenlenecekEngelliIndirim] =
    useState<EngelliIndirimType | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "engelli-indirim-kolonlar",
  );
  const [filters, setFilters] =
    useState<EngelliIndirimFilters>(INITIAL_FILTERS);

  const { data: engelliIndirimListesi = [], isLoading } =
    useEngelliIndirimList(yil, enabled);

  const dereceOptions = useMemo(
    () =>
      Array.from(
        new Set(engelliIndirimListesi.map((e) => String(e.Derece))),
      ).sort((a, b) => Number(a) - Number(b)),
    [engelliIndirimListesi],
  );

  // Derece proc parametresi olmadığı için client-side filtreleniyor.
  // Arama açıklama, derece ve tutarda; tutar hem ham ("12000.5") hem formatlı ("12.000,50").
  const filteredData = useMemo(() => {
    let data = engelliIndirimListesi;

    if (filters.Derece !== "ALL") {
      data = data.filter((e) => String(e.Derece) === filters.Derece);
    }

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((e) =>
      [
        e.Aciklama,
        e.Derece,
        e.IndirimTutari,
        formatMoney(e.IndirimTutari),
      ].some((value) =>
        String(value ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(query),
      ),
    );
  }, [engelliIndirimListesi, searchText, filters.Derece]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteEngelliIndirim.mutate(
      { IDPersonelEngelliIndirim: silinecekId },
      {
        onSuccess: (result) => {
          if (result && Number(result.test) !== 1) {
            toast.error("Engelli indirimi silinemedi");
            return;
          }
          toast.success("Engelli indirimi silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Engelli indirimi silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<EngelliIndirimType>[] = [
    { header: "Yıl", accessorKey: "Yil" },
    { header: "Derece", accessorKey: "Derece" },
    { header: "Açıklama", accessorKey: "Aciklama" },
    { header: "İndirim Tutarı", accessorKey: "IndirimTutari", format: "money" },
  ];

  const columns: ColumnDef<EngelliIndirimType>[] = useMemo(
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
                onClick: (r) => setDuzenlenecekEngelliIndirim(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) =>
                  setSilinecekId(Number(r.IDPersonelEngelliIndirim)),
              },
            ]}
          />
        ),
      },
      { accessorKey: "Yil", header: "Yıl" },
      { accessorKey: "Derece", header: "Derece" },
      { accessorKey: "Aciklama", header: "Açıklama" },
      {
        accessorKey: "IndirimTutari",
        header: "İndirim Tutarı",
        cell: ({ row }) => formatMoney(row.original.IndirimTutari),
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
          <EngelliIndirimFiltre
            filters={filters}
            dereceOptions={dereceOptions}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />
          <YilSecici value={yil} onChange={setSeciliYil} />

          <Button
            type="button"
            size="sm"
            onClick={() => setOpenEngelliIndirimEkle(true)}
          >
            <Plus className="size-4" />
            Engelli İndirimi Ekle
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
            title={`Engelli İndirim Oranları ${yil}`}
            fileName={`engelli-indirim-oranlari-${yil}`}
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
        title="Engelli indirimini sil"
        description="Bu engelli indirimi kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteEngelliIndirim.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openEngelliIndirimEkle && (
        <EngelliIndirimEkle
          open={openEngelliIndirimEkle}
          onOpenChange={setOpenEngelliIndirimEkle}
          defaultYil={yil}
        />
      )}

      {duzenlenecekEngelliIndirim && (
        <EngelliIndirimEkle
          open={Boolean(duzenlenecekEngelliIndirim)}
          onOpenChange={(open) => !open && setDuzenlenecekEngelliIndirim(null)}
          defaultYil={yil}
          engelliIndirim={duzenlenecekEngelliIndirim}
        />
      )}

      {openAktar && (
        <SonrakiYilaAktar
          open={openAktar}
          onOpenChange={setOpenAktar}
          mevcutYil={yil}
          onAktarildi={setSeciliYil}
          konu="Engelli indirimleri"
          aktar={aktarEngelliIndirim.mutateAsync}
          isPending={aktarEngelliIndirim.isPending}
        />
      )}
    </div>
  );
};

export default EngelliIndirimListesi;
