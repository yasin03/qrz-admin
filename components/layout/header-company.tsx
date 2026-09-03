"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { months } from "@/utils/data";
import { Building2Icon } from "lucide-react";
import {
  useKurumsalData,
  useSirketler,
  useSubeler,
} from "@/hooks/use-kurumsal-data";
import { useCurrentContext, useSaveContext } from "@/hooks/use-context";
import { FormLabel, FormSelect } from "../forms";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type HeaderCompanyFormValues = {
  IDGurup?: number | string;
  IDSirket?: number | string;
  IDSube?: number | string;
  Yil: string;
  Ay: string;
};

type ContextResponse = {
  context: {
    IDGurup?: number | string | null;
    IDSirket?: number | string | null;
    IDSube?: number | string | null;
    Yil?: number | string | null;
    Ay?: number | string | null;
  } | null;
};

const HeaderCompany = () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getFullYear());
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preferredContext, setPreferredContext] =
    useState<ContextResponse["context"]>(null);

  const years = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => {
      const yearValue = String(Number(currentYear) - i);
      return { value: yearValue, label: yearValue };
    });
  }, [currentYear]);
  const form = useForm<HeaderCompanyFormValues>({
    defaultValues: {
      IDGurup: undefined,
      IDSirket: undefined,
      IDSube: undefined,
      Yil: currentYear,
      Ay: currentMonth,
    },
  });
  const selectedGrup = Number(form.watch("IDGurup") ?? 0);
  const selectedSirket = Number(form.watch("IDSirket") ?? 0);
  const selectedSube = Number(form.watch("IDSube") ?? 0);
  const selectedYear = form.watch("Yil") || currentYear;
  const selectedMonth = form.watch("Ay") || currentMonth;

  const { gruplar } = useKurumsalData();
  const { data: sirketler = [] } = useSirketler(selectedGrup ?? 0);
  const { data: subeler = [] } = useSubeler(selectedSirket ?? 0);

  const { data: savedContext, isLoading: isLoadingContext } =
    useCurrentContext();
  const saveContext = useSaveContext();
  const hasHydratedFromContext = useRef(false);

  useEffect(() => {
    if (isLoadingContext || hasHydratedFromContext.current) return;
    hasHydratedFromContext.current = true;

    if (savedContext) {
      form.setValue("IDGurup", savedContext.IDGurup ?? undefined);
      form.setValue("IDSirket", savedContext.IDSirket ?? undefined);
      form.setValue("IDSube", savedContext.IDSube ?? undefined);
      if (savedContext.Yil) form.setValue("Yil", String(savedContext.Yil));
      if (savedContext.Ay) {
        form.setValue("Ay", String(savedContext.Ay).padStart(2, "0"));
      }
    }
  }, [isLoadingContext, savedContext, form]);

  useEffect(() => {
    if (!gruplar.length) return;

    const currentGrupValue = Number(form.getValues("IDGurup") ?? 0);
    if (
      currentGrupValue &&
      gruplar.some((x) => x.IDGurup === currentGrupValue)
    ) {
      return;
    }

    const preferredGrup = preferredContext?.IDGurup
      ? Number(preferredContext.IDGurup)
      : null;
    const nextGrup =
      preferredGrup && gruplar.some((x) => x.IDGurup === preferredGrup)
        ? preferredGrup
        : gruplar[0].IDGurup;

    form.setValue("IDGurup", nextGrup);
  }, [gruplar, form, preferredContext]);

  useEffect(() => {
    if (!sirketler.length) return;

    const currentSirketValue = Number(form.getValues("IDSirket") ?? 0);
    if (
      currentSirketValue &&
      sirketler.some((x) => x.IDSirket === currentSirketValue)
    ) {
      return;
    }

    const preferredSirket = preferredContext?.IDSirket
      ? Number(preferredContext.IDSirket)
      : null;
    const nextSirket =
      preferredSirket && sirketler.some((x) => x.IDSirket === preferredSirket)
        ? preferredSirket
        : sirketler[0].IDSirket;

    form.setValue("IDSirket", nextSirket);
  }, [sirketler, form, preferredContext]);

  useEffect(() => {
    if (!subeler.length) return;

    const currentSubeValue = Number(form.getValues("IDSube") ?? 0);
    if (
      currentSubeValue &&
      subeler.some((x) => x.IDSube === currentSubeValue)
    ) {
      return;
    }

    const preferredSube = preferredContext?.IDSube
      ? Number(preferredContext.IDSube)
      : null;
    const nextSube =
      preferredSube && subeler.some((x) => x.IDSube === preferredSube)
        ? preferredSube
        : subeler[0].IDSube;

    form.setValue("IDSube", nextSube);
  }, [subeler, form, preferredContext]);

  const currentGrup = useMemo(
    () => gruplar.find((x) => x.IDGurup === selectedGrup),
    [gruplar, selectedGrup],
  );

  const currentSirket = useMemo(
    () => sirketler.find((x) => x.IDSirket === selectedSirket),
    [sirketler, selectedSirket],
  );

  const currentSube = useMemo(
    () => subeler.find((x) => x.IDSube === selectedSube),
    [subeler, selectedSube],
  );

  const title = useMemo(() => {
    return `${currentGrup?.GurupAdi ?? ""} / ${
      currentSirket?.SirketAdi ?? ""
    } / ${currentSube?.SubeAdi ?? ""} / ${selectedYear}/${selectedMonth}`;
  }, [currentGrup, currentSirket, currentSube, selectedYear, selectedMonth]);

  const onSubmit = async (data: HeaderCompanyFormValues) => {
    if (!data.IDSirket) {
      toast.error("Lütfen bir şirket seçin.");
      return;
    }

    try {
      setIsSaving(true);

      await saveContext.mutateAsync({
        IDGurup: data.IDGurup || null,
        IDSirket: data.IDSirket,
        IDSube: data.IDSube || null,
        Yil: data.Yil,
        Ay: data.Ay,
      });

      toast.success("Çalışma bölümü güncellendi.");
      setOpen(false);

      // Tüm uygulama artık yeni context'e göre çalışmalı; API route'ları
      // grsisudo cookie'sini server-side okuyor, en garantili yol tam
      // sayfa yenilemesi — hem server hem client tarafındaki her cache
      // (React Query dahil) baştan, doğru context'le kurulur.
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || "Kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          color="secondary"
          appearance="outline"
          className="py-2"
          title={title}
        >
          <Building2Icon />
          <span className="text-sm font-semibold text-foreground">
            {currentGrup?.GurupAdi ?? ""}
          </span>
          <span className="text-xs text-muted-foreground">
            {selectedYear}/{selectedMonth}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Şirket Seçimi</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4 py-2">
            <FormSelect
              control={form.control}
              name="IDGurup"
              label="Grup"
              options={gruplar}
              valueKey="IDGurup"
              labelKey="GurupAdi"
              vertical
            />
            <FormSelect
              control={form.control}
              name="IDSirket"
              label="Şirket"
              options={sirketler}
              valueKey="IDSirket"
              labelKey="SirketAdi"
              vertical
            />
            <FormSelect
              control={form.control}
              name="IDSube"
              label="Şube"
              options={subeler}
              valueKey="IDSube"
              labelKey="SubeAdi"
              vertical
            />

            <FormLabel label="Dönem Yıl/Ay">
              <FormSelect
                control={form.control}
                name="Yil"
                options={years}
                valueKey="value"
                labelKey="label"
                vertical
              />
              <FormSelect
                control={form.control}
                name="Ay"
                options={months}
                valueKey="value"
                labelKey="label"
                vertical
              />
            </FormLabel>
          </div>
        </form>

        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HeaderCompany;
