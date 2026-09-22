"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TalepListesi from "@/components/avans/TalepListesi";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import AvansListesi from "./AvansListesi";

type TabValue = "avans" | "talep";

const AvansPage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;
  const [activeTab, setActiveTab] = useState<TabValue>("avans");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Avans Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="avans">
              {isPersonel ? "Avanslarım" : "Tüm Avanslar"}
            </TabsTrigger>
            <TabsTrigger value="talep">
              {isPersonel ? "Taleplerim" : "Tüm Talepler"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="avans">
          <AvansListesi enabled={Boolean(user) && activeTab === "avans"} />
        </TabsContent>

        <TabsContent value="talep">
          <TalepListesi enabled={Boolean(user) && activeTab === "talep"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvansPage;
