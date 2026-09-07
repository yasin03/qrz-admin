// api/context/route.js
import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";
import {
  buildSessionToken,
  fetchSessionFromDb,
  setSessionCookie,
  CONTEXT_COOKIE_NAME,
} from "@/lib/session";

// Mevcut çalışma bağlamını okur. grsisudo cookie'si varsa direkt onu decode
// eder (hızlı yol); yoksa (ör. ilk login, cookie henüz oluşmadıysa) DB'den
// çekip cookie'yi de o an oluşturur.
export async function GET(request) {
  try {
    const sid = request.cookies.get("sid")?.value;
    const user = sid ? await joseDecrypt(sid) : null;

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    const cookieToken = request.cookies.get(CONTEXT_COOKIE_NAME)?.value;
    let context = cookieToken ? await joseDecrypt(cookieToken) : null;

    if (!context) {
      const { session, token } = await buildSessionToken(user.IDKullanici);
      if (!session) {
        return NextResponse.json({ context: null });
      }
      context = session;
      const response = NextResponse.json({ context });
      setSessionCookie(response, token);
      return response;
    }

    return NextResponse.json({ context });
  } catch (err) {
    console.error("context GET error", err);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}

// Yeni çalışma bağlamını DB'ye yazar (KullaniciSonIslem_UPDATE), ardından
// güncel satırı tekrar SELECT edip cookie'yi tazeler. Böylece grsisudo her
// zaman DB ile senkron kalır.
export async function POST(request) {
  try {
    const sid = request.cookies.get("sid")?.value;
    const user = sid ? await joseDecrypt(sid) : null;

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { IDSirket, IDSube, Yil, Ay } = body;

    if (!IDSirket || !Yil) {
      return NextResponse.json(
        { message: "Şirket ve yıl seçimi zorunludur." },
        { status: 400 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "0.0.0.0";

    const updateQuery = `[KullaniciSonIslem_UPDATE] '${user.IDKullanici}', '${Yil}', '${Ay ?? ""}', '${IDSirket}', '${IDSube ?? ""}', '${ip}'`;
    await ExecuteQuery(updateQuery);

    const { session, token } = await buildSessionToken(user.IDKullanici);
    if (!session) {
      return NextResponse.json(
        { message: "Güncelleme sonrası oturum bilgisi okunamadı." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ Sonuc: "1", context: session });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error("context POST error", err);
    return NextResponse.json(
      { message: "Bir hata oluştu. Lütfen tekrar deneyiniz." },
      { status: 500 },
    );
  }
}
