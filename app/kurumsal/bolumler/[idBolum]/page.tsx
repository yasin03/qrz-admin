"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function BolumDetayPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
      <h1 className="text-lg font-semibold text-foreground">Bölüm Düzenleme</h1>
      <p className="text-sm text-muted-foreground">
        Bölüm düzenleme artık liste ekranında modal üzerinden yapılır. Lütfen
        bir önceki ekrana dönüp "Düzenle" aksiyonunu kullanın.
      </p>

      <Button
        type="button"
        color="secondary"
        appearance="ghost"
        size="sm"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        Geri
      </Button>
    </div>
  );
}
