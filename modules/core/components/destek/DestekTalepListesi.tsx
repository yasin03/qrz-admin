"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CircleCheck,
  CircleDot,
  Inbox,
  Lock,
  LockOpen,
  Mail,
  MessageCircleQuestion,
  Plus,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KULLANICI_TIPI } from "@/lib/roles";
import { useHasRole } from "@/stores/auth-store";
import {
  useChangeDestekTalepDurumu,
  useDeleteDestekTalep,
  useDestekKonuList,
  useDestekTalepList,
} from "@/modules/core/hooks/use-destek";
import {
  DestekTalepFilters,
  DestekTalepType,
} from "@/modules/core/types/destek";
import DestekFiltre from "./DestekFiltre";
import { DURUM_BADGE, ONCELIK_BADGE } from "./destek-options";
import DestekTalepEkle from "./DestekTalepEkle";
import DestekMesajDrawer from "./DestekMesajDrawer";

const INITIAL_FILTERS: DestekTalepFilters = {
  Durumu: "ALL",
  Oncelik: "ALL",
  Konu: "ALL",
};

const formatDateTime = (value: string | null) =>
  value ? formatDate(value, "dd.MM.yyyy HH:mm") : "-";

const toOptions = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).map((v) => ({
    value: v,
    label: v,
  }));

const DestekTalepListesi = () => {
  const isAdmin = useHasRole(KULLANICI_TIPI.ADMIN);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<DestekTalepFilters>(INITIAL_FILTERS);
  const [openTalepEkle, setOpenTalepEkle] = useState(false);
  const [seciliTalep, setSeciliTalep] = useState<DestekTalepType | null>(null);
  const [silinecek, setSilinecek] = useState<DestekTalepType | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "destek-talep-kolonlar",
  );

  const { data: talepListesi = [], isLoading } = useDestekTalepList();

  const { data: konuListesi = [] } = useDestekKonuList();
  const { mutate: changeDurum, isPending: isChangingDurum } =
    useChangeDestekTalepDurumu();
  const deleteTalep = useDeleteDestekTalep();

  const handleDeleteConfirm = () => {
    if (!silinecek) return;

    deleteTalep.mutate(
      { IDDestekTakip: silinecek.IDDestekTakip },
      {
        onSuccess: () => {
          toast.success("Destek talebi silindi");
          setSilinecek(null);
        },
        onError: () => {
          toast.error("Destek talebi silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const handleDurumDegistir = useCallback(
    (talep: DestekTalepType) => {
      const yeniDurum = talep.Durumu === "KAPALI" ? "AÇIK" : "KAPALI";

      changeDurum(
        { IDDestekTakip: talep.IDDestekTakip, Durumu: yeniDurum },
        {
          onSuccess: () => {
            toast.success(
              yeniDurum === "KAPALI"
                ? "Destek talebi kapatıldı"
                : "Destek talebi yeniden açıldı",
            );
          },
          onError: () => {
            toast.error("Talep durumu değiştirilemedi", {
              description: "Lütfen daha sonra tekrar deneyiniz.",
            });
          },
        },
      );
    },
    [changeDurum],
  );

  const konuOptions = useMemo(
    () => toOptions(konuListesi.map((k) => k.Konu)),
    [konuListesi],
  );

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");

    return talepListesi.filter((t) => {
      const matchesDurum =
        filters.Durumu === "ALL" || t.Durumu === filters.Durumu;
      const matchesOncelik =
        filters.Oncelik === "ALL" || t.Oncelik === filters.Oncelik;
      const matchesKonu = filters.Konu === "ALL" || t.Konu === filters.Konu;

      const matchesSearch =
        query.length === 0 ||
        [
          t.IDDestekTakip,
          t.Baslik,
          t.Konu,
          t.KullaniciAdi,
          t.SirketAdi,
          t.GurupAdi,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLocaleLowerCase("tr-TR").includes(query));

      return matchesDurum && matchesOncelik && matchesKonu && matchesSearch;
    });
  }, [talepListesi, searchText, filters]);

  // Banner'daki özet sayılar (filtreden bağımsız, tüm talepler).
  const ozet = useMemo(
    () => ({
      toplam: talepListesi.length,
      acik: talepListesi.filter((t) => t.Durumu === "AÇIK").length,
      kapali: talepListesi.filter((t) => t.Durumu === "KAPALI").length,
      okunmamis: talepListesi.filter((t) => !t.Okundu).length,
    }),
    [talepListesi],
  );

  const handleFilterChange = useCallback(
    (next: DestekTalepFilters) => setFilters(next),
    [],
  );
  const handleFilterReset = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const exportColumns: ExportColumn<DestekTalepType>[] = [
    { header: "Talep No", accessorKey: "IDDestekTakip" },
    { header: "Başlık", accessorKey: "Baslik" },
    { header: "Konu", accessorKey: "Konu" },
    { header: "Öncelik", accessorKey: "Oncelik" },
    { header: "Durum", accessorKey: "Durumu" },
    ...(isAdmin
      ? ([
          { header: "Grup", accessorKey: "GurupAdi" },
          { header: "Şirket", accessorKey: "SirketAdi" },
        ] as ExportColumn<DestekTalepType>[])
      : []),
    { header: "Oluşturan", accessorKey: "KullaniciAdi" },
    {
      header: "Oluşturma Tarihi",
      accessorKey: (row) => formatDateTime(row.OlusturmaTarihi),
    },
  ];

  const columns: ColumnDef<DestekTalepType>[] = useMemo(
    () => [
      // Satır işlemleri şimdilik yalnızca Admin'de (durum değiştirme).
      ...(isAdmin
        ? ([
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
                      label: (r: DestekTalepType) =>
                        r.Durumu === "KAPALI"
                          ? "Talebi Yeniden Aç"
                          : "Talebi Kapat",
                      icon: (r: DestekTalepType) =>
                        r.Durumu === "KAPALI" ? LockOpen : Lock,
                      disabled: isChangingDurum,
                      onClick: handleDurumDegistir,
                    },
                    { divider: true },
                    {
                      label: "Sil",
                      icon: Trash2,
                      variant: "danger",
                      onClick: (r: DestekTalepType) => setSilinecek(r),
                    },
                  ]}
                />
              ),
            },
          ] as ColumnDef<DestekTalepType>[])
        : []),
      {
        accessorKey: "IDDestekTakip",
        header: "No",
        size: 70,
        cell: ({ row }) => (
          <span className="font-medium text-muted-foreground">
            #{row.original.IDDestekTakip}
          </span>
        ),
      },
      {
        accessorKey: "Baslik",
        header: `Başlık\nKonu`,
        size: 280,
        cell: ({ row }) => {
          const { Baslik, Konu, Okundu } = row.original;
          return (
            <span className="flex items-start gap-2">
              {!Okundu && (
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600 dark:bg-primary"
                  title="Okunmamış mesaj var"
                />
              )}
              <span className="flex flex-col gap-0.5">
                <span className={Okundu ? undefined : "font-semibold"}>
                  {Baslik || "-"}
                </span>
                <span className="text-sm text-gray-400">{Konu || "-"}</span>
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "Oncelik",
        header: "Öncelik",
        cell: ({ row }) => {
          const oncelik = row.original.Oncelik;
          return (
            <Badge variant={ONCELIK_BADGE[oncelik] ?? "gray"}>{oncelik}</Badge>
          );
        },
      },
      {
        accessorKey: "Durumu",
        header: "Durum",
        cell: ({ row }) => {
          const durum = row.original.Durumu;
          return <Badge variant={DURUM_BADGE[durum] ?? "gray"}>{durum}</Badge>;
        },
      },
      ...(isAdmin
        ? ([
            {
              accessorKey: "SirketAdi",
              header: `Şirket\nGrup`,
              size: 260,
              cell: ({ row }) => (
                <span className="flex flex-col gap-0.5">
                  <span>{row.original.SirketAdi || "-"}</span>
                  <span className="text-sm text-gray-400">
                    {row.original.GurupAdi || "-"}
                  </span>
                </span>
              ),
            },
          ] as ColumnDef<DestekTalepType>[])
        : []),
      {
        accessorKey: "KullaniciAdi",
        header: "Oluşturan",
        cell: ({ row }) => <span>{row.original.KullaniciAdi || "-"}</span>,
      },
      {
        accessorKey: "OlusturmaTarihi",
        header: "Oluşturma Tarihi",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.original.OlusturmaTarihi)}
          </span>
        ),
      },
    ],
    [isAdmin, isChangingDurum, handleDurumDegistir],
  );

  return (
    <div className="space-y-4">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-xl border border-blue-700/25 bg-linear-to-br from-blue-700/20 via-sky-500/12 to-cyan-400/8 p-5 sm:p-6 dark:border-primary/30 dark:from-primary/25 dark:via-primary/12 dark:to-primary/5">
        <MessageCircleQuestion
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-8 size-44 text-blue-700/10 sm:size-56 dark:text-primary/15"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm shadow-blue-800/30 dark:bg-primary dark:text-primary-foreground dark:shadow-primary/20">
              <MessageCircleQuestion className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold sm:text-2xl">Yardım & Destek</h1>
              <p className="text-sm text-muted-foreground">
                Sorununuzu veya talebinizi iletin, ekibimiz en kısa sürede dönüş
                yapsın.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <OzetKutusu
            icon={Inbox}
            label="Toplam Talep"
            value={ozet.toplam}
            loading={isLoading}
            iconClassName="text-blue-800 dark:text-primary"
          />
          <OzetKutusu
            icon={CircleDot}
            label="Açık"
            value={ozet.acik}
            loading={isLoading}
            iconClassName="text-green-600 dark:text-green-400"
          />
          <OzetKutusu
            icon={CircleCheck}
            label="Kapalı"
            value={ozet.kapali}
            loading={isLoading}
            iconClassName="text-muted-foreground"
          />
          <OzetKutusu
            icon={Mail}
            label="Okunmamış"
            value={ozet.okunmamis}
            loading={isLoading}
            iconClassName="text-sky-600 dark:text-sky-400"
          />
        </div>
      </section>

      {/* Araç çubuğu */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-64">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="Talep Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            className="shrink-0 self-start sm:self-auto"
            onClick={() => setOpenTalepEkle(true)}
          >
            <Plus className="size-4" />
            Talep Oluştur
          </Button>
          <DestekFiltre
            filters={filters}
            konuOptions={konuOptions}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
          />
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="Destek Talepleri"
            fileName="destek-talepleri"
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
        data={filteredData}
        columns={columns}
        loading={isLoading}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        onRowClick={setSeciliTalep}
      />

      <DestekMesajDrawer
        talep={seciliTalep}
        onOpenChange={(open) => !open && setSeciliTalep(null)}
      />

      {openTalepEkle && (
        <DestekTalepEkle open={openTalepEkle} onOpenChange={setOpenTalepEkle} />
      )}

      <ConfirmDialog
        open={!!silinecek}
        onOpenChange={(open) => !open && setSilinecek(null)}
        title="Destek talebini sil"
        description={`"#${silinecek?.IDDestekTakip ?? ""} – ${silinecek?.Baslik ?? ""}" talebi ve tüm mesajları kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteTalep.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

type OzetKutusuProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  loading?: boolean;
  iconClassName?: string;
};

function OzetKutusu({
  icon: Icon,
  label,
  value,
  loading,
  iconClassName,
}: OzetKutusuProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2.5 backdrop-blur-sm">
      {/* Kutucuk zemini ikonun renginden (bg-current/10) türetiliyor. */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-current/10",
          iconClassName,
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {label}
      </p>
      <p className="shrink-0 text-xl leading-none font-semibold tabular-nums">
        {loading ? "–" : value}
      </p>
    </div>
  );
}

export default DestekTalepListesi;
