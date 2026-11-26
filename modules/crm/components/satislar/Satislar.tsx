"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/use-tab-param";

import { Finans } from "../finans/Finans";
import { SatisListesi } from "./SatisListesi";

const TABS = ["satislar", "finans"] as const;

/** Satışlar sayfası: satış (alacak doğuran kayıt) ve finans (tahsilat) ayrı sekmelerde. */
const SatislarPage = () => {
  const [activeTab, setActiveTab] = useTabParam(TABS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Satışlar</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="satislar">Satışlar</TabsTrigger>
          <TabsTrigger value="finans">Finans</TabsTrigger>
        </TabsList>

        <TabsContent value="satislar">
          <SatisListesi />
        </TabsContent>

        <TabsContent value="finans">
          <Finans />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SatislarPage;
