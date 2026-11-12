"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Check,
  CheckCheck,
  FileText,
  Loader2,
  Lock,
  MessagesSquare,
  Paperclip,
  SendHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { KULLANICI_TIPI } from "@/lib/roles";
import { useHasRole, useUser } from "@/stores/auth-store";
import {
  DESTEK_TALEP_QUERY_KEY,
  useDestekMesajList,
  useInsertDestekMesaj,
} from "@/modules/core/hooks/use-destek";
import type {
  DestekDosyaType,
  DestekMesajType,
  DestekTalepType,
} from "@/modules/core/types/destek";
import {
  DURUM_BADGE,
  MAX_DOSYA_BOYUTU,
  MAX_DOSYA_SAYISI,
} from "./destek-options";
import {
  downloadDosya,
  emojiOnlyCount,
  fileToBase64,
  formatFileSize,
  parseDosyalar,
} from "./destek-utils";
import { EmojiSecici } from "./EmojiSecici";

type Props = {
  talep: DestekTalepType | null;
  onOpenChange: (open: boolean) => void;
};

// Tarihler SQL'den yerel saat olarak geliyor; formatDate'teki gibi "Z"
// atılıp yerel saat kabul ediliyor.
const toLocalDate = (value: string) => parseISO(value.replace("Z", ""));

function gunEtiketi(date: Date) {
  if (isToday(date)) return "Bugün";
  if (isYesterday(date)) return "Dün";
  return format(date, "d MMMM yyyy", { locale: tr });
}

type MesajSatiri = {
  mesaj: DestekMesajType;
  tarih: Date;
  isMine: boolean;
  /** Gün değiştiyse üstte tarih ayracı gösterilir. */
  gunAyraci: string | null;
  /** Aynı kişinin art arda mesajlarının ilki (balon kuyruğu + isim). */
  grupBasi: boolean;
};

const DestekMesajDrawer = ({ talep: seciliTalep, onOpenChange }: Props) => {
  const talep = useLastDefined(seciliTalep);
  const open = Boolean(seciliTalep);
  const user = useUser();
  const isAdmin = useHasRole(KULLANICI_TIPI.ADMIN);
  const queryClient = useQueryClient();

  const { data: mesajlar = [], isLoading } = useDestekMesajList(
    talep?.IDDestekTakip,
    open,
  );

  // Mesajlar okununca listedeki "okunmamış" işareti güncellensin.
  useEffect(() => {
    if (!open) {
      queryClient.invalidateQueries({ queryKey: [DESTEK_TALEP_QUERY_KEY] });
    }
  }, [open, queryClient]);

  const satirlar = useMemo<MesajSatiri[]>(() => {
    const sirali = [...mesajlar].sort(
      (a, b) =>
        a.Tarih.localeCompare(b.Tarih) ||
        Number(a.IDDestekTakipMesaj) - Number(b.IDDestekTakipMesaj),
    );

    return sirali.map((mesaj, index) => {
      const onceki = sirali[index - 1];
      const tarih = toLocalDate(mesaj.Tarih);
      const gun = gunEtiketi(tarih);
      const oncekiGun = onceki ? gunEtiketi(toLocalDate(onceki.Tarih)) : null;
      const gunAyraci = gun !== oncekiGun ? gun : null;

      return {
        mesaj,
        tarih,
        isMine: String(mesaj.IDKullanici) === String(user?.IDKullanici),
        gunAyraci,
        grupBasi:
          gunAyraci !== null ||
          !onceki ||
          String(onceki.IDKullanici) !== String(mesaj.IDKullanici),
      };
    });
  }, [mesajlar, user?.IDKullanici]);

  // Yeni mesaj gelince / drawer açılınca en alta kaydır.
  const sonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    sonRef.current?.scrollIntoView({ block: "end" });
  }, [open, satirlar.length]);

  if (!talep) return null;

  const isKapali = talep.Durumu === "KAPALI";

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={talep.Baslik}
      badge={
        <Badge variant={DURUM_BADGE[talep.Durumu] ?? "gray"}>
          {talep.Durumu}
        </Badge>
      }
      description={[
        `#${talep.IDDestekTakip}`,
        talep.Konu,
        isAdmin ? talep.SirketAdi : null,
      ]
        .filter(Boolean)
        .join(" · ")}
      bodyClassName="bg-muted/40 px-3 py-4"
      footer={
        isKapali ? (
          <div className="flex w-full items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Bu talep kapatıldığı için mesaj gönderilemez.
          </div>
        ) : (
          <MesajYaz IDDestekTakip={talep.IDDestekTakip} />
        )
      }
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : satirlar.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <MessagesSquare className="size-8 opacity-50" />
          Henüz mesaj yok.
          {!isKapali && <span>İlk mesajı aşağıdan gönderebilirsiniz.</span>}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {satirlar.map((satir) => (
            <Fragment key={satir.mesaj.IDDestekTakipMesaj}>
              {satir.gunAyraci && (
                <div className="sticky top-0 z-10 my-3 flex justify-center first:mt-0">
                  <span className="rounded-md bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border backdrop-blur-sm">
                    {satir.gunAyraci}
                  </span>
                </div>
              )}
              <MesajBalonu satir={satir} />
            </Fragment>
          ))}
          <div ref={sonRef} />
        </div>
      )}
    </SideDrawer>
  );
};

// ---- Mesaj balonu ----------------------------------------------------------

function MesajBalonu({ satir }: { satir: MesajSatiri }) {
  const { mesaj, tarih, isMine, grupBasi } = satir;
  const dosyalar = parseDosyalar(mesaj.jsonDosya);
  // WhatsApp'taki gibi yalnızca 1-3 emojiden oluşan mesaj büyük ve
  // balonsuz gösterilir.
  const emojiSayisi = emojiOnlyCount(mesaj.Mesaj);
  const isBuyukEmoji =
    emojiSayisi > 0 && emojiSayisi <= 3 && dosyalar.length === 0;

  return (
    <div
      className={cn(
        "flex",
        isMine ? "justify-end" : "justify-start",
        grupBasi && "mt-2",
      )}
    >
      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl px-3 pt-1.5 pb-1 text-sm",
          isBuyukEmoji
            ? "px-1"
            : isMine
              ? "bg-blue-800 text-white shadow-sm dark:bg-primary dark:text-primary-foreground"
              : "bg-background text-foreground shadow-sm ring-1 ring-border",
          grupBasi &&
            !isBuyukEmoji &&
            (isMine ? "rounded-tr-sm" : "rounded-tl-sm"),
        )}
      >
        {!isMine && grupBasi && (
          <p className="mb-0.5 text-xs font-semibold text-blue-800 dark:text-primary">
            {mesaj.KullaniciAdi}
          </p>
        )}

        {dosyalar.length > 0 && (
          <div className="mt-1 mb-1 flex flex-col gap-1">
            {dosyalar.map((dosya, i) => (
              <button
                key={`${dosya.fileName}-${i}`}
                type="button"
                onClick={() => downloadDosya(dosya)}
                disabled={!dosya.base64}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors disabled:cursor-default",
                  isMine
                    ? "bg-white/15 hover:bg-white/25 dark:bg-black/10 dark:hover:bg-black/20"
                    : "bg-muted hover:bg-muted/70",
                )}
                title="İndir"
              >
                <FileText className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {dosya.fileName}
                </span>
                {dosya.fileSize ? (
                  <span className="shrink-0 opacity-70">
                    {formatFileSize(dosya.fileSize)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {/* Saat, WhatsApp'taki gibi metnin sağ altına yerleşir; kısa
            mesajlarda aynı satırda, uzunlarda son satırın altında kalır. */}
        <p
          className={cn(
            "wrap-break-word whitespace-pre-wrap",
            isBuyukEmoji && "text-4xl leading-tight",
          )}
        >
          {mesaj.Mesaj}
          <span
            className={cn(
              "float-right mt-1.5 ml-3 flex translate-y-0.5 items-center gap-1 text-[11px] leading-none",
              isBuyukEmoji
                ? "mt-5 rounded-full bg-background/90 px-1.5 py-1 text-muted-foreground shadow-sm ring-1 ring-border"
                : isMine
                  ? "text-white/70 dark:text-primary-foreground/70"
                  : "text-muted-foreground",
            )}
          >
            {format(tarih, "HH:mm")}
            {isMine &&
              (mesaj.Okundu ? (
                <CheckCheck className="size-3.5" aria-label="Okundu" />
              ) : (
                <Check className="size-3.5" aria-label="Gönderildi" />
              ))}
          </span>
        </p>
      </div>
    </div>
  );
}

// ---- Mesaj yazma alanı -----------------------------------------------------

function MesajYaz({ IDDestekTakip }: { IDDestekTakip: string }) {
  const [mesaj, setMesaj] = useState("");
  const [dosyalar, setDosyalar] = useState<DestekDosyaType[]>([]);
  const [isFileReading, setIsFileReading] = useState(false);
  const { mutate: insertMesaj, isPending } = useInsertDestekMesaj();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Emoji imlecin olduğu yere (seçili metin varsa onun yerine) eklenir.
  const handleEmojiSelect = (emoji: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? mesaj.length;
    const end = el?.selectionEnd ?? mesaj.length;
    const imlec = start + emoji.length;

    setMesaj((prev) => prev.slice(0, start) + emoji + prev.slice(end));

    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(imlec, imlec);
    });
  };

  const canSend =
    (mesaj.trim().length > 0 || dosyalar.length > 0) &&
    !isPending &&
    !isFileReading;

  const handleSend = () => {
    if (!canSend) return;

    insertMesaj(
      {
        IDDestekTakip,
        Mesaj: mesaj.trim(),
        Dosya: JSON.stringify(dosyalar),
      },
      {
        onSuccess: () => {
          setMesaj("");
          setDosyalar([]);
        },
        onError: (error) => {
          toast.error(error.message || "Mesaj gönderilemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const kalanHak = MAX_DOSYA_SAYISI - dosyalar.length;
    if (kalanHak <= 0) {
      toast.error(`En fazla ${MAX_DOSYA_SAYISI} dosya ekleyebilirsiniz.`);
      return;
    }

    const buyukler = files.filter((f) => f.size > MAX_DOSYA_BOYUTU);
    if (buyukler.length > 0) {
      toast.error(
        `${buyukler.map((f) => f.name).join(", ")} ${formatFileSize(MAX_DOSYA_BOYUTU)} sınırını aşıyor.`,
      );
    }

    const eklenecekler = files
      .filter((f) => f.size <= MAX_DOSYA_BOYUTU)
      .slice(0, kalanHak);
    if (eklenecekler.length === 0) return;

    setIsFileReading(true);
    try {
      const yeni = await Promise.all(
        eklenecekler.map(async (file) => ({
          fileName: file.name,
          fileSize: file.size,
          base64: await fileToBase64(file),
        })),
      );
      setDosyalar((prev) => [...prev, ...yeni]);
    } catch {
      toast.error("Dosya okunamadı, lütfen tekrar deneyin.");
    } finally {
      setIsFileReading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {dosyalar.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dosyalar.map((dosya, i) => (
            <span
              key={`${dosya.fileName}-${i}`}
              className="flex max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs"
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-40 truncate">{dosya.fileName}</span>
              <button
                type="button"
                onClick={() =>
                  setDosyalar((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-muted-foreground hover:text-foreground"
                aria-label={`${dosya.fileName} dosyasını kaldır`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <label
          className={cn(
            "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            (isPending || isFileReading) && "pointer-events-none opacity-50",
          )}
          title="Dosya ekle"
        >
          {isFileReading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Paperclip className="size-5" />
          )}
          <span className="sr-only">Dosya ekle</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isPending || isFileReading}
          />
        </label>

        <EmojiSecici onSelect={handleEmojiSelect} disabled={isPending} />

        <Textarea
          ref={textareaRef}
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          onKeyDown={(e) => {
            // Enter gönderir, Shift+Enter yeni satır.
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Mesaj yazın..."
          disabled={isPending}
          className="max-h-32 min-h-9 flex-1 resize-none rounded-2xl py-2"
        />

        <Button
          type="button"
          size="icon"
          className="size-9 shrink-0 rounded-full"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Gönder"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default DestekMesajDrawer;
