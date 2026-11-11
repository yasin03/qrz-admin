import { z } from "zod";

export const bolumSchema = z.object({
  BolumAdi: z.string().min(2, "Bölüm adı en az 2 karakter olmalıdır."),
});

export type BolumForm = z.infer<typeof bolumSchema>;
