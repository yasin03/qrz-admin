import { z } from "zod";

import { GUN_KODLARI } from "@/modules/core/lib/ajanda-tekrar";

/** Radix Select "" değeri kabul etmediği için "seçilmedi" anlamında kullanılır. */
export const SECILMEDI = "yok";

const SAAT = /^\d{2}:\d{2}$/;

export const ajandaSchema = z
  .object({
    Baslik: z.string().trim().min(1, "Başlık zorunludur.").max(250, "En fazla 250 karakter."),
    IDAjandaKategori: z.string(),
    /** "" = kategori rengi */
    Renk: z.string(),
    TumGun: z.boolean(),
    /** "yyyy-MM-dd" */
    BaslangicTarih: z.string().min(1, "Başlangıç tarihi zorunludur."),
    /** "HH:mm" */
    BaslangicSaat: z.string(),
    BitisTarih: z.string(),
    BitisSaat: z.string(),
    Konum: z.string().max(250, "En fazla 250 karakter."),
    Aciklama: z.string(),

    TekrarTip: z.enum(["yok", "gunluk", "haftaici", "haftalik", "aylik", "yillik"]),
    TekrarAralik: z.string(),
    TekrarGunler: z.array(z.enum(GUN_KODLARI)),
    AylikTip: z.enum(["gun", "haftagunu"]),
    TekrarBitisTip: z.enum(["asla", "tarih", "sayi"]),
    TekrarBitisTarih: z.string(),
    TekrarSayi: z.string(),

    /** IDKullanici listesi (string). */
    Katilimcilar: z.array(z.string()),
    /** Dakika ya da SECILMEDI. */
    HatirlatmaDakika: z.string(),
    HatirlatmaEposta: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.TumGun && !SAAT.test(v.BaslangicSaat)) {
      ctx.addIssue({ code: "custom", path: ["BaslangicSaat"], message: "Saat zorunludur." });
    }

    if (v.BitisTarih) {
      const bas = `${v.BaslangicTarih} ${v.TumGun ? "00:00" : v.BaslangicSaat}`;
      const son = `${v.BitisTarih} ${v.TumGun ? "00:00" : v.BitisSaat || "00:00"}`;
      if (son < bas) {
        ctx.addIssue({
          code: "custom",
          path: [v.TumGun || v.BitisTarih < v.BaslangicTarih ? "BitisTarih" : "BitisSaat"],
          message: "Bitiş, başlangıçtan önce olamaz.",
        });
      }
    }

    if (v.TekrarTip !== "yok") {
      const aralik = Number(v.TekrarAralik);
      if (!Number.isInteger(aralik) || aralik < 1 || aralik > 99) {
        ctx.addIssue({ code: "custom", path: ["TekrarAralik"], message: "1–99 arası olmalı." });
      }
      if (v.TekrarBitisTip === "tarih") {
        if (!v.TekrarBitisTarih) {
          ctx.addIssue({ code: "custom", path: ["TekrarBitisTarih"], message: "Bitiş tarihi seçin." });
        } else if (v.TekrarBitisTarih < v.BaslangicTarih) {
          ctx.addIssue({
            code: "custom",
            path: ["TekrarBitisTarih"],
            message: "Başlangıçtan önce olamaz.",
          });
        }
      }
      if (v.TekrarBitisTip === "sayi") {
        const sayi = Number(v.TekrarSayi);
        if (!Number.isInteger(sayi) || sayi < 1 || sayi > 999) {
          ctx.addIssue({ code: "custom", path: ["TekrarSayi"], message: "1–999 arası olmalı." });
        }
      }
    }
  });

export type AjandaForm = z.infer<typeof ajandaSchema>;
