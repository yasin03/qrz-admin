"use client";

import {
  CalculatorIcon,
  BrushCleaning,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type Props = {
  seciliSayisi: number;
  seciliHepsiOnayli: boolean;
  seciliHepsiOnaysiz: boolean;
  onTumunuHesapla: () => void;
  onTumunuTemizle: () => void;
  onSeciliHesapla: () => void;
  onSeciliTemizle: () => void;
  onOnayla: () => void;
  onOnayiKaldir: () => void;
};

export default function BordroTopluIslemMenu({
  seciliSayisi,
  seciliHepsiOnayli,
  seciliHepsiOnaysiz,
  onTumunuHesapla,
  onTumunuTemizle,
  onSeciliHesapla,
  onSeciliTemizle,
  onOnayla,
  onOnayiKaldir,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" color="secondary" appearance="outline" className="gap-1.5">
          Toplu İşlemler
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Hesaplama</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onTumunuHesapla}>
          <CalculatorIcon className="size-4" />
          Tümünü Hesapla
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onTumunuTemizle}
          className="text-destructive focus:text-destructive"
        >
          <BrushCleaning className="size-4" />
          Tümünü Hesabı Temizle
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled={seciliSayisi === 0} onSelect={onSeciliHesapla}>
          <CalculatorIcon className="size-4" />
          Seçilenleri Hesapla{seciliSayisi > 0 ? ` (${seciliSayisi})` : ""}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={seciliSayisi === 0}
          onSelect={onSeciliTemizle}
          className="text-destructive focus:text-destructive"
        >
          <BrushCleaning className="size-4" />
          Seçilenleri Hesabı Temizle
          {seciliSayisi > 0 ? ` (${seciliSayisi})` : ""}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Onay ({seciliSayisi} seçili)</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={seciliSayisi === 0 || seciliHepsiOnayli}
          onSelect={onOnayla}
        >
          <CheckCircle2 className="size-4 text-emerald-600" />
          Onayla
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={seciliSayisi === 0 || seciliHepsiOnaysiz}
          onSelect={onOnayiKaldir}
          className="text-destructive focus:text-destructive"
        >
          <XCircle className="size-4" />
          Onayı Kaldır
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}