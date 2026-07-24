import { z } from "zod";

export const createGrupSchema = z.object({
  GrupAdi: z.string().min(3, "Grup adı en az 3 karakter olmalıdır."),

  YetkiliKisi: z.string().min(3, "Yetkili kişi zorunludur."),

  Tel: z.string().min(10, "Telefon zorunludur."),

  IsTel: z.string().optional(),

  Durum: z.boolean(),
});

export type CreateGrupForm = z.infer<typeof createGrupSchema>;
