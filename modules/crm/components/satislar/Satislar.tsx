"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/use-tab-param";
import type { DbId } from "@/modules/crm/types/satis";

import { Finans } from "../finans/Finans";
import { SatisListesi } from "./SatisListesi";

const TABS = ["satislar", "finans"] as const;

/** Satışlar sayfası: satış (alacak doğuran kayıt) ve finans (tahsilat) ayrı sekmelerde. */
const SatislarPage = () => {
  const [activeTab, setActiveTab] = useTabParam(TABS);
  const pathname = usePathname();

  // Finans'tan satışa geçiş: sekme ve açık satış tek adres güncellemesiyle
  // (iki ayrı replaceState birbirinin parametresini ezerdi).
  const satisAc = useCallback(
    (id: DbId) => {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", "satislar");
      params.set("satis", String(id));
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    },
    [pathname],
  );

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
          <Finans onSatisAc={satisAc} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SatislarPage;
