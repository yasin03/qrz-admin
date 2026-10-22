"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import EklentiListesi from "./eklenti/EklentiListesi";
import KesintiListesi from "./kesinti/KesintiListesi";
import MesaiListesi from "./mesai/MesaiListesi";

type TabValue = "eklenti" | "kesinti" | "mesai";

const ParametrePage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;
  const [activeTab, setActiveTab] = useState<TabValue>("eklenti");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Eklenti, Kesinti & Mesai Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
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
