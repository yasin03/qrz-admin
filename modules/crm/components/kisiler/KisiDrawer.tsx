"use client";

import type { ReactNode } from "react";
import { Building2, Pencil, Trash2, User, UserCheck } from "lucide-react";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AktiviteListesi } from "@/modules/crm/components/aktivite/AktiviteListesi";
import { useIlAdi } from "@/modules/crm/hooks/use-crm";
import { KISI_TIP_ETIKET, kisiAdi } from "@/modules/crm/lib/crm";
import type { CrmKisiRow } from "@/modules/crm/types/crm";

type Props = {
  kisi: CrmKisiRow | null;
  onOpenChange: (open: boolean) => void;
  onDuzenle: (kisi: CrmKisiRow) => void;
  onDonustur: (kisi: CrmKisiRow) => void;
  onSil: (kisi: CrmKisiRow) => void;
};

function Bilgi({ label, children }: { label: string; children: ReactNode }) {
  if (children == null || children === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">{children}</dd>
    </div>
  );
}

export function KisiDrawer({ kisi: seciliKisi, onOpenChange, onDuzenle, onDonustur, onSil }: Props) {
  const kisi = useLastDefined(seciliKisi);
  const ilAdi = useIlAdi();
  if (!kisi) return null;

  const tuzel = kisi.KisiTuru === 2;
  const musteri = kisi.Tip === "Musteri";
  const ad = kisiAdi(kisi);
  const altBaslik = [
    kisi.Kurum && kisi.YetkiliKisi ? kisi.YetkiliKisi : null,
    kisi.YetkiliKisiPozisyonu,
  ]
    .filter(Boolean)
    .join(" · ");

  const izinler = [
    ["E-posta", kisi.EmailKabul],
    ["SMS", kisi.SmsKabul],
    ["Arama", kisi.AramaKabul],
    ["WhatsApp", kisi.WhatsappKabul],
  ] as const;

  const sosyal = [kisi.WebSitesi, kisi.Linkedin, kisi.Facebook, kisi.Twitter, kisi.Instagram].filter(Boolean);
  const Icon = tuzel ? Building2 : User;

  return (
    <SideDrawer
      open={!!seciliKisi}
      onOpenChange={onOpenChange}
      size="lg"
      title={ad}
      badge={
        <Badge variant={musteri ? "success" : "info"}>{KISI_TIP_ETIKET[kisi.Tip]}</Badge>
      }
      description={altBaslik || (tuzel ? "Tüzel kişi" : "Gerçek kişi")}
      icon={
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
      }
      bodyClassName="space-y-6"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button variant="danger" appearance="ghost" onClick={() => onSil(kisi)}>
            <Trash2 /> Sil
          </Button>
          <div className="flex gap-2">
            {!musteri && (
              <Button variant="success" appearance="outline" onClick={() => onDonustur(kisi)}>
                <UserCheck /> Müşteriye Dönüştür
              </Button>
            )}
            <Button onClick={() => onDuzenle(kisi)}>
              <Pencil /> Düzenle
            </Button>
          </div>
        </div>
      }
    >
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Bilgi label="Cep Telefonu">{kisi.CepTelefon}</Bilgi>
        <Bilgi label="İş Telefonu">{kisi.YetkiliKisiTel}</Bilgi>
        <Bilgi label="E-posta">
          {kisi.YetkiliKisiEPostaAdresi && (
            <a className="text-primary hover:underline" href={`mailto:${kisi.YetkiliKisiEPostaAdresi}`}>
              {kisi.YetkiliKisiEPostaAdresi}
            </a>
          )}
        </Bilgi>
        <Bilgi label="Faks">{kisi.Fax}</Bilgi>
        <Bilgi label="Şehir">{ilAdi(kisi.IlKodu)}</Bilgi>
        {tuzel ? (
          <Bilgi label="Vergi No">{kisi.VergiNo}</Bilgi>
        ) : (
          <Bilgi label="TC Kimlik No">{kisi.TcKimlikNo}</Bilgi>
        )}
        <Bilgi label="Kaynak">{kisi.Kaynak}</Bilgi>
        <Bilgi label={musteri ? "Müşteri Olma" : "Oluşturma"}>
          {formatDate(musteri && kisi.MusteriOlmaTarihi ? kisi.MusteriOlmaTarihi : kisi.OlusturmaTarihi)}
          {kisi.Ad && <span className="text-muted-foreground"> · {kisi.Ad}</span>}
        </Bilgi>
        <div className="sm:col-span-2">
          <Bilgi label="Adres">{kisi.Adres}</Bilgi>
        </div>
        {sosyal.length > 0 && (
          <div className="sm:col-span-2">
            <Bilgi label="Web / Sosyal Medya">{sosyal.join(" · ")}</Bilgi>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="mb-1 text-xs text-muted-foreground">İletişim İzinleri</dt>
          <dd className="flex flex-wrap gap-1.5">
            {izinler.map(([label, izin]) => (
              <Badge key={label} variant={izin ? "success" : "gray"} className={cn(!izin && "line-through")}>
                {label}
              </Badge>
            ))}
            {!kisi.Durum && <Badge variant="danger">Pasif</Badge>}
          </dd>
        </div>
      </dl>

      {kisi.Notlar && (
        <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap wrap-break-word">{kisi.Notlar}</p>
      )}

      <AktiviteListesi kisi={kisi} />
    </SideDrawer>
  );
}
