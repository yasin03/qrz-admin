import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.delete("sid", { path: "/" });
  response.cookies.delete("grsisudo", { path: "/" });

  return response;
}
