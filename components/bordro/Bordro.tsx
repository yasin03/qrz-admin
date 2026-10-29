"use client";

import { useCurrentContext } from "@/hooks/use-context";
import BordroListesi from "./BordroListesi";
import { useRole } from "@/stores/auth-store";
import { PersonelYetkiGuard } from "@/components/customs/PersonelYetkiGuard";
import PersonelBordroListesi from "./PersonelBordroListesi";

const BordroPage = () => {
  const { data: savedContext, isPending: isContextPending } =
    useCurrentContext();
  const { isPersonel } = useRole();

  if (isPersonel) {
    return (
      <PersonelYetkiGuard yetki="PersonelBordroGorur">
        <div className="space-y-4">
          <h1 className="mb-0 text-xl font-bold sm:text-2xl">Bordrom</h1>
          <PersonelBordroListesi
            initialYil={savedContext?.Yil}
            initialAy={savedContext?.Ay}
          />
        </div>
      </PersonelYetkiGuard>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="mb-0 text-xl font-bold sm:text-2xl">
        Bordro Yönetimi
        <small className="text-gray-400 italic">
          - {savedContext?.AyAdi ?? ""}
        </small>
      </h1>

      <BordroListesi />
    </div>
  );
};

export default BordroPage;
