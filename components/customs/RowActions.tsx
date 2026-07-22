"use client";

import type { LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { EllipsisVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type RowAction<TData> = {
  label: string;
  icon?: LucideIcon;
  onClick: (row: TData) => void;
  /** "danger" kırmızı metin/hover ile riskli aksiyonları (sil vb.) vurgular. */
  variant?: "default" | "danger";
  disabled?: boolean | ((row: TData) => boolean);
  /** Bu öğeden önce ince bir ayraç çizgisi çizer — aksiyonları gruplamak için. */
  separatorBefore?: boolean;
};

export type RowActionsMenuProps<TData> = {
  row: TData;
  actions: RowAction<TData>[];
  align?: "start" | "end";
  triggerLabel?: string;
};

/**
 * Satır bazlı "..." menüsü. Her tablo kendi aksiyon listesini tanımlar:
 *
 *   <RowActions
 *     row={row.original}
 *     actions={[
 *       { label: "Düzenle", icon: Pencil, onClick: (r) => edit(r.id) },
 *       {
 *         label: row.original.status === "Aktif" ? "Pasif Yap" : "Aktif Yap",
 *         icon: Power,
 *         onClick: (r) => toggleStatus(r.id),
 *       },
 *       { label: "Rapor Oluştur", icon: FileText, onClick: (r) => report(r.id) },
 *       {
 *         label: "Sil",
 *         icon: Trash2,
 *         variant: "danger",
 *         separatorBefore: true,
 *         onClick: (r) => remove(r.id),
 *       },
 *     ]}
 *   />
 */
export function RowActions<TData>({
  row,
  actions,
  align = "end",
  triggerLabel = "İşlemler",
}: RowActionsMenuProps<TData>) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          color="secondary"
          appearance="ghost"
          size="icon-sm"
          aria-label={triggerLabel}
          onClick={(event) => event.stopPropagation()}
        >
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {actions.map((action, index) => {
            const isDisabled =
              typeof action.disabled === "function"
                ? action.disabled(row)
                : (action.disabled ?? false);
            const Icon = action.icon;

            return (
              <div key={action.label}>
                {action.separatorBefore && index > 0 && (
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                )}
                <DropdownMenu.Item
                  disabled={isDisabled}
                  onSelect={() => action.onClick(row)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none",
                    "data-[highlighted]:bg-muted",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    action.variant === "danger"
                      ? "text-destructive data-[highlighted]:bg-destructive/10"
                      : "text-popover-foreground",
                  )}
                >
                  {Icon && <Icon className="size-4" />}
                  {action.label}
                </DropdownMenu.Item>
              </div>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
