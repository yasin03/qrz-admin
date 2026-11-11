"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import IzinListesi from "@/modules/bordro/components/izin/IzinListesi";
import TalepListesi from "@/modules/bordro/components/izin/TalepListesi";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import { useTabParam } from "@/hooks/use-tab-param";

const TABS = ["izin", "talepler"] as const;

const IzinPage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;
  const [activeTab, setActiveTab] = useTabParam(TABS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">İzin Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="izin">
              {isPersonel ? "İzinlerim" : "Tüm İzinler"}
            </TabsTrigger>
            <TabsTrigger value="talepler">
              {isPersonel ? "Taleplerim" : "Tüm Talepler"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="izin">
          <IzinListesi enabled={Boolean(user) && activeTab === "izin"} />
        </TabsContent>

        <TabsContent value="talepler">
          <TalepListesi enabled={Boolean(user) && activeTab === "izin"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IzinPage;
