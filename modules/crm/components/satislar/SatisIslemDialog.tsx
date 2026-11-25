"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { addDays, format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import type { RowAction } from "@/components/customs/RowActions";
import { FormCheckbox, FormInput, FormSelect } from "@/components/forms";
import { useInsertCrmTahsilat } from "@/modules/crm/hooks/use-finans";
import { useDeleteCrmSatis, useIptalCrmSatis, useYenileCrmSatis } from "@/modules/crm/hooks/use-satis";
import { ODEME_SEKLI_SECENEKLERI } from "@/modules/crm/lib/finans";
import { bitisOner, iptalFormVarsayilan, iptalFormdanIade, satisIzin } from "@/modules/crm/lib/satis";
import { gunFormat, paraFormat } from "@/modules/crm/lib/teklif";
import {
  satisIptalSchema,
  satisYenileSchema,
  type SatisIptalForm,
  type SatisYenileForm,
} from "@/modules/crm/schemas/satis.schema";
import type { CrmSatisRow, DbId } from "@/modules/crm/types/satis";

export type SatisIslemTipi = "iptal" | "yenile" | "sil";

export type SatisIslem = {
  tip: SatisIslemTipi;
  satis: Pick<
    CrmSatisRow,
    "IDCrmSatis" | "SatisNo" | "KisiAdi" | "SatisTipi" | "BitisTarihi" | "ParaBirimi" | "Durum" | "YenilendiMi"
  >;
  /** Net tahsil edilen (rozet sorgusundan). İptalde iade önerisi için. */
  tahsilEdilen: number;
};

type Props = {
  islem: SatisIslem | null;
  onOpenChange: (open: boolean) => void;
  /** Yenilemede yeni satışın ID'si, diğerlerinde null. */
  onTamamlandi?: (tip: SatisIslemTipi, yeniID: DbId | null) => void;
};

/** Satış iptali (isteğe bağlı iade), abonelik yenileme ve silme için onay dialog'u. */
export function SatisIslemDialog({ islem, onOpenChange, onTamamlandi }: Props) {
  const iptal = useIptalCrmSatis();
  const yenile = useYenileCrmSatis();
  const sil = useDeleteCrmSatis();
  const tahsilat = useInsertCrmTahsilat();
  const isLoading = [iptal, yenile, sil, tahsilat].some((m) => m.isPending);

  const iptalForm = useForm<SatisIptalForm>({
    resolver: zodResolver(satisIptalSchema),
    defaultValues: iptalFormVarsayilan(0),
  });
  const yenileForm = useForm<SatisYenileForm>({
    resolver: zodResolver(satisYenileSchema),
    defaultValues: { SatisTarihi: "" },
  });
  const iadeAc = useWatch({ control: iptalForm.control, name: "IadeAc" });

  // Yeni işlem açılınca formlar sıfırlanır (render sırasında, effect'siz).
  const [oncekiIslem, setOncekiIslem] = useState(islem);
  if (islem !== oncekiIslem) {
    setOncekiIslem(islem);
    if (islem) {
      iptalForm.reset(iptalFormVarsayilan(islem.tahsilEdilen));
      yenileForm.reset({ SatisTarihi: "" });
    }
  }

  if (!islem) {
    return <ConfirmDialog open={false} onOpenChange={onOpenChange} title="" onConfirm={() => {}} />;
  }

  const s = islem.satis;
  const tahsilatVar = islem.tahsilEdilen > 0;

  const iptalEt = async (v: SatisIptalForm) => {
    try {
      await iptal.mutateAsync({ IDCrmSatis: s.IDCrmSatis, IptalNedeni: v.IptalNedeni });
    } catch (error) {
      toast.error((error as Error)?.message || "Satış iptal edilemedi.");
      return;
    }

    // İade finans kaydıdır, ayrı çağrı: başarısız olsa da iptal geçerli kalır.
    const iade = iptalFormdanIade(v, s.IDCrmSatis);
    if (iade) {
      try {
        await tahsilat.mutateAsync(iade);
        toast.success("Satış iptal edildi, iade kaydı açıldı.");
      } catch (error) {
        toast.warning("Satış iptal edildi ama iade kaydedilemedi.", {
          description: `${(error as Error)?.message ?? ""} İadeyi Finans sekmesinden ekleyin.`.trim(),
        });
      }
    } else {
      toast.success("Satış iptal edildi.");
    }
    onTamamlandi?.("iptal", null);
    onOpenChange(false);
  };

  const yenileEt = async (v: SatisYenileForm) => {
    try {
      const sonuc = await yenile.mutateAsync({ IDCrmSatis: s.IDCrmSatis, SatisTarihi: v.SatisTarihi || null });
      toast.success(sonuc.SatisNo ? `Yeni dönem ${sonuc.SatisNo} oluşturuldu.` : "Yeni dönem oluşturuldu.");
      onTamamlandi?.("yenile", sonuc.IDCrmSatis);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Satış yenilenemedi.");
    }
  };

  const silEt = async () => {
    try {
      await sil.mutateAsync(s.IDCrmSatis);
      toast.success("Satış silindi.");
      onTamamlandi?.("sil", null);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Satış silinemedi.");
    }
  };

  if (islem.tip === "iptal") {
    return (
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Satışı iptal et"
        description={
          tahsilatVar
            ? `"${s.SatisNo}" iptal edilecek. ${paraFormat(islem.tahsilEdilen, s.ParaBirimi)} tahsilat var; tahsilatlar silinmez, iade kaydı açabilirsiniz.`
            : `"${s.SatisNo}" iptal edilecek ve alacak listesinden düşecek. İptal edilen satış değiştirilemez.`
        }
        confirmLabel="İptal Et"
        variant="warning"
        isLoading={isLoading}
        onConfirm={iptalForm.handleSubmit(iptalEt)}
      >
        <div className="space-y-3">
          <FormInput
            control={iptalForm.control}
            name="IptalNedeni"
            label="İptal nedeni (opsiyonel)"
            type="textarea"
            rows={2}
            maxLength={500}
            vertical
          />
          {tahsilatVar && (
            <>
              <FormCheckbox control={iptalForm.control} name="IadeAc" label="İade kaydı aç" />
              {iadeAc && (
                <div className="grid grid-cols-2 gap-2">
                  <FormInput control={iptalForm.control} name="IadeTarihi" label="Tarih" type="date" vertical />
                  <FormInput
                    control={iptalForm.control}
                    name="IadeTutari"
                    label="Tutar"
                    format="money"
                    vertical
                  />
                  <FormSelect
                    control={iptalForm.control}
                    name="IadeOdemeSekli"
                    label="Ödeme şekli"
                    options={ODEME_SEKLI_SECENEKLERI}
                    className="col-span-2"
                    vertical
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ConfirmDialog>
    );
  }

  if (islem.tip === "yenile") {
    // SP ile aynı: yeni dönem eski bitişin ertesi günü başlar.
    const yeniBas = s.BitisTarihi ? format(addDays(parseISO(s.BitisTarihi.slice(0, 10)), 1), "yyyy-MM-dd") : "";
    const yeniBit = bitisOner(s.SatisTipi, yeniBas);
    return (
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Aboneliği yenile"
        description={`"${s.SatisNo}" kalemleriyle ${gunFormat(yeniBas)} – ${gunFormat(yeniBit)} dönemi için yeni satış açılacak. Yeni satış kendi alacağıyla Finans'a düşer.`}
        confirmLabel="Yenile"
        variant="primary"
        isLoading={isLoading}
        onConfirm={yenileForm.handleSubmit(yenileEt)}
      >
        <FormInput
          control={yenileForm.control}
          name="SatisTarihi"
          label="Satış tarihi"
          type="date"
          description="Boş bırakılırsa bugün."
          vertical
        />
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="Satışı sil"
      description={`"${s.SatisNo}" kalıcı olarak silinecek. Bu işlem geri alınamaz. Yanlış girilen kayıtlar içindir; vazgeçilen satışı iptal edin.`}
      confirmLabel="Sil"
      variant="danger"
      isLoading={isLoading}
      onConfirm={silEt}
    />
  );
}

/** Liste satırı menüsü — duruma göre uygun işlemler görünür. */
export function satisSatirAksiyonlari<T extends CrmSatisRow>(h: {
  onGoruntule: (s: T) => void;
  onDuzenle: (s: T) => void;
  onIslem: (tip: SatisIslemTipi, s: T) => void;
  /** Satışın tahsilatı var mı (rozet sorgusundan); silme buna göre gizlenir. */
  tahsilatVar: (s: T) => boolean;
}): RowAction<T>[] {
  return [
    { label: "Görüntüle", icon: Eye, onClick: h.onGoruntule },
    { divider: true },
    { label: "Düzenle", icon: Pencil, hidden: (s) => !satisIzin.duzenle(s), onClick: h.onDuzenle },
    {
      label: "Yenile",
      icon: RefreshCw,
      hidden: (s) => !satisIzin.yenile(s),
      onClick: (s) => h.onIslem("yenile", s),
    },
    { divider: true },
    {
      label: "İptal Et",
      icon: Ban,
      hidden: (s) => !satisIzin.iptal(s),
      onClick: (s) => h.onIslem("iptal", s),
    },
    {
      label: "Sil",
      icon: Trash2,
      variant: "danger",
      hidden: (s) => !satisIzin.sil(s, h.tahsilatVar(s)),
      onClick: (s) => h.onIslem("sil", s),
    },
  ];
}
