"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  CircleCheck,
  Loader2,
  MessageSquarePlus,
  MessageSquareText,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { RowActions } from "@/components/customs/RowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HATIRLATMA_SECENEKLERI } from "@/modules/core/components/takvim/takvim-utils";
import { parseYerel } from "@/modules/core/lib/ajanda";
import {
  useCrmAktiviteler,
  useDeleteCrmAktivite,
  useIptalCrmAktivite,
} from "@/modules/crm/hooks/use-crm";
import { gecikmisMi, gorusmeAraciEtiket } from "@/modules/crm/lib/crm";
import type { CrmAktiviteRow, CrmKisiRow } from "@/modules/crm/types/crm";

import { AktiviteFormDialog, type AktiviteFormModu } from "./AktiviteFormDialog";
import { AktiviteTamamlaDialog } from "./AktiviteTamamlaDialog";

type Props = {
  kisi: Pick<CrmKisiRow, "IDCrmKisi" | "Kurum" | "YetkiliKisi">;
};

type Onay = { tip: "iptal" | "sil"; aktivite: CrmAktiviteRow };

const tarihMetni = (a: CrmAktiviteRow) => {
  const t = parseYerel(a.Tarih);
  return t ? format(t, "d MMMM yyyy, EEE HH:mm", { locale: tr }) : "-";
};

function durumRozeti(a: CrmAktiviteRow) {
  if (a.Durum === 1) return <Badge variant="success">Yapıldı</Badge>;
  if (a.Durum === 2) return <Badge variant="gray">İptal</Badge>;
  return gecikmisMi(a) ? <Badge variant="danger">Gecikti</Badge> : <Badge variant="info">Planlandı</Badge>;
}

const IKON = {
  0: { icon: CalendarClock, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  1: { icon: MessageSquareText, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  2: { icon: CalendarX, className: "bg-muted text-muted-foreground" },
} as const;

/** Kişinin zaman çizelgesi: önce bekleyen randevular (yakından uzağa), sonra geçmiş. */
export function AktiviteListesi({ kisi }: Props) {
  const { data = [], isLoading, isError, refetch } = useCrmAktiviteler({ IDCrmKisi: kisi.IDCrmKisi });
  const iptal = useIptalCrmAktivite();
  const sil = useDeleteCrmAktivite();

  const [formMod, setFormMod] = useState<AktiviteFormModu | null>(null);
  const [tamamlanacak, setTamamlanacak] = useState<CrmAktiviteRow | null>(null);
  const [onay, setOnay] = useState<Onay | null>(null);

  const { bekleyen, gecmis } = useMemo(
    () => ({
      // SP yeniden eskiye sıralı döner; bekleyenler yakından uzağa gösterilir.
      bekleyen: data.filter((a) => a.Durum === 0).reverse(),
      gecmis: data.filter((a) => a.Durum !== 0),
    }),
    [data],
  );

  const onayla = async () => {
    if (!onay) return;
    try {
      if (onay.tip === "iptal") {
        await iptal.mutateAsync(onay.aktivite.IDCrmAktivite);
        toast.success("Randevu iptal edildi, takvimden kaldırıldı.");
      } else {
        await sil.mutateAsync(onay.aktivite.IDCrmAktivite);
        toast.success("Kayıt silindi.");
      }
      setOnay(null);
    } catch (error) {
      toast.error((error as Error)?.message || "İşlem yapılamadı.");
    }
  };

  const satir = (a: CrmAktiviteRow) => {
    const { icon: Icon, className } = IKON[a.Durum];
    const hatirlatma =
      a.Durum === 0 && a.HatirlatmaDakika != null
        ? (HATIRLATMA_SECENEKLERI.find((h) => h.value === String(a.HatirlatmaDakika))?.label ??
          `${a.HatirlatmaDakika} dakika önce`)
        : null;

    return (
      <li key={String(a.IDCrmAktivite)} className="flex gap-3 py-3">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", className)}>
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn("font-medium wrap-break-word", a.Durum === 2 && "line-through text-muted-foreground")}>
                {a.Konu || (a.Durum === 0 || a.Durum === 2 ? "Randevu" : "Görüşme")}
              </p>
              <p className="text-xs text-muted-foreground">
                {[
                  tarihMetni(a),
                  a.GorusmeAraci ? gorusmeAraciEtiket(a.GorusmeAraci) : null,
                  a.Sure ? `${a.Sure} dk` : null,
                  a.Ad,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {durumRozeti(a)}
              <RowActions
                row={a}
                actions={[
                  {
                    label: "Yapıldı",
                    icon: CircleCheck,
                    hidden: (r) => r.Durum !== 0,
                    onClick: (r) => setTamamlanacak(r),
                  },
                  {
                    label: "Düzenle",
                    icon: Pencil,
                    hidden: (r) => r.Durum === 2,
                    onClick: (r) => setFormMod({ tip: "duzenle", aktivite: r }),
                  },
                  {
                    label: "İptal Et",
                    icon: XCircle,
                    hidden: (r) => r.Durum !== 0,
                    onClick: (r) => setOnay({ tip: "iptal", aktivite: r }),
                  },
                  { divider: true },
                  {
                    label: "Sil",
                    icon: Trash2,
                    variant: "danger",
                    onClick: (r) => setOnay({ tip: "sil", aktivite: r }),
                  },
                ]}
              />
            </div>
          </div>

          {a.Aciklama && (
            <p className="rounded-md bg-muted/50 p-2.5 text-sm whitespace-pre-wrap wrap-break-word">{a.Aciklama}</p>
          )}
          {hatirlatma && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bell className="size-3.5" />
              {hatirlatma}
              {a.HatirlatmaKanal === 3 && " · e-posta ile de"}
            </p>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Görüşmeler ve Randevular</h3>
        <div className="flex gap-2">
          <Button size="sm" appearance="outline" onClick={() => setFormMod({ tip: "yeni", kisi, durum: 0 })}>
            <CalendarPlus /> Randevu Planla
          </Button>
          <Button size="sm" onClick={() => setFormMod({ tip: "yeni", kisi, durum: 1 })}>
            <MessageSquarePlus /> Görüşme Ekle
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="py-6 text-center text-sm text-destructive">
          Aktiviteler getirilemedi.{" "}
          <button type="button" className="underline" onClick={() => refetch()}>
            Tekrar dene
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          <CalendarCheck className="size-6" />
          Henüz görüşme veya randevu yok.
        </div>
      ) : (
        <div className="space-y-4">
          {bekleyen.length > 0 && (
            <section>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Bekleyen randevular</p>
              <ul className="divide-y">{bekleyen.map(satir)}</ul>
            </section>
          )}
          {gecmis.length > 0 && (
            <section>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Geçmiş</p>
              <ul className="divide-y">{gecmis.map(satir)}</ul>
            </section>
          )}
        </div>
      )}

      <AktiviteFormDialog open={!!formMod} onOpenChange={(v) => !v && setFormMod(null)} mod={formMod} />

      <AktiviteTamamlaDialog
        open={!!tamamlanacak}
        onOpenChange={(v) => !v && setTamamlanacak(null)}
        aktivite={tamamlanacak}
      />

      <ConfirmDialog
        open={!!onay}
        onOpenChange={(v) => !v && setOnay(null)}
        title={onay?.tip === "iptal" ? "Randevuyu iptal et" : "Kaydı sil"}
        description={
          onay?.tip === "iptal"
            ? "Randevu iptal edilecek ve takviminizden kaldırılacak."
            : "Kayıt kalıcı olarak silinecek. Bu işlem geri alınamaz."
        }
        variant={onay?.tip === "iptal" ? "warning" : "danger"}
        confirmLabel={onay?.tip === "iptal" ? "İptal Et" : "Sil"}
        cancelLabel="Vazgeç"
        isLoading={iptal.isPending || sil.isPending}
        onConfirm={onayla}
      />
    </div>
  );
}
