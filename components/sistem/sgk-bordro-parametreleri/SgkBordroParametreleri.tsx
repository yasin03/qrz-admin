"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/use-tab-param";
import TatilListesi from "./tatiller/TatilListesi";
import IzinLimitListesi from "./izin-limitleri/IzinLimitListesi";
import VergiOranListesi from "./vergi-oranlari/VergiOranListesi";
import KatsayiOranListesi from "./katsayi-oranlari/KatsayiOranListesi";
import EngelliIndirimListesi from "./engelli-indirim-oranlari/EngelliIndirimListesi";
import MeslekKoduListesi from "./meslek-kodlari/MeslekKoduListesi";
import KidemIhbarListesi from "./kidem-ihbar/KidemIhbarListesi";

// Yeni parametre tipleri buraya tab olarak eklenir.
const TABS = [
  { value: "vergi-oranlari", label: "Vergi Yüzde Oranları" },
  { value: "katsayi-oranlari", label: "Katsayı Oranları" },
  { value: "kidem-ihbar", label: "Kıdem İhbar Tanımları" },
  { value: "engelli-indirim-oranlari", label: "Engelli İndirim Oranları" },
  { value: "meslek-kodlari", label: "Meslek Kodları" },
  { value: "izin-limitleri", label: "İzin Limitleri" },
  { value: "tatiller", label: "Tatiller" },
] as const;

const TAB_VALUES = TABS.map((t) => t.value);

const HAZIR_TABLAR: string[] = [
  "vergi-oranlari",
  "katsayi-oranlari",
  "kidem-ihbar",
  "engelli-indirim-oranlari",
  "meslek-kodlari",
  "izin-limitleri",
  "tatiller",
];

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

        <TabsContent value="vergi-oranlari">
          <VergiOranListesi enabled={activeTab === "vergi-oranlari"} />
        </TabsContent>

        <TabsContent value="katsayi-oranlari">
          <KatsayiOranListesi enabled={activeTab === "katsayi-oranlari"} />
        </TabsContent>

        <TabsContent value="kidem-ihbar">
          <KidemIhbarListesi enabled={activeTab === "kidem-ihbar"} />
        </TabsContent>

        <TabsContent value="engelli-indirim-oranlari">
          <EngelliIndirimListesi
            enabled={activeTab === "engelli-indirim-oranlari"}
          />
        </TabsContent>

        <TabsContent value="meslek-kodlari">
          <MeslekKoduListesi enabled={activeTab === "meslek-kodlari"} />
        </TabsContent>

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
