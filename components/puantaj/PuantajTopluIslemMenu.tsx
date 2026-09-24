"use client";

import {
  ChevronDown,
  Sparkle,
  Sparkles,
  GalleryVerticalEnd,
  CalendarPlus,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type Props = {
  seciliSayisi: number;
  onTopluGiris: () => void;
  onSeciliTemizle: () => void;
  onHepsiniTemizle: () => void;
};

export default function PuantajTopluIslemMenu({
  seciliSayisi,
  onTopluGiris,
  onSeciliTemizle,
  onHepsiniTemizle,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          color="danger"
          appearance="outline"
          className="gap-1.5"
        >
          <GalleryVerticalEnd className="size-4" />
          Toplu İşlemler
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onTopluGiris}>
          <CalendarPlus className="size-4" />
          Toplu Giriş
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={seciliSayisi === 0}
          onSelect={onSeciliTemizle}
          className="text-destructive focus:text-destructive"
        >
          <Sparkle className="size-4" />
          Seçilenleri Temizle{seciliSayisi > 0 ? ` (${seciliSayisi})` : ""}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onHepsiniTemizle}
          className="text-destructive focus:text-destructive"
        >
          <Sparkles className="size-4" />
          Hepsini Temizle
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
