import { ExecuteQuery } from "@/lib/db";
import { fail } from "@/lib/api-session";
import { KULLANICI_TIPI } from "@/lib/roles";

/**
 * Personel kullanıcı ilgili sayfa yetkisine (PersonelPdksGorur vb.) sahip
 * değilse 403 cevabı döner, aksi halde null. Admin/Yönetici için hiç sorgu
 * atmaz. Route içinde:
 *
 *   const denied = await assertPersonelYetki(session, "PersonelPdksGorur");
 *   if (denied) return denied;
 */
export async function assertPersonelYetki(session, key) {
  if (session.user.IDKullaniciTip !== KULLANICI_TIPI.PERSONEL) return null;

  const [yetki] = await ExecuteQuery(
    `[SirketSabit_SELECT] '${session.user.IDSirket}'`,
  );

  if (yetki && Boolean(yetki[key])) return null;

  return fail(session.isMobile, "Bu işlem için yetkiniz yok", 403, "FORBIDDEN");
}
