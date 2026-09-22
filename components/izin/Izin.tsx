"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import IzinListesi from "@/components/izin/IzinListesi";
import TalepListesi from "@/components/izin/TalepListesi";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";

type TabValue = "izin" | "talepler";

const IzinPage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;
  const [activeTab, setActiveTab] = useState<TabValue>("izin");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">İzin Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
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
