export type IzinRaporOrtakProps = {
  IDSirket: string;
  IDSube: string;
  seciliSube: string;
  cikisVar: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  /** Üst bileşende kurulan filtre popover'ı */
  filtre: React.ReactNode;
};

export const CIKIS_DAHIL_METNI = "Çıkış yapanlar dahil";
