"use client";

import { useCurrentContext } from "@/hooks/use-context";
import { KULLANICI_TIPI } from "@/lib/roles";
import PuantajListesi from "./PuantajListesi";
import PersonelPuantajTakvimi from "./PersonelPuantajTakvimi";
import { useHasRole } from "@/stores/auth-store";

const PuantajPage = () => {
  const { data: savedContext, isPending: isContextPending } =
    useCurrentContext();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);

  if (isPersonel) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold mb-0">Puantajım</h1>
        <PersonelPuantajTakvimi
          baseParams={{
            IDSube: savedContext?.IDSube || "0",
            IDBolum: savedContext?.IDBolum || "0",
          }}
          initialYil={savedContext?.Yil}
          initialAy={savedContext?.Ay}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-0">
        Puantaj Yönetimi{" "}
        <small className="text-gray-400 italic">
          - {savedContext?.AyAdi ?? ""}
        </small>
      </h1>

      <PuantajListesi
        selectParams={{
          IDSube: savedContext?.IDSube || "0",
          IDBolum: savedContext?.IDBolum || "0",
          Yil: savedContext?.Yil || new Date().getFullYear().toString(),
          Ay: (
            savedContext?.Ay || (new Date().getMonth() + 1).toString()
          ).padStart(2, "0"),
          Adi: "",
          TcKimlikNo: "",
        }}
        enabled={true}
      />
    </div>
  );
};

export default PuantajPage;
