import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { User } from "@/stores/auth-store";

const SESSION_COOKIE_NAME = "sid";

// Cookie olmadan da erişilebilecek sayfalar
const PUBLIC_PATHS = ["/login", "/forgot-password"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * lib/token.ts'teki joseDecrypt'in aynısı — o dosyayı doğrudan import
 * etmiyoruz çünkü içindeki "jsonwebtoken" paketi Node crypto'ya
 * bağımlı ve Edge runtime'da (proxy'nin çalıştığı yer) patlar.
 * Sadece jose kullanan bu kısmı burada tekrarlıyoruz.
 */
async function verifySession(token: string) {
  try {
    const key = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    // auth POST route'u tüm DB satırını (sonuc) şifreliyor, bu yüzden
    // payload auth-store'daki User tipiyle birebir örtüşüyor.
    return payload as unknown as User;
  } catch {
    return null;
  }
}

// DÜZELTME: "middleware" -> "proxy" (Next.js 16.1'de dosya adı ve export
// adı bu şekilde değişti, mantığın kendisi birebir aynı kaldı).
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const isAuthenticated = session !== null;
  const isPublic = isPublicPath(pathname);

  // Token yok veya süresi dolmuş/bozulmuş, korumalı bir sayfaya gidiyor
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);

    const response = NextResponse.redirect(loginUrl);
    if (token) {
      // Geçersiz/süresi dolmuş cookie'yi temizle
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // Geçerli oturumla /login sayfasına gitmeye çalışıyor
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Örnek: role-bazlı koruma — yalnızca Admin girebilsin
  // if (pathname.startsWith("/kurumsal-ayarlar") && session?.KullaniciTipi !== "Admin") {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Şunlar hariç tüm yolları eşleştir:
     * - api rotaları (kendi auth kontrollerini kendileri yapıyor)
     * - Next.js statik dosyaları / görsel optimizasyonu
     * - favicon, public klasöründeki dosyalar (logolar, resimler vb.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};