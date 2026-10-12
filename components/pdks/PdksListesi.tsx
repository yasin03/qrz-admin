"use client";

import { Eye, EyeOff, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { format, parse } from "date-fns";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { CustomDataTable } from "../customs/CustomDataTable";
import { CustomDateNavigator } from "../customs/CustomDateNavigator";
import { RowActions } from "../customs/RowActions";
import {
  useDeletePdks,
  usePdksList,
  useUpdatePdksSaat,
} from "@/hooks/use-pdks";
import {
  PDKSSelectRequestType,
  PDKSSelectResponseType,
  PDKSUpdateInput,
  PdksYon,
} from "@/types/pdks";
import { Input } from "../ui/input";
import { useMemo, useState } from "react";
import { normalize } from "@/lib/utils";
import PdksFiltre, { PdksFiltreValues } from "./PdksFiltre";
import PdksDetay from "./PdksDetay";
import SaatSecici from "./SaatSecici";
import { ExportMenu } from "../export/ExportMenu";
import { CustomColumnVisibility } from "../customs/CustomColumnVisibility";
import { ExportColumn } from "../export/types";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

type Props = {
  enabled: boolean;
};

const PdksListesi = ({ enabled }: Props) => {
  const [tarih, setTarih] = useState(() => format(new Date(), "yyyy-MM-dd"));
  // Şube/bölüm filtresi context yüklenince PdksFiltre'den gelir; o zamana kadar sorgu atılmaz
  const [bolumFiltre, setBolumFiltre] = useState<PdksFiltreValues | null>(
    null,
  );
  const pdksFilters: PDKSSelectRequestType = {
    IDSube: bolumFiltre?.IDSube ?? "0",
    IDBolum: bolumFiltre?.IDBolum ?? "0",
    Tarih: tarih,
  };
  const {
    data: pdksData = [],
    isLoading: isPdksLoading,
    isError: isPdksError,
  } = usePdksList(pdksFilters, enabled && bolumFiltre !== null);
  const [searchText, setSearchText] = useState("");

  const filteredPdksData = useMemo(() => {
    const search = normalize(searchText.trim());
    const girisYok = bolumFiltre?.GirisYok ?? false;
    const cikisYok = bolumFiltre?.CikisYok ?? false;

    if (!search && !girisYok && !cikisYok) return pdksData;

    return pdksData.filter((kayit) => {
      // Eksik veri filtreleri birlikte seçilirse ikisi de eksik olanlar kalır
      if (girisYok && kayit.Giris?.trim()) return false;
      if (cikisYok && kayit.Cikis?.trim()) return false;
      if (!search) return true;

      return [kayit.AdSoyad, kayit.Tarih, kayit.Giris, kayit.Cikis].some(
        (value) => value && normalize(String(value)).includes(search),
      );
    });
  }, [pdksData, searchText, bolumFiltre?.GirisYok, bolumFiltre?.CikisYok]);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("pdks-kolonlar");

  // ---- Saat güncelleme --------------------------------------------------
  // Seçilen saat, Giriş/Çıkış hücresine tıklanınca o kayda; satırlar seçiliyse
  // kaydet butonuyla seçili kayıtların hepsine uygulanır.
  const [girisSaat, setGirisSaat] = useState("09:00");
  const [cikisSaat, setCikisSaat] = useState("18:00");
  const [selectedRows, setSelectedRows] = useState<PDKSSelectResponseType[]>(
    [],
  );
  const updateSaat = useUpdatePdksSaat();
  const pendingUpdate = updateSaat.isPending ? updateSaat.variables : undefined;
  // Toplu kayıt sürerken spinner hücrelerde değil kaydet butonunda gösterilir
  const [topluKaydedilenYon, setTopluKaydedilenYon] = useState<PdksYon | null>(
    null,
  );

  const saatGuncelle = (payload: PDKSUpdateInput, kayitSayisi: number) => {
    updateSaat.mutate(payload, {
      onSuccess: () => {
        toast.success(
          kayitSayisi > 1
            ? `${kayitSayisi} kaydın ${payload.Yon.toLocaleLowerCase("tr-TR")} saati ${payload.Saat} olarak güncellendi`
            : `${payload.Yon} saati ${payload.Saat} olarak güncellendi`,
        );
      },
      onError: (err) => {
        toast.error("Saat güncellenemedi", {
          description: err.message || "Lütfen daha sonra tekrar deneyiniz.",
        });
      },
      onSettled: () => setTopluKaydedilenYon(null),
    });
  };

  const handleHucreClick = (kayit: PDKSSelectResponseType, yon: PdksYon) => {
    saatGuncelle(
      {
        IDSubePersonelSaat: String(kayit.IDSubePersonelSaat),
        Yon: yon,
        Saat: yon === "Giriş" ? girisSaat : cikisSaat,
      },
      1,
    );
  };

  const handleTopluKaydet = (yon: PdksYon) => {
    if (!selectedRows.length) return;
    setTopluKaydedilenYon(yon);
    saatGuncelle(
      {
        IDSubePersonelSaat: selectedRows
          .map((r) => r.IDSubePersonelSaat)
          .join("-"),
        Yon: yon,
        Saat: yon === "Giriş" ? girisSaat : cikisSaat,
      },
      selectedRows.length,
    );
  };

  const renderSaatHucresi = (
    kayit: PDKSSelectResponseType,
    yon: PdksYon,
    deger: string | null,
  ) => {
    const yeniSaat = yon === "Giriş" ? girisSaat : cikisSaat;
    const isPending =
      !topluKaydedilenYon &&
      pendingUpdate?.Yon === yon &&
      pendingUpdate.IDSubePersonelSaat === String(kayit.IDSubePersonelSaat);

    return (
      <button
        type="button"
        disabled={updateSaat.isPending}
        title={`${yon} saatini ${yeniSaat} yap`}
        onClick={(event) => {
          // satıra tıklayınca açılan detay tetiklenmesin
          event.stopPropagation();
          handleHucreClick(kayit, yon);
        }}
        className="inline-flex min-w-14 items-center justify-center rounded-md border border-dashed border-transparent px-2 py-0.5 tabular-nums transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:cursor-wait"
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : deger ?? "-"}
      </button>
    );
  };

  // ---- Temizleme ----------------------------------------------------------
  // Satır menüsünden tek kayıt, başlık menüsünden seçili kayıtlar temizlenir.
  const deletePdks = useDeletePdks();
  const [temizlenecekler, setTemizlenecekler] = useState<
    PDKSSelectResponseType[] | null
  >(null);
  const tarihGosterim = format(
    parse(tarih, "yyyy-MM-dd", new Date()),
    "dd.MM.yyyy",
  );

  const temizlemeAciklamasi = !temizlenecekler?.length
    ? ""
    : `${
        temizlenecekler.length === 1
          ? `"${temizlenecekler[0].AdSoyad}" personelinin`
          : `Seçili ${temizlenecekler.length} personelin`
      } ${tarihGosterim} tarihine ait tüm giriş çıkış verileri temizlenecektir. Devam etmek istiyor musunuz?`;

  const handleTemizleConfirm = () => {
    if (!temizlenecekler?.length) return;
    const adet = temizlenecekler.length;

    deletePdks.mutate(
      {
        IDSubePersonelSaat: temizlenecekler
          .map((r) => r.IDSubePersonelSaat)
          .join("-"),
      },
      {
        onSuccess: () => {
          toast.success(
            adet > 1
              ? `${adet} personelin giriş çıkış verileri temizlendi`
              : "Giriş çıkış verileri temizlendi",
          );
          setTemizlenecekler(null);
        },
        onError: (err) => {
          toast.error("Kayıtlar temizlenemedi", {
            description: err.message || "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<PDKSSelectResponseType>[] = [
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Tarih", accessorKey: "Tarih" },
    { header: "Giriş", accessorKey: "Giris" },
    { header: "Çıkış", accessorKey: "Cikis" },
    { header: "NormalSure", accessorKey: "NormalSure" },
    { header: "MesaiSure", accessorKey: "MesaiSure" },
    { header: "IzinSure", accessorKey: "IzinSure" },
    { header: "ToplamSure", accessorKey: "ToplamSure" },
  ];

  const columns: ColumnDef<PDKSSelectResponseType>[] = [
    {
      id: "actions",
      size: 50,
      enableSorting: false,
      header: () => (
        <RowActions
          triggerLabel="Toplu işlemler"
          actions={[
            {
              label: selectedRows.length
                ? `Seçilileri Temizle (${selectedRows.length})`
                : "Seçilileri Temizle",
              icon: Trash2,
              variant: "danger",
              disabled: selectedRows.length === 0,
              onClick: () => setTemizlenecekler(selectedRows),
            },
          ]}
        />
      ),
      cell: ({ row, table }) => {
        // CustomDataTable expand state'ine meta üzerinden erişiliyor
        const meta = table.options.meta as
          | {
              expandedRows?: Record<string, boolean>;
              toggleRowExpanded?: (id: string) => void;
            }
          | undefined;
        const isExpanded = Boolean(meta?.expandedRows?.[row.id]);

        return (
          <RowActions
            row={row.original}
            actions={[
              {
                label: isExpanded ? "Detayı Gizle" : "Detay Göster",
                icon: isExpanded ? EyeOff : Eye,
                onClick: () => meta?.toggleRowExpanded?.(row.id),
              },
              { label: "Düzenle", icon: Pencil, onClick: (r) => console.log(r) },
              { divider: true },
              {
                label: "Temizle",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setTemizlenecekler([r]),
              },
            ]}
          />
        );
      },
    },
    { accessorKey: "AdSoyad", header: "Ad Soyad" },
    { accessorKey: "Tarih", header: "Tarih" },
    {
      accessorKey: "Giris",
      header: "İlk Giriş",
      cell: ({ row }) =>
        renderSaatHucresi(row.original, "Giriş", row.original.Giris),
    },
    {
      accessorKey: "Cikis",
      header: "Son Çıkış",
      cell: ({ row }) =>
        renderSaatHucresi(row.original, "Çıkış", row.original.Cikis),
    },
    {
      accessorKey: "NormalSure",
      header: "Normal Süre",
      cell: ({ row }) => row.original.NormalSure ?? "-",
    },
    {
      accessorKey: "MesaiSure",
      header: "Mesai Süresi",
      cell: ({ row }) => row.original.MesaiSure ?? "-",
    },
    {
      accessorKey: "IzinSure",
      header: "İzin Süresi",
      cell: ({ row }) => row.original.IzinSure ?? "-",
    },
    {
      accessorKey: "ToplamSure",
      header: "Toplam Süre",
      cell: ({ row }) => row.original.ToplamSure ?? "-",
    },
  ];

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-3 sm:mr-auto">
          {(["Giriş", "Çıkış"] as const).map((yon) => (
            <SaatSecici
              key={yon}
              yon={yon}
              value={yon === "Giriş" ? girisSaat : cikisSaat}
              onChange={yon === "Giriş" ? setGirisSaat : setCikisSaat}
              showSave={selectedRows.length > 0}
              onSave={() => handleTopluKaydet(yon)}
              saving={topluKaydedilenYon === yon}
              saveLabel={`${yon} saatini seçili ${selectedRows.length} kayda uygula`}
            />
          ))}
        </div>
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CustomDateNavigator value={tarih} onChange={setTarih} />
          <PdksFiltre onApply={setBolumFiltre} />
          <ExportMenu
            data={pdksData}
            exportColumns={exportColumns}
            title="İzin Listesi"
            fileName="izin-listesi"
            showImport
            onImport={(rows) => {
              // rows: Record<string, unknown>[] — Excel'den okunan ham satırlar
              // burada kendi doğrulama + toplu ekleme API çağrını yapabilirsin
              console.log("İçe aktarılan izin:", rows);
            }}
          />
          <CustomColumnVisibility
            columns={columns}
            value={columnVisibility}
            onChange={setColumnVisibility}
          />
        </div>
      </div>
      <CustomDataTable
        data={filteredPdksData}
        columns={columns}
        getRowId={(row) => String(row.IDSubePersonelSaat)}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        loading={isPdksLoading}
        pagination
        selectableRows
        onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
        expandable
        expandOnRowClick
        expandedRowContent={(row) => (
          <PdksDetay idSubePersonelSaat={row.original.IDSubePersonelSaat} />
        )}
        emptyMessage={
          isPdksError
            ? "Kayıtlar yüklenirken hata oluştu."
            : "Pdks kaydı bulunamadı."
        }
      />

      <ConfirmDialog
        open={!!temizlenecekler}
        onOpenChange={(open) => !open && setTemizlenecekler(null)}
        title="Giriş çıkış verilerini temizle"
        description={temizlemeAciklamasi}
        variant="danger"
        confirmLabel="Temizle"
        isLoading={deletePdks.isPending}
        onConfirm={handleTemizleConfirm}
      />
    </div>
  );
};

export default PdksListesi;
