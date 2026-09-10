"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { useIzinSure, useUpdateTalep } from "@/hooks/use-izin";
import { User } from "@/stores/auth-store";
import { IzinTalepType } from "@/types/izin";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { Textarea } from "../ui/textarea";

const YILLIK_IZIN_KODU_ETIKET = "YI"; // Aciklama alanı "YI-Yillik Izin" olarak geldiği için başlangıç eşleşmesi kullanılıyor

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talep: IzinTalepType | null;
  currentUser: User | null;
};

function getDurumInfo(talep: IzinTalepType): {
  label: string;
  variant: "secondary" | "success" | "danger";
} {
  if (talep.RedDurum) return { label: "Reddedildi", variant: "danger" };
  if (talep.OnayDurum) return { label: "Onaylandı", variant: "success" };
  return { label: "Beklemede", variant: "secondary" };
}

function DetayField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Label className="w-28 shrink-0 pt-0.5">{label}</Label>
      <div className="flex-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

const TalepDetayDialog = ({
  open,
  onOpenChange,
  talep,
  currentUser,
}: Props) => {
  const [onayDialogOpen, setOnayDialogOpen] = useState(false);
  const [redDialogOpen, setRedDialogOpen] = useState(false);
  const [redAciklama, setRedAciklama] = useState("");

  const updateTalep = useUpdateTalep();

  const isYillikIzin = talep?.Aciklama?.startsWith(YILLIK_IZIN_KODU_ETIKET);
  const bugun = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: izinSure, isFetching: isLoadingIzinSure } = useIzinSure(
    {
      IDSubePersonel: String(talep?.IDSubePersonel ?? ""),
      Tarih: bugun,
    },
    Boolean(isYillikIzin && open),
  );

  const isPending = talep ? !talep.OnayDurum && !talep.RedDurum : false;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRedAciklama("");
    }
    onOpenChange(nextOpen);
  };

  const handleOnayla = () => {
    if (!talep || !currentUser?.IDKullanici) return;

    updateTalep.mutate(
      {
        IDSubePersonelIzinTalep: talep.IDSubePersonelIzinTalep,
        IDKullanici: String(currentUser.IDKullanici),
        KabulRed: "KABUL",
        RedAciklama: "",
      },
      {
        onSuccess: () => {
          toast.success("Talep onaylandı.");
          setOnayDialogOpen(false);
          handleClose(false);
        },
        onError: () => {
          toast.error("Talep onaylanamadı", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const handleReddet = () => {
    if (!talep || !currentUser?.IDKullanici) return;
    if (!redAciklama.trim()) {
      toast.error("Red açıklaması giriniz.");
      return;
    }

    updateTalep.mutate(
      {
        IDSubePersonelIzinTalep: talep.IDSubePersonelIzinTalep,
        IDKullanici: String(currentUser.IDKullanici),
        KabulRed: "RED",
        RedAciklama: redAciklama.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Talep reddedildi.");
          setRedDialogOpen(false);
          handleClose(false);
        },
        onError: () => {
          toast.error("Talep reddedilemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  if (!talep) return null;

  const { label: durumLabel, variant: durumVariant } = getDurumInfo(talep);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>İzin Talep Detayları</DialogTitle>
            <DialogDescription>
              {talep.AdSoyad} — {talep.SicilNo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetayField label="Sicil No">{talep.SicilNo}</DetayField>
              <DetayField label="Şube">{talep.SubeAdi}</DetayField>
              <DetayField label="Başlangıç">
                {formatDate(talep.BaslangicTarihi)}
              </DetayField>
              <DetayField label="Bitiş">
                {formatDate(talep.BitisTarihi)}
              </DetayField>
              <DetayField label={isYillikIzin ? "Gün" : "Gün / Saat"}>
                {talep.Gun}
              </DetayField>
              <DetayField label="İzin Tipi">
                <Badge variant="secondary">{talep.Aciklama}</Badge>
              </DetayField>
              <DetayField label="Telefon">{talep.Telefon || "-"}</DetayField>
              <DetayField label="Talep Tarihi">
                {formatDate(talep.Tarih)}
              </DetayField>
              <DetayField label="Durum">
                <Badge variant={durumVariant}>{durumLabel}</Badge>
              </DetayField>

              <DetayField label="Adres" className="sm:col-span-2">
                {talep.Adres || "-"}
              </DetayField>

              <DetayField label="Mesaj" className="sm:col-span-2">
                {talep.Mesaj || "-"}
              </DetayField>

              {talep.RedDurum && talep.RedAciklama && (
                <DetayField label="Red Açıklaması" className="sm:col-span-2">
                  <span className="text-destructive">{talep.RedAciklama}</span>
                </DetayField>
              )}

              {talep.Dosyalar && (
                <DetayField label="Dosya" className="sm:col-span-2">
                  <a
                    href={talep.Dosyalar}
                    download
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <FileText className="size-4" />
                    Dosyayı görüntüle
                    <Download className="size-3.5" />
                  </a>
                </DetayField>
              )}
            </div>

            {isYillikIzin && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  Yıllık İzin Durumu
                </p>

                {isLoadingIzinSure ? (
                  <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                ) : izinSure ? (
                  <div className="grid grid-cols-3 gap-2">
                    <IzinStat
                      label="Kıdem Yılı"
                      value={izinSure.IzinKidemYili}
                    />
                    <IzinStat
                      label="Toplam Hak"
                      value={izinSure.ToplamIzinHakki}
                    />
                    <IzinStat
                      label="Bu Yıl Kullanılan"
                      value={izinSure.KullanilanIzin}
                    />
                    <IzinStat
                      label="Geçmiş Yıl Kullanılan"
                      value={izinSure.oKullanilanIzin}
                    />
                    <IzinStat
                      label="Toplam Kullanılan"
                      value={izinSure.ToplamKullanilanIzin}
                    />
                    <IzinStat
                      label="Kalan İzin"
                      value={izinSure.ToplamKalanIzin}
                      highlight
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    İzin bilgisi bulunamadı.
                  </p>
                )}
              </div>
            )}
          </div>

          {isPending && (
            <DialogFooter>
              <Button
                type="button"
                variant="danger"
                appearance="outline"
                onClick={() => setRedDialogOpen(true)}
                disabled={updateTalep.isPending}
              >
                Talebi Reddet
              </Button>
              <Button
                type="button"
                variant="success"
                appearance="outline"
                onClick={() => setOnayDialogOpen(true)}
                disabled={updateTalep.isPending}
              >
                Talebi Onayla
              </Button>
              <Button
                type="button"
                appearance="outline"
                onClick={() => handleClose(false)}
                disabled={updateTalep.isPending}
              >
                Vazgeç
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={onayDialogOpen}
        onOpenChange={setOnayDialogOpen}
        title="Talebi onayla"
        description={`${talep.AdSoyad} adlı personelin izin talebi onaylanacak. Onaylıyor musunuz?`}
        variant="success"
        confirmLabel="Onayla"
        isLoading={updateTalep.isPending}
        onConfirm={handleOnayla}
      />

      <Dialog
        open={redDialogOpen}
        onOpenChange={(next) => {
          if (!updateTalep.isPending) {
            setRedDialogOpen(next);
            if (!next) setRedAciklama("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Talebi Reddet</DialogTitle>
            <DialogDescription>
              {talep.AdSoyad} adlı personelin izin talebini reddetme sebebini
              yazınız.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={redAciklama}
            onChange={(e) => setRedAciklama(e.target.value)}
            placeholder="Red sebebini yazınız..."
            rows={4}
            disabled={updateTalep.isPending}
          />

          <DialogFooter>
           
            <Button
              type="button"
              variant="danger"
              onClick={handleReddet}
              disabled={updateTalep.isPending || !redAciklama.trim()}
            >
              {updateTalep.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Reddet
            </Button>
             <Button
              type="button"
              appearance="outline"
              onClick={() => setRedDialogOpen(false)}
              disabled={updateTalep.isPending}
            >
              Vazgeç
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

type IzinStatProps = {
  label: string;
  value: number | string;
  highlight?: boolean;
};

function IzinStat({ label, value, highlight }: IzinStatProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background px-2.5 py-2",
        highlight && "border-primary/40 bg-primary/5",
      )}
    >
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-base font-semibold leading-tight",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default TalepDetayDialog;
