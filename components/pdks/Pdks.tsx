"use client";

import { useMemo, useState } from "react";
import { Clock, Loader2, Plus, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import SubeVardiyaEkle from "@/components/pdks/vardiya-ayar/SubeVardiyaEkle";
import SubeVardiyaListesi from "@/components/pdks/vardiya-ayar/SubeVardiyaListesi";
import BolumVardiyaEkle from "@/components/pdks/vardiya-ayar/BolumVardiyaEkle";
import BolumVardiyaListesi from "@/components/pdks/vardiya-ayar/BolumVardiyaListesi";
import PdksFiltre from "@/components/pdks/PdksFiltre";
import PdksListesi from "@/components/pdks/PdksListesi";
import {
  SubeVardiyaSaat,
  BolumVardiyaSaat,
  PDKSSelectRequestType,
} from "@/types/pdks";
import { useBolumler } from "@/hooks/use-kurumsal-data";
import { useCurrentContext } from "@/hooks/use-context";
import { useRole } from "@/stores/auth-store";
import PersonelPdksListesi from "@/components/pdks/PersonelPdksListesi";

type TabValue = "pdks" | "sube-vardiya" | "bolum-vardiya";

// Personel kendi aylık kayıtlarını, diğer roller PDKS yönetim ekranını görür
const PdksPage = () => {
  const { data: savedContext, isPending: isContextPending } =
    useCurrentContext();
  const { isPersonel } = useRole();

  if (isPersonel) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold sm:text-2xl">PDKS Kayıtlarım</h1>
        {/* Yil/Ay ilk değer olarak alındığı için context gelmeden mount etme */}
        {isContextPending ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <PersonelPdksListesi
            initialYil={savedContext?.Yil}
            initialAy={savedContext?.Ay}
          />
        )}
      </div>
    );
  }

  return <PdksYonetimi />;
};

const PdksYonetimi = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("pdks");
  const { data: savedContext } = useCurrentContext();
  const idSube = savedContext?.IDSube ? Number(savedContext.IDSube) : 0;

  const { data: bolumler = [], isLoading: isLoadingBolumler } =
    useBolumler(idSube);

  // ---- Şube vardiya dialog state -----------------------------------------
  const [openSubeVardiyaEkle, setOpenSubeVardiyaEkle] = useState(false);
  const [duzenlenecekSubeVardiya, setDuzenlenecekSubeVardiya] =
    useState<SubeVardiyaSaat | null>(null);

  const handleSubeVardiyaEkle = () => {
    setDuzenlenecekSubeVardiya(null);
    setOpenSubeVardiyaEkle(true);
  };

  const handleSubeVardiyaDuzenle = (kayit: SubeVardiyaSaat) => {
    setDuzenlenecekSubeVardiya(kayit);
    setOpenSubeVardiyaEkle(true);
  };

  // ---- Bölüm vardiya dialog state + seçili bölüm -------------------------
  const [selectedIDBolum, setSelectedIDBolum] = useState<string>("");
  const idBolum = selectedIDBolum ? Number(selectedIDBolum) : null;

  const [openBolumVardiyaEkle, setOpenBolumVardiyaEkle] = useState(false);
  const [duzenlenecekBolumVardiya, setDuzenlenecekBolumVardiya] =
    useState<BolumVardiyaSaat | null>(null);

  const handleBolumVardiyaEkle = () => {
    setDuzenlenecekBolumVardiya(null);
    setOpenBolumVardiyaEkle(true);
  };

  const handleBolumVardiyaDuzenle = (kayit: BolumVardiyaSaat) => {
    setDuzenlenecekBolumVardiya(kayit);
    setOpenBolumVardiyaEkle(true);
  };

  const bolumOptions = useMemo(
    () =>
      bolumler.map((b) => ({
        value: String(b.IDBolum),
        label: b.BolumAdi,
      })),
    [bolumler],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold sm:text-2xl">PDKS Yönetimi</h1>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="pdks">
              <Clock /> PDKS Kayıtları
            </TabsTrigger>
            <TabsTrigger value="sube-vardiya">
              <Settings /> Şube Vardiya Ayarları
            </TabsTrigger>
            <TabsTrigger value="bolum-vardiya">
              <Settings /> Bölüm Vardiya Ayarları
            </TabsTrigger>
          </TabsList>

          {activeTab === "sube-vardiya" && (
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={handleSubeVardiyaEkle}>
                <Plus className="size-4" />
                Yeni Vardiya Ekle
              </Button>
            </div>
          )}

          {activeTab === "bolum-vardiya" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={selectedIDBolum}
                onValueChange={setSelectedIDBolum}
                disabled={isLoadingBolumler}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Bölüm seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {bolumOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                size="sm"
                onClick={handleBolumVardiyaEkle}
                disabled={!idBolum}
              >
                <Plus className="size-4" />
                Yeni Vardiya Ekle
              </Button>
            </div>
          )}
        </div>

        {/* forceMount: sekme değişince unmount olmasın, filtre ve açık detaylar korunsun */}
        <TabsContent
          value="pdks"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <PdksListesi enabled={Boolean(activeTab === "pdks")} />
        </TabsContent>

        <TabsContent value="sube-vardiya">
          <SubeVardiyaListesi
            enabled={activeTab === "sube-vardiya"}
            onDuzenle={handleSubeVardiyaDuzenle}
          />
        </TabsContent>

        <TabsContent value="bolum-vardiya">
          <BolumVardiyaListesi
            idBolum={idBolum}
            enabled={activeTab === "bolum-vardiya"}
            onDuzenle={handleBolumVardiyaDuzenle}
          />
        </TabsContent>
      </Tabs>

      {openSubeVardiyaEkle && (
        <SubeVardiyaEkle
          open={openSubeVardiyaEkle}
          onOpenChange={setOpenSubeVardiyaEkle}
          duzenlenecekKayit={duzenlenecekSubeVardiya}
        />
      )}

      {openBolumVardiyaEkle && (
        <BolumVardiyaEkle
          open={openBolumVardiyaEkle}
          onOpenChange={setOpenBolumVardiyaEkle}
          idBolum={idBolum}
          duzenlenecekKayit={duzenlenecekBolumVardiya}
        />
      )}
    </div>
  );
};

export default PdksPage;
