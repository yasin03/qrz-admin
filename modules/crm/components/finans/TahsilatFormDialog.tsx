"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FormInput, FormLabel, FormSearchSelect, FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ParaBirimi } from "@/constants/data";
import {
  useCrmFinansAlacaklar,
  useCrmTahsilatDetay,
  useInsertCrmTahsilat,
  useUpdateCrmTahsilat,
} from "@/modules/crm/hooks/use-finans";
import {
  ODEME_SEKLI_SECENEKLERI,
  TAHSILAT_TIP_SECENEKLERI,
  tahsilatFormVarsayilan,
  tahsilatFormdanParams,
} from "@/modules/crm/lib/finans";
import { paraFormat } from "@/modules/crm/lib/teklif";
import { tahsilatSchema, type TahsilatForm } from "@/modules/crm/schemas/finans.schema";
import type { DbId, TahsilatTip } from "@/modules/crm/types/finans";

/** Formun bilmesi gereken satış bilgisi (alacak satırı veya satış detayından). */
export type TahsilatSatisBilgisi = {
  IDCrmSatis: DbId;
  SatisNo: string;
  KisiAdi: string | null;
  ParaBirimi: ParaBirimi;
  /** Satışın kalanı (tahsilat önerisi ve üst sınır bilgisi). */
  Kalan: number;
  /** Net tahsil edilen (iade üst sınırı bilgisi). */
  TahsilEdilen: number;
};

/**
 * - yeni + satis: satış sabit (Alacaklar / satış detayı).
 * - yeni (satissiz): açık alacaklardan satış seçilir (Tahsilatlar).
 * - duzenle: satış ve para birimi değişmez.
 */
export type TahsilatFormModu =
  | { tip: "yeni"; satis?: TahsilatSatisBilgisi; Tip?: TahsilatTip }
  | { tip: "duzenle"; IDCrmTahsilat: DbId };

type Props = {
  mod: TahsilatFormModu | null;
  onOpenChange: (open: boolean) => void;
};

/** Satış seçimi: açık alacaklar (kalanı olan + iade bekleyen). Arama yerel. */
function useAcikAlacakSecenekleri(search: string) {
  const { data = [], isLoading } = useCrmFinansAlacaklar();
  const options = useMemo(() => {
    const tumu = data.map((a) => ({
      value: String(a.IDCrmSatis),
      label: `${a.SatisNo} · ${a.KisiAdi ?? "-"} · kalan ${paraFormat(a.Kalan, a.ParaBirimi)}`,
    }));
    const q = search.trim().toLocaleLowerCase("tr");
    return q ? tumu.filter((o) => o.label.toLocaleLowerCase("tr").includes(q)) : tumu;
  }, [data, search]);
  return { options, isLoading };
}

export function TahsilatFormDialog({ mod, onOpenChange }: Props) {
  const open = mod != null;
  const insert = useInsertCrmTahsilat();
  const update = useUpdateCrmTahsilat();
  const isPending = insert.isPending || update.isPending;

  const duzenle = mod?.tip === "duzenle";
  const sabitSatis = mod?.tip === "yeni" ? mod.satis : undefined;
  const {
    data: detay,
    isLoading: detayYukleniyor,
    isError: detayHata,
  } = useCrmTahsilatDetay(mod?.tip === "duzenle" ? mod.IDCrmTahsilat : null);
  // Satışsız yeni kayıtta seçilen satışın bilgisi açık alacaklardan bulunur.
  const { data: alacaklar = [] } = useCrmFinansAlacaklar({}, open && mod?.tip === "yeni" && !sabitSatis);

  const form = useForm<TahsilatForm>({
    resolver: zodResolver(tahsilatSchema),
    defaultValues: tahsilatFormVarsayilan(),
  });
  const { control } = form;

  useEffect(() => {
    if (!mod) return;
    if (mod.tip === "yeni") {
      const tip = mod.Tip ?? 1;
      const s = mod.satis;
      form.reset(
        tahsilatFormVarsayilan(null, {
          IDCrmSatis: s?.IDCrmSatis,
          Tip: tip,
          // Tahsilatta kalan, iadede tahsil edilen önerilir.
          Tutar: s ? (tip === 1 ? s.Kalan : s.TahsilEdilen) : null,
        }),
      );
    } else if (detay) {
      form.reset(tahsilatFormVarsayilan(detay));
    }
  }, [mod, detay, form]);

  const seciliSatisID = useWatch({ control, name: "IDCrmSatis" });
  const tip = useWatch({ control, name: "Tip" });

  const satis: TahsilatSatisBilgisi | null = useMemo(() => {
    if (sabitSatis) return sabitSatis;
    if (detay) {
      return {
        IDCrmSatis: detay.IDCrmSatis,
        SatisNo: detay.SatisNo,
        KisiAdi: detay.KisiAdi,
        ParaBirimi: detay.ParaBirimi,
        Kalan: NaN,
        TahsilEdilen: NaN,
      };
    }
    const a = alacaklar.find((x) => String(x.IDCrmSatis) === seciliSatisID);
    return a
      ? {
          IDCrmSatis: a.IDCrmSatis,
          SatisNo: a.SatisNo,
          KisiAdi: a.KisiAdi,
          ParaBirimi: a.ParaBirimi,
          Kalan: a.Kalan,
          TahsilEdilen: a.TahsilEdilen,
        }
      : null;
  }, [sabitSatis, detay, alacaklar, seciliSatisID]);

  const paraBirimi = satis?.ParaBirimi ?? "TRY";
  const sinirMetni =
    satis && Number.isFinite(satis.Kalan)
      ? tip === "2"
        ? `Tahsil edilen: ${paraFormat(satis.TahsilEdilen, paraBirimi)}`
        : `Kalan: ${paraFormat(satis.Kalan, paraBirimi)}`
      : undefined;

  const onSubmit = async (v: TahsilatForm) => {
    const params = tahsilatFormdanParams(v);
    const iade = params.Tip === 2;
    try {
      if (mod?.tip === "duzenle") {
        // Serviste IDCrmSatis gönderilmez (satış değişmez).
        await update.mutateAsync({ ...params, IDCrmTahsilat: mod.IDCrmTahsilat });
        toast.success(iade ? "İade güncellendi." : "Tahsilat güncellendi.");
      } else {
        await insert.mutateAsync({ ...params, ParaBirimi: paraBirimi });
        toast.success(iade ? "İade kaydedildi." : "Tahsilat kaydedildi.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Kayıt yapılamadı.");
    }
  };

  const baslik = duzenle
    ? `${detay?.Tip === 2 ? "İade" : "Tahsilat"} Düzenle`
    : tip === "2"
      ? "İade Ekle"
      : "Tahsilat Ekle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{baslik}</DialogTitle>
          <DialogDescription>
            {satis
              ? `${satis.SatisNo} · ${satis.KisiAdi ?? "-"}`
              : "Ödemenin ait olduğu satışı seçin. Tutar satışın para biriminde girilir."}
          </DialogDescription>
        </DialogHeader>

        {duzenle && detayYukleniyor ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : duzenle && detayHata ? (
          <p className="py-8 text-center text-sm text-destructive">Kayıt getirilemedi.</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {!duzenle && !sabitSatis && (
              <FormSearchSelect
                control={control}
                name="IDCrmSatis"
                label="Satış"
                required
                placeholder="Açık alacak seçin"
                searchPlaceholder="Satış no veya kişi ara..."
                useOptions={useAcikAlacakSecenekleri}
                minSearchLength={0}
                debounceMs={0}
              />
            )}
            <FormLabel label="Kayıt Tipi / Tarih" required>
              <FormSelect control={control} name="Tip" options={TAHSILAT_TIP_SECENEKLERI} />
              <FormInput control={control} name="Tarih" type="date" />
            </FormLabel>
            <FormInput
              control={control}
              name="Tutar"
              label="Tutar"
              format="money"
              required
              description={sinirMetni}
              endIcon={<span className="text-xs text-muted-foreground">{paraBirimi}</span>}
            />
            {paraBirimi !== "TRY" && (
              <FormInput
                control={control}
                name="Kur"
                label="Kur"
                format="decimal"
                placeholder="Boş → satışın kuru"
                description="Tahsilat günü kuru; TL raporlarında bu kur kullanılır."
                endIcon={<span className="text-xs text-muted-foreground">₺</span>}
              />
            )}
            <FormSelect control={control} name="OdemeSekli" label="Ödeme Şekli" options={ODEME_SEKLI_SECENEKLERI} />
            <FormLabel label="Fatura No / Tarih">
              <FormInput control={control} name="FaturaNo" placeholder="Opsiyonel" maxLength={50} />
              <FormInput control={control} name="FaturaTarihi" type="date" />
            </FormLabel>
            <FormInput control={control} name="Aciklama" label="Açıklama" type="textarea" rows={2} maxLength={500} />

            <DialogFooter>
              <Button type="button" appearance="outline" onClick={() => onOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
