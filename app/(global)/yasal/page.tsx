import type { Metadata } from "next";

import { YASAL } from "@/constants/yasal";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni | QR Zaman",
  description:
    "QR Zaman Personel Yönetim Sistemi mobil uygulaması ve web paneli kapsamında işlenen kişisel veriler hakkında 6698 sayılı KVKK uyarınca aydınlatma metni.",
};

function Bolum({
  id,
  baslik,
  children,
}: {
  id: string;
  baslik: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{baslik}</h2>
      {children}
    </section>
  );
}

function Liste({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

const VERI_KATEGORILERI: { kategori: string; veriler: string }[] = [
  {
    kategori: "Kimlik",
    veriler:
      "Ad, soyad, T.C. kimlik numarası, doğum tarihi ve yeri, cinsiyet, medeni durum",
  },
  {
    kategori: "İletişim",
    veriler: "Cep telefonu numarası, e-posta adresi, ikamet adresi",
  },
  {
    kategori: "Özlük ve mesleki bilgiler",
    veriler:
      "Çalışılan şirket, şube ve bölüm, görev ve kullanıcı rolü, işe giriş bilgileri, eğitim ve askerlik durumu, fotoğraf",
  },
  {
    kategori: "Finansal",
    veriler:
      "Ücret ve ücret tipi, bordro kalemleri, avans, kesinti ve eklenti kayıtları, banka adı, şube kodu, hesap numarası ve IBAN",
  },
  {
    kategori: "Sosyal güvenlik",
    veriler:
      "SGK durumu, belge türü, prim gün sayısı, prime esas kazanç ve prim tutarları, teşvik/kanun numarası",
  },
  {
    kategori: "İzin ve talep kayıtları",
    veriler:
      "İzin türü, tarihleri ve onay durumu; avans talepleri ve ret açıklamaları",
  },
  {
    kategori: "Giriş-çıkış (PDKS) kayıtları",
    veriler:
      "Giriş ve çıkış zamanı, yönü, okutulan QR koduna ait lokasyon ve bölüm bilgisi, puantaj sonuçları",
  },
  {
    kategori: "Konum",
    veriler:
      "Yalnızca QR kod okutulduğu anda alınan enlem, boylam, konum doğruluğu ve irtifa bilgisi",
  },
  {
    kategori: "Cihaz",
    veriler:
      "Uygulamanın cihazınızda ürettiği rastgele cihaz kimliği, cihaz adı, marka, model, işletim sistemi ve sürümü",
  },
  {
    kategori: "İşlem güvenliği",
    veriler:
      "Kullanıcı adı, şifrelenmiş oturum anahtarı, giriş zamanları ve işlem kayıtları",
  },
  {
    kategori: "Özel nitelikli kişisel veri",
    veriler: "Kan grubu (sağlık verisi), işvereniniz tarafından girilmişse",
  },
];

export default function GizlilikPolitikasiPage() {
  return (
    <article className="space-y-10 leading-relaxed [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-blue-400 [&_p]:text-foreground/90 [&_li]:text-foreground/90">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </h1>
        <p className="text-sm text-muted-foreground">
          Son güncelleme: {YASAL.SON_GUNCELLEME}
        </p>
        <p>
          Bu metin; <strong>QR Zaman</strong> mobil uygulaması (iOS ve Android)
          ile QR Zaman web yönetim paneli (birlikte “Hizmet”) kapsamında
          işlenen kişisel verileriniz hakkında, 6698 sayılı Kişisel Verilerin
          Korunması Kanunu (“KVKK”) ve ilgili mevzuat uyarınca sizi
          bilgilendirmek amacıyla hazırlanmıştır.
        </p>
      </header>

      <nav
        aria-label="İçindekiler"
        className="rounded-lg border bg-muted/40 p-4 text-sm"
      >
        <p className="mb-2 font-semibold">İçindekiler</p>
        <ol className="list-decimal space-y-1 pl-5 [&_a]:no-underline">
          <li><a href="#taraflar">Veri sorumlusu ve veri işleyen</a></li>
          <li><a href="#veriler">İşlenen kişisel veriler</a></li>
          <li><a href="#kamera-konum">Kamera, konum ve cihaz izinleri</a></li>
          <li><a href="#amaclar">İşleme amaçları</a></li>
          <li><a href="#hukuki-sebep">Hukuki sebepler</a></li>
          <li><a href="#toplama">Toplama yöntemi</a></li>
          <li><a href="#aktarim">Aktarım</a></li>
          <li><a href="#saklama">Saklama süreleri</a></li>
          <li><a href="#guvenlik">Güvenlik</a></li>
          <li><a href="#cihazda">Cihazınızda saklanan veriler</a></li>
          <li><a href="#haklar">Haklarınız ve başvuru</a></li>
          <li><a href="#hesap-silme">Hesap ve veri silme talebi</a></li>
          <li><a href="#cocuklar">Çocukların gizliliği</a></li>
          <li><a href="#degisiklikler">Değişiklikler ve iletişim</a></li>
        </ol>
      </nav>

      <Bolum id="taraflar" baslik="1. Veri Sorumlusu ve Veri İşleyen">
        <p>
          QR Zaman, işletmelerin personel, puantaj, giriş-çıkış (PDKS), izin,
          avans ve bordro süreçlerini yönetmesi için sunulan bir hizmettir.
          Uygulamadaki kullanıcı hesapları, çalıştığınız kurum (“İşvereniniz”)
          tarafından oluşturulur. Uygulama üzerinden kendiliğinden hesap
          açılamaz.
        </p>
        <Liste>
          <li>
            <strong>İşvereniniz</strong>, sizinle ilgili personel, özlük,
            bordro, izin ve giriş-çıkış verilerinin işlenme amaç ve
            yöntemlerini belirlediği için bu veriler bakımından{" "}
            <strong>veri sorumlusudur</strong>.
          </li>
          <li>
            <strong>{YASAL.SIRKET_UNVANI}</strong> (“QR Zaman”), bu verileri
            İşvereniniz adına ve onun talimatları doğrultusunda işleyen{" "}
            <strong>veri işleyendir</strong>. Uygulama hesabının
            güvenliği, cihaz doğrulaması ve hizmetin teknik olarak
            sunulmasına ilişkin kayıtlar bakımından ise QR Zaman veri
            sorumlusu sıfatıyla hareket eder.
          </li>
        </Liste>
        <p className="text-sm text-muted-foreground">
          {YASAL.SIRKET_UNVANI} · {YASAL.SIRKET_ADRES} · MERSİS:{" "}
          {YASAL.MERSIS_NO} · E-posta:{" "}
          <a href={`mailto:${YASAL.KVKK_EPOSTA}`}>{YASAL.KVKK_EPOSTA}</a>
        </p>
      </Bolum>

      <Bolum id="veriler" baslik="2. İşlenen Kişisel Veriler">
        <p>
          Kullanıcı rolünüze (personel, yönetici, yönetici/admin) ve
          İşvereninizin kullandığı modüllere bağlı olarak aşağıdaki veri
          kategorileri işlenebilir:
        </p>
        {/* Mobilde kategori üstte, veriler altta; sm ve üstünde iki sütunlu tablo görünümü */}
        <div className="overflow-hidden rounded-lg border text-sm">
          <div className="hidden bg-muted/60 font-semibold sm:grid sm:grid-cols-[11rem_1fr]">
            <div className="px-4 py-2">Kategori</div>
            <div className="px-4 py-2">Veriler</div>
          </div>
          <dl className="divide-y">
            {VERI_KATEGORILERI.map((satir) => (
              <div
                key={satir.kategori}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-0 sm:px-0 sm:py-0"
              >
                <dt className="font-semibold sm:px-4 sm:py-2.5">
                  {satir.kategori}
                </dt>
                <dd className="text-foreground/90 sm:px-4 sm:py-2.5">
                  {satir.veriler}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p>
          Yönetici rolündeki kullanıcılar, yetkileri dahilinde sorumlu
          oldukları personelin yukarıdaki verilerini görüntüleyebilir ve
          izin/avans taleplerini onaylayabilir veya reddedebilir.
        </p>
        <p>
          Hizmet; reklam kimliği, reklam veya pazarlama amaçlı takip aracı ya
          da üçüncü taraf analiz araçları kullanmaz. Kişisel verileriniz
          satılmaz.
        </p>
      </Bolum>

      <Bolum id="kamera-konum" baslik="3. Kamera, Konum ve Cihaz İzinleri">
        <Liste>
          <li>
            <strong>Kamera:</strong> Yalnızca giriş-çıkış kaydı için işyerinde
            bulunan QR kodu okutmak amacıyla kullanılır. Kamera görüntüsü
            kaydedilmez, saklanmaz ve sunucuya gönderilmez; yalnızca okunan QR
            kod içeriği işlenir.
          </li>
          <li>
            <strong>Konum:</strong> Yalnızca uygulama açıkken ve QR kod
            okuttuğunuz anda, giriş-çıkışın tanımlı işyeri konumunda
            yapıldığını doğrulamak amacıyla alınır. Arka planda konum takibi
            yapılmaz; uygulama kapalıyken veya kullanılmıyorken konumunuz
            alınmaz. Yönetici yetkisine sahip kullanıcılar, işyeri lokasyonu
            tanımlarken bulundukları konumu kaydedebilir.
          </li>
          <li>
            <strong>Cihaz bilgisi:</strong> Uygulama ilk açılışta cihazınıza
            özel rastgele bir kimlik üretir. Bu kimlik ve cihaz model
            bilgileri, giriş-çıkış kaydının sizin tanımlı cihazınızdan
            yapıldığını doğrulamak ve başkası adına sahte kayıt oluşturulmasını
            önlemek için kullanılır. Telefonunuzun IMEI, seri numarası veya
            reklam kimliği alınmaz.
          </li>
        </Liste>
        <p>
          Kamera ve konum izinlerini dilediğiniz zaman cihaz ayarlarından
          kapatabilirsiniz. Bu durumda QR kod ile giriş-çıkış kaydı
          oluşturulamaz; uygulamanın diğer bölümleri kullanılmaya devam
          edilebilir.
        </p>
      </Bolum>

      <Bolum id="amaclar" baslik="4. Kişisel Verilerin İşlenme Amaçları">
        <Liste>
          <li>İş sözleşmesinden doğan yükümlülüklerin yerine getirilmesi</li>
          <li>
            Personel giriş-çıkış (PDKS) kayıtlarının tutulması, puantaj ve
            çalışma sürelerinin hesaplanması
          </li>
          <li>
            Ücret, bordro, avans, kesinti ve eklenti işlemlerinin yürütülmesi
          </li>
          <li>İzin ve avans taleplerinin oluşturulması ve onaylanması</li>
          <li>
            Konum ve cihaz doğrulaması ile sahte veya başkası adına
            giriş-çıkış kaydının önlenmesi
          </li>
          <li>
            Kullanıcı hesaplarının yönetimi, yetkilendirme ve bilgi
            güvenliğinin sağlanması
          </li>
          <li>
            İş, sosyal güvenlik ve vergi mevzuatından kaynaklanan yasal
            yükümlülüklerin yerine getirilmesi (4857 sayılı İş Kanunu, 5510
            sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu, 6331
            sayılı İş Sağlığı ve Güvenliği Kanunu, vergi mevzuatı)
          </li>
          <li>
            Yetkili kurum ve kuruluşlara bilgi verilmesi, olası
            uyuşmazlıklarda hakların korunması
          </li>
          <li>Hizmetin teknik olarak sunulması, hataların giderilmesi</li>
        </Liste>
      </Bolum>

      <Bolum id="hukuki-sebep" baslik="5. Hukuki Sebepler">
        <p>Kişisel verileriniz KVKK’nın 5. maddesinin 2. fıkrasında yer alan:</p>
        <Liste>
          <li>
            (a) Kanunlarda açıkça öngörülmesi ve (ç) veri sorumlusunun hukuki
            yükümlülüğünü yerine getirebilmesi için zorunlu olması,
          </li>
          <li>
            (c) Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya
            ilgili olması (iş sözleşmesi),
          </li>
          <li>
            (e) Bir hakkın tesisi, kullanılması veya korunması için zorunlu
            olması,
          </li>
          <li>
            (f) İlgili kişinin temel hak ve özgürlüklerine zarar vermemek
            kaydıyla, veri sorumlusunun meşru menfaatleri için zorunlu olması
            (ör. giriş-çıkış kayıtlarının doğruluğunun konum ve cihaz ile
            doğrulanması, bilgi güvenliği)
          </li>
        </Liste>
        <p>
          hukuki sebeplerine dayanılarak işlenir. Özel nitelikli kişisel veri
          olan <strong>kan grubu</strong> bilgisi, KVKK’nın 6. maddesinin 3.
          fıkrası uyarınca iş sağlığı ve güvenliği ile sosyal güvenlik
          alanındaki hukuki yükümlülüklerin yerine getirilmesi amacıyla ve
          Kurul’un belirlediği yeterli önlemler alınarak işlenir.
        </p>
      </Bolum>

      <Bolum id="toplama" baslik="6. Kişisel Verilerin Toplanma Yöntemi">
        <Liste>
          <li>
            İşvereniniz veya yetkilendirdiği kullanıcılar tarafından QR Zaman
            web yönetim paneline girilmesi yoluyla,
          </li>
          <li>
            Mobil uygulamada oturum açmanız, QR kod okutmanız, izin veya avans
            talebi oluşturmanız sırasında sizin tarafınızdan iletilmesi
            yoluyla,
          </li>
          <li>
            QR kod okutma anında cihazınızdan otomatik olarak alınan konum ve
            cihaz bilgileri yoluyla
          </li>
        </Liste>
        <p>elektronik ortamda toplanır.</p>
      </Bolum>

      <Bolum id="aktarim" baslik="7. Kişisel Verilerin Aktarılması">
        <p>
          Kişisel verileriniz, KVKK’nın 8. ve 9. maddelerine uygun olarak ve
          yukarıdaki amaçlarla sınırlı şekilde aşağıdaki alıcılara
          aktarılabilir:
        </p>
        <Liste>
          <li>
            <strong>İşvereniniz</strong> ve İşvereninizin yetkilendirdiği
            yönetici kullanıcılar,
          </li>
          <li>
            Kanunen yetkili <strong>kamu kurum ve kuruluşları</strong> (Sosyal
            Güvenlik Kurumu, Gelir İdaresi Başkanlığı, yargı mercileri vb.),
          </li>
          <li>
            Hizmetin sunulması için gerekli{" "}
            <strong>barındırma ve altyapı hizmet sağlayıcıları</strong>{" "}
            (gizlilik yükümlülüğü altında ve yalnızca hizmetin sunulması
            amacıyla).
          </li>
        </Liste>
        <p>
          Verileriniz pazarlama, reklam veya profilleme amacıyla üçüncü
          kişilerle paylaşılmaz. Sunucularımız {YASAL.SUNUCU_KONUMU}’dedir;
          kişisel verileriniz yurt dışına aktarılmaz.
        </p>
      </Bolum>

      <Bolum id="saklama" baslik="8. Saklama Süreleri">
        <p>
          Kişisel verileriniz, işlenme amaçlarının gerektirdiği ve ilgili
          mevzuatta öngörülen süreler boyunca saklanır:
        </p>
        <Liste>
          <li>
            Özlük, bordro, puantaj ve giriş-çıkış kayıtları: iş ilişkisi
            süresince ve sona ermesinden itibaren iş ve sosyal güvenlik
            mevzuatı ile genel zamanaşımı süreleri boyunca (kural olarak 10
            yıl),
          </li>
          <li>
            Mobil uygulama hesabı ve cihaz kaydı: hesabınız aktif olduğu
            sürece; hesap kapatıldığında veya silme talebiniz
            sonuçlandığında silinir,
          </li>
          <li>
            İşlem güvenliği kayıtları: ilgili mevzuat ve bilgi güvenliği
            gereklilikleri kapsamında 2 yıl.
          </li>
        </Liste>
        <p>
          Saklama süresi sona eren veriler, Kişisel Verilerin Silinmesi, Yok
          Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik uyarınca
          silinir, yok edilir veya anonim hale getirilir.
        </p>
      </Bolum>

      <Bolum id="guvenlik" baslik="9. Veri Güvenliği">
        <Liste>
          <li>
            Uygulama ile sunucular arasındaki tüm iletişim HTTPS (TLS) ile
            şifrelenir.
          </li>
          <li>
            Oturum bilgileri cihazınızda işletim sisteminin güvenli deposunda
            (iOS Keychain / Android Keystore) şifreli olarak saklanır.
          </li>
          <li>
            Verilere erişim rol bazlı yetkilendirme ile sınırlandırılır;
            personel yalnızca kendi verilerini, yöneticiler yalnızca yetkili
            oldukları birimlerin verilerini görebilir.
          </li>
          <li>
            Sunucu erişimleri kayıt altına alınır ve yetkisiz erişime karşı
            idari ve teknik tedbirler uygulanır.
          </li>
        </Liste>
      </Bolum>

      <Bolum id="cihazda" baslik="10. Cihazınızda Saklanan Veriler">
        <p>
          Mobil uygulama cihazınızda yalnızca oturum bilgilerinizi ve cihaz
          kimliğini (şifreli olarak) ve tema (açık/koyu) tercihinizi saklar.
          Oturumu kapattığınızda oturum bilgileri cihazınızdan silinir.
          Uygulamayı kaldırdığınızda cihazda saklanan tüm veriler silinir.
          Web panelinde yalnızca oturumun sürdürülmesi için zorunlu çerezler
          kullanılır; reklam veya takip çerezi kullanılmaz.
        </p>
      </Bolum>

      <Bolum id="haklar" baslik="11. Haklarınız ve Başvuru Yöntemi">
        <p>KVKK’nın 11. maddesi uyarınca;</p>
        <Liste>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
          <li>
            İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını
            öğrenme,
          </li>
          <li>
            Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,
          </li>
          <li>
            Eksik veya yanlış işlenmişse düzeltilmesini isteme ve bunun
            aktarıldığı üçüncü kişilere bildirilmesini isteme,
          </li>
          <li>
            KVKK’nın 7. maddesindeki şartlar çerçevesinde silinmesini veya yok
            edilmesini isteme ve bunun aktarıldığı üçüncü kişilere
            bildirilmesini isteme,
          </li>
          <li>
            Münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize
            bir sonucun ortaya çıkmasına itiraz etme,
          </li>
          <li>
            Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın
            giderilmesini talep etme
          </li>
        </Liste>
        <p>haklarına sahipsiniz.</p>
        <p>
          Personel verilerinize ilişkin talepleriniz için öncelikle veri
          sorumlusu olan <strong>İşvereninize</strong> başvurmanız gerekir.
          Mobil uygulama hesabınız, cihaz kaydınız veya bu metinle ilgili
          talepleriniz için ise{" "}
          <a href={`mailto:${YASAL.KVKK_EPOSTA}`}>{YASAL.KVKK_EPOSTA}</a>{" "}
          adresine kayıtlı e-posta adresinizden veya{" "}
          {YASAL.SIRKET_ADRES} adresine yazılı olarak başvurabilirsiniz. Bize
          ulaşan ve İşvereninizi ilgilendiren talepler, gecikmeksizin
          İşvereninize iletilir.
        </p>
        <p>
          Başvurularınız, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında
          Tebliğ uyarınca talebin niteliğine göre en geç{" "}
          <strong>30 gün</strong> içinde ücretsiz olarak sonuçlandırılır.
          Başvurunuzda ad, soyad, kullanıcı adınız, iletişim bilginiz ve
          talebinizin konusunun yer alması gerekir.
        </p>
      </Bolum>

      <Bolum id="hesap-silme" baslik="12. Hesap ve Veri Silme Talebi">
        <p>
          Mobil uygulama hesabınızın ve ilişkili kişisel verilerinizin
          silinmesini <a href="/hesap-silme">Hesap Silme Talebi formu</a>{" "}
          üzerinden talep edebilirsiniz. Mobil uygulamada bu forma Profil &gt;
          Hesap Silme Talebi adımından da ulaşabilirsiniz. Dilerseniz{" "}
          <a href={`mailto:${YASAL.KVKK_EPOSTA}?subject=Hesap%20Silme%20Talebi`}>
            {YASAL.KVKK_EPOSTA}
          </a>{" "}
          adresine “Hesap Silme Talebi” konulu bir e-posta göndererek
          kullanıcı adınızı ve çalıştığınız şirketi de belirtebilirsiniz.
        </p>
        <p>Talebiniz onaylandığında:</p>
        <Liste>
          <li>
            Mobil uygulama erişiminiz kapatılır; cihaz kaydınız ve hesap
            bilgileriniz silinir,
          </li>
          <li>
            Saklanmasında yasal zorunluluk bulunmayan kişisel verileriniz
            silinir veya anonim hale getirilir,
          </li>
          <li>
            Bordro, puantaj, giriş-çıkış ve SGK kayıtları gibi İşvereninizin
            kanunen saklamakla yükümlü olduğu veriler, yalnızca yasal saklama
            süresi boyunca erişimi kısıtlanmış şekilde tutulur ve süre
            sonunda silinir.
          </li>
        </Liste>
      </Bolum>

      <Bolum id="cocuklar" baslik="13. Çocukların Gizliliği">
        <p>
          Hizmet, işverenler ve çalışanları için tasarlanmıştır; 18 yaşından
          küçüklere yönelik değildir ve bilerek 18 yaşından küçüklerden veri
          toplanmaz. Çalışan bir reşit olmayanın kayıtları yalnızca
          İşvereninizin yasal yükümlülükleri kapsamında işlenir.
        </p>
      </Bolum>

      <Bolum id="degisiklikler" baslik="14. Değişiklikler ve İletişim">
        <p>
          Bu metin, mevzuat veya hizmetteki değişikliklere bağlı olarak
          güncellenebilir. Güncel sürüm her zaman bu sayfada yayımlanır ve
          sayfanın başındaki “Son güncelleme” tarihi değiştirilir.
        </p>
        <p>
          Sorularınız için:{" "}
          <a href={`mailto:${YASAL.DESTEK_EPOSTA}`}>{YASAL.DESTEK_EPOSTA}</a> {" - "}
          <a href={`tel:${YASAL.DESTEK_TELEFON}`}>{YASAL.DESTEK_TELEFON}</a> {" "}
        </p>
      </Bolum>
    </article>
  );
}
