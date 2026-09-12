"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { CustomDataTable } from "../customs/CustomDataTable";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import PuantajTopluSilMenu from "./PuantajTopluSilMenu";
import type { AktifPuantajAraci } from "./PuantajToolbar";
import {
  PuantajSelectRequestType,
  PuantajSelectResponseType,
} from "@/types/puantaj";
import {
  usePuantajList,
  useUpdatePuantaj,
  useDeletePuantaj,
} from "@/hooks/use-puantaj";
import { cn } from "@/lib/utils";
import { HAFTA_DATA } from "@/constants/data";
import { getPuantajBadge } from "./puantaj-helpers";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import PuantajToolbar from "./PuantajToolbar";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { CustomColumnVisibility } from "../customs/CustomColumnVisibility";

type Props = {
  selectParams: PuantajSelectRequestType;
  enabled: boolean;
};

const SELECT_WIDTH = 40;
const ADSOYAD_WIDTH = 200;
const TC_WIDTH = 130;
const TEMIZLE_CODE = "temizle";
const BOS_TUR = "BOŞ";

type SilmeModu = { type: "selected"; ids: string[] } | { type: "all" } | null;

const PuantajListesi = ({ selectParams, enabled }: Props) => {
  const {
    data: puantajData = [],
    isLoading: isPuantajLoading,
    isError: isPuantajError,
  } = usePuantajList(selectParams, enabled);
  const { izinTipleri } = usePersonelSabitTanimlar();
  const { mutateAsync: updatePuantaj, isPending: isUpdating } =
    useUpdatePuantaj();
  const { mutateAsync: deletePuantaj, isPending: isDeleting } =
    useDeletePuantaj();
  const [activeTool, setActiveTool] = useState<AktifPuantajAraci | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "puantaj-kolonlar", // localStorage anahtarı, kalıcı olsun istiyorsanız
  );
  const isPending = isUpdating || isDeleting;
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<PuantajSelectResponseType[]>(
    [],
  );
  const [silmeModu, setSilmeModu] = useState<SilmeModu>(null);

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return puantajData;
    return puantajData.filter((puantaj) => {
      return (
        puantaj.Ad?.toLocaleLowerCase("tr-TR").includes(query) ||
        puantaj.Soyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        puantaj.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        puantaj.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        puantaj.TcKimlikNo?.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [puantajData, searchText]);

  const gunSayisi = useMemo(() => {
    const yil = Number(selectParams.Yil);
    const ay = Number(selectParams.Ay);
    if (!yil || !ay) return 31;
    return new Date(yil, ay, 0).getDate();
  }, [selectParams.Yil, selectParams.Ay]);

  const handleHucreClick = (
    kayit: PuantajSelectResponseType,
    gunNo: number,
  ) => {
    if (!activeTool) {
      toast.info("Önce sağ üst menüden bir işlem seçin.");
      return;
    }

    // "Kayıt Sil" modu artık tıklanan tek hücreyi temizliyor (BOŞ koduyla update)
    const tur = activeTool.tur === TEMIZLE_CODE ? BOS_TUR : activeTool.tur;
    const saat = activeTool.tur === TEMIZLE_CODE ? "0" : activeTool.saat;

    updatePuantaj({
      IDSubePersonel: kayit.IDSubePersonel,
      Yil: kayit.Yil,
      Ay: kayit.Ay,
      Gun: String(gunNo),
      Saat: saat,
      Tur: tur,
    }).catch((error) => {
      console.error(error);
      toast.error("Puantaj güncellenirken hata oluştu.");
    });
  };

  const handleSeciliTemizle = () => {
    if (selectedRows.length === 0) {
      toast.info("Önce en az bir satır seçin.");
      return;
    }
    setSilmeModu({
      type: "selected",
      ids: selectedRows.map((r) => String(r.IDSubePersonel)),
    });
  };

  const handleHepsiniTemizle = () => {
    setSilmeModu({ type: "all" });
  };

  const handleConfirmDelete = async () => {
    if (!silmeModu) return;
    try {
      await deletePuantaj({
        IDSube: selectParams.IDSube,
        IDBolum: selectParams.IDBolum,
        Yil: selectParams.Yil,
        Ay: selectParams.Ay,
        List: silmeModu.type === "all" ? "0" : silmeModu.ids.join("-"),
      });
      toast.success("Puantaj kayıtları silindi.");
      setSelectedRows([]);
    } catch (error) {
      console.error(error);
      toast.error("Kayıtlar silinirken hata oluştu.");
    } finally {
      setSilmeModu(null);
    }
  };

  const columns: ColumnDef<PuantajSelectResponseType>[] = useMemo(() => {
    const sabitColumns: ColumnDef<PuantajSelectResponseType>[] = [
      {
        accessorKey: "AdSoyad",
        header: "Ad Soyad",
        size: ADSOYAD_WIDTH,
        meta: {
          headerClassName: "sticky z-30 bg-background border-r border-border",
          cellClassName: "sticky z-20 bg-background border-r border-border",
          stickyLeft: SELECT_WIDTH,
        },
      },
      {
        accessorKey: "TcKimlikNo",
        header: "TC Kimlik No",
        size: TC_WIDTH,
        meta: {
          headerClassName:
            "sticky z-30 bg-background border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.06)]",
          cellClassName:
            "sticky z-20 bg-background border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.06)]",
          stickyLeft: SELECT_WIDTH + ADSOYAD_WIDTH,
        },
      },
    ];

    const gunColumns: ColumnDef<PuantajSelectResponseType>[] = Array.from(
      { length: gunSayisi },
      (_, i) => {
        const gunNo = i + 1;
        const key = `G${gunNo}` as keyof PuantajSelectResponseType;

        const yil = Number(selectParams.Yil);
        const ay = Number(selectParams.Ay);
        const tarih = new Date(yil, ay - 1, gunNo);
        const jsGun = tarih.getDay();
        const haftaNo = jsGun === 0 ? 7 : jsGun;
        const hafta = HAFTA_DATA.find((item) => Number(item.value) === haftaNo);
        const isWeekend = hafta?.isWeekend ?? false;
        const shortDay = hafta?.shortTr ?? "";

        return {
          id: key,
          accessorKey: key,
          header: () => (
            <div
              className={cn(
                "flex flex-col items-center justify-center leading-tight",
                isWeekend && "text-red-500",
              )}
            >
              <span className="font-medium">{gunNo}</span>
              <span className="text-[10px] font-normal">{shortDay}</span>
            </div>
          ),
          size: 40,
          enableSorting: false,
          meta: {
            headerClassName: cn(
              "border-r border-border text-center",
              isWeekend && "bg-red-50 text-red-500",
            ),
            cellClassName: cn(
              "relative p-0 border-r border-border text-center hover:bg-primary/10 hover:ring-1 hover:ring-inset hover:ring-primary/40 transition-colors",
              isWeekend && "bg-red-50/50",
              activeTool?.tur === TEMIZLE_CODE &&
                "hover:bg-destructive/10 hover:ring-destructive/40",
            ),
          },
          cell: ({ row, getValue }) => {
            const value = getValue<string | null>();
            const trimmed = value?.trim();
            const kayit = row.original;
            const badge = getPuantajBadge(trimmed);

            return (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleHucreClick(kayit, gunNo)}
                className={cn(
                  "absolute inset-0 z-10 flex items-center justify-center",
                  activeTool ? "cursor-pointer" : "cursor-default",
                )}
              >
                {badge && (
                  <span
                    className={cn(
                      "inline-flex min-w-7 items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </button>
            );
          },
        };
      },
    );

    return [...sabitColumns, ...gunColumns];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gunSayisi, activeTool, isPending]);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center justify-end gap-2">
        <div className="w-48 shrink-0">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Ara..."
            className="w-full"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="shrink-0">
          <PuantajTopluSilMenu
            seciliSayisi={selectedRows.length}
            onSeciliTemizle={handleSeciliTemizle}
            onHepsiniTemizle={handleHepsiniTemizle}
          />
        </div>

        <div className="shrink-0">
          <PuantajToolbar
            izinTipleri={izinTipleri ?? []}
            value={activeTool}
            onChange={setActiveTool}
          />
        </div>
        <div className="shrink-0">
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
        loading={isPuantajLoading}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        selectableRows
        onSelectedRowsChange={({ selectedRows }) =>
          setSelectedRows(selectedRows)
        }
        emptyMessage={
          isPuantajError
            ? "Kayıtlar yüklenirken hata oluştu."
            : "Puantaj kaydı bulunamadı."
        }
      />

      <ConfirmDialog
        open={!!silmeModu}
        onOpenChange={(open) => !open && setSilmeModu(null)}
        title="Puantaj kayıtları silinsin mi?"
        description={
          silmeModu?.type === "all"
            ? `${selectParams.Ay}/${selectParams.Yil} dönemine ait TÜM personelin puantaj kayıtları silinecek. Bu işlem geri alınamaz.`
            : silmeModu?.type === "selected"
              ? `Seçili ${silmeModu.ids.length} personelin ${selectParams.Ay}/${selectParams.Yil} dönemine ait puantaj kayıtları silinecek. Bu işlem geri alınamaz.`
              : ""
        }
        confirmLabel="Evet, Sil"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default PuantajListesi;
