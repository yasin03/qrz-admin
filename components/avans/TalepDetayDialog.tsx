"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { User } from "@/stores/auth-store";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { Textarea } from "../ui/textarea";
import { AvansTalepType } from "@/types/avans";
import { useUpdateTalep } from "@/hooks/use-avans";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talep: AvansTalepType | null;
  currentUser: User | null;
};

function getDurumInfo(talep: AvansTalepType): {
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
  const isPending = talep ? !talep.OnayDurum && !talep.RedDurum : false;

  const aylikOdemeTutari = useMemo(() => {
    if (!talep) return 0;
    const taksitSayi = Number(talep.TaksitSayisi);
    if (!taksitSayi) return 0;
    return talep.Tutar / taksitSayi;
  }, [talep]);

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
        IDSubePersonelAvansTalep: talep.IDSubePersonelAvansTalep,
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
        IDSubePersonelAvansTalep: talep.IDSubePersonelAvansTalep,
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
            <DialogTitle>Avans Talep Detayları</DialogTitle>
            <DialogDescription>
              {talep.AdSoyad} — {talep.SicilNo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mb-12">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetayField label="Sicil No">{talep.SicilNo}</DetayField>
              <DetayField label="Şube">{talep.SubeAdi}</DetayField>

              <DetayField label="Talep Tarihi">
                {formatDate(talep.Tarih)}
              </DetayField>
              <DetayField label="Ödeme Başlangıcı">
                {formatDate(talep.OdemeBaslangicTarihi)}
              </DetayField>

              <DetayField label="Tutar">
                {talep.Tutar.toLocaleString("tr-TR")} ₺
              </DetayField>
              <DetayField label="Taksit Sayısı">
                {talep.TaksitSayisi}
              </DetayField>

              <DetayField label="Aylık Ödeme">
                {aylikOdemeTutari.toLocaleString("tr-TR", {
                  maximumFractionDigits: 2,
                })}{" "}
                ₺
              </DetayField>
              <DetayField label="Durum">
                <Badge variant={durumVariant}>{durumLabel}</Badge>
              </DetayField>

              <DetayField label="Mesaj" className="sm:col-span-2">
                {talep.Mesaj || "-"}
              </DetayField>

              {talep.RedDurum && talep.RedAciklama && (
                <DetayField label="Red Açıklaması" className="sm:col-span-2">
                  <span className="text-destructive">{talep.RedAciklama}</span>
                </DetayField>
              )}
            </div>
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
        description={`${talep.AdSoyad} adlı personelin avans talebi onaylanacak. Onaylıyor musunuz?`}
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
              {talep.AdSoyad} adlı personelin avans talebini reddetme sebebini
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

export default TalepDetayDialog;
