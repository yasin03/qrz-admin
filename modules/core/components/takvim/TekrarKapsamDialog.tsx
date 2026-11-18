"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type TekrarKapsam = "bu" | "tumu";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "duzenle" veya "sil" — başlık ve buton metinleri buna göre. */
  islem: "duzenle" | "sil";
  onSec: (kapsam: TekrarKapsam) => void | Promise<void>;
  loading?: boolean;
};

const SECENEKLER: { value: TekrarKapsam; label: string; aciklama: string }[] = [
  { value: "bu", label: "Sadece bu etkinlik", aciklama: "Serinin diğer tekrarları değişmez." },
  { value: "tumu", label: "Tüm etkinlikler", aciklama: "Serinin tamamı etkilenir." },
];

/** Tekrarlı bir etkinlik düzenlenirken / silinirken kapsam seçimi. */
export function TekrarKapsamDialog({ open, onOpenChange, islem, onSec, loading }: Props) {
  const [kapsam, setKapsam] = useState<TekrarKapsam>("bu");
  const sil = islem === "sil";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setKapsam("bu");
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{sil ? "Tekrarlanan etkinliği sil" : "Tekrarlanan etkinliği düzenle"}</DialogTitle>
          <DialogDescription>Bu işlem hangi etkinlikleri etkilesin?</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" className="flex flex-col gap-2">
          {SECENEKLER.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={kapsam === s.value}
              onClick={() => setKapsam(s.value)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                kapsam === s.value && "border-primary bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  kapsam === s.value && "border-primary",
                )}
              >
                {kapsam === s.value && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span>
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="block text-xs text-muted-foreground">{s.aciklama}</span>
              </span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" appearance="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            type="button"
            variant={sil ? "danger" : "primary"}
            disabled={loading}
            onClick={() => onSec(kapsam)}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {sil ? "Sil" : "Devam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
