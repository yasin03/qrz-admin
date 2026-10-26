// app/(dashboard)/kurumsal/sirketler/[idSirket]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSirketDetay } from "@/hooks/use-kurumsal-data";

import Sube from "@/components/kurumsal/sube/Sube";
import { SirketDetayForm } from "@/components/kurumsal/sirket/SirketDetayForm";

export default function SirketDetayPage() {
  const params = useParams<{ idSirket: string }>();
  const router = useRouter();
  const idSirket = Number(params.idSirket);

  const { data: sirket } = useSirketDetay(idSirket);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            color="secondary"
            appearance="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Geri dön"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {sirket?.SirketAdi}
            </h1>
            <p className="text-sm text-muted-foreground">
              Şirket bilgilerini görüntüle ve düzenle
            </p>
          </div>
        </div>
      </div>

      <SirketDetayForm idSirket={idSirket} />

      {sirket && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Şubeler</h2>
          <Sube idSirket={idSirket} />
        </div>
      )}
    </div>
  );
}
