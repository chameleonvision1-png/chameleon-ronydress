import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isR2Configured, uploadToR2 } from "./r2";
import { buildSeed } from "./seed";
import type { DB } from "./types";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "ronydress-data")
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const STORE_ROW_ID = "ronydress";
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
const R2_DB_KEY = "ronydress/db.enc";

function r2CipherKey(): Buffer {
  return crypto.scryptSync(process.env.ADMIN_SECRET || "ronydress-secret", "rd-salt", 32);
}

function encryptDB(db: DB): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", r2CipherKey(), iv);
  const plain = Buffer.from(JSON.stringify(db), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from("RD1", "ascii"), iv, tag, enc]);
}

function decryptDB(payload: Buffer): DB | null {
  try {
    if (payload.length < 31 || payload.subarray(0, 3).toString("ascii") !== "RD1") return null;
    const iv = payload.subarray(3, 15);
    const tag = payload.subarray(15, 31);
    const enc = payload.subarray(31);
    const decipher = crypto.createDecipheriv("aes-256-gcm", r2CipherKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
    return JSON.parse(plain) as DB;
  } catch {
    return null;
  }
}

async function readR2EncryptedDB(): Promise<DB | null> {
  if (!isR2Configured() || !R2_PUBLIC_BASE) return null;
  try {
    const res = await fetch(`${R2_PUBLIC_BASE}/${R2_DB_KEY}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return decryptDB(buf);
  } catch {
    return null;
  }
}

async function writeR2EncryptedDB(db: DB): Promise<void> {
  if (!isR2Configured()) return;
  try {
    await uploadToR2(R2_DB_KEY, encryptDB(db), "application/octet-stream");
  } catch {
    // Ignore transient R2 write failures
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

let queue: Promise<unknown> = Promise.resolve();
let memoryCache: { db: DB; ts: number } | null = null;
const CACHE_TTL_MS = 1500;

function ensureLocal() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(buildSeed(), null, 2), "utf8");
  }
}

function readLocalDB(): DB {
  ensureLocal();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
}

function writeLocalDB(db: DB) {
  ensureLocal();
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}

async function readSupabaseDB(): Promise<DB | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/alban_store?id=eq.${STORE_ROW_ID}&select=data`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { data?: DB }[];
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.data) {
      return rows[0].data;
    }
    const seed = readLocalDB();
    await writeSupabaseDB(seed);
    return seed;
  } catch {
    return null;
  }
}

async function writeSupabaseDB(db: DB): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/alban_store?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([
        {
          id: STORE_ROW_ID,
          data: db,
          updated_at: new Date().toISOString(),
        },
      ]),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function migrateIfNeeded(db: DB): { db: DB; migrated: boolean } {
  let migrated = false;
  if (!db.rentalRequests) {
    db.rentalRequests = [];
    migrated = true;
  }
  if (!db.appointments) {
    db.appointments = [];
    migrated = true;
  }
  if (!db.blockedDates) {
    db.blockedDates = [];
    migrated = true;
  }
  if ((db.catalogVersion ?? 0) < 1) {
    const seed = buildSeed();
    db.categories = seed.categories;
    db.dresses = seed.dresses;
    db.catalogVersion = 1;
    migrated = true;
  }
  return { db, migrated };
}

export async function readDB(forceFresh = false): Promise<DB> {
  if (!forceFresh && memoryCache && Date.now() - memoryCache.ts < CACHE_TTL_MS) {
    return structuredClone(memoryCache.db);
  }
  const remote = await readSupabaseDB();
  if (remote) {
    const { migrated } = migrateIfNeeded(remote);
    if (migrated) {
      await writeSupabaseDB(remote);
    }
    memoryCache = { db: remote, ts: Date.now() };
    return structuredClone(remote);
  }
  const r2Remote = await readR2EncryptedDB();
  if (r2Remote) {
    const { migrated } = migrateIfNeeded(r2Remote);
    if (migrated) {
      await writeR2EncryptedDB(r2Remote);
    }
    memoryCache = { db: r2Remote, ts: Date.now() };
    return structuredClone(r2Remote);
  }
  const rawLocal = readLocalDB();
  const { db: local, migrated } = migrateIfNeeded(rawLocal);
  if (migrated) {
    try {
      writeLocalDB(local);
    } catch {
      // Ignore read-only FS errors
    }
  }
  await writeR2EncryptedDB(local);
  memoryCache = { db: local, ts: Date.now() };
  return structuredClone(local);
}

export function updateDB<T>(fn: (db: DB) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDB(true);
    const result = fn(db);
    memoryCache = { db: structuredClone(db), ts: Date.now() };
    try {
      writeLocalDB(db);
    } catch {
      // Ignore local FS write error
    }
    const ok = await writeSupabaseDB(db);
    if (!ok) {
      await writeR2EncryptedDB(db);
    }
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export function uid(prefix = "") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function checkDateAvailability(
  db: DB,
  dressCode: string,
  eventDate: string,
): { available: boolean; reasonAr?: string; conflictRange?: string } {
  const dress = db.dresses.find((d) => d.code.toLowerCase() === dressCode.toLowerCase());
  if (!dress) {
    return { available: false, reasonAr: "كود الفستان غير موجود." };
  }
  if (dress.status === "unavailable") {
    return { available: false, reasonAr: "هذا الموديل غير متاح للحجز حالياً." };
  }

  const buffer = db.settings.cleaningBufferDays ?? 2;
  const reqTs = new Date(`${eventDate}T00:00:00Z`).getTime();
  if (Number.isNaN(reqTs)) {
    return { available: false, reasonAr: "تاريخ المناسبة غير صالح." };
  }
  const dayMs = 86400000;

  for (const b of db.blockedDates) {
    if (b.dressCode.toLowerCase() !== dressCode.toLowerCase()) continue;
    const sTs = new Date(`${b.startDate}T00:00:00Z`).getTime() - buffer * dayMs;
    const eTs = new Date(`${b.endDate}T00:00:00Z`).getTime() + buffer * dayMs;
    if (reqTs >= sTs && reqTs <= eTs) {
      return {
        available: false,
        reasonAr: b.reasonAr || "محجوز في هذا الموعد للتأجير أو التجهيز.",
        conflictRange: `${b.startDate} — ${b.endDate}`,
      };
    }
  }

  for (const r of db.rentalRequests) {
    if (r.dressCode.toLowerCase() !== dressCode.toLowerCase()) continue;
    if (r.requestType !== "rent") continue;
    if (r.status === "cancelled" || r.status === "returned") continue;
    const sTs = new Date(`${r.pickupDate}T00:00:00Z`).getTime() - buffer * dayMs;
    const eTs = new Date(`${r.returnDate}T00:00:00Z`).getTime() + buffer * dayMs;
    if (reqTs >= sTs && reqTs <= eTs) {
      return {
        available: false,
        reasonAr: "محجوز لمناسبة أخرى في نفس الفترة (تشمل أيام التجهيز والدراي كلين).",
        conflictRange: `${r.pickupDate} — ${r.returnDate}`,
      };
    }
  }

  return { available: true };
}

export async function publicDB() {
  const db = await readDB();
  const { adminPassword: _pw, adminUsername: _u, ...settings } = db.settings;
  void _pw;
  void _u;
  return {
    settings,
    categories: [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    dresses: db.dresses,
  };
}

export type PublicData = Awaited<ReturnType<typeof publicDB>>;
