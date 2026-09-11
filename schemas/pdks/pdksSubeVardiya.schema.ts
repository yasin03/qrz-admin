import { z } from "zod";

const saatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const subeVardiyaSaatSchema = z
  .object({
    VardiyaAdi: z.string().min(2, "Vardiya adı en az 2 karakter olmalı."),
    BaslamaSaati: z.string().regex(saatRegex, "Geçerli bir saat girin."),
    BitisSaati: z.string().regex(saatRegex, "Geçerli bir saat girin."),
    Gece: z.boolean(),
    HT: z.coerce.number().min(1).max(7, "Hafta tatili günü seçin."),
  })
  .refine((data) => data.Gece || data.BaslamaSaati < data.BitisSaati, {
    message: "Gece vardiyası değilse bitiş, başlangıçtan sonra olmalı.",
    path: ["BitisSaati"],
  });

export type SubeVardiyaSaatFormSchema = z.infer<typeof subeVardiyaSaatSchema>;
