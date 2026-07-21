import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { joseEncrypt } from "@/lib/token";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { Sonuc: "hata", message: "Kullanici adi ve sifre zorunlu." },
        { status: 400 },
      );
    }

    const [sonuc] = await ExecuteQuery(
      "[LoginKontrol] '" + username + "', '" + password + "'",
    );

    const response = NextResponse.json(sonuc ?? { Sonuc: "0" });

    if (sonuc?.Sonuc == "1") {
      const userToken = await joseEncrypt(sonuc);
      response.cookies.set("sid", userToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24,
        path: "/",
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("auth POST error", error);
    return NextResponse.json(
      { Sonuc: "hata", message: "Sunucu hatasi" },
      { status: 500 },
    );
  }
}
