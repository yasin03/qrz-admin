// Oturumsuz API'ler (app/api/(global)/*) için sunucudan sunucuya koruma.
// Çağıran (ör. qrz-web) kullanıcı oturumu taşımaz; bunun yerine x-api-key
// header'ında .env'deki GLOBAL_API_KEY ile aynı anahtarı gönderir.
// Bu route'lar IDSirket / IDKullanici'yi istemciden almaz, kendi ayarından okur.

import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import { fail } from "@/lib/api-session";

export const API_KEY_HEADER = "x-api-key";

/** Sabit süreli karşılaştırma: anahtar karakter karakter tahmin edilemesin. */
function anahtarGecerli(gelen: string | null) {
  const beklenen = process.env.GLOBAL_API_KEY;
  if (!beklenen || !gelen) return false;

  const a = Buffer.from(gelen);
  const b = Buffer.from(beklenen);
  return a.length === b.length && timingSafeEqual(a, b);
}

type ApiKeyHandler = (request: NextRequest) => Promise<Response>;

/**
 * Route'u sarar: anahtar yoksa / yanlışsa 401 ile kısa devre yapar.
 * GLOBAL_API_KEY tanımlı değilse bütün istekler reddedilir (yanlışlıkla
 * korumasız açılmasın).
 */
export function withApiKey(handler: ApiKeyHandler) {
  return async function (request: NextRequest) {
    if (!anahtarGecerli(request.headers.get(API_KEY_HEADER))) {
      return fail(false, "Yetkisiz istek.", 401, "UNAUTHORIZED");
    }
    return handler(request);
  };
}
