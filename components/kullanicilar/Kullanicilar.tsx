"use client";
import { CustomDataTable } from "../customs/CustomDataTable";
import { Button } from "../ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useRef } from "react";
import { RowAction, RowActions } from "../customs/RowActions";
import { UserPlus, FileText, Merge, Pencil, Power, Trash2 } from "lucide-react";
import KullaniciEkle, { type KullaniciEkleRef } from "./KullaniciEkle";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: "Satış" | "Muhasebe" | "IT" | "İnsan Kaynakları";
  status: "Aktif" | "Pasif";
  salary: number;
  startDate: string; // ISO
  locked?: boolean; // örnek: bu kullanıcı seçilemesin diye
};

const Kullanicilar = () => {
  const [selected, setSelected] = useState<Employee[]>([]);
  const kullaniciEkleRef = useRef<KullaniciEkleRef>(null);

  const employees: Employee[] = [
    {
      id: "1",
      name: "Ayşe Yılmaz",
      email: "ayse.yilmaz@sirket.com",
      department: "IT",
      status: "Aktif",
      salary: 42000,
      startDate: "2022-03-14",
    },
    {
      id: "2",
      name: "Mehmet Kaya",
      email: "mehmet.kaya@sirket.com",
      department: "Satış",
      status: "Aktif",
      salary: 31000,
      startDate: "2021-07-01",
    },
    {
      id: "3",
      name: "Zeynep Demir",
      email: "zeynep.demir@sirket.com",
      department: "Muhasebe",
      status: "Pasif",
      salary: 28500,
      startDate: "2020-11-23",
      locked: true, // seçilemesin diye örnek
    },
    {
      id: "4",
      name: "Emre Şahin",
      email: "emre.sahin@sirket.com",
      department: "İnsan Kaynakları",
      status: "Aktif",
      salary: 35000,
      startDate: "2023-01-09",
    },
    {
      id: "5",
      name: "Elif Arslan",
      email: "elif.arslan@sirket.com",
      department: "IT",
      status: "Aktif",
      salary: 47500,
      startDate: "2019-05-30",
    },
    {
      id: "6",
      name: "Can Öztürk",
      email: "can.ozturk@sirket.com",
      department: "Satış",
      status: "Pasif",
      salary: 29800,
      startDate: "2022-09-12",
    },
  ];

  // ---- 3. Kolon tanımları ----------------------------------------------

  const columns: ColumnDef<Employee>[] = [
    {
      id: "actions",
      size: 20,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const employee = row.original;

        const actions: RowAction<Employee>[] = [
          {
            label: "Düzenle",
            icon: Pencil,
            onClick: (r) => console.log("düzenle", r.id),
          },
          {
            label: employee.status === "Aktif" ? "Pasif Yap" : "Aktif Yap",
            icon: Power,
            onClick: (r) => console.log("durum değiştir", r.id),
          },
          {
            label: "Rapor Oluştur",
            icon: FileText,
            onClick: (r) => console.log("rapor", r.id),
          },
          {
            label: "Kullanıcı Birleştir",
            icon: Merge,
            // örnek: bazı satırlarda bu aksiyon anlamsızsa disabled edilebilir
            disabled: (r) => Boolean(r.locked),
            onClick: (r) => console.log("birleştir", r.id),
          },
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            separatorBefore: true,
            onClick: (r) => console.log("sil", r.id),
          },
        ];

        return (
          <div className="flex justify-end">
            <RowActions row={employee} actions={actions} />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Ad Soyad",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "department",
      header: "Departman",
    },
    {
      accessorKey: "status",
      header: "Durum",
      cell: ({ getValue }) => {
        const status = getValue<Employee["status"]>();
        return (
          <span
            className={
              status === "Aktif"
                ? "inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
            }
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "salary",
      header: "Maaş",
      cell: ({ getValue }) =>
        new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
          maximumFractionDigits: 0,
        }).format(getValue<number>()),
    },
    {
      accessorKey: "startDate",
      header: "İşe Başlama",
      cell: ({ getValue }) =>
        new Intl.DateTimeFormat("tr-TR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date(getValue<string>())),
    },
  ];

  const openDialogMenu = () => {
    kullaniciEkleRef.current?.open();
  };

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold">Kullanıcılar</h1>
      <CustomDataTable
        data={employees}
        columns={columns}
        getRowId={(row) => row.id}
        pagination
        paginationPerPage={5}
        selectableRows
        selectableRowDisabled={(row) => Boolean(row.locked)}
        onSelectedRowsChange={({ selectedRows }) => setSelected(selectedRows)}
        dense
        searchable
        searchPlaceholder="İsim veya e-posta ara..."
        title="Kullanıcılar"
        actions={
          <Button type="button" size="sm" onClick={openDialogMenu}>
            <UserPlus className="size-4" />
            Yeni Çalışan
          </Button>
        }
        onRowClick={(row) => console.log("satıra tıklandı", row)}
        emptyMessage="Çalışan bulunamadı."
      />

      <KullaniciEkle ref={kullaniciEkleRef} />
    </div>
  );
};

export default Kullanicilar;
