import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdmin, makeToken } from "@/lib/auth";
import { readDB, updateDB } from "@/lib/db";
import { cookies } from "next/headers";
import type { AtelierSettings } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = await readDB();
  const { adminPassword: _pw, ...safe } = db.settings;
  void _pw;
  return NextResponse.json({ settings: safe });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Partial<AtelierSettings> & { newPassword?: string };
  try {
    body = (await req.json()) as Partial<AtelierSettings> & { newPassword?: string };
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const updated = await updateDB((db) => {
    const nextPassword =
      body.newPassword && body.newPassword.trim().length >= 4
        ? body.newPassword.trim()
        : db.settings.adminPassword;
    const { newPassword: _np, ...rest } = body;
    void _np;
    db.settings = {
      ...db.settings,
      ...rest,
      adminPassword: nextPassword,
    };
    return db.settings;
  });

  if (body.newPassword && body.newPassword.trim().length >= 4) {
    const store = await cookies();
    store.set(ADMIN_COOKIE, makeToken(updated.adminUsername, updated.adminPassword), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
  }

  const { adminPassword: _pw, ...safe } = updated;
  void _pw;
  return NextResponse.json({ settings: safe });
}
