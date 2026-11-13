"use client";

import { useCurrentContext } from "@/modules/core/hooks/use-context";
import PuantajListesi from "./PuantajListesi";
import PersonelPuantajTakvimi from "./PersonelPuantajTakvimi";
import { useRole } from "@/stores/auth-store";
import { PersonelYetkiGuard } from "@/components/customs/PersonelYetkiGuard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/use-tab-param";
import MesaiCizelgesi from "./mesai/MesaiCizelgesi";

const TABS = ["puantaj", "mesai"] as const;

const PuantajPage = () => {
  const { data: savedContext, isPending: isContextPending } =
    useCurrentContext();
  const { isPersonel } = useRole();

  if (isPersonel) {
    return (
      <PersonelYetkiGuard yetki="PersonelPuantajGorur">
        <div className="space-y-4">
          <h1 className="mb-0 text-xl font-bold sm:text-2xl">Puantajım</h1>
          <PersonelPuantajTakvimi
            initialYil={savedContext?.Yil}
            initialAy={savedContext?.Ay}
          />
        </div>
      </PersonelYetkiGuard>
    );
  }

  return <PuantajYonetimi />;
};

const PuantajYonetimi = () => {
  const { data: savedContext } = useCurrentContext();
  const [activeTab, setActiveTab] = useTabParam(TABS);

  const selectParams = {
    IDSube: savedContext?.IDSube || "0",
    IDBolum: savedContext?.IDBolum || "0",
    Yil: savedContext?.Yil || new Date().getFullYear().toString(),
    Ay: (savedContext?.Ay || (new Date().getMonth() + 1).toString()).padStart(
      2,
      "0",
    ),
    Adi: "",
    TcKimlikNo: "",
  };

  return (
    <div className="space-y-4">
      <h1 className=" text-xl font-bold sm:text-2xl">
        Puantaj Yönetimi{" "}
        <small className="text-gray-400 italic">
          - {savedContext?.AyAdi ?? ""}
        </small>
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="puantaj">Puantaj Çizelgesi</TabsTrigger>
          <TabsTrigger value="mesai">Mesai Çizelgesi</TabsTrigger>
        </TabsList>

        <TabsContent value="puantaj">
          <PuantajListesi
            selectParams={selectParams}
            enabled={activeTab === "puantaj"}
          />
        </TabsContent>

        <TabsContent value="mesai">
          <MesaiCizelgesi
            selectParams={selectParams}
            enabled={activeTab === "mesai"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PuantajPage;
