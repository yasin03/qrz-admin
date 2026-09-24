"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Square,
  SquareCheck,
  SquareMinus,
  Users,
} from "lucide-react";

import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import PuantajToolbar, {
  HAFTA_TATILI_CODE,
  IS_GUNU_CODE,
  type AktifPuantajAraci,
  type IzinTipi,
} from "./PuantajToolbar";
import { getHaftaBilgisi } from "./puantaj-helpers";
import { HAFTA_DATA } from "@/constants/data";
import { cn } from "@/lib/utils";
import type { PuantajSelectResponseType } from "@/types/puantaj";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personelList: PuantajSelectResponseType[];
  izinTipleri: IzinTipi[];
  yil: string;
  ay: string;
  isSubmitting: boolean;
  onSubmit: (payload: {
    ids: string[];
    gunler: number[];
    tool: AktifPuantajAraci;
  }) => void | Promise<void>;
};

type TakvimHucre = {
  gunNo: number;
  isWeekend: boolean;
  haftaNo: number;
} | null;

function isDoluHucre(hucre: TakvimHucre): hucre is NonNullable<TakvimHucre> {
  return hucre !== null;
}

// İş Günü -> tüm mesai günleri (Pt-Ct), Hafta Tatili -> Pazar,
// diğer izin türleri -> hafta içi (Pt-Cu). Kullanıcı bu varsayımı takvimde
// hücre/sütun/satır tıklayarak serbestçe değiştirebilir.
function getVarsayilanGunler(
  tur: string,
  yil: number,
  ay: number,
  gunSayisi: number,
): number[] {
  const gunler = Array.from({ length: gunSayisi }, (_, i) => i + 1);
  if (tur === IS_GUNU_CODE) {
    return gunler.filter((gun) => !getHaftaBilgisi(yil, ay, gun).isWeekend);
  }
  if (tur === HAFTA_TATILI_CODE) {
    return gunler.filter((gun) => getHaftaBilgisi(yil, ay, gun).isWeekend);
  }
  return gunler.filter((gun) => getHaftaBilgisi(yil, ay, gun).haftaNo <= 5);
}

export default function PuantajTopluGirisModal({
  open,
  onOpenChange,
  ...rest
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Toplu Puantaj Girişi</DialogTitle>
          <DialogDescription>
            Personel ve günleri seçip bir puantaj türü uygulayın;
            işaretlediğiniz tüm hücreler tek seferde işlenir.
          </DialogDescription>
        </DialogHeader>

        {/* Diyalog her açılışta sıfırdan mount olsun diye içerik `open`
            false iken hiç render edilmiyor — personel/gün seçimleri ve
            aktif araç, useEffect'siz doğal başlangıç durumuna dönüyor. */}
        {open && (
          <PuantajTopluGirisIcerik {...rest} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PuantajTopluGirisIcerik({
  personelList,
  izinTipleri,
  yil,
  ay,
  isSubmitting,
  onSubmit,
  onOpenChange,
}: Omit<Props, "open">) {
  const [selectedPersonelIds, setSelectedPersonelIds] = useState<string[]>(() =>
    personelList.map((p) => String(p.IDSubePersonel)),
  );
  const [personelPopoverOpen, setPersonelPopoverOpen] = useState(false);
  const [aktifTool, setAktifTool] = useState<AktifPuantajAraci | null>(null);
  const [selectedGunler, setSelectedGunler] = useState<Set<number>>(
    () => new Set(),
  );
  // Sadece tür GERÇEKTEN değiştiğinde varsayılan gün seçimini sıfırlıyoruz —
  // İş Günü'nün saat +/- adımları da onChange tetikliyor, o an seçim korunmalı.
  const previousTurRef = useRef<string | null>(null);

  const yilSayi = Number(yil);
  const aySayi = Number(ay);

  const gunSayisi = useMemo(() => {
    if (!yilSayi || !aySayi) return 30;
    return new Date(yilSayi, aySayi, 0).getDate();
  }, [yilSayi, aySayi]);

  const takvim = useMemo<TakvimHucre[][]>(() => {
    if (!yilSayi || !aySayi) return [];
    const ilkGunHaftaNo = getHaftaBilgisi(yilSayi, aySayi, 1).haftaNo;
    const bosHucre = ilkGunHaftaNo - 1;
    const haftaSayisi = Math.ceil((bosHucre + gunSayisi) / 7);

    return Array.from({ length: haftaSayisi }, (_, haftaIndex) =>
      Array.from({ length: 7 }, (_, kolonIndex) => {
        const gunNo = haftaIndex * 7 + kolonIndex - bosHucre + 1;
        if (gunNo < 1 || gunNo > gunSayisi) return null;
        const { isWeekend, haftaNo } = getHaftaBilgisi(yilSayi, aySayi, gunNo);
        return { gunNo, isWeekend, haftaNo };
      }),
    );
  }, [yilSayi, aySayi, gunSayisi]);

  const handleToolChange = (tool: AktifPuantajAraci | null) => {
    setAktifTool(tool);
    if (!tool) {
      previousTurRef.current = null;
      setSelectedGunler(new Set());
      return;
    }
    if (tool.tur !== previousTurRef.current) {
      setSelectedGunler(
        new Set(getVarsayilanGunler(tool.tur, yilSayi, aySayi, gunSayisi)),
      );
    }
    previousTurRef.current = tool.tur;
  };

  const toggleGun = (gunNo: number) => {
    setSelectedGunler((prev) => {
      const next = new Set(prev);
      if (next.has(gunNo)) next.delete(gunNo);
      else next.add(gunNo);
      return next;
    });
  };

  const toggleKolon = (kolonIndex: number) => {
    const gunler = takvim
      .map((hafta) => hafta[kolonIndex])
      .filter(isDoluHucre)
      .map((hucre) => hucre.gunNo);
    if (gunler.length === 0) return;
    const hepsiSecili = gunler.every((gun) => selectedGunler.has(gun));
    setSelectedGunler((prev) => {
      const next = new Set(prev);
      gunler.forEach((gun) => (hepsiSecili ? next.delete(gun) : next.add(gun)));
      return next;
    });
  };

  const toggleSatir = (haftaIndex: number) => {
    const gunler = takvim[haftaIndex].filter(isDoluHucre).map((h) => h.gunNo);
    if (gunler.length === 0) return;
    const hepsiSecili = gunler.every((gun) => selectedGunler.has(gun));
    setSelectedGunler((prev) => {
      const next = new Set(prev);
      gunler.forEach((gun) => (hepsiSecili ? next.delete(gun) : next.add(gun)));
      return next;
    });
  };

  const tumGunler = useMemo(
    () => Array.from({ length: gunSayisi }, (_, i) => i + 1),
    [gunSayisi],
  );
  const tumGunlerSecili =
    tumGunler.length > 0 && tumGunler.every((gun) => selectedGunler.has(gun));
  const hicGunSecilmemis = selectedGunler.size === 0;

  const toggleTumu = () => {
    setSelectedGunler(tumGunlerSecili ? new Set() : new Set(tumGunler));
  };

  const togglePersonel = (id: string) => {
    setSelectedPersonelIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const tumPersonelSecili =
    personelList.length > 0 &&
    selectedPersonelIds.length === personelList.length;

  const canSubmit =
    !isSubmitting &&
    selectedPersonelIds.length > 0 &&
    selectedGunler.size > 0 &&
    !!aktifTool;

  const handleSubmit = async () => {
    if (!canSubmit || !aktifTool) return;
    await onSubmit({
      ids: selectedPersonelIds,
      gunler: Array.from(selectedGunler).sort((a, b) => a - b),
      tool: aktifTool,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* ---- Personel seçici ---- */}
        <Popover
          open={personelPopoverOpen}
          onOpenChange={setPersonelPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              appearance="outline"
              className="w-full justify-between gap-1.5 sm:w-64"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {selectedPersonelIds.length === 0
                    ? "Personel seçin"
                    : tumPersonelSecili
                      ? `Tümü Seçili (${personelList.length})`
                      : `${selectedPersonelIds.length}/${personelList.length} personel`}
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command
              filter={(itemValue, search) => {
                const haystack = itemValue.toLocaleLowerCase("tr-TR");
                return haystack.includes(search.toLocaleLowerCase("tr-TR"))
                  ? 1
                  : 0;
              }}
            >
              <CommandInput placeholder="Personel ara..." />
              <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
                <Button
                  type="button"
                  size="sm"
                  appearance="ghost"
                  className="h-6 px-1.5 text-xs"
                  onClick={() =>
                    setSelectedPersonelIds(
                      personelList.map((p) => String(p.IDSubePersonel)),
                    )
                  }
                >
                  Tümünü Seç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  appearance="ghost"
                  className="h-6 px-1.5 text-xs text-destructive"
                  onClick={() => setSelectedPersonelIds([])}
                >
                  Temizle
                </Button>
              </div>
              <CommandList>
                <CommandEmpty>Personel bulunamadı.</CommandEmpty>
                <CommandGroup>
                  {personelList.map((personel) => {
                    const id = String(personel.IDSubePersonel);
                    const isSelected = selectedPersonelIds.includes(id);
                    return (
                      <CommandItem
                        key={id}
                        value={`${personel.AdSoyad} ${personel.SicilNo} ${personel.TcKimlikNo}`}
                        onSelect={() => togglePersonel(id)}
                      >
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50",
                          )}
                        >
                          {isSelected && <Check className="size-3" />}
                        </div>
                        <span className="truncate">{personel.AdSoyad}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {personel.SicilNo}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* ---- Puantaj türü seçici (mevcut araç çubuğu) ---- */}
        <PuantajToolbar
          izinTipleri={izinTipleri}
          value={aktifTool}
          onChange={handleToolChange}
        />
      </div>

      {/* ---- Takvim ---- */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-105 border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-10 border-r border-b border-border bg-muted/40 p-0">
                <button
                  type="button"
                  onClick={toggleTumu}
                  disabled={gunSayisi === 0}
                  className="flex size-full items-center justify-center py-2 text-muted-foreground hover:bg-muted"
                  aria-label="Tüm takvimi seç / kaldır"
                >
                  {tumGunlerSecili ? (
                    <SquareCheck className="size-4 text-primary" />
                  ) : hicGunSecilmemis ? (
                    <Square className="size-4" />
                  ) : (
                    <SquareMinus className="size-4 text-primary" />
                  )}
                </button>
              </th>
              {HAFTA_DATA.map((gun, kolonIndex) => {
                const kolonGunleri = takvim
                  .map((hafta) => hafta[kolonIndex])
                  .filter(isDoluHucre);
                const kolonSecili =
                  kolonGunleri.length > 0 &&
                  kolonGunleri.every((hucre) =>
                    selectedGunler.has(hucre.gunNo),
                  );

                return (
                  <th
                    key={gun.value}
                    className="border-r border-b border-border p-0 last:border-r-0"
                  >
                    <button
                      type="button"
                      onClick={() => toggleKolon(kolonIndex)}
                      disabled={kolonGunleri.length === 0}
                      className={cn(
                        "w-full py-2 text-xs font-semibold transition-colors hover:bg-primary/10",
                        gun.isWeekend
                          ? "bg-red-50/60 text-red-500 dark:bg-red-950/20"
                          : "bg-cyan-50/60 text-foreground dark:bg-cyan-950/10",
                        kolonSecili && "bg-primary/15 text-primary",
                      )}
                    >
                      {gun.shortTr}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {takvim.map((hafta, haftaIndex) => {
              const haftaGunleri = hafta.filter(isDoluHucre);
              const haftaSecili =
                haftaGunleri.length > 0 &&
                haftaGunleri.every((hucre) => selectedGunler.has(hucre.gunNo));

              return (
                <tr key={haftaIndex}>
                  <td className="border-r border-b border-border bg-muted/40 p-0">
                    <button
                      type="button"
                      onClick={() => toggleSatir(haftaIndex)}
                      disabled={haftaGunleri.length === 0}
                      className={cn(
                        "flex size-full min-h-11 w-10 items-center justify-center text-xs font-semibold text-muted-foreground hover:bg-primary/10",
                        haftaSecili && "bg-primary/15 text-primary",
                      )}
                    >
                      {haftaIndex + 1}
                    </button>
                  </td>
                  {hafta.map((hucre, kolonIndex) => (
                    <td key={kolonIndex} className="border ">
                      {hucre && (
                        <button
                          type="button"
                          onClick={() => toggleGun(hucre.gunNo)}
                          className={cn(
                            "mx-auto flex size-9 items-center justify-center rounded-md text-sm font-semibold transition-colors",
                            selectedGunler.has(hucre.gunNo)
                              ? "bg-blue-800 text-white hover:bg-blue-800/90"
                              : hucre.isWeekend
                                ? "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20"
                                : "bg-background text-foreground hover:bg-muted",
                          )}
                        >
                          {hucre.gunNo}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedPersonelIds.length} personel × {selectedGunler.size} gün seçili
        {aktifTool
          ? ` — Uygulanacak: ${aktifTool.label}${
              aktifTool.tur === IS_GUNU_CODE ? ` (${aktifTool.saat} sa.)` : ""
            }`
          : " — önce bir puantaj türü seçin"}
      </p>

      <DialogFooter>
        <Button
          type="button"
          appearance="outline"
          onClick={() => onOpenChange(false)}
        >
          Vazgeç
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Uygula
        </Button>
      </DialogFooter>
    </div>
  );
}
