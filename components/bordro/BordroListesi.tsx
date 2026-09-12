"use client";

import { useMemo, useState } from "react";
import { useMemo as useMemoAlias } from "react"; // (gereksiz, kaldırıldı aşağıda)
import { useBordroList } from "@/hooks/use-bordro";
import { useCurrentContext } from "@/hooks/use-context";
import { CustomDataTable } from "../customs/CustomDataTable";
import { Input } from "../ui/input";
import {
  BrushCleaning,
  CalculatorIcon,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { BordroResponseType } from "@/types/bordro";
import { RowAction, RowActions } from "../customs/RowActions";
import { formatMoney } from "@/lib/format";
import {
  useHesaplaBordro,
  useHesapSilBordro,
  useOnaylaBordro,
} from "@/hooks/use-bordro";
import { toast } from "sonner";
import BordroTopluIslemMenu from "./BordroTopluIslemMenu";
import { cn } from "@/lib/utils";
import { CustomColumnVisibility } from "../customs/CustomColumnVisibility";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const ACTIONS_WIDTH = 50;
const TC_WIDTH = 160;
const ADSOYAD_WIDTH = 180;

const BordroListesi = () => {
  const { data: savedContext } = useCurrentContext();

  const params = {
    IDSube: savedContext?.IDSube || "0",
    IDBolum: savedContext?.IDBolum || "0",
    Yil: savedContext?.Yil || new Date().getFullYear().toString(),
    Ay: (savedContext?.Ay || (new Date().getMonth() + 1).toString()).padStart(
      2,
      "0",
    ),
    Adi: "",
    TcKimlikNo: "",
  };

  const {
    data: bordroData = [],
    isLoading: isBordroLoading,
    isError: isBordroError,
  } = useBordroList(params, true);

  const { mutateAsync: hesapla } = useHesaplaBordro();
  const { mutateAsync: hesapSil } = useHesapSilBordro();
  const { mutateAsync: onaylaMutate } = useOnaylaBordro();

  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<BordroResponseType[]>([]);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "bordro-kolonlar", // localStorage anahtarı, kalıcı olsun istiyorsanız
  );
  const filteredData = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return bordroData;
    return bordroData.filter((bordro) => {
      return (
        bordro.Ad?.toLocaleLowerCase("tr-TR").includes(query) ||
        bordro.Soyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        bordro.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        bordro.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        bordro.TcKimlikNo?.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [bordroData, searchText]);

  const idListesi = (rows: BordroResponseType[]) =>
    rows.map((r) => String(r.IDSubePersonel)).join("-");

  // ---- Tekil (row action) işlemler ----
  const handleTekilHesapla = (kayit: BordroResponseType) => {
    hesapla({
      IDSube: params.IDSube,
      IDSubePersonelList: String(kayit.IDSubePersonel),
      Yil: params.Yil,
      Ay: params.Ay,
    })
      .then(() => toast.success("Bordro hesaplandı."))
      .catch((e) => {
        console.error(e);
        toast.error("Hesaplama sırasında hata oluştu.");
      });
  };

  const handleTekilHesapSil = (kayit: BordroResponseType) => {
    hesapSil({
      IDSube: params.IDSube,
      IDSubePersonelList: String(kayit.IDSubePersonel),
      Yil: params.Yil,
      Ay: params.Ay,
    })
      .then(() => toast.success("Bordro hesabı temizlendi."))
      .catch((e) => {
        console.error(e);
        toast.error("Hesap temizlenirken hata oluştu.");
      });
  };

  const handleTekilOnay = (kayit: BordroResponseType) => {
    const yeniDurum = kayit.OnayTarihi == null;
    onaylaMutate({
      IDSube: params.IDSube,
      IDSubePersonelList: String(kayit.IDSubePersonel),
      Yil: params.Yil,
      Ay: params.Ay,
      OnayDurum: yeniDurum,
    })
      .then(() =>
        toast.success(yeniDurum ? "Bordro onaylandı." : "Onay kaldırıldı."),
      )
      .catch((e) => {
        console.error(e);
        toast.error("Onay işlemi sırasında hata oluştu.");
      });
  };

  // ---- Toplu işlemler ----
  const handleTumunuHesapla = () => {
    if (bordroData.length === 0) return;
    hesapla({
      IDSube: params.IDSube,
      IDSubePersonelList: idListesi(bordroData),
      Yil: params.Yil,
      Ay: params.Ay,
    })
      .then(() => toast.success("Tüm bordrolar hesaplandı."))
      .catch((e) => {
        console.error(e);
        toast.error("Hesaplama sırasında hata oluştu.");
      });
  };

  const handleTumunuTemizle = () => {
    if (bordroData.length === 0) return;
    hesapSil({
      IDSube: params.IDSube,
      IDSubePersonelList: idListesi(bordroData),
      Yil: params.Yil,
      Ay: params.Ay,
    })
      .then(() => toast.success("Tüm bordro hesapları temizlendi."))
      .catch((e) => {
        console.error(e);
        toast.error("Hesaplar temizlenirken hata oluştu.");
      });
  };

  const handleSeciliHesapla = () => {
    if (selectedRows.length === 0) {
      toast.info("Önce en az bir satır seçin.");
      return;
    }
    hesapla({
      IDSube: params.IDSube,
      IDSubePersonelList: idListesi(selectedRows),
      Yil: params.Yil,
      Ay: params.Ay,
    })
      .then(() => toast.success("Seçili bordrolar hesaplandı."))
      .catch((e) => {
        console.error(e);
        toast.error("Hesaplama sırasında hata oluştu.");
      });
  };

  const handleSeciliTemizle = () => {
    if (selectedRows.length === 0) {
      toast.info("Önce en az bir satır seçin.");
      return;
    }
    hesapSil({
      IDSube: params.IDSube,
      IDSubePersonelList: idListesi(selectedRows),
      Yil: params.Yil,
      Ay: params.Ay,
    })
      .then(() => toast.success("Seçili bordro hesapları temizlendi."))
      .catch((e) => {
        console.error(e);
        toast.error("Hesaplar temizlenirken hata oluştu.");
      });
  };

  const handleOnayla = () => {
    if (selectedRows.length === 0) {
      toast.info("Önce en az bir satır seçin.");
      return;
    }
    onaylaMutate({
      IDSube: params.IDSube,
      IDSubePersonelList: idListesi(selectedRows),
      Yil: params.Yil,
      Ay: params.Ay,
      OnayDurum: true,
    })
      .then(() => toast.success("Seçili kayıtlar onaylandı."))
      .catch((e) => {
        console.error(e);
        toast.error("Onaylama sırasında hata oluştu.");
      });
  };

  const handleOnayiKaldir = () => {
    if (selectedRows.length === 0) {
      toast.info("Önce en az bir satır seçin.");
      return;
    }
    onaylaMutate({
      IDSube: params.IDSube,
      IDSubePersonelList: idListesi(selectedRows),
      Yil: params.Yil,
      Ay: params.Ay,
      OnayDurum: false,
    })
      .then(() => toast.success("Seçili kayıtların onayı kaldırıldı."))
      .catch((e) => {
        console.error(e);
        toast.error("Onay kaldırılırken hata oluştu.");
      });
  };

  const seciliHepsiOnayli =
    selectedRows.length > 0 && selectedRows.every((r) => r.OnayTarihi != null);
  const seciliHepsiOnaysiz =
    selectedRows.length > 0 && selectedRows.every((r) => r.OnayTarihi == null);

  const columns: ColumnDef<BordroResponseType>[] = [
    {
      id: "actions",
      size: ACTIONS_WIDTH,
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        stickyLeft: 40,
        headerClassName: "sticky z-40 bg-background border-r border-border",
        cellClassName: "sticky z-30 bg-background border-r border-border",
      },
      cell: ({ row }) => {
        const kayit = row.original;
        const onayli = kayit.OnayTarihi != null;

        const actions: RowAction<BordroResponseType>[] = [
          {
            label: "Hesapla",
            icon: CalculatorIcon,
            onClick: () => handleTekilHesapla(kayit),
          },
          {
            label: "Hesabı Temizle",
            icon: BrushCleaning,
            variant: "danger",
            separatorBefore: true,
            onClick: () => handleTekilHesapSil(kayit),
          },
          {
            label: onayli ? "Onayı Kaldır" : "Onayla",
            icon: onayli ? XCircle : CheckCircle2,
            separatorBefore: true,
            variant: onayli ? "danger" : undefined,
            onClick: () => handleTekilOnay(kayit),
          },
        ];

        return (
          <div className="flex justify-end">
            <RowActions row={kayit} actions={actions} />
          </div>
        );
      },
    },

    {
      accessorKey: "TcKimlikNo",
      header: "TC Kimlik No",
      size: TC_WIDTH,
      meta: {
        stickyLeft: 40 + ACTIONS_WIDTH,
        headerClassName: "sticky z-40 bg-background border-r border-border",
        cellClassName: "sticky z-30 p-0 border-r border-border", // bg-background kaldırıldı, p-0 eklendi
      },
      cell: ({ row }) => {
        const onayli = row.original.OnayTarihi != null;
        return (
          <div
            className={cn(
              "flex h-full items-center px-3 py-3",
              onayli ? "bg-emerald-50" : "bg-red-50",
            )}
          >
            {row.original.TcKimlikNo ?? "-"}
          </div>
        );
      },
    },

    {
      accessorKey: "AdSoyad",
      header: "Ad Soyad",
      size: ADSOYAD_WIDTH,
      meta: {
        stickyLeft: 40 + ACTIONS_WIDTH + TC_WIDTH,
        headerClassName:
          "sticky z-40 bg-background border-r border-border shadow-[5px_0_8px_-6px_rgba(0,0,0,0.35)]",
        cellClassName: cn(
          "sticky z-30 p-0 border-r border-border shadow-[5px_0_8px_-6px_rgba(0,0,0,0.35)]",
        ),
      },
      cell: ({ row }) => {
        const onayli = row.original.OnayTarihi != null;
        return (
          <div
            className={cn(
              "flex h-full items-center px-3 py-3",
              onayli ? "bg-emerald-50" : "bg-red-50",
            )}
          >
            {row.original.AdSoyad ?? "-"}
          </div>
        );
      },
    },

    {
      accessorKey: "IseSonGirisTarihi2",
      header: "Göreve Başlama",
      size: 130,
      cell: ({ row }) => row.original.IseSonGirisTarihi2 ?? "-",
    },

    {
      accessorKey: "CikisTarihi2",
      header: "Görevden Ayrılma",
      size: 120,
      cell: ({ row }) => row.original.CikisTarihi2 ?? "-",
    },

    {
      accessorKey: "UcretTipi",
      header: "Ücret Tipi",
      cell: ({ row }) => (
        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium">
          {row.original.UcretTipi ?? "-"}
        </span>
      ),
    },

    {
      accessorKey: "Ucret",
      header: "Ücret",
      cell: ({ row }) => formatMoney(row.original.Ucret),
    },

    {
      accessorKey: "SgkDurumu",
      header: "SGK Durum",
      cell: ({ row }) => row.original.SgkDurumu ?? "-",
    },

    {
      accessorKey: "PersonelSgkBelgeTuru",
      header: "SGK Belge Türü",
      cell: ({ row }) => row.original.PersonelSgkBelgeTuru ?? "-",
    },

    {
      accessorKey: "SgkGunSayisi",
      header: "SGK Gün",
      cell: ({ row }) => row.original.SgkGunSayisi ?? "-",
    },

    {
      accessorKey: "CalismaGunSayisi",
      header: "Çalışma Gün",
      cell: ({ row }) => row.original.GunSayisi ?? "-",
    },

    {
      accessorKey: "SgkEksikGun",
      header: "Eksik Gün",
      cell: ({ row }) => row.original.SgkEksikGun ?? "-",
    },

    // ─────────────────────────────────────────────
    // YEMEK / YOL
    // ─────────────────────────────────────────────
    {
      accessorKey: "ToplamYemek",
      header: "Toplam Yemek",
      size: 120,
      cell: ({ row }) => formatMoney(row.original.ToplamYemek),
    },

    {
      accessorKey: "BrutToplamYemek",
      header: "Brüt Toplam Yemek",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.BrutToplamYemek),
    },

    {
      accessorKey: "ToplamYol",
      header: "Toplam Yol",
      size: 120,
      cell: ({ row }) => formatMoney(row.original.ToplamYol),
    },

    {
      accessorKey: "BrutToplamYol",
      header: "Brüt Toplam Yol",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.BrutToplamYol),
    },

    // ─────────────────────────────────────────────
    // BRÜT ÖDEMELER
    // ─────────────────────────────────────────────
    {
      accessorKey: "BrutGunOdemeler",
      header: "Brüt Toplam Günler Saatler",
      size: 180,
      cell: ({ row }) => formatMoney(row.original.BrutGunOdemeler),
    },

    {
      accessorKey: "BrutMesaiOdemeler",
      header: "Brüt Toplam Mesailer",
      size: 160,
      cell: ({ row }) => formatMoney(row.original.BrutMesaiOdemeler),
    },

    {
      accessorKey: "BrutToplamYolYemek",
      header: "Brüt Toplam Yol Yemek",
      size: 170,
      cell: ({ row }) => formatMoney(row.original.BrutToplamYolYemek),
    },

    {
      accessorKey: "BrutYardimOdemeler",
      header: "Toplam Yardımlar",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.BrutYardimOdemeler),
    },

    {
      accessorKey: "BrutToplamOdemeler",
      header: "Brüt Toplam Ödemeler",
      size: 160,
      cell: ({ row }) => formatMoney(row.original.BrutToplamOdemeler),
    },

    // ─────────────────────────────────────────────
    // VERGİ / İSTİSNALAR
    // ─────────────────────────────────────────────
    {
      accessorKey: "SgkIstisnasi",
      header: "SGK İstisnası",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.SgkIstisnasi),
    },

    {
      accessorKey: "DamgaVergisiIstisnasi",
      header: "DV. İstisnası",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.DamgaVergisiIstisnasi),
    },

    {
      accessorKey: "DamgaVergisiMatrahi",
      header: "DV. Matrahı",
      size: 130,
      cell: ({ row }) => formatMoney(row.original.DamgaVergisiMatrahi),
    },

    {
      accessorKey: "DamgaVergisi",
      header: "Damga Vergisi",
      size: 130,
      cell: ({ row }) => formatMoney(row.original.DamgaVergisi),
    },

    {
      accessorKey: "IstisnaDamgaVergisi",
      header: "İstisna Damga Vergisi",
      size: 170,
      cell: ({ row }) => formatMoney(row.original.IstisnaDamgaVergisi),
    },

    {
      accessorKey: "DamgaVergisiFarki",
      header: "Kesilecek Damga Vergisi",
      size: 180,
      cell: ({ row }) => formatMoney(row.original.DamgaVergisiFarki),
    },

    // ─────────────────────────────────────────────
    // SGK
    // ─────────────────────────────────────────────
    {
      accessorKey: "SgkMatrahi",
      header: "SGK Matrahı",
      size: 130,
      cell: ({ row }) => formatMoney(row.original.SgkMatrahi),
    },

    {
      accessorKey: "SgkIsciPrimi",
      header: "SGK İşçi Primi",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.SgkIsciPrimi),
    },

    {
      accessorKey: "SgkIsverenPrimi",
      header: "SGK İşveren Primi",
      size: 160,
      cell: ({ row }) => formatMoney(row.original.SgkIsverenPrimi),
    },

    {
      accessorKey: "SgkIssizIsciPrimi",
      header: "SGK İşsiz İşçi Primi",
      size: 180,
      cell: ({ row }) => formatMoney(row.original.SgkIssizIsciPrimi),
    },

    {
      accessorKey: "SgkIssizIsverenPrimi",
      header: "SGK İşsiz İşveren Primi",
      size: 200,
      cell: ({ row }) => formatMoney(row.original.SgkIssizIsverenPrimi),
    },

    // ─────────────────────────────────────────────
    // VERGİ MATRAHI / İNDİRİMLER
    // ─────────────────────────────────────────────
    {
      accessorKey: "KumulatifVergiMatrahi",
      header: "D. Kümülatif Vergi Matrahı",
      size: 200,
      cell: ({ row }) => formatMoney(row.original.KumulatifVergiMatrahi),
    },

    {
      accessorKey: "VergiMatrahi",
      header: "Gelir Vergisi Matrahı",
      size: 170,
      cell: ({ row }) => formatMoney(row.original.VergiMatrahi),
    },

    {
      accessorKey: "SendikaKesintisi",
      header: "Sendika İndirimi",
      size: 150,
      cell: ({ row }) => formatMoney(row.original.SendikaKesintisi),
    },

    {
      accessorKey: "VergiIndirimi",
      header: "Vergi İndirimi",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.VergiIndirimi),
    },

    {
      accessorKey: "PersonelIndirimi",
      header: "Diğer Vergi İndirimleri",
      size: 190,
      cell: ({ row }) => formatMoney(row.original.PersonelIndirimi),
    },

    {
      accessorKey: "IndirimSonrasiVergiMatrahi",
      header: "İndirim Sonrası V.M.",
      size: 180,
      cell: ({ row }) => formatMoney(row.original.IndirimSonrasiVergiMatrahi),
    },

    {
      accessorKey: "GelirVergisi",
      header: "Gelir Vergisi",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.GelirVergisi),
    },

    {
      accessorKey: "AuKumulatifVergiMatrahi",
      header: "AÜ. Kümülatif VM.",
      size: 170,
      cell: ({ row }) => formatMoney(row.original.AuKumulatifVergiMatrahi),
    },

    {
      accessorKey: "AuGelirVergisi",
      header: "AÜ Gelir Vergisi",
      size: 160,
      cell: ({ row }) => formatMoney(row.original.AuGelirVergisi),
    },

    {
      accessorKey: "IstisnaGelirVergisi",
      header: "İstisna Gelir Vergisi",
      size: 170,
      cell: ({ row }) => formatMoney(row.original.IstisnaGelirVergisi),
    },

    {
      accessorKey: "GelirVergisiFarki",
      header: "Kesilecek Gelir Vergisi",
      size: 180,
      cell: ({ row }) => formatMoney(row.original.GelirVergisiFarki),
    },

    {
      accessorKey: "YasalKesintilerToplami",
      header: "Yasal Kesintiler Toplamı",
      size: 190,
      cell: ({ row }) => formatMoney(row.original.YasalKesintilerToplami),
    },

    // ─────────────────────────────────────────────
    // NET
    // ─────────────────────────────────────────────
    {
      accessorKey: "NetOdenen",
      header: "NET ÖDENEN",
      size: 140,
      cell: ({ row }) => formatMoney(row.original.NetOdenen),
    },

    {
      accessorKey: "KesintilerToplami",
      header: "Kesintiler Toplamı",
      size: 160,
      cell: ({ row }) => formatMoney(row.original.KesintilerToplami),
    },

    {
      accessorKey: "OdenecekTutar",
      header: "ÖDENECEK TUTAR",
      size: 160,
      cell: ({ row }) => formatMoney(row.original.OdenecekTutar),
    },

    // ─────────────────────────────────────────────
    // TARİH
    // ─────────────────────────────────────────────
    {
      accessorKey: "HesaplamaTarihi2",
      header: "Hesaplama Tarihi",
      size: 160,
      cell: ({ row }) => row.original.HesaplamaTarihi2 ?? "-",
    },

    {
      accessorKey: "OnayTarihi",
      header: "Onay Durumu",
      cell: ({ row }) =>
        row.original.OnayTarihi ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            Onaylı
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500">
            <XCircle className="size-3.5" />
            Onaysız
          </span>
        ),
    },
  ];

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
          <BordroTopluIslemMenu
            seciliSayisi={selectedRows.length}
            seciliHepsiOnayli={seciliHepsiOnayli}
            seciliHepsiOnaysiz={seciliHepsiOnaysiz}
            onTumunuHesapla={handleTumunuHesapla}
            onTumunuTemizle={handleTumunuTemizle}
            onSeciliHesapla={handleSeciliHesapla}
            onSeciliTemizle={handleSeciliTemizle}
            onOnayla={handleOnayla}
            onOnayiKaldir={handleOnayiKaldir}
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
        loading={isBordroLoading}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        selectableRows
        onSelectedRowsChange={({ selectedRows }) =>
          setSelectedRows(selectedRows)
        }
        emptyMessage={
          isBordroError
            ? "Kayıtlar yüklenirken hata oluştu."
            : "Bordro kaydı bulunamadı."
        }
      />
    </div>
  );
};

export default BordroListesi;
