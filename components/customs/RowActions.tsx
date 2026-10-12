"use client";

import type { LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { EllipsisVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Resolvable<T, TData> = T | ((row: TData) => T);

const resolve = <T, TData>(value: Resolvable<T, TData>, row: TData): T =>
  typeof value === "function" ? (value as (row: TData) => T)(row) : value;

export type RowActionItem<TData> = {
  /** Sabit metin ya da satıra göre hesaplanan metin: `(r) => r.Durum ? "Pasif Yap" : "Aktif Yap"` */
  label: Resolvable<string, TData>;
  icon?: Resolvable<LucideIcon | undefined, TData>;
  onClick: (row: TData) => void;
  /** "danger" kırmızı metin/hover ile riskli aksiyonları (sil vb.) vurgular. */
  variant?: "default" | "danger";
  disabled?: Resolvable<boolean, TData>;
  /** true ise öğe menüde hiç gösterilmez (yetki, duruma göre gizleme vb.). */
  hidden?: Resolvable<boolean, TData>;
};

/** Aksiyonlar arasına ince ayraç çizgisi. Baştaki, sondaki ve art arda gelen ayraçlar otomatik atlanır. */
export type RowActionDivider = { divider: true };

export type RowAction<TData> = RowActionItem<TData> | RowActionDivider;

export type RowActionsMenuProps<TData> = {
  /** Aksiyonlara geçilecek satır. Başlık (toplu işlem) menüsünde verilmeyebilir. */
  row?: TData;
  actions: RowAction<TData>[];
  align?: "start" | "end";
  triggerLabel?: string;
  /** Tetikleyiciyi saran div'in sınıfı. Default: sağa yaslı (`flex justify-end`). */
  className?: string;
};

const isDivider = <TData,>(
  action: RowAction<TData>,
): action is RowActionDivider => "divider" in action && action.divider;

/** Gizli öğeleri atar, ayraçları normalize eder (başta/sonda/art arda olanları siler). */
function buildMenuItems<TData>(actions: RowAction<TData>[], row: TData) {
  const items: (RowActionItem<TData> | RowActionDivider)[] = [];

  for (const action of actions) {
    if (isDivider(action)) {
      items.push(action);
      continue;
    }
    if (resolve(action.hidden ?? false, row)) continue;
    items.push(action);
  }

  return items.filter((item, index) => {
    if (!isDivider(item)) return true;
    const prev = items[index - 1];
    const hasNextItem = items.slice(index + 1).some((i) => !isDivider(i));
    return Boolean(prev) && !isDivider(prev) && hasNextItem;
  });
}

/**
 * Satır ya da başlık için "..." menüsü. Her tablo kendi aksiyon listesini tanımlar:
 *
 *   cell: ({ row }) => (
 *     <RowActions
 *       row={row.original}
 *       actions={[
 *         { label: "Düzenle", icon: Pencil, onClick: handleDuzenle },
 *         {
 *           label: (r) => (r.Durum ? "Pasif Yap" : "Aktif Yap"),
 *           icon: Power,
 *           onClick: handleToggleDurum,
 *         },
 *         { divider: true },
 *         { label: "Sil", icon: Trash2, variant: "danger", onClick: setSilinecek },
 *       ]}
 *     />
 *   ),
 *
 *   // Başlıkta toplu işlem - row verilmez, seçili satırlar closure'dan okunur
 *   header: () => (
 *     <RowActions
 *       actions={[
 *         {
 *           label: "Seçilileri Sil",
 *           icon: Trash2,
 *           variant: "danger",
 *           disabled: selectedRows.length === 0,
 *           onClick: () => setSilinecekler(selectedRows),
 *         },
 *       ]}
 *     />
 *   ),
 */
export function RowActions<TData = void>({
  row,
  actions,
  align = "end",
  triggerLabel = "İşlemler",
  className = "flex justify-end",
}: RowActionsMenuProps<TData>) {
  const currentRow = row as TData;
  const items = buildMenuItems(actions, currentRow);

  return (
    <div className={className}>
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
            // Portal DOM'da body'ye taşınsa da React event'leri React ağacı
            // üzerinden satıra kadar kabarıyor — menüdeki bir tıklama satırın
            // onRowClick'ini (detay sayfasına gitme) tetiklemesin.
            onClick={(event) => event.stopPropagation()}
            className="z-50 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            {items.map((item, index) => {
              if (isDivider(item)) {
                return (
                  <DropdownMenu.Separator
                    key={`divider-${index}`}
                    className="my-1 h-px bg-border"
                  />
                );
              }

              const label = resolve(item.label, currentRow);
              const Icon = item.icon ? resolve(item.icon, currentRow) : undefined;

              return (
                <DropdownMenu.Item
                  key={`${index}-${label}`}
                  disabled={resolve(item.disabled ?? false, currentRow)}
                  onSelect={() => item.onClick(currentRow)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none",
                    "data-highlighted:bg-muted",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                    item.variant === "danger"
                      ? "text-destructive data-highlighted:bg-destructive/10"
                      : "text-popover-foreground",
                  )}
                >
                  {Icon && <Icon className="size-4" />}
                  {label}
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
