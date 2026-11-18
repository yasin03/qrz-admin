"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormInput, FormLabel } from "@/components/forms";
import { cn } from "@/lib/utils";
import {
  useAjandaKategoriler,
  useDeleteAjandaKategori,
  useInsertAjandaKategori,
  useUpdateAjandaKategori,
} from "@/modules/core/hooks/use-ajanda";
import type { AjandaKategori, DbId } from "@/modules/core/types/takvim";

import { AjandaRenkSecici } from "./AjandaRenkSecici";
import { AJANDA_RENKLERI } from "./takvim-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Yeni kategori eklenince (etkinlik formunda otomatik seçmek için). */
  onCreated?: (IDAjandaKategori: DbId) => void;
};

const kategoriSchema = z.object({
  Ad: z
    .string()
    .trim()
    .min(1, "Kategori adı giriniz")
    .max(100, "En fazla 100 karakter."),
  Renk: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Renk seçiniz"),
});

type KategoriForm = z.infer<typeof kategoriSchema>;

const DEFAULT_VALUES: KategoriForm = { Ad: "", Renk: AJANDA_RENKLERI[0] };

/**
 * Ajanda kategorileri: sistem kategorileri salt okunur, kullanıcının kendi
 * kategorileri eklenir / düzenlenir / silinir. Etkinlik formunun içinden açılır.
 */
export function AjandaKategoriDialog({ open, onOpenChange, onCreated }: Props) {
  const { data: kategoriler = [], isLoading } = useAjandaKategoriler();
  const insert = useInsertAjandaKategori();
  const update = useUpdateAjandaKategori();
  const remove = useDeleteAjandaKategori();
  const isSaving = insert.isPending || update.isPending;

  const [duzenlenen, setDuzenlenen] = useState<AjandaKategori | null>(null);
  const [silinecek, setSilinecek] = useState<DbId | null>(null);

  const form = useForm<KategoriForm>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Kapanırken form ve seçimler sıfırlansın (effect yerine olay anında).
  const kapat = (v: boolean) => {
    if (!v) {
      form.reset(DEFAULT_VALUES);
      setDuzenlenen(null);
      setSilinecek(null);
    }
    onOpenChange(v);
  };

  const duzenle = (k: AjandaKategori) => {
    setDuzenlenen(k);
    setSilinecek(null);
    form.reset({ Ad: k.Ad, Renk: k.Renk.toUpperCase() });
  };

  const vazgec = () => {
    setDuzenlenen(null);
    form.reset(DEFAULT_VALUES);
  };

  const handleSubmit = async (values: KategoriForm) => {
    try {
      if (duzenlenen) {
        await update.mutateAsync({
          IDAjandaKategori: duzenlenen.IDAjandaKategori,
          Sira: duzenlenen.Sira,
          ...values,
        });
        toast.success("Kategori güncellendi.");
      } else {
        const ozelSayisi = kategoriler.filter((k) => !k.Sistem).length;
        const result = await insert.mutateAsync({
          ...values,
          Sira: ozelSayisi + 1,
        });
        toast.success("Kategori eklendi.");
        if (result?.IDAjandaKategori != null)
          onCreated?.(result.IDAjandaKategori);
      }
      vazgec();
    } catch (error) {
      toast.error((error as Error)?.message || "Kategori kaydedilemedi.");
    }
  };

  const sil = async (k: AjandaKategori) => {
    try {
      await remove.mutateAsync(k.IDAjandaKategori);
      toast.success("Kategori silindi.");
      setSilinecek(null);
      if (
        duzenlenen &&
        String(duzenlenen.IDAjandaKategori) === String(k.IDAjandaKategori)
      )
        vazgec();
    } catch (error) {
      toast.error((error as Error)?.message || "Kategori silinemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={kapat}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kategoriler</DialogTitle>
          <DialogDescription>
            Etkinliklerinizi gruplamak için kendi kategorilerinizi
            ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        {/* Etkinlik formunun içinden açıldığı için submit dış forma taşmasın. */}
        <form
          onSubmit={(event) => {
            event.stopPropagation();
            form.handleSubmit(handleSubmit)(event);
          }}
          className="flex flex-col gap-4 rounded-lg border p-3"
        >
          <FormInput
            control={form.control}
            name="Ad"
            label="Kategori Adı"
            required
            maxLength={100}
            disabled={isSaving}
          />
          <Controller
            control={form.control}
            name="Renk"
            render={({ field, fieldState }) => (
              <FormLabel label="Renk" required>
                <div className="flex flex-col gap-1">
                  <AjandaRenkSecici
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSaving}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              </FormLabel>
            )}
          />
          <div className="flex justify-end gap-2">
            {duzenlenen && (
              <Button
                type="button"
                appearance="outline"
                onClick={vazgec}
                disabled={isSaving}
              >
                Vazgeç
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {duzenlenen ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </form>

        <ul className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-lg border">
          {isLoading && (
            <li className="flex justify-center p-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </li>
          )}
          {kategoriler.map((k) => {
            const id = String(k.IDAjandaKategori);
            const aktif =
              duzenlenen && String(duzenlenen.IDAjandaKategori) === id;
            const silOnay = silinecek != null && String(silinecek) === id;

            return (
              <li
                key={id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2",
                  aktif && "bg-primary/5",
                )}
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: k.Renk }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{k.Ad}</span>

                {k.Sistem ? (
                  <Badge variant="gray" className="gap-1">
                    <Lock className="size-3" /> Sistem
                  </Badge>
                ) : silOnay ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      Silinsin mi?
                    </span>
                    <Button
                      type="button"
                      size="xs"
                      variant="danger"
                      disabled={remove.isPending}
                      onClick={() => sil(k)}
                    >
                      {remove.isPending && (
                        <Loader2 className="size-3 animate-spin" />
                      )}
                      Sil
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="secondary"
                      appearance="ghost"
                      aria-label="Vazgeç"
                      onClick={() => setSilinecek(null)}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="secondary"
                      appearance="ghost"
                      title="Düzenle"
                      aria-label={`${k.Ad} kategorisini düzenle`}
                      onClick={() => duzenle(k)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="danger"
                      appearance="ghost"
                      title="Sil"
                      aria-label={`${k.Ad} kategorisini sil`}
                      onClick={() => setSilinecek(k.IDAjandaKategori)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="-mt-2 text-xs text-muted-foreground">
          Silinen kategorideki etkinlikler kategorisiz kalır, renkleri korunur.
        </p>

        <DialogFooter>
          <Button
            type="button"
            appearance="outline"
            onClick={() => kapat(false)}
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
