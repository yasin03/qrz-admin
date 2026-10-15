import type { Metadata } from "next";
import Link from "next/link";

import { YASAL } from "@/constants/yasal";
import { HesapSilmeFormu } from "./hesap-silme-formu";

export const metadata: Metadata = {
  title: "Hesap Silme Talebi | QR Zaman",
  description:
    "QR Zaman mobil uygulama hesabınızın ve ilişkili kişisel verilerinizin silinmesini talep edin.",
};

export default function HesapSilmePage() {
  return (
    <div className="space-y-8 leading-relaxed">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Hesap Silme Talebi
        </h1>
        <p className="text-foreground/90">
          QR Zaman mobil uygulama hesabınızın ve ilişkili kişisel verilerinizin
          silinmesini bu form ile talep edebilirsiniz. Talebiniz, kimliğiniz ve
          işvereninizle doğrulandıktan sonra en geç <strong>30 gün</strong>{" "}
          içinde sonuçlandırılır ve size e-posta ile bilgi verilir. Formu
          gönderdiğinizde e-posta uygulamanız bilgileriniz dolu olarak açılır;
          e-postayı göndererek talebinizi tamamlarsınız.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="mb-2 font-semibold">Silinecek veriler</p>
          <ul className="list-disc space-y-1 pl-5 text-foreground/90">
            <li>Mobil uygulama erişiminiz ve hesap bilgileriniz</li>
            <li>Cihaz kaydınız ve cihaz bilgileriniz</li>
            <li>
              Saklanmasında yasal zorunluluk bulunmayan diğer kişisel
              verileriniz (silinir veya anonim hale getirilir)
            </li>
          </ul>
        </div>
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="mb-2 font-semibold">Yasal süre boyunca saklananlar</p>
          <ul className="list-disc space-y-1 pl-5 text-foreground/90">
            <li>Bordro ve ücret kayıtları</li>
            <li>Puantaj ve giriş-çıkış (PDKS) kayıtları</li>
            <li>SGK ve özlük kayıtları</li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Bu kayıtlar işvereninizin kanuni yükümlülüğü gereği erişimi
            kısıtlanarak saklanır ve süre sonunda silinir.
          </p>
        </div>
      </div>

      <HesapSilmeFormu />

      <p className="text-sm text-muted-foreground">
        Ayrıntılı bilgi için{" "}
        <Link
          href="/yasal#hesap-silme"
          className="font-medium text-info hover:underline"
        >
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </Link>
        &apos;ni inceleyebilir veya{" "}
        <a
          href={`mailto:${YASAL.KVKK_EPOSTA}`}
          className="font-medium text-info hover:underline"
        >
          {YASAL.KVKK_EPOSTA}
        </a>{" "}
        adresine yazabilirsiniz.
      </p>
    </div>
  );
}
