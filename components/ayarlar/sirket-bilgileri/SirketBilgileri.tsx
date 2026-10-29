"use client";

import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentContext } from "@/hooks/use-context";
import { useSirketler } from "@/hooks/use-kurumsal-data";
import { SirketDetayForm } from "@/components/kurumsal/sirket/SirketDetayForm";
import Sube from "@/components/kurumsal/sube/Sube";

const SirketBilgileri = () => {
  const { data: context, isLoading: isLoadingContext } = useCurrentContext();
  const idGurup = Number(context?.IDGurup ?? 0);
  const { data: sirketler = [], isLoading: isLoadingSirketler } =
    useSirketler(idGurup);

  // Kullanıcı dropdown'dan seçim yapana kadar context'teki şirket gösterilir.
  const [seciliSirket, setSeciliSirket] = useState<number | null>(null);
  const idSirket = seciliSirket ?? Number(context?.IDSirket ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Şirket Bilgileri</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select
            value={idSirket ? String(idSirket) : undefined}
            onValueChange={(value) => setSeciliSirket(Number(value))}
            disabled={isLoadingContext || isLoadingSirketler}
          >
            <SelectTrigger className="w-full sm:w-64">
              <Building2 className="text-muted-foreground" />
              <SelectValue placeholder="Şirket seçin" />
            </SelectTrigger>
            <SelectContent>
              {sirketler.map((sirket) => (
                <SelectItem key={sirket.IDSirket} value={String(sirket.IDSirket)}>
                  {sirket.SirketAdi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoadingContext ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !idSirket ? (
        <p className="text-sm text-muted-foreground">Lütfen bir şirket seçin.</p>
      ) : (
        <>
          {/* key: şirket değişince form state'i sıfırdan kurulsun */}
          <SirketDetayForm key={idSirket} idSirket={idSirket} />

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Şubeler
            </h2>
            <Sube idSirket={idSirket} />
          </div>
        </>
      )}
    </div>
  );
};

export default SirketBilgileri;
