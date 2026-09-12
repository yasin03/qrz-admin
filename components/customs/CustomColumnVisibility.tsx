"use client";

import { Columns3 } from "lucide-react";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type Props<TData> = {
  columns: ColumnDef<TData, any>[];
  value: VisibilityState;
  onChange: (value: VisibilityState) => void;
};

function getColumnId(column: ColumnDef<any, any>): string | undefined {
  if (column.id) return column.id;
  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey;
  }
  return undefined;
}

function getColumnLabel(column: ColumnDef<any, any>): string | null {
  const meta = column.meta as { label?: string } | undefined;
  if (meta?.label) return meta.label;
  if (typeof column.header === "string" && column.header.trim() !== "") {
    return column.header;
  }
  // Header boş/fonksiyon ve meta.label yoksa: "actions", "__select" gibi
  // araç kolonları kabul edilir, menüde gösterilmez.
  return null;
}

export function CustomColumnVisibility<TData>({
  columns,
  value,
  onChange,
}: Props<TData>) {
  const toggleColumns = columns
    .filter((column) => column.enableHiding !== false)
    .map((column) => {
      const id = getColumnId(column);
      const label = getColumnLabel(column);
      return id && label ? { id, label } : null;
    })
    .filter((item): item is { id: string; label: string } => item !== null);

  const isVisible = (id: string) => value[id] !== false;

  const toggle = (id: string, checked: boolean) => {
    onChange({ ...value, [id]: checked });
  };

  const hepsiGorunur = toggleColumns.every((c) => isVisible(c.id));

  const toggleAll = (checked: boolean) => {
    const next: VisibilityState = { ...value };
    toggleColumns.forEach((c) => {
      next[c.id] = checked;
    });
    onChange(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          color="secondary"
          appearance="outline"
          className="gap-1.5"
        >
          <Columns3 className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Görünür Kolonlar</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={hepsiGorunur}
          onCheckedChange={(checked) => toggleAll(!!checked)}
          onSelect={(e) => e.preventDefault()}
          className="font-medium"
        >
          {hepsiGorunur ? "Seçimi Kaldır" : "Tümünü Seç"}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        {toggleColumns.map(({ id, label }) => (
          <DropdownMenuCheckboxItem
            key={id}
            checked={isVisible(id)}
            onCheckedChange={(checked) => toggle(id, !!checked)}
            onSelect={(e) => e.preventDefault()}
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
