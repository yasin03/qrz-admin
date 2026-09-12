"use client";

import { useState } from "react";
import {
  Briefcase,
  Gamepad2,
  Plane,
  MessageSquare,
  Moon,
  Settings2,
  Eraser,
  Tag,
  Minus,
  Plus,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";

export type IzinTipi = { value: string; label: string };

export type AktifPuantajAraci = {
  tur: string;
  saat: string;
  label: string;
};

type Props = {
  izinTipleri: IzinTipi[];
  value: AktifPuantajAraci | null;
  onChange: (tool: AktifPuantajAraci | null) => void;
};

const IS_GUNU_CODE = "IS";
const HAFTA_TATILI_CODE = "HT";
const TEMIZLE_CODE = "temizle";
const DEFAULT_SAAT = "7.5";

const QUICK_OPTIONS = [
  { code: "YI", label: "Yıllık İzin", icon: Plane },
  { code: "MI", label: "Mazeret İzni", icon: MessageSquare },
  { code: "01", label: "İstirahatli", icon: Moon },
];

const TOOL_ICONS: Record<string, LucideIcon> = {
  [IS_GUNU_CODE]: Briefcase,
  [HAFTA_TATILI_CODE]: Gamepad2,
  [TEMIZLE_CODE]: Eraser,
  YI: Plane,
  MI: MessageSquare,
  "01": Moon,
};

function getToolIcon(tur?: string): LucideIcon | null {
  if (!tur) return null;
  return TOOL_ICONS[tur] ?? Tag;
}

export default function PuantajToolbar({
  izinTipleri,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "diger">("main");
  const [saat, setSaat] = useState(
    value?.tur === IS_GUNU_CODE ? value.saat : DEFAULT_SAAT,
  );

  const select = (tur: string, turSaat: string, label: string) => {
    onChange({ tur, saat: turSaat, label });
    setView("main");
    setOpen(false);
  };

  // Stepper'la yapılan her değişiklik ANINDA aktif araca yansıtılıyor,
  // popover kapanmıyor ki kullanıcı arka arkaya +/- yapabilsin.
  const handleSaatChange = (delta: number) => {
    const next = Math.max(0, Number(saat || "0") + delta).toString();
    setSaat(next);
    onChange({ tur: IS_GUNU_CODE, saat: next, label: "İş Günü" });
  };

  const clear = () => {
    onChange({
      tur: TEMIZLE_CODE,
      saat: "",
      label: "Kayıt Sil",
    });
    setView("main");
    setOpen(false);
  };

  const ToolIcon = getToolIcon(value?.tur);
  const triggerLabel = value
    ? `${value.label}${value.tur === IS_GUNU_CODE ? ` (${value.saat})` : ""}`
    : "Pdks Türü Seç";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Popover her açıldığında local saat, güncel aktif araçtan
          // yeniden senkronize edilir (stale değer kalmasın).
          setSaat(value?.tur === IS_GUNU_CODE ? value.saat : DEFAULT_SAAT);
        } else {
          setView("main");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          color={
            value?.tur === TEMIZLE_CODE
              ? "danger"
              : value
                ? "primary"
                : "secondary"
          }
          appearance="outline"
          className="gap-1.5"
        >
          {ToolIcon && <ToolIcon className="size-4" />}
          {triggerLabel}
          <ChevronDown className="size-3.5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={4}
        className="w-72 p-0"
      >
        {view === "main" ? (
          <div className="py-1">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <Button
                appearance="ghost"
                onClick={() => select(IS_GUNU_CODE, saat, "İş Günü")}
                className="flex items-center gap-2 text-sm"
              >
                <Briefcase className="size-4 text-muted-foreground" />
                <span>İş Günü</span>
              </Button>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="icon-sm"
                  color="danger"
                  appearance="solid"
                  onClick={() => handleSaatChange(-0.5)}
                  aria-label="Azalt"
                >
                  <Minus className="size-3.5" />
                </Button>
                <Input
                  value={saat}
                  className="h-7 w-14 px-1 text-center"
                  readOnly
                />
                <Button
                  type="button"
                  size="icon-sm"
                  color="success"
                  appearance="solid"
                  onClick={() => handleSaatChange(0.5)}
                  aria-label="Artır"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="w-full px-3 pb-2 pt-0 text-left text-xs text-muted-foreground">
              Saat otomatik uygulanır — istediğiniz an hücreye tıklayabilirsiniz
            </div>

            <div className="border-t border-border" />

            <button
              type="button"
              onClick={() => select(HAFTA_TATILI_CODE, "0", "Hafta Tatili")}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive hover:bg-muted"
            >
              <Gamepad2 className="size-4" />
              Hafta Tatili
            </button>

            {QUICK_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => select(opt.code, "0", opt.label)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
              >
                <opt.icon className="size-4 text-muted-foreground" />
                {opt.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setView("diger")}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="size-4 text-muted-foreground" />
                Diğer
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <button
              type="button"
              onClick={clear}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive hover:bg-muted"
            >
              <Eraser className="size-4" />
              Kayıt Sil (hücreye tıklayınca o günün kaydı silinir)
            </button>
          </div>
        ) : (
          <Command>
            <div className="flex items-center gap-1 border-b border-border px-1 py-1">
              <Button
                type="button"
                size="icon-sm"
                color="secondary"
                appearance="ghost"
                onClick={() => setView("main")}
                aria-label="Geri"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <CommandInput placeholder="İzin türü ara..." className="h-8" />
            </div>
            <CommandList className="max-h-64">
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup>
                {izinTipleri.map((tip) => (
                  <CommandItem
                    key={tip.value}
                    value={tip.label}
                    onSelect={() => select(tip.value, "0", tip.label)}
                  >
                    {tip.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
