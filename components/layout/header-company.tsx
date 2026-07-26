"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { months } from "@/utils/data";
import { Building2Icon } from "lucide-react";
import {
  useKurumsalData,
  useSirketler,
  useSubeler,
} from "@/hooks/use-kurumsal-data";
import { FormSelect } from "../forms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const HeaderCompany = () => {
  const currentDate = new Date();

  const years = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) =>
      (currentDate.getFullYear() - i).toString(),
    );
  }, [currentDate]);

  const form = useForm<any>({
    defaultValues: {
      IDGurup: "",
      IDSirket: "",
      IDSube: "",
    },
  });
  const selectedGrup = form.watch("IDGurup");
  const selectedSirket = form.watch("IDSirket");
  const selectedSube = form.watch("IDSube");

  const { gruplar, isLoadingGruplar, createGrup } = useKurumsalData();
  const {
    data: sirketler = [],
    isLoading: isLoadingSirketler,
    isError: isErrorSirketler,
  } = useSirketler(selectedGrup ?? 0);
  const {
    data: subeler = [],
    isLoading: isLoadingSubeler,
    isError: isErrorSubeler,
  } = useSubeler(selectedSirket ?? 0);

  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState(
    String(currentDate.getMonth() + 1).padStart(2, "0"),
  );

  useEffect(() => {
    if (!gruplar.length) return;

    if (!form.getValues("IDGurup")) {
      form.setValue("IDGurup", gruplar[0].IDGurup);
    }
  }, [gruplar, form]);
  useEffect(() => {
    if (!sirketler.length) return;

    form.setValue("IDSirket", sirketler[0].IDSirket);
  }, [sirketler, form]);
  useEffect(() => {
    if (!subeler.length) return;

    form.setValue("IDSube", subeler[0].IDSube);
  }, [subeler, form]);

  useEffect(() => {
    form.setValue("IDSirket", undefined);
    form.setValue("IDSube", undefined);
  }, [selectedGrup]);

  useEffect(() => {
    form.setValue("IDSube", undefined);
  }, [selectedSirket]);

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
    } / ${currentSube?.SubeAdi ?? ""} / ${year}/${month}`;
  }, [currentGrup, currentSirket, currentSube, year, month]);
  const onSubmit = (data: any) => {
    console.log("Form submitted:", data);
  };

  return (
    <Dialog>
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
            {year}/{month}
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

            <div className="flex items-center gap-4">
              <Label className="w-24 shrink-0">Dönem</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HeaderCompany;
