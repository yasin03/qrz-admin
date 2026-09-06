"use client";

import { AlertDialog } from "radix-ui";
import {
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmDialogVariant = "danger" | "primary" | "warning" | "success";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: ConfirmDialogVariant;
  /** Ekstra içerik: liste, tablo önizlemesi, uyarı kutusu vs. description altına eklenir */
  children?: React.ReactNode;
  /** Onay butonunu devre dışı bırakmak için (örn. bir onay kutusu işaretlenmeden aktif olmasın) */
  confirmDisabled?: boolean;
};

type VariantConfig = {
  icon: LucideIcon;
  iconClassName: string;
  buttonColor: ConfirmDialogVariant;
};

const variantConfig: Record<ConfirmDialogVariant, VariantConfig> = {
  danger: {
    icon: Trash2,
    iconClassName: "text-destructive",
    buttonColor: "danger",
  },
  primary: {
    icon: Info,
    iconClassName: "text-primary",
    buttonColor: "primary",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-500",
    buttonColor: "warning",
  },
  success: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-500",
    buttonColor: "success",
  },
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
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={isLoading ? undefined : onOpenChange}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          onEscapeKeyDown={(event) => isLoading && event.preventDefault()}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted",
              )}
            >
              <Icon className={cn("size-4.5", config.iconClassName)} />
            </div>
            <div className="flex-1 pt-0.5">
              <AlertDialog.Title className="text-base font-semibold text-foreground">
                {title}
              </AlertDialog.Title>
              {description && (
                <AlertDialog.Description className="mt-1.5 text-sm text-muted-foreground">
                  {description}
                </AlertDialog.Description>
              )}
            </div>
          </div>

          {children && <div className="mt-4">{children}</div>}

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
              color={config.buttonColor}
              disabled={isLoading || confirmDisabled}
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
