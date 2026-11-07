"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, QrCode, Trash2 } from "lucide-react";

import { SideDrawer, useLastDefined } from "../customs/SideDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useUpdateLokasyon } from "@/hooks/use-lokasyon";
import { LokasyonType } from "@/types/lokasyon";
import {
  LokasyonFormFields,
  lokasyonSchema,
  parseCoordinate,
  type LokasyonForm,
} from "./LokasyonEkle";
import { QrKodPanel } from "./QRKodDialog";

export type LokasyonDetayTab = "bilgiler" | "qr";

type Props = {
  lokasyon: LokasyonType | null;
  onOpenChange: (open: boolean) => void;
  tab: LokasyonDetayTab;
  onTabChange: (tab: LokasyonDetayTab) => void;
  bolumOptions: Array<{ value: string; label: string }>;
  onDelete: (id: string) => void;
  onSuccess?: () => void;
};

const toFormValues = (lokasyon: LokasyonType): LokasyonForm => ({
  IDBolum: String(lokasyon.IDBolum ?? ""),
  LokasyonAdi: lokasyon.LokasyonAdi ?? "",
  Enlem: String(lokasyon.Enlem ?? ""),
  Boylam: String(lokasyon.Boylam ?? ""),
  Aktif: Boolean(lokasyon.Aktif),
});

const LokasyonDetayDrawer = ({
  lokasyon: seciliLokasyon,
  onOpenChange,
  tab,
  onTabChange,
  bolumOptions,
  onDelete,
  onSuccess,
}: Props) => {
  const lokasyon = useLastDefined(seciliLokasyon);
  const { mutateAsync: updateLokasyon, isPending: isSaving } =
    useUpdateLokasyon();

  const form = useForm<LokasyonForm>({
    resolver: zodResolver(lokasyonSchema),
  });

  useEffect(() => {
    if (lokasyon) form.reset(toFormValues(lokasyon));
  }, [lokasyon, form]);

  const handleSubmit = async (values: LokasyonForm) => {
    if (!lokasyon) return;
    try {
      await updateLokasyon({
        IDBolumLokasyon: String(lokasyon.IDBolumLokasyon),
        IDBolum: values.IDBolum,
        LokasyonAdi: values.LokasyonAdi.trim(),
        Enlem: String(parseCoordinate(values.Enlem)),
        Boylam: String(parseCoordinate(values.Boylam)),
        Aktif: values.Aktif ? 1 : 0,
      });
      toast.success("Lokasyon başarıyla güncellendi.");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lokasyon güncellenemedi.",
      );
    }
  };

  if (!lokasyon) return null;

  return (
    <SideDrawer
      open={!!seciliLokasyon}
      onOpenChange={onOpenChange}
      title={lokasyon.LokasyonAdi}
      badge={
        <Badge variant={lokasyon.Aktif ? "success" : "danger"}>
          {lokasyon.Aktif ? "Aktif" : "Pasif"}
        </Badge>
      }
      description={lokasyon.BolumAdi}
      footer={
        <>
          <Button
            type="button"
            variant="danger"
            appearance="outline"
            className="flex-1"
            onClick={() => onDelete(lokasyon.IDBolumLokasyon)}
            disabled={isSaving}
          >
            <Trash2 className="size-4" />
            Sil
          </Button>
          {tab === "bilgiler" && (
            <Button
              type="submit"
              form="lokasyon-detay-form"
              className="flex-1"
              disabled={isSaving || !form.formState.isDirty}
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          )}
        </>
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as LokasyonDetayTab)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="bilgiler">
            <Pencil className="size-4" />
            Bilgiler
          </TabsTrigger>
          <TabsTrigger value="qr" disabled={!lokasyon.Aktif}>
            <QrCode className="size-4" />
            QR Kod
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bilgiler">
          <form
            id="lokasyon-detay-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <LokasyonFormFields
              control={form.control}
              bolumOptions={bolumOptions}
              disabled={isSaving}
            />
          </form>
        </TabsContent>

        <TabsContent value="qr">
          <QrKodPanel data={lokasyon} />
        </TabsContent>
      </Tabs>
    </SideDrawer>
  );
};

export default LokasyonDetayDrawer;
