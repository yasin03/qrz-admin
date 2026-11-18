"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { AJANDA_RENKLERI } from "./takvim-utils";

type Props = {
  value: string;
  onChange: (renk: string) => void;
  /**
   * true: seçili renge tekrar tıklayınca seçim kalkar (value = "").
   * Etkinlik formunda "renk yok → kategori rengi" anlamında kullanılır.
   */
  temizlenebilir?: boolean;
  disabled?: boolean;
};

const ayni = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();

/** Hazır palet + özel renk seçici (#RRGGBB). */
export function AjandaRenkSecici({
  value,
  onChange,
  temizlenebilir,
  disabled,
}: Props) {
  const ozel = Boolean(value) && !AJANDA_RENKLERI.some((r) => ayni(r, value));

  const sec = (renk: string) => {
    if (temizlenebilir && value && ayni(value, renk)) onChange("");
    else onChange(renk);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {AJANDA_RENKLERI.map((r) => {
        const secili = Boolean(value) && ayni(value, r);
        return (
          <button
            key={r}
            type="button"
            title={r}
            aria-pressed={secili}
            onClick={() => sec(r)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background",
              secili && "ring-2 ring-primary",
            )}
            style={{ backgroundColor: r }}
          >
            {secili && <Check className="size-4 text-white" />}
          </button>
        );
      })}
      <label
        title="Özel renk"
        className={cn(
          "relative flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] ring-offset-2 ring-offset-background",
          ozel && "ring-2 ring-primary",
        )}
      >
        <input
          type="color"
          value={value || AJANDA_RENKLERI[0]}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
