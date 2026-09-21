import { jwtVerify, SignJWT } from "jose";

export type User = {
  Ad: string;
  IDKullaniciTip: string;
  KullaniciTipi: string;
  IDGurup: string | null;
  IDSirket: string | null;
  IDSube: string | null;
  IDSubePersonel: string | null;
  IDKullanici: string;
  IDDevice: string;
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}

const secret = new TextEncoder().encode(JWT_SECRET);

// Mobil JWT'leri sid/grsisudo cookie token'larından (aynı JWT_SECRET ile
// imzalanıyor) ayırt etmek için sabit bir audience claim'i kullanıyoruz.
// Böylece cookie tarafında üretilmiş bir token, kazara Bearer olarak
// gönderilse bile burada reddedilir.
const AUDIENCE = "qrz-mobile";

export async function createAccessToken(user: User) {
  return await new SignJWT({
    IDKullanici: user.IDKullanici,
    IDKullaniciTip: user.IDKullaniciTip,
    IDGurup: user.IDGurup,
    IDSirket: user.IDSirket,
    IDSube: user.IDSube,
    IDSubePersonel: user.IDSubePersonel,
    IDDevice: user.IDDevice,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setAudience(AUDIENCE)
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      audience: AUDIENCE,
    });

    return payload;
  } catch {
    return null;
  }
}
