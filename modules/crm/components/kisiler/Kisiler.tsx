"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/use-tab-param";

import { KisiListesi } from "./KisiListesi";

const TABS = ["musteriler", "kontaklar"] as const;

const KisilerPage = () => {
  const [activeTab, setActiveTab] = useTabParam(TABS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Kişiler</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="musteriler">Müşteriler</TabsTrigger>
          <TabsTrigger value="kontaklar">Kontaklar</TabsTrigger>
        </TabsList>

        <TabsContent value="musteriler">
          <KisiListesi tip="Musteri" />
        </TabsContent>

        <TabsContent value="kontaklar">
          <KisiListesi tip="Kontak" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KisilerPage;
