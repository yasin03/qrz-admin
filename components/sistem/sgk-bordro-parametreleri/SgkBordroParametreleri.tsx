"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/use-tab-param";
import TatilListesi from "./tatiller/TatilListesi";
import IzinLimitListesi from "./izin-limitleri/IzinLimitListesi";

// Yeni parametre tipleri buraya tab olarak eklenir.
const TABS = [
  { value: "vergi-oranlari", label: "Vergi Yüzde Oranları" },
  { value: "katsayi-oranlari", label: "Katsayı Oranları" },
  { value: "engelli-indirim-oranlari", label: "Engelli İndirim Oranları" },
  { value: "kidem-ihbar-sureleri", label: "Kıdem-İhbar Süreleri" },
  { value: "meslek-kodlari", label: "Meslek Kodları" },
  { value: "izin-limitleri", label: "İzin Limitleri" },
  { value: "tatiller", label: "Tatiller" },
] as const;

const TAB_VALUES = TABS.map((t) => t.value);

const HAZIR_TABLAR: string[] = ["izin-limitleri", "tatiller"];

const SgkBordroParametreleri = () => {
  const [activeTab, setActiveTab] = useTabParam(TAB_VALUES);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">
          SGK Bordro Parametreleri
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* 7 tab dar ekranda sığmadığı için liste yatay kaydırılabilir */}
        <div className="max-w-full overflow-x-auto">
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="px-2.5">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* İçeriği henüz yapılmamış tablar */}
        {TABS.filter((tab) => !HAZIR_TABLAR.includes(tab.value)).map((tab) => (
          <TabsContent key={tab.value} value={tab.value} />
        ))}

        <TabsContent value="izin-limitleri">
          <IzinLimitListesi enabled={activeTab === "izin-limitleri"} />
        </TabsContent>

        <TabsContent value="tatiller">
          <TatilListesi enabled={activeTab === "tatiller"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SgkBordroParametreleri;
