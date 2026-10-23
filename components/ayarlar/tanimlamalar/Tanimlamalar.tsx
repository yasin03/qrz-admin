"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PersonelGrupListesi from "./personel-grup/PersonelGrupListesi";

// Yeni tanım tipleri buraya tab olarak ekleniyor.
type TabValue = "personel-grup";

const TanimlamalarPage = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("personel-grup");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Tanımlamalar</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="personel-grup">Personel Grupları</TabsTrigger>
            <TabsTrigger value="katsayilar">Katsayılar</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personel-grup">
          <PersonelGrupListesi enabled={activeTab === "personel-grup"} />
        </TabsContent>
        <TabsContent value="katsayilar">
          <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Katsayıları tanımlama işlemleri henüz geliştirilme aşamasındadır.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TanimlamalarPage;
