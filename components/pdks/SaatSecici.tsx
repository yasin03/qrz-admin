"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogIn,
  LogOut,
  SaveCheck,
} from "lucide-react";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { PdksYon } from "@/types/pdks";

const GUN_DAKIKA = 24 * 60;

const pad = (n: number) => String(n).padStart(2, "0");

const toDakika = (saat: string) => {
  const [h, m] = saat.split(":").map(Number);
  return h * 60 + m;
};

const fromDakika = (dakika: number) => {
  // 23:55'ten ileri gidince 00:00'a, 00:00'dan geri gidince 23:55'e sarar
  const normalized = ((dakika % GUN_DAKIKA) + GUN_DAKIKA) % GUN_DAKIKA;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

/**
 * Elle girilen değeri "HH:mm"e çevirir, geçersizse null döner.
 * Kabul edilen örnekler: "9" → 09:00, "17" → 17:00, "930" → 09:30,
 * "0930" → 09:30, "9:5" → 09:05, "17:35" → 17:35
 */
export function parseSaat(text: string): string | null {
  const value = text.trim();
  if (!value) return null;

  let h: number;
  let m: number;

  if (value.includes(":")) {
    const [hs, ms = "0"] = value.split(":");
    if (!/^\d{1,2}$/.test(hs) || !/^\d{1,2}$/.test(ms)) return null;
    h = Number(hs);
    m = Number(ms);
  } else {
    if (!/^\d{1,4}$/.test(value)) return null;
    if (value.length <= 2) {
      h = Number(value);
      m = 0;
    } else {
      h = Number(value.slice(0, -2));
      m = Number(value.slice(-2));
    }
  }

  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

type SaatSeciciProps = {
  yon: PdksYon;
  /** "HH:mm" */
  value: string;
  onChange: (value: string) => void;
  /** Oklarla kaç dakika ileri/geri gidileceği. Default: 5 */
  step?: number;
  /** Seçili satır varsa sağda toplu kaydet butonu gösterilir. */
  showSave?: boolean;
  onSave?: () => void;
  saving?: boolean;
  /** Kaydet butonu tooltip'i (ör. "3 kayda uygula"). */
  saveLabel?: string;
};

export default function SaatSecici({
  yon,
  value,
  onChange,
  step = 5,
  showSave = false,
  onSave,
  saving = false,
  saveLabel,
}: SaatSeciciProps) {
  // Yazarken ara değerleri (ör. "9", "17:") tutmak için ayrı taslak state;
  // geçerli saate blur/Enter'da çevrilip onChange ile dışarı verilir.
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  // Dışarıdan (oklar vb.) değer değişince taslağı senkronla
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = () => {
    const parsed = parseSaat(draft);
    if (parsed) {
      setDraft(parsed);
      if (parsed !== value) onChange(parsed);
    } else {
      setDraft(value); // geçersiz giriş - son geçerli değere dön
    }
  };

  const shift = (direction: 1 | -1) => {
    const base = parseSaat(draft) ?? value;
    onChange(fromDakika(toDakika(base) + direction * step));
  };

  const isGiris = yon === "Giriş";
  const YonIcon = isGiris ? LogIn : LogOut;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          isGiris ? "text-success" : "text-destructive",
        )}
      >
        <YonIcon className="size-3.5" />
        {yon}
      </span>

      <div className="flex h-8 items-center rounded-lg border border-input bg-background">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label={`${yon} saatini ${step} dakika geri al`}
          className="flex h-full w-7 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>

        <input
          value={draft}
          inputMode="numeric"
          maxLength={5}
          placeholder="SS:dd"
          aria-label={`${yon} saati`}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d:]/g, ""))}
          onBlur={commit}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              shift(1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              shift(-1);
            }
          }}
          className="h-full w-14 bg-transparent text-center text-sm tabular-nums outline-none"
        />

        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={`${yon} saatini ${step} dakika ileri al`}
          className="flex h-full w-7 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {showSave && (
        <Button
          type="button"
          variant="success"
          size="icon-sm"
          onClick={onSave}
          disabled={saving}
          title={saveLabel}
          aria-label={saveLabel ?? `${yon} saatini kaydet`}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SaveCheck className="size-4" />
          )}
        </Button>
      )}
    </div>
  );
}
