// Admin'in Ayarlar > Kurumsal Yönetim > Yetki Ayarları ekranından personel
// için açıp kapatabildiği sayfa görünürlük bayrakları. Sadece Personel
// rolüne uygulanır; Admin/Yönetici her zaman görür.
export type PerYetkiKey =
  | "PersonelPdksGorur"
  | "PersonelPuantajGorur"
  | "PersonelBordroGorur";
