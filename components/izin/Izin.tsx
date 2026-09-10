"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import IzinFiltre from "@/components/izin/IzinFiltre";
import IzinEkle from "@/components/izin/IzinEkle";
import IzinListesi from "@/components/izin/IzinListesi";
import TalepEkle from "@/components/izin/TalepEkle";
import TalepListesi from "@/components/izin/TalepListesi";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import { IzinFilters } from "@/types/izin";
import { useCurrentContext } from "@/hooks/use-context";

function getDefaultDateRange() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return {
    BaslangicTarihi: format(yearStart, "yyyy-MM-dd"),
    BitisTarihi: format(now, "yyyy-MM-dd"),
  };
}

function getYearBounds() {
  const year = new Date().getFullYear();
  return {
    BaslangicTarihi: `${year}-01-01`,
    BitisTarihi: `${year}-12-31`,
  };
}

type TabValue = "izin" | "talepler";

const IzinPage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;
  const { data: savedContext, isLoading: isLoadingContext } =
    useCurrentContext();
  const { izinTipleri } = usePersonelSabitTanimlar();

  const [activeTab, setActiveTab] = useState<TabValue>("izin");
  const [filters, setFilters] = useState<IzinFilters>(() => ({
    ...getDefaultDateRange(),
    Aciklama: "",
  }));
  const [searchText, setSearchText] = useState("");
  const [talepSearchText, setTalepSearchText] = useState("");
  const [openIzinEkle, setOpenIzinEkle] = useState(false);
  const [openTalepEkle, setOpenTalepEkle] = useState(false);

  const selectParams = useMemo(
    () => ({
      IDSube: isPersonel ? String(user?.IDSube ?? null) : null,
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      BaslangicTarihi: filters.BaslangicTarihi,
      BitisTarihi: filters.BitisTarihi,
      Aciklama: filters.Aciklama,
    }),
    [isPersonel, user?.IDSubePersonel, filters],
  );

  const talepSelectParams = useMemo(
    () => ({
      IDSube: isPersonel ? "0" : String(savedContext?.IDSube ?? "0"),
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      ...getYearBounds(),
    }),
    [isPersonel, user?.IDSube, user?.IDSubePersonel, savedContext?.IDSube],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">İzin Yönetimi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="izin">
              {isPersonel ? "İzinlerim" : "Tüm İzinler"}
            </TabsTrigger>
            <TabsTrigger value="talepler">
              {isPersonel ? "Taleplerim" : "Tüm Talepler"}
            </TabsTrigger>
          </TabsList>

          {activeTab === "izin" && (
            <div className="flex items-center gap-2">
              {!isPersonel && (
                <Input
                  startIcon={<Search className="h-4 w-4" />}
                  placeholder="Ara..."
                  className="w-48"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              )}

              <IzinFiltre
                filters={filters}
                izinTipleri={izinTipleri}
                onChange={setFilters}
                onReset={() =>
                  setFilters({ ...getDefaultDateRange(), Aciklama: "" })
                }
              />

              {!isPersonel && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setOpenIzinEkle(true)}
                >
                  <UserPlus className="size-4" />
                  Yeni İzin Ekle
                </Button>
              )}
            </div>
          )}

          {activeTab === "talepler" && (
            <div className="flex items-center gap-2">
              {!isPersonel && (
                <Input
                  startIcon={<Search className="h-4 w-4" />}
                  placeholder="Ara..."
                  className="w-48"
                  value={talepSearchText}
                  onChange={(e) => setTalepSearchText(e.target.value)}
                />
              )}

              <IzinFiltre
                filters={filters}
                izinTipleri={izinTipleri}
                onChange={setFilters}
                onReset={() =>
                  setFilters({ ...getDefaultDateRange(), Aciklama: "" })
                }
              />

              {isPersonel && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setOpenTalepEkle(true)}
                >
                  <UserPlus className="size-4" />
                  Talep Ekle
                </Button>
              )}
            </div>
          )}
        </div>

        <TabsContent value="izin" className="mt-4">
          <IzinListesi
            selectParams={selectParams}
            isPersonel={isPersonel}
            searchText={searchText}
            enabled={Boolean(user) && activeTab === "izin"}
          />
        </TabsContent>

        <TabsContent value="talepler" className="mt-4">
          <TalepListesi
            isPersonel={isPersonel}
            searchText={talepSearchText}
            selectParams={talepSelectParams}
          />
        </TabsContent>
      </Tabs>

      {openIzinEkle && (
        <IzinEkle open={openIzinEkle} onOpenChange={setOpenIzinEkle} />
      )}

      {openTalepEkle && (
        <TalepEkle
          open={openTalepEkle}
          onOpenChange={setOpenTalepEkle}
          user={user}
        />
      )}
    </div>
  );
};

export default IzinPage;
