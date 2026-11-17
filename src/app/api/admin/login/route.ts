import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkCredentials, currentToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "محاولات دخول كثيرة، يرجى الانتظار دقيقة" }, { status: 429 });
  }

  try {
    const { username = "", password = "" } = await req.json();
    const ok = await checkCredentials(String(username), String(password));
    if (!ok) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }
    const token = await currentToken();
    const store = await cookies();
    store.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر تسجيل الدخول" }, { status: 400 });
  }
}
