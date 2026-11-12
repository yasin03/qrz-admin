"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EMOJI_KATEGORILERI } from "./emoji-list";

type Props = {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
};

// Fare tetikleyiciden içeriğe geçerken popover kapanmasın diye kısa gecikme.
const KAPANMA_GECIKMESI = 200;

/**
 * Üzerine gelince (masaüstü) ya da tıklayınca (dokunmatik) açılan emoji
 * listesi. Emoji seçildikçe popover açık kalır; birden fazla eklenebilir.
 */
export function EmojiSecici({ onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const kapatmaZamanlayici = useRef<ReturnType<typeof setTimeout>>(null);

  const zamanlayiciyiIptalEt = () => {
    if (kapatmaZamanlayici.current) {
      clearTimeout(kapatmaZamanlayici.current);
      kapatmaZamanlayici.current = null;
    }
  };

  const ac = () => {
    if (disabled) return;
    zamanlayiciyiIptalEt();
    setOpen(true);
  };

  const gecikmeliKapat = () => {
    zamanlayiciyiIptalEt();
    kapatmaZamanlayici.current = setTimeout(
      () => setOpen(false),
      KAPANMA_GECIKMESI,
    );
  };

  useEffect(() => zamanlayiciyiIptalEt, []);

  const listeRef = useRef<HTMLDivElement>(null);
  const kategoriyeGit = (baslik: string) => {
    const liste = listeRef.current;
    const bolum = liste?.querySelector<HTMLElement>(
      `[data-kategori="${baslik}"]`,
    );
    if (liste && bolum) {
      liste.scrollTo({ top: bolum.offsetTop - 8, behavior: "smooth" });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onMouseEnter={ac}
          onMouseLeave={gecikmeliKapat}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
            open && "bg-muted text-foreground",
          )}
          title="Emoji ekle"
          aria-label="Emoji ekle"
        >
          <Smile className="size-5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-80 p-0"
        onMouseEnter={ac}
        onMouseLeave={gecikmeliKapat}
        // Mesaj kutusundaki imleç kaybolmasın.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Kategoriye hızlı geçiş */}
        <div className="flex gap-0.5 overflow-x-auto border-b border-border p-1.5">
          {EMOJI_KATEGORILERI.map((kategori) => (
            <button
              key={kategori.baslik}
              type="button"
              onClick={() => kategoriyeGit(kategori.baslik)}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-lg leading-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              title={kategori.baslik}
              aria-label={kategori.baslik}
            >
              {kategori.ikon}
            </button>
          ))}
        </div>

        <div
          ref={listeRef}
          className="relative max-h-72 overflow-y-auto overscroll-contain p-2"
        >
          {EMOJI_KATEGORILERI.map((kategori) => (
            <div
              key={kategori.baslik}
              data-kategori={kategori.baslik}
              className="mb-2 last:mb-0"
            >
              <p className="sticky top-0 z-10 bg-popover p-1 text-xs font-medium text-muted-foreground">
                {kategori.baslik}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {kategori.emojiler.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    className="flex size-8 items-center justify-center rounded-md text-xl leading-none transition-transform hover:scale-110 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    aria-label={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
