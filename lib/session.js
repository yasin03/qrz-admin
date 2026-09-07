// lib/session.js
import { ExecuteQuery } from "@/lib/db";
import { joseEncrypt } from "@/lib/token";

const CONTEXT_COOKIE_NAME = "grsisudo";

// DB'den güncel session bilgisini çeker (Yil, Ay, IDSube, IDSirket, IDGurup,
// GurupAdi, SirketAdi, SubeAdi, ...) ve jose ile imzalar.
export async function fetchSessionFromDb(IDKullanici) {
  const [session] = await ExecuteQuery(
    `[KullaniciSonIslem_SELECTByIDKullaniciSonIslem] '${IDKullanici}'`,
  );
  return session ?? null;
}

export async function buildSessionToken(IDKullanici) {
  const session = await fetchSessionFromDb(IDKullanici);
  if (!session) return { session: null, token: null };

  const token = await joseEncrypt(session, "30d");
  return { session, token };
}

export function setSessionCookie(response, token) {
  response.cookies.set(CONTEXT_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });
}

export { CONTEXT_COOKIE_NAME };