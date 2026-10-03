"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TalepListesi from "@/components/avans/TalepListesi";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import EklentiListesi from "./EklentiListesi";

type TabValue = "eklenti" | "kesinti";

const ParametrePage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;
  const [activeTab, setActiveTab] = useState<TabValue>("eklenti");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Eklenti & Kesinti Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="eklenti">
              {isPersonel ? "Eklentilerim" : "Tüm Eklentiler"}
            </TabsTrigger>
            <TabsTrigger value="kesinti">
              {isPersonel ? "Kesintilerim" : "Tüm Kesintiler"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="eklenti">
          <EklentiListesi
            enabled={Boolean(user) && activeTab === "eklenti"}
          />
        </TabsContent>

        <TabsContent value="kesinti">
          {/* <TalepListesi enabled={Boolean(user) && activeTab === "talep"} /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParametrePage;
