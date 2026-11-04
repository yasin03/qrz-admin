/** ISCO-08 meslek ana grupları — Kod'un ilk hanesi. */
export const ANA_GRUP_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "0 - Silahlı Kuvvetler Meslekleri" },
  { value: "1", label: "1 - Yöneticiler" },
  { value: "2", label: "2 - Profesyonel Meslek Mensupları" },
  {
    value: "3",
    label: "3 - Teknisyenler, Teknikerler ve Yardımcı Profesyonel Meslekler",
  },
  { value: "4", label: "4 - Büro Hizmetlerinde Çalışan Elemanlar" },
  { value: "5", label: "5 - Hizmet ve Satış Elemanları" },
  {
    value: "6",
    label: "6 - Nitelikli Tarım, Ormancılık ve Su Ürünleri Çalışanları",
  },
  { value: "7", label: "7 - Sanatkârlar ve İlgili İşlerde Çalışanlar" },
  { value: "8", label: "8 - Tesis ve Makine Operatörleri ve Montajcılar" },
  { value: "9", label: "9 - Nitelik Gerektirmeyen Meslekler" },
];

/** "0110.01" → "0" */
export function getAnaGrup(kod: string | null | undefined) {
  return String(kod ?? "").trim().charAt(0);
}
