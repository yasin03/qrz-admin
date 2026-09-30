"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, FolderOpen, Search } from "lucide-react";

import { Input } from "../ui/input";

const BELGE_DATA = [
  { key: "AileYardimiBildirimi", label: "Aile Yardım Bildirimi", type: "file" },
  { key: "AylikPuantajCetveli", label: "Aylık Puantaj Cetveli", type: "file" },
  {
    key: "BelirliSureliIsSozlesmesi",
    label: "Belirli Süreli İş Sözleşmesi",
    type: "file",
  },
  {
    key: "BelirsizSureliISSozlesmesi",
    label: "Belirsiz Süreli İş Sözleşmesi",
    type: "file",
  },
  { key: "ElemanIStekFormu", label: "Eleman İş Teklif Formu", type: "file" },
  {
    key: "FesihBildirimiAlmama",
    label: "Fesih Bildirimi Almama",
    type: "file",
  },
  { key: "Ibraname", label: "İbraname", type: "file" },
  {
    key: "IsBasvuruveBilgiFormu",
    label: "İş Başvuru ve Bilgi Formu",
    type: "file",
  },
  {
    key: "IsciOzlukDosyasindaOlmasiGerekenler",
    label: "İşçi Özlük Dosyasında Olması Gerekenler",
    type: "file",
  },
  { key: "IseAlimFormu", label: "İşe Alım Formu", type: "file" },
  { key: "IseDavetYazisi", label: "İşe Davet Yazısı", type: "file" },
  {
    key: "IseGelmemeNoterTebligati",
    label: "İşe Gelmeme Noter Tebligatı",
    type: "file",
  },
  {
    key: "IseGelmemeNoterTutanagi",
    label: "İşe Gelmeme Noter Tutanağı",
    type: "file",
  },
  {
    key: "IseIzinsizGEcGelmeTutanagi",
    label: "İşe İzinsiz Geç Gelme Tutanağı",
    type: "file",
  },
  { key: "IsTalepFormu", label: "İş Talep Formu", type: "file" },
  {
    key: "UcretliIzinIstekFormu",
    label: "Ücretli İzin İstek Formu",
    type: "file",
  },
  {
    key: "YillikUcretliIzinCetveli",
    label: "Yıllık Ücretli İzin Cetveli",
    type: "file",
  },
  {
    key: "BirdenFazlaIsverendeCalisanUcretlininVergiIndirimTaahhutnamesi",
    label:
      "Birden Fazla İşverende Çalışan Ücretlinin Vergi İndirim Taahhütnamesi",
    type: "file",
  },
];

type Belge = (typeof BELGE_DATA)[number];

const Belgeler = () => {
  const [search, setSearch] = useState("");

  const filteredBelgeler = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr");
    if (!query) return BELGE_DATA;
    return BELGE_DATA.filter((belge) =>
      belge.label.toLocaleLowerCase("tr").includes(query),
    );
  }, [search]);

  // TODO: Backend hazır olduğunda belge indirme isteği burada yapılacak.
  const handleDownload = (belge: Belge) => {
    toast.info(`"${belge.label}" indirme özelliği yakında aktif olacak.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Belge Yönetimi</h1>
          <p className="text-sm text-muted-foreground">
            İhtiyacınız olan belge şablonlarını indirebilirsiniz.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Belge ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="size-4" />}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredBelgeler.length} belge listeleniyor
      </p>

      {filteredBelgeler.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <FolderOpen className="size-10 text-muted-foreground" />
          <p className="font-medium">Belge bulunamadı</p>
          <p className="text-sm text-muted-foreground">
            Farklı bir arama terimi deneyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredBelgeler.map((belge) => (
            <button
              key={belge.key}
              type="button"
              onClick={() => handleDownload(belge)}
              className="cursor-pointer group flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="line-clamp-2 text-sm font-medium leading-snug"
                  title={belge.label}
                >
                  {belge.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Belge şablonu
                </p>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
                <Download className="size-4" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Belgeler;
