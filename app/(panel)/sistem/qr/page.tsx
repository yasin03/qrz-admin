"use client";

// GEÇİCİ test sayfası: mobilde QR okutunca çalışan INSERT_PDKS_KENDI sorgusunu
// art arda simüle eder. İşi bitince bu sayfa ve pdks route'taki GEÇİCİ blok silinecek.

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Play, Square } from "lucide-react";

import { FormInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

type FormValues = {
  IDSubePersonel: string;
  idBolum: string;
  idBolumLokasyon: string;
  idDevice: string;
  latitude: string;
  longitude: string;
  baslangic: string;
  accuracy: string;
  altitude: string;
  altitudeAccuracy: string;
  adet: string;
  zamanAdimiDk: string;
  aralikMs: string;
};

type Sonuc = {
  sira: number;
  yon: "Giriş" | "Çıkış";
  zaman: number;
  sureMs: number | null;
  test: number | null;
  mesaj: string;
};

const DEFAULTS: FormValues = {
  IDSubePersonel: "40",
  idBolum: "4",
  idBolumLokasyon: "4",
  idDevice: "705ec7d5-db1f-4d27-9efd-0e0c9b48deb9",
  latitude: "37.206455287372",
  longitude: "38.81643987887085",
  baslangic: "2026-11-30T08:30:00.000Z",
  accuracy: "9.00887410962962",
  altitude: "711.0139501177425",
  altitudeAccuracy: "30",
  adet: "10",
  zamanAdimiDk: "5",
  aralikMs: "100",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Prosedür sonucu {..}, [{..}] ya da [[{..}]] dönebilir
function sonucuBul(data: unknown): { test: unknown; sonuc?: unknown } | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = sonucuBul(item);
      if (found) return found;
    }
    return null;
  }
  if (data && typeof data === "object" && "test" in data) {
    return data as { test: unknown; sonuc?: unknown };
  }
  return null;
}

const Page = () => {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: DEFAULTS,
  });
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);
  const durdurRef = useRef(false);

  const gonder = async (v: FormValues) => {
    const adet = Math.max(1, Number(v.adet) || 1);
    const aralikMs = Math.max(0, Number(v.aralikMs) || 0);
    const adimMs = (Number(v.zamanAdimiDk) || 0) * 60_000;
    // "Z" yok sayılır: "2026-11-30T08:30:00.000Z" → yerel 30 Kasım 08:30 → timestamp (ms)
    const baslangic = new Date(v.baslangic.trim().replace(/Z$/i, "")).getTime();
    if (!Number.isFinite(baslangic)) return;

    durdurRef.current = false;
    setCalisiyor(true);
    setSonuclar([]);

    const istekler: Promise<void>[] = [];

    for (let i = 0; i < adet && !durdurRef.current; i++) {
      // Giriş, Çıkış, Giriş... ; her kayıt bir öncekinden zamanAdimiDk sonra
      const yon = i % 2 === 0 ? "Giriş" : "Çıkış";
      const zaman = baslangic + i * adimMs;
      const JsonData = JSON.stringify({
        idBolum: Number(v.idBolum),
        idBolumLokasyon: Number(v.idBolumLokasyon),
        idDevice: v.idDevice,
        latitude: Number(v.latitude),
        longitude: Number(v.longitude),
        timestamp: zaman,
        accuracy: Number(v.accuracy),
        altitude: Number(v.altitude),
        altitudeAccuracy: Number(v.altitudeAccuracy),
      });

      const sira = i + 1;
      const t0 = performance.now();

      // Cevap beklenmeden bir sonraki istek aralikMs sonra gider
      istekler.push(
        api
          .post("/api/pdks", {
            type: "INSERT_PDKS_KENDI",
            IDSubePersonel: v.IDSubePersonel,
            Yon: yon,
            JsonData,
          })
          .then(({ data }) => {
            const r = sonucuBul(data);
            return {
              test: r ? Number(r.test) : null,
              mesaj: r ? String(r.sonuc ?? "") : `Beklenmeyen yanıt: ${JSON.stringify(data)}`,
            };
          })
          .catch((err) => ({
            test: null,
            mesaj: err?.response?.data?.error ?? err?.message ?? String(err),
          }))
          .then(({ test, mesaj }) => {
            const sonuc: Sonuc = {
              sira,
              yon,
              zaman,
              sureMs: Math.round(performance.now() - t0),
              test,
              mesaj,
            };
            setSonuclar((prev) => [...prev, sonuc].sort((a, b) => a.sira - b.sira));
          }),
      );

      if (i < adet - 1) await sleep(aralikMs);
    }

    await Promise.all(istekler);
    setCalisiyor(false);
  };

  const basarili = sonuclar.filter((s) => s.test === 1).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">QR Simülasyonu (Test)</h1>
        <p className="text-sm text-muted-foreground">
          INSERT_PDKS_KENDI sorgusunu Giriş/Çıkış sırasıyla art arda çalıştırır.
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(gonder)(e)} className="grid items-start gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <FormInput control={control} name="IDSubePersonel" label="IDSubePersonel" format="number" required />
          <FormInput control={control} name="idDevice" label="idDevice" />
          <FormInput control={control} name="idBolum" label="idBolum" format="number" />
          <FormInput control={control} name="idBolumLokasyon" label="idBolumLokasyon" format="number" />
          <FormInput control={control} name="latitude" label="latitude" />
          <FormInput control={control} name="longitude" label="longitude" />
          <FormInput
            control={control}
            name="baslangic"
            label="Başlangıç"
            description="Örn: 2026-11-30T08:30:00.000Z (30 Kasım 08:30)"
            required
          />
          <FormInput control={control} name="accuracy" label="accuracy" />
          <FormInput control={control} name="altitude" label="altitude" />
          <FormInput control={control} name="altitudeAccuracy" label="altitudeAccuracy" />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <FormInput
            control={control}
            name="adet"
            label="Sorgu sayısı"
            format="number"
            description="Yarısı Giriş, yarısı Çıkış (100 → 50 Giriş + 50 Çıkış)"
          />
          <FormInput
            control={control}
            name="zamanAdimiDk"
            label="Zaman adımı (dk)"
            format="number"
            description="Her kaydın timestamp'i bir öncekinden bu kadar sonra"
          />
          <FormInput
            control={control}
            name="aralikMs"
            label="Sorgu aralığı (ms)"
            format="number"
            description="Her sorgu arasındaki bekleme süresi"
          />

          {calisiyor ? (
            <Button type="button" variant="danger" className="w-full" onClick={() => (durdurRef.current = true)}>
              <Square /> Durdur
            </Button>
          ) : (
            <Button type="submit" className="w-full">
              <Play /> Gönder
            </Button>
          )}
        </div>
      </form>

      {sonuclar.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {sonuclar.length} yanıt · {basarili} başarılı · {sonuclar.length - basarili} başarısız
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Yön</th>
                  <th className="px-3 py-2">Zaman</th>
                  <th className="px-3 py-2">Süre</th>
                  <th className="px-3 py-2">test</th>
                  <th className="px-3 py-2">Sonuç</th>
                </tr>
              </thead>
              <tbody>
                {sonuclar.map((s) => (
                  <tr key={s.sira} className="border-t">
                    <td className="px-3 py-2">{s.sira}</td>
                    <td className="px-3 py-2">{s.yon}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(s.zaman).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-2">{s.sureMs} ms</td>
                    <td className={s.test === 1 ? "px-3 py-2 text-green-600" : "px-3 py-2 text-red-600"}>
                      {s.test ?? "-"}
                    </td>
                    <td className="px-3 py-2">{s.mesaj}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
