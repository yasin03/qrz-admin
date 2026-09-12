"use client";

import { useCurrentContext } from "@/hooks/use-context";
import { KULLANICI_TIPI } from "@/lib/roles";
import PuantajListesi from "./PuantajListesi";
import PersonelPuantajTakvimi from "./PersonelPuantajTakvimi";
import { AY_DATA } from "@/constants/data";
import { useHasRole } from "@/stores/auth-store";

const PuantajPage = () => {
  const { data: savedContext } = useCurrentContext();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);

  const sessionMonth =
    AY_DATA.find((ay) => ay.value === savedContext?.Ay)?.label || "";

  if (isPersonel) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Puantajım</h1>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          PDKS Yönetimi{" "}
          <small className="text-gray-400 italic">- {sessionMonth}</small>
        </h1>
      </div>

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
