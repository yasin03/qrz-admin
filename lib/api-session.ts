import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { joseDecrypt } from "@/lib/token";
import { requireAuth } from "@/lib/mobile/require-auth";
import { apiSuccess, apiError, type ApiErrorCode } from "@/lib/mobile/cors";

export type SessionUser = {
  IDKullanici: string;
  IDKullaniciTip: string | null;
  IDGurup: string | null;
  IDSirket: string | null;
  IDSube: string | null;
  IDSubePersonel: string | null;
  IDDevice: string | null;
  // Aktif calisma donemi (grsisudo'dan). Mobil JWT'de bu kavram yok,
  // mobil session'da her zaman null - donem gereken sorgularda payload'dan
  // gelmesi beklenir.
  Yil: string | null;
  Ay: string | null;
};

export type Session =
  | { authenticated: true; isMobile: boolean; user: SessionUser; error: null }
  | { authenticated: false; isMobile: boolean; user: null; error: string };

// Authorization header'ı olan istekler mobil (Bearer/JWT) kabul edilir;
// olmayanlar web istemcisi sayılır ve sid/grsisudo cookie'lerine bakılır.
export function isMobileRequest(request: NextRequest | Request) {
  return Boolean(request.headers.get("authorization"));
}

export async function getSession(request: NextRequest): Promise<Session> {
  if (isMobileRequest(request)) {
    const auth = await requireAuth(request);

    if (!auth.authenticated) {
      return {
        authenticated: false,
        isMobile: true,
        user: null,
        error: auth.error ?? "Yetkilendirme hatasi.",
      };
    }

    return {
      authenticated: true,
      isMobile: true,
      user: { ...auth.user, Yil: null, Ay: null },
      error: null,
    };
  }

  const sidToken = request.cookies.get("sid")?.value;
  const sid = sidToken ? await joseDecrypt(sidToken) : null;

  if (!sid) {
    return {
      authenticated: false,
      isMobile: false,
      user: null,
      error: "Kullanıcı Bilgisi Bulunamadı.",
    };
  }

  // grsisudo (aktif sirket/sube/donem baglami) her zaman garanti degil
  // (ör. ilk login sonrasi henuz olusmamis olabilir) - eksikse cokmeden
  // ilgili alanlari null birakiyoruz, cagiran route karar versin.
  const grsisudoToken = request.cookies.get("grsisudo")?.value;
  const grsisudo = grsisudoToken ? await joseDecrypt(grsisudoToken) : null;

  const user: SessionUser = {
    IDKullanici: String(sid.IDKullanici),
    IDKullaniciTip:
      sid.IDKullaniciTip != null ? String(sid.IDKullaniciTip) : null,
    IDGurup: grsisudo?.IDGurup != null ? String(grsisudo.IDGurup) : null,
    IDSirket: grsisudo?.IDSirket != null ? String(grsisudo.IDSirket) : null,
    IDSube: grsisudo?.IDSube != null ? String(grsisudo.IDSube) : null,
    IDSubePersonel:
      sid.IDSubePersonel != null ? String(sid.IDSubePersonel) : null,
    IDDevice: null,
    Yil: grsisudo?.Yil != null ? String(grsisudo.Yil) : null,
    Ay: grsisudo?.Ay != null ? String(grsisudo.Ay) : null,
  };

  return { authenticated: true, isMobile: false, user, error: null };
}

// Basari cevabi: mobil istekte mobile-api'nin { success, data } zarfi,
// web istekte mevcut admin davranisi olan ham NextResponse.json korunur.
export function ok(isMobile: boolean, data: unknown, status = 200) {
  if (isMobile) return apiSuccess(data, status);
  return NextResponse.json(data, { status });
}

// Hata cevabi: mobil istekte { success:false, error:{...} } zarfi, web
// istekte mevcut admin davranisi olan { message } sekli korunur.
export function fail(
  isMobile: boolean,
  message: string,
  status = 400,
  code?: ApiErrorCode,
) {
  if (isMobile) return apiError(message, status, code);
  return NextResponse.json({ message }, { status });
}

type SessionHandler = (
  request: NextRequest,
  session: Extract<Session, { authenticated: true }>,
) => Promise<Response>;

// Route'u sarar: once getSession calisir, auth basarisizsa 401 ile
// kisa devre yapar (Bearer gecersizse cookie'ye dusmez), basariliysa
// handler'i normalize edilmis session ile cagirir.
export function withSession(handler: SessionHandler) {
  return async function (request: NextRequest) {
    const session = await getSession(request);

    if (!session.authenticated) {
      return fail(session.isMobile, session.error, 401, "UNAUTHORIZED");
    }

    return handler(request, session);
  };
}
