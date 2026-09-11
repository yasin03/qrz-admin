"use client";

import { useMemo, useState } from "react";
import { Clock, Plus, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import SubeVardiyaEkle from "@/components/pdks/SubeVardiyaEkle";
import SubeVardiyaListesi from "@/components/pdks/SubeVardiyaListesi";
import BolumVardiyaEkle from "@/components/pdks/BolumVardiyaEkle";
import BolumVardiyaListesi from "@/components/pdks/BolumVardiyaListesi";
import PdksFiltre from "@/components/pdks/PdksFiltre";
import PdksListesi from "@/components/pdks/PdksListesi";
import {
  SubeVardiyaSaat,
  BolumVardiyaSaat,
  PDKSSelectParams,
  PDKSSelectRequestType,
} from "@/types/pdks";
import { useBolumler } from "@/hooks/use-kurumsal-data";
import { useCurrentContext } from "@/hooks/use-context";

type TabValue = "pdks" | "sube-vardiya" | "bolum-vardiya";

const PdksPage = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("pdks");

  const { data: savedContext } = useCurrentContext();
  const idSube = savedContext?.IDSube ? Number(savedContext.IDSube) : 0;

  const { data: bolumler = [], isLoading: isLoadingBolumler } =
    useBolumler(idSube);

  // ---- PDKS kayıt filtresi -------------------------------------------
  const [pdksFilters, setPdksFilters] = useState<PDKSSelectRequestType | null>(
    null,
  );

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDKS Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
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

          {activeTab === "pdks" && (
            <div className="flex items-center gap-2">
              <PdksFiltre onApply={setPdksFilters} />
            </div>
          )}

          {activeTab === "sube-vardiya" && (
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={handleSubeVardiyaEkle}>
                <Plus className="size-4" />
                Yeni Vardiya Ekle
              </Button>
            </div>
          )}

          {activeTab === "bolum-vardiya" && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedIDBolum}
                onValueChange={setSelectedIDBolum}
                disabled={isLoadingBolumler}
              >
                <SelectTrigger className="w-48">
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

        <TabsContent value="pdks" className="mt-4">
          <PdksListesi
            selectParams={
              pdksFilters ?? {
                IDSube: "0",
                IDBolum: "0",
                Tarih1: "",
                Tarih2: "",
              }
            }
            enabled={Boolean(pdksFilters) && activeTab === "pdks"}
          />
        </TabsContent>

        <TabsContent value="sube-vardiya" className="mt-4">
          <SubeVardiyaListesi
            enabled={activeTab === "sube-vardiya"}
            onDuzenle={handleSubeVardiyaDuzenle}
          />
        </TabsContent>

        <TabsContent value="bolum-vardiya" className="mt-4">
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
