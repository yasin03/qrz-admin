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
  UserCog,
  QrCode,
} from "lucide-react";

import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { useDeleteLokasyon, useLokasyonList } from "@/hooks/use-lokasyon";
import { LokasyonFilters, LokasyonType } from "@/types/lokasyon";
import LokasyonFiltre from "./LokasyonFiltre";
import LokasyonEkle from "./LokasyonEkle";
import { LokasyonQrData } from "@/lib/qr-utils";
import { QrKodDialog } from "./QRKodDialog";
import { useBolumler } from "@/hooks/use-kurumsal-data";
import { useCurrentContext } from "@/hooks/use-context";

const INITIAL_FILTERS: LokasyonFilters = {
  IDBolum: "",
  LokasyonAdi: "",
  Aktif: null,
};

const Lokasyon = () => {
  const { data: savedContext, isLoading: isLoadingContext } =
    useCurrentContext();
  const [filters, setFilters] = useState<LokasyonFilters>(INITIAL_FILTERS);
  const deleteLokasyon = useDeleteLokasyon();
  const [searchText, setSearchText] = useState("");
  const [openLokasyonEkle, setOpenLokasyonEkle] = useState(false);
  const [duzenlenecekId, setDuzenlenecekId] = useState<string | number | null>(
    null,
  );
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LokasyonQrData | null>(null);

  const {
    data: lokasyonListesi = [],
    isLoading: isLoadingLokasyon,
    refetch: refetchLokasyonListesi,
  } = useLokasyonList(INITIAL_FILTERS);

  const {
    data: bolumler = [],
    isLoading: isLoadingSubeler,
    isError: isErrorSubeler,
  } = useBolumler(Number(savedContext?.IDSube));

  const bolumOptions = useMemo(() => {
    const map = new Map<string, string>();

    bolumler.forEach((bolum) => {
      map.set(String(bolum.IDBolum), bolum.BolumAdi);
    });

    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [bolumler]);

  const seciliLokasyon = useMemo(
    () =>
      duzenlenecekId === null
        ? null
        : (lokasyonListesi.find(
            (item) => String(item.IDBolumLokasyon) === String(duzenlenecekId),
          ) ?? null),
    [duzenlenecekId, lokasyonListesi],
  );

  const filteredLokasyonListesi = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");

    return lokasyonListesi.filter((lokasyon) => {
      const selectedBolum = String(filters.IDBolum || "");
      const matchesBolum =
        selectedBolum === "" || String(lokasyon.IDBolum) === selectedBolum;
      const matchesAktif =
        filters.Aktif === null || lokasyon.Aktif === filters.Aktif;

      const matchesSearch =
        query.length === 0 ||
        lokasyon.BolumAdi.toLocaleLowerCase("tr-TR").includes(query) ||
        lokasyon.LokasyonAdi.toLocaleLowerCase("tr-TR").includes(query) ||
        lokasyon.Enlem.toLocaleLowerCase("tr-TR").includes(query) ||
        lokasyon.Boylam.toLocaleLowerCase("tr-TR").includes(query);

      return matchesBolum && matchesAktif && matchesSearch;
    });
  }, [lokasyonListesi, searchText, filters]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteLokasyon.mutate(
      { IDBolumLokasyon: silinecekId },
      {
        onSuccess: () => {
          toast.success("Lokasyon silindi");
          refetchLokasyonListesi();
          setSearchText("");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Lokasyon silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  // ---- 3. Kolon tanımları ----------------------------------------------
  const columns: ColumnDef<LokasyonType>[] = [
    {
      id: "actions",
      size: 20,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const rowdata = row.original;

        const actions: RowAction<LokasyonType>[] = [
          {
            label: "Düzenle",
            icon: Pencil,
            onClick: (r) => setDuzenlenecekId(r.IDBolumLokasyon),
          },
          {
            label: "QR Kod Oluştur",
            icon: QrCode,
            disabled: !rowdata.Aktif,
            onClick: (r: LokasyonQrData) => {
              setSelectedRow(r);
              setQrDialogOpen(true);
            },
          },
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            separatorBefore: true,
            onClick: (r) => setSilinecekId(r.IDBolumLokasyon),
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
      accessorKey: "BolumAdi",
      header: "Bölüm Adı",
      cell: ({ row }) => <span className="">{row.original.BolumAdi}</span>,
    },

    {
      accessorKey: "LokasyonAdi",
      header: "Lokasyon Adı",
      cell: ({ row }) => <span className="">{row.original.LokasyonAdi}</span>,
    },

    {
      accessorKey: "Enlem",
      header: "Enlem",
      cell: ({ row }) => <span>{row.original.Enlem}</span>,
    },
    {
      accessorKey: "Boylam",
      header: "Boylam",
      cell: ({ row }) => <span>{row.original.Boylam}</span>,
    },

    {
      accessorKey: "Aktif",
      header: "Durum",
      cell: ({ row }) => {
        const durum = row.original.Aktif;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lokasyon Yönetimi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Ara..."
            className="w-48"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <LokasyonFiltre
            filters={{ IDBolum: filters.IDBolum, Aktif: filters.Aktif }}
            bolumOptions={bolumOptions}
            onChange={(next) =>
              setFilters((prev) => ({
                ...prev,
                IDBolum: next.IDBolum,
                Aktif: next.Aktif,
              }))
            }
            onReset={() =>
              setFilters((prev) => ({
                ...prev,
                IDBolum: "",
                Aktif: null,
              }))
            }
          />
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenLokasyonEkle(true)}
          >
            <UserPlus className="size-4" />
            Yeni Lokasyon Ekle
          </Button>
        </div>
      </div>
      <CustomDataTable
        data={filteredLokasyonListesi}
        columns={columns}
        loading={isLoadingLokasyon}
        getRowId={(row) => row.IDBolumLokasyon}
        pagination
        onRowClick={(row) => console.log("satıra tıklandı", row)}
        emptyMessage="Lokasyon bulunamadı."
      />

      <LokasyonEkle
        open={openLokasyonEkle || duzenlenecekId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenLokasyonEkle(false);
            setDuzenlenecekId(null);
          }
        }}
        id={duzenlenecekId}
        lokasyon={seciliLokasyon}
        bolumOptions={bolumOptions}
        defaultIDBolum={filters.IDBolum}
        onSuccess={() => {
          refetchLokasyonListesi();
        }}
      />

      {qrDialogOpen && (
        <QrKodDialog
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          data={selectedRow}
        />
      )}

      <ConfirmDialog
        open={!!silinecekId}
        onOpenChange={(open) => !open && setSilinecekId(null)}
        title="Lokasyonu sil"
        description={`Bu Lokasyon kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteLokasyon.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Lokasyon;
