"use client";

import { useMemo, useState } from "react";
import { Pencil, Power, Trash2, Loader2, Plus, Search } from "lucide-react";

import { useDeleteSirket, useSirketler } from "@/hooks/use-kurumsal-data";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowAction, RowActions } from "@/components/customs/RowActions";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { SirketType } from "@/types/kurumsal/sirket";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import SirketEkle from "./SirketEkle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalize } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Sube from "../sube/Sube";
type SirketProps = {
  idGurup: number;
};

export default function Sirket({ idGurup }: SirketProps) {
  const {
    data: sirketler = [],
    isLoading: isLoadingSirketler,
    isError: isErrorSirketler,
  } = useSirketler(idGurup);
  const router = useRouter();
  const deleteSirket = useDeleteSirket();
  const [silinecekSirket, setSilinecekSirket] = useState<SirketType | null>(
    null,
  );
  const [openSirketEkle, setOpenSirketEkle] = useState(false);
  const [duzenlenecekSirket, setDuzenlenecekSirket] =
    useState<SirketType | null>(null);
  const [searchText, setSearchText] = useState<string>("");

  const filteredSirketler = useMemo(() => {
    if (!searchText.trim()) return sirketler;

    const search = normalize(searchText);

    return sirketler.filter((sirket) =>
      [sirket.SirketAdi, sirket.Tel]
        .filter(Boolean)
        .some((value) => value && normalize(value.toString()).includes(search)),
    );
  }, [sirketler, searchText]);

  const handleDeleteConfirm = () => {
    if (!silinecekSirket) return;

    deleteSirket.mutate(
      { IDSirket: silinecekSirket.IDSirket, IDGurup: idGurup },
      {
        onSuccess: () => {
          toast.success("Şirket silindi");
          setSilinecekSirket(null);
        },
        onError: () => {
          toast.error("Şirket silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<SirketType>[]>(
    () => [
      {
        id: "actions",
        size: 20,
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const sirket = row.original;

          const actions: RowAction<SirketType>[] = [
            {
              label: "Düzenle",
              icon: Pencil,
              onClick: (r) => router.push(`/kurumsal/sirketler/${r.IDSirket}`),
            },
            {
              label: sirket.Durum === 1 ? "Pasif Yap" : "Aktif Yap",
              icon: Power,
              onClick: (r) => console.log("durum değiştir", r.IDSirket),
            },
            {
              label: "Sil",
              icon: Trash2,
              variant: "danger",
              separatorBefore: true,
              onClick: (r) => setSilinecekSirket(r),
            },
          ];

          return (
            <div className="flex justify-end">
              <RowActions row={sirket} actions={actions} />
            </div>
          );
        },
      },
      {
        // "GrupAdi" SirketType üzerinde yoktu — sıralama kırılıyordu, "SirketAdi" olarak düzelttim
        accessorKey: "SirketAdi",
        header: "Şirket Adı",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.SirketAdi2}
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
            <Badge variant={status ? "success" : "secondary"} className="w-20">
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
    ],
    [],
  );

  if (isLoadingSirketler) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (isErrorSirketler) {
    return (
      <p className="p-4 text-center text-sm text-destructive">
        Şirketler getirilemedi.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"></h1>
        </div>

        <div className="flex justify-end gap-2">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Şirket Ara..."
            className="w-48"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenSirketEkle(true)}
          >
            <Plus className="size-4" />
            Yeni Şirket Ekle
          </Button>
        </div>
      </div>
      <CustomDataTable
        data={filteredSirketler}
        columns={columns}
        onRowClick={(row) => router.push(`/kurumsal/sirketler/${row.IDSirket}`)}
        pagination={false}
        expandable
        expandedRowContent={(row) => <Sube idSirket={row.original.IDSirket} />}
      />

      {/* Ekleme modu */}
      <SirketEkle
        open={openSirketEkle}
        onOpenChange={setOpenSirketEkle}
        idGurup={idGurup}
      />

      {/* Düzenleme modu — aynı component, sirket prop'u dolu geliyor */}
      <SirketEkle
        open={!!duzenlenecekSirket}
        onOpenChange={(open) => !open && setDuzenlenecekSirket(null)}
        idGurup={idGurup}
        sirket={duzenlenecekSirket}
      />

      <ConfirmDialog
        open={!!silinecekSirket}
        onOpenChange={(open) => !open && setSilinecekSirket(null)}
        title="Şirketi sil"
        description={`"${silinecekSirket?.SirketAdi}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteSirket.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
