@AGENTS.md

# qrz-admin

Yeni sayfa, bileşen, hook, servis, API route veya SQL yazarken aşağıdaki standartlar **zorunludur**. Mevcut eski kod (özellikle bordro API'leri) bu standartlara uymuyorsa örnek alınmaz; standart geçerlidir.

@.claude/standards/genel.md
@.claude/standards/api.md
@.claude/standards/sql.md
@.claude/standards/frontend.md

## Yeni özellik kontrol listesi

1. İlgili modülün `.claude/<modul>-ozellik/README.md` dosyasını oku (ör. CRM için `.claude/crm-ozellik/README.md`).
2. SQL: `sql/<modul>_<ozellik>.sql` + `_geri_al.sql` (tablo → view → SP).
3. API: `app/api/(<modul>)/<ozellik>/route.js` (`queryTypes` + `lib/sql`).
4. `types` → `services` → `hooks` → `schemas` → `lib` → `components` → `page.tsx`.
5. Yeni sayfa menüye girecekse `modules/<modul>/navigation.ts`; rol kısıtı varsa `proxy.ts`.
6. `npx tsc --noEmit` ve `npx eslint` ile doğrula.
7. Özellik dokümanını yaz ve modül README tablosunu güncelle.
