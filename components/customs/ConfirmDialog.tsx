"use client";

import { AlertDialog } from "radix-ui";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "danger" | "primary";
};

/**
 * Silme gibi geri alınamaz işlemler için onay dialog'u. Tamamen controlled
 * (`open`/`onOpenChange` dışarıdan) — onay butonu Radix'in otomatik kapatma
 * davranışını KULLANMIYOR, böylece mutation `isLoading` iken dialog açık
 * kalabiliyor; kapatmak çağıranın sorumluluğunda (genelde onSuccess'te).
 *
 *   <ConfirmDialog
 *     open={!!targetRow}
 *     onOpenChange={(open) => !open && setTargetRow(null)}
 *     title="Şirketi sil"
 *     description={`"${targetRow?.SirketAdi}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
 *     variant="danger"
 *     isLoading={deleteSirket.isPending}
 *     onConfirm={() => deleteSirket.mutate(...)}
 *   />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  onConfirm,
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          onEscapeKeyDown={(event) => isLoading && event.preventDefault()}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <AlertDialog.Title className="text-base font-semibold text-foreground">
            {title}
          </AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              color="secondary"
              appearance="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              color={variant}
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
