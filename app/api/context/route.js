import { NextResponse } from "next/server";
import { joseDecrypt, joseEncrypt } from "@/lib/token";

const CONTEXT_COOKIE_NAME = "grsisudo";

// Mevcut çalışma bağlamını (grup/şirket/şube/dönem) okur — HeaderCompany
// açılışta formu bununla dolduruyor.
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

    const token = request.cookies.get(CONTEXT_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ context: null });
    }

    const context = await joseDecrypt(token);
    return NextResponse.json({ context: context ?? null });
  } catch (err) {
    console.error("context GET error", err);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}

// Yeni çalışma bağlamını kaydeder — sid ile aynı desende (jose, HS256),
// httpOnly cookie olarak yazılıyor. Tüm diğer API route'ları bundan sonra
// bu cookie'yi decrypt edip IDSirket/Yil/IDSube okuyabilir.
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
    const { IDGurup, IDSirket, IDSube, Yil, Ay } = body;

    if (!IDSirket || !Yil) {
      return NextResponse.json(
        { message: "Şirket ve yıl seçimi zorunludur." },
        { status: 400 },
      );
    }

    const contextPayload = {
      IDGurup: IDGurup ?? null,
      IDSirket,
      IDSube: IDSube ?? null,
      Yil,
      Ay: Ay ?? null,
    };

    // 30 gün — bu bir güvenlik token'ı değil, kalıcı bir tercih; "sid" gibi
    // kısa ömürlü olmasına gerek yok, ama yine de imzalı (client tahrif edemez).
    const token = await joseEncrypt(contextPayload, "30d");

    const response = NextResponse.json({ Sonuc: "1", context: contextPayload });
    response.cookies.set(CONTEXT_COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("context POST error", err);
    return NextResponse.json(
      { message: "Bir hata oluştu. Lütfen tekrar deneyiniz." },
      { status: 500 },
    );
  }
}
