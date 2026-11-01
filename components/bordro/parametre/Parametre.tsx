"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import { useTabParam } from "@/hooks/use-tab-param";
import EklentiListesi from "./eklenti/EklentiListesi";
import KesintiListesi from "./kesinti/KesintiListesi";
import MesaiListesi from "./mesai/MesaiListesi";

const TABS = ["eklenti", "kesinti", "mesai"] as const;

const ParametrePage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;
  const [activeTab, setActiveTab] = useTabParam(TABS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Eklenti, Kesinti & Mesai Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="eklenti">
              {isPersonel ? "Eklentilerim" : "Eklentiler"}
            </TabsTrigger>
            <TabsTrigger value="kesinti">
              {isPersonel ? "Kesintilerim" : "Kesintiler"}
            </TabsTrigger>
            <TabsTrigger value="mesai">
              {isPersonel ? "Mesailerim" : "Mesailer"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="eklenti">
          <EklentiListesi
            enabled={Boolean(user) && activeTab === "eklenti"}
          />
        </TabsContent>

        <TabsContent value="kesinti">
          <KesintiListesi
            enabled={Boolean(user) && activeTab === "kesinti"}
          />
        </TabsContent>

        <TabsContent value="mesai">
          <MesaiListesi enabled={Boolean(user) && activeTab === "mesai"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParametrePage;
