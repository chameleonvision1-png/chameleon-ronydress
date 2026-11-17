import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { readDB, uid, updateDB } from "@/lib/db";
import type { Dress } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = await readDB();
  return NextResponse.json({ dresses: db.dresses });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Partial<Dress>;
  try {
    body = (await req.json()) as Partial<Dress>;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const code = String(body.code || "").trim().toUpperCase();
  const nameAr = String(body.nameAr || "").trim();
  if (!code || !nameAr) {
    return NextResponse.json({ error: "الكود والاسم مطلوبان" }, { status: 400 });
  }

  const created = await updateDB((db) => {
    const dress: Dress = {
      id: uid("dress-"),
      code,
      nameAr,
      nameEn: String(body.nameEn || code).trim(),
      storyAr: String(body.storyAr || "").trim(),
      occasions: Array.isArray(body.occasions) && body.occasions.length > 0 ? body.occasions : ["soiree"],
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : [{ nameAr: "لون أساسي", hex: "#B89040" }],
      sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ["38", "40", "42"],
      lengthAr: String(body.lengthAr || "١٥٨ سم").trim(),
      fabricAr: String(body.fabricAr || "قماش سهرة فاخر").trim(),
      detailsAr: Array.isArray(body.detailsAr) ? body.detailsAr : [],
      modes: body.modes || { rent: true, sale: false, tailor: true },
      rentPrice: body.rentPrice ? Number(body.rentPrice) : undefined,
      deposit: body.deposit ? Number(body.deposit) : undefined,
      rentalDays: body.rentalDays ? Number(body.rentalDays) : 3,
      salePrice: body.salePrice ? Number(body.salePrice) : undefined,
      showPrice: Boolean(body.showPrice),
      status: body.status || "available",
      shots: Array.isArray(body.shots) ? body.shots : [],
      symmetric: Boolean(body.symmetric),
      onOrbit: Boolean(body.onOrbit),
      orbitOrder: Number(body.orbitOrder || db.dresses.length + 1),
      isFeatured: Boolean(body.isFeatured),
    };
    db.dresses.push(dress);
    return dress;
  });

  return NextResponse.json({ dress: created }, { status: 201 });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Partial<Dress> & { id?: string };
  try {
    body = (await req.json()) as Partial<Dress> & { id?: string };
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "معرّف الفستان مطلوب" }, { status: 400 });
  }

  const updated = await updateDB((db) => {
    const idx = db.dresses.findIndex((d) => d.id === body.id);
    if (idx === -1) return null;
    db.dresses[idx] = { ...db.dresses[idx], ...body };
    return db.dresses[idx];
  });

  if (!updated) {
    return NextResponse.json({ error: "الفستان غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ dress: updated });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await updateDB((db) => {
    db.dresses = db.dresses.filter((d) => d.id !== id);
  });
  return NextResponse.json({ ok: true });
}
