"use client";

import { useMemo, useState } from "react";
import { Pencil, Power, Trash2, Loader2, Search, Plus } from "lucide-react";
import { toast } from "sonner";

import { useSubeler, useDeleteSube } from "@/hooks/use-kurumsal-data";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowAction, RowActions } from "@/components/customs/RowActions";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { SubeType } from "@/types/kurumsal/sube";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalize } from "@/lib/utils";
import { useRouter } from "next/navigation";
import SubeEkle from "./SubeEkle";

type SubeProps = {
  idSirket: number;
};

export default function Sube({ idSirket }: SubeProps) {
  // Bu şirkete özel şube listesi — kendi query key'i (["kurumsal","subeler",idSirket])
  // ile cache'leniyor, diğer şirketlerin expand'ları birbirine karışmıyor.
  const {
    data: subeler = [],
    isLoading: isLoadingSubeler,
    isError: isErrorSubeler,
  } = useSubeler(idSirket);
  const router = useRouter();
  const deleteSube = useDeleteSube();
  const [silinecekSube, setSilinecekSube] = useState<SubeType | null>(null);
  const [openSubeEkle, setOpenSubeEkle] = useState(false);
  const [duzenlenecekSube, setDuzenlenecekSube] = useState<SubeType | null>(
    null,
  );
  const [searchText, setSearchText] = useState<string>("");

  const filteredSubeler = useMemo(() => {
    if (!searchText.trim()) return subeler;

    const search = normalize(searchText);

    return subeler.filter((sube) =>
      [sube.SubeAdi, sube.Tel]
        .filter(Boolean)
        .some((value) => value && normalize(value.toString()).includes(search)),
    );
  }, [subeler, searchText]);

  const handleDeleteConfirm = () => {
    if (!silinecekSube) return;

    deleteSube.mutate(
      { IDSube: silinecekSube.IDSube, IDSirket: idSirket },
      {
        onSuccess: () => {
          toast.success("Şube silindi");
          setSilinecekSube(null);
        },
        onError: () => {
          toast.error("Şube silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<SubeType>[]>(
    () => [
      {
        id: "actions",
        size: 20,
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const sube = row.original;

          const actions: RowAction<SubeType>[] = [
            {
              label: "Düzenle",
              icon: Pencil,
              onClick: (r) => router.push(`/kurumsal/subeler/${r.IDSube}`),
            },
            {
              label: sube.Durum === 1 ? "Pasif Yap" : "Aktif Yap",
              icon: Power,
              onClick: (r) => console.log("durum değiştir", r.IDSube),
            },
            {
              label: "Sil",
              icon: Trash2,
              variant: "danger",
              separatorBefore: true,
              onClick: (r) => setSilinecekSube(r),
            },
          ];

          return (
            <div className="flex justify-end">
              <RowActions row={sube} actions={actions} />
            </div>
          );
        },
      },
      {
        // NOT: SubeType'ın tam alan adlarını görmediğim için Sirket ile aynı
        // desende (SubeAdi/Tel/Durum/CreatedDate) yazdım — kendi tipine göre
        // accessorKey'leri düzelt.
        accessorKey: "SubeAdi",
        header: "Şube Adı",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.SubeAdi}
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
            <Badge
              variant={status ? "success" : "destructive"}
              className="w-20"
            >
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

  if (isLoadingSubeler) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (isErrorSubeler) {
    return (
      <p className="p-4 text-center text-sm text-destructive">
        Şubeler getirilemedi.
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
            placeholder="Şube Ara..."
            className="w-48"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="button" size="sm" onClick={() => setOpenSubeEkle(true)}>
            <Plus className="size-4" />
            Yeni Şube Ekle
          </Button>
        </div>
      </div>

      <CustomDataTable
        data={filteredSubeler}
        columns={columns}
        onRowClick={(row) => router.push(`/kurumsal/subeler/${row.IDSube}`)}
        pagination={false}
      />

      <SubeEkle
        open={openSubeEkle}
        onOpenChange={setOpenSubeEkle}
        idSirket={idSirket}
      />

      <SubeEkle
        open={!!duzenlenecekSube}
        onOpenChange={(open) => !open && setDuzenlenecekSube(null)}
        idSirket={idSirket}
        sube={duzenlenecekSube}
      />

      <ConfirmDialog
        open={!!silinecekSube}
        onOpenChange={(open) => !open && setSilinecekSube(null)}
        title="Şubeyi sil"
        description={`"${silinecekSube?.SubeAdi}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteSube.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
