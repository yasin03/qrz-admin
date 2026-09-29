"use client";

import { useState } from "react";
import { UserSearch } from "lucide-react";

import { useRole, useUser } from "@/stores/auth-store";
import OzlukBilgileri from "./OzlukBilgileri";
import PersonelSecici from "./PersonelSecici";

const OzlukPage = () => {
  const user = useUser();
  const { isPersonel } = useRole();
  const [seciliPersonel, setSeciliPersonel] = useState<string | null>(null);

  if (isPersonel) {
    return (
      <div className="space-y-4">
        <h1 className="mb-0 text-xl font-bold sm:text-2xl">
          Özlük Bilgilerim
        </h1>
        {user?.IDSubePersonel ? (
          <OzlukBilgileri idSubePersonel={user.IDSubePersonel} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Hesabınıza bağlı bir personel kaydı bulunamadı.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="mb-0 text-xl font-bold sm:text-2xl">
          Personel Özlük Bilgileri
        </h1>
        <PersonelSecici
          value={seciliPersonel}
          onChange={setSeciliPersonel}
        />
      </div>

      {seciliPersonel ? (
        <OzlukBilgileri idSubePersonel={seciliPersonel} isAdminView />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <UserSearch className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Personel seçilmedi
          </p>
          <p className="text-sm text-muted-foreground">
            Özlük bilgilerini görüntülemek için yukarıdan bir personel seçin.
          </p>
        </div>
      )}
    </div>
  );
};

export default OzlukPage;
