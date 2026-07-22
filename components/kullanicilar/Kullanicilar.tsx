"use client";
import { CustomDataTable } from "../customs/CustomDataTable";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

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
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            color="secondary"
            appearance="ghost"
            size="icon-sm"
            aria-label="Düzenle"
            onClick={(event) => {
              event.stopPropagation();
              console.log("düzenle", row.original.id);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            color="danger"
            appearance="ghost"
            size="icon-sm"
            aria-label="Sil"
            onClick={(event) => {
              event.stopPropagation();
              console.log("sil", row.original.id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

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
          <Button type="button" size="sm">
            <UserPlus className="size-4" />
            Yeni Çalışan
          </Button>
        }
        onRowClick={(row) => console.log("satıra tıklandı", row)}
        emptyMessage="Çalışan bulunamadı."
      />
    </div>
  );
};

export default Kullanicilar;
