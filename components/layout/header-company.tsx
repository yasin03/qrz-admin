"use client";

import React, { useMemo, useState } from "react";
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

const HeaderCompany = () => {
  const currentDate = new Date();

  const years = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) =>
      (currentDate.getFullYear() - i).toString(),
    );
  }, [currentDate]);

  const [group, setGroup] = useState("1");
  const [company, setCompany] = useState("1");
  const [branch, setBranch] = useState("1");
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState(
    String(currentDate.getMonth() + 1).padStart(2, "0"),
  );

  const title = useMemo(() => {
    const groupName =
      group === "1"
        ? "Kurtalan Ekspres"
        : group === "2"
        ? "Yıldız Holding"
        : "Demo Grup";

    const companyName =
      company === "1"
        ? "Kurtalan A.Ş."
        : company === "2"
        ? "Kurtalan Teknoloji"
        : "Demo Şirket";

    const branchName =
      branch === "1" ? "Merkez" : branch === "2" ? "İstanbul" : "Ankara";

    return `${groupName} / ${companyName} / ${branchName} / ${year}/${month}`;
  }, [group, company, branch, year, month]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button color="secondary" appearance="outline" className="py-2" title={title}>
            <Building2Icon />
          <span className="text-sm font-semibold text-foreground">
            Kurtalan Ekspres Grubu
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

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Grup</Label>

            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Kurtalan Ekspres</SelectItem>
                <SelectItem value="2">Yıldız Holding</SelectItem>
                <SelectItem value="3">Demo Grup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Şirket</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Kurtalan A.Ş.</SelectItem>
                <SelectItem value="2">Kurtalan Teknoloji</SelectItem>
                <SelectItem value="3">Demo Şirket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0">Şube</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Merkez</SelectItem>
                <SelectItem value="2">İstanbul</SelectItem>
                <SelectItem value="3">Ankara</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

        <DialogFooter>
          <Button>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HeaderCompany;
