"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Check,
  Lock,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import type {
  Appointment,
  AtelierSettings,
  BlockedDateRange,
  Dress,
  DressStatus,
  RentalRequest,
} from "@/lib/types";
import { STATUS_LABELS_AR } from "@/lib/whatsapp";

export function AdminDashboard({
  initialAuthed,
  initialDresses,
  initialRentals,
  initialAppointments,
  initialBlocked,
  initialSettings,
}: {
  initialAuthed: boolean;
  initialDresses: Dress[];
  initialRentals: RentalRequest[];
  initialAppointments: Appointment[];
  initialBlocked: BlockedDateRange[];
  initialSettings: Omit<AtelierSettings, "adminPassword"> | null;
}) {
  const [authed, setAuthed] = React.useState(initialAuthed);
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("");
  const [loginErr, setLoginErr] = React.useState("");

  const [tab, setTab] = React.useState<"dresses" | "rentals" | "appointments" | "settings">("dresses");
  const [dresses, setDresses] = React.useState(initialDresses);
  const [rentals, setRentals] = React.useState(initialRentals);
  const [appointments, setAppointments] = React.useState(initialAppointments);
  const [blockedDates, setBlockedDates] = React.useState(initialBlocked);
  const [settings, setSettings] = React.useState(initialSettings);
  const [newPassword, setNewPassword] = React.useState("");
  const [notice, setNotice] = React.useState("");

  // Quick Add Dress State
  const [newCode, setNewCode] = React.useState("");
  const [newNameAr, setNewNameAr] = React.useState("");
  const [newFabric, setNewFabric] = React.useState("");
  const [newFrontUrl, setNewFrontUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  // Quick Block Date State
  const [blkCode, setBlkCode] = React.useState("RD-01");
  const [blkStart, setBlkStart] = React.useState("");
  const [blkEnd, setBlkEnd] = React.useState("");
  const [blkReason, setBlkReason] = React.useState("محجوز في الأتيليه");

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const d = await res.json();
      setLoginErr(d.error || "بيانات الدخول غير صحيحة");
      return;
    }
    setAuthed(true);
    window.location.reload();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  };

  const handleUpload = async (file: File, onDone: (url: string) => void) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onDone(data.url);
    } finally {
      setUploading(false);
    }
  };

  const updateDress = async (dress: Dress, patch: Partial<Dress>) => {
    const res = await fetch("/api/admin/dresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dress.id, ...patch }),
    });
    if (res.ok) {
      const data = await res.json();
      setDresses((prev) => prev.map((d) => (d.id === dress.id ? data.dress : d)));
      flash("تم تحديث بيانات الفستان");
    }
  };

  const addDress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newNameAr) return;
    const res = await fetch("/api/admin/dresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newCode,
        nameAr: newNameAr,
        fabricAr: newFabric || "قماش سهرة وتطريز هاند ميد",
        onOrbit: true,
        isFeatured: true,
        shots: newFrontUrl
          ? [{ src: newFrontUrl, angle: "front", labelAr: "أمامي", w: 640, h: 960 }]
          : [],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setDresses((prev) => [data.dress, ...prev]);
      setNewCode("");
      setNewNameAr("");
      setNewFabric("");
      setNewFrontUrl("");
      flash("تم إضافة الفستان بنجاح");
    }
  };

  const deleteDress = async (id: string) => {
    const res = await fetch(`/api/admin/dresses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      setDresses((prev) => prev.filter((d) => d.id !== id));
      flash("تم حذف الفستان");
    }
  };

  const updateStatus = async (kind: "rental" | "appointment", id: string, status: string) => {
    const res = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status }),
    });
    if (res.ok) {
      if (kind === "rental") {
        setRentals((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: status as RentalRequest["status"] } : r)),
        );
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: status as Appointment["status"] } : a)),
        );
      }
      flash("تم تحديث الحالة");
    }
  };

  const addBlockedRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "block",
        action: "add",
        dressCode: blkCode,
        startDate: blkStart,
        endDate: blkEnd,
        reasonAr: blkReason,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setBlockedDates((prev) => [data.blockedDate, ...prev]);
      setBlkStart("");
      setBlkEnd("");
      flash("تم إغلاق التاريخ للتأجير");
    }
  };

  const removeBlockedRange = async (id: string) => {
    const res = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "block", action: "remove", id }),
    });
    if (res.ok) {
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, newPassword }),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      setNewPassword("");
      flash("تم حفظ إعدادات الأتيليه");
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--bg-primary)] px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7 shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-[var(--brand-gold)]" />
            <div>
              <h1 className="text-lg font-bold text-[var(--text-strong)]">لوحة إدارة Rony Dress</h1>
              <p className="text-xs text-[var(--text-muted)]">أتيليه فستان ست البنات</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dir="ltr"
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-gold)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-gold)]"
            />
          </div>

          {loginErr && <p className="text-xs font-semibold text-red-600">{loginErr}</p>}

          <button
            type="submit"
            className="w-full rounded bg-[var(--brand-gold)] py-2.5 text-sm font-bold text-[#FFF9F2] hover:bg-[var(--brand-gold-hover)]"
          >
            دخول
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[var(--bg-primary)] pb-16">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo-monogram.webp" alt="Rony Dress" className="h-9 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-[var(--text-strong)]">لوحة إدارة أتيليه Rony Dress</h1>
              <p className="text-xs text-[var(--text-muted)]">إدارة الفساتين، الحجوزات، مواعيد البروفة، والإعدادات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-strong)]"
            >
              معاينة الموقع
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-strong)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="mx-auto mt-4 max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-2 rounded bg-[var(--brand-gold)] px-4 py-2.5 text-xs font-bold text-[#FFF9F2]">
            <Check className="h-4 w-4" />
            <span>{notice}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-4">
          {[
            { id: "dresses", label: `الفساتين (${dresses.length})`, icon: Sparkles },
            { id: "rentals", label: `طلبات الإيجار والتفصيل (${rentals.length})`, icon: CalendarCheck },
            { id: "appointments", label: `مواعيد البروفة (${appointments.length})`, icon: CalendarCheck },
            { id: "settings", label: "الإعدادات والأرقام والسياسات", icon: SettingsIcon },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-bold transition ${
                  tab === t.id
                    ? "bg-[var(--brand-gold)] text-[#FFF9F2]"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-strong)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* DRESSES TAB */}
        {tab === "dresses" && (
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--text-strong)]">
                إضافة فستان جديد (إرشاد التصوير للدوران ٣٦٠°: صوّري الفستان على مانيكان قدام خلفية سادة من ٤ إلى ٨ زوايا)
              </h2>
              <form onSubmit={addDress} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
                <input
                  type="text"
                  required
                  placeholder="الكود (مثل RD-09)"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="اسم الفستان"
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="القماش والتفاصيل"
                  value={newFabric}
                  onChange={(e) => setNewFabric(e.target.value)}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
                />
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded border border-dashed border-[var(--brand-gold)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--brand-gold)]">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploading ? "جارٍ الرفع..." : newFrontUrl ? "تم رفع الصورة" : "رفع الصورة الأمامية"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, setNewFrontUrl);
                    }}
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 rounded bg-[var(--brand-gold)] px-4 py-2 text-xs font-bold text-[#FFF9F2]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>إضافة فستان</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {dresses.map((d) => (
                <div
                  key={d.id}
                  className="flex gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
                >
                  <img
                    src={d.shots[0]?.src || "/logo-monogram.webp"}
                    alt={d.nameAr}
                    className="h-32 w-22 shrink-0 rounded bg-[#F7F1E8] object-cover object-top"
                  />
                  <div className="min-w-0 flex-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-en font-bold text-[var(--brand-gold)]">{d.code}</span>
                      <button
                        type="button"
                        onClick={() => deleteDress(d.id)}
                        aria-label={`حذف ${d.nameAr}`}
                        className="text-[var(--text-muted)] hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="truncate text-sm font-bold text-[var(--text-strong)]">{d.nameAr}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={d.status}
                        onChange={(e) => updateDress(d, { status: e.target.value as DressStatus })}
                        className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2 py-1 text-xs"
                      >
                        {Object.entries(STATUS_LABELS_AR).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="سعر الإيجار (اختياري)"
                        defaultValue={d.rentPrice || ""}
                        onBlur={(e) =>
                          updateDress(d, {
                            rentPrice: e.target.value ? Number(e.target.value) : undefined,
                            showPrice: Boolean(e.target.value),
                          })
                        }
                        className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={d.onOrbit}
                          onChange={(e) => updateDress(d, { onOrbit: e.target.checked })}
                        />
                        <span>في الكاروسيل الدائري</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={d.showPrice}
                          onChange={(e) => updateDress(d, { showPrice: e.target.checked })}
                        />
                        <span>إظهار السعر</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RENTALS TAB */}
        {tab === "rentals" && (
          <div className="mt-6 space-y-6">
            <form
              onSubmit={addBlockedRange}
              className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-5"
            >
              <select
                value={blkCode}
                onChange={(e) => setBlkCode(e.target.value)}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
              >
                {dresses.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.nameAr}
                  </option>
                ))}
              </select>
              <input
                type="date"
                required
                value={blkStart}
                onChange={(e) => setBlkStart(e.target.value)}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
              />
              <input
                type="date"
                required
                value={blkEnd}
                onChange={(e) => setBlkEnd(e.target.value)}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={blkReason}
                onChange={(e) => setBlkReason(e.target.value)}
                placeholder="السبب"
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="rounded bg-[var(--brand-gold)] px-4 py-2 text-xs font-bold text-[#FFF9F2]"
              >
                حظر تاريخ (حجز داخلي)
              </button>
            </form>

            {blockedDates.length > 0 && (
              <div className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <p className="text-xs font-bold">التواريخ المحجوزة يدوياً:</p>
                {blockedDates.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span>
                      <strong className="font-en">{b.dressCode}</strong>: {b.startDate} → {b.endDate} ({b.reasonAr})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBlockedRange(b.id)}
                      className="text-red-600 underline"
                    >
                      فك الحظر
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {rentals.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                  لا توجد طلبات حجز مسجلة بعد.
                </p>
              ) : (
                rentals.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[var(--text-strong)]">
                        [{r.dressCode}] {r.dressNameAr} — {r.requestType === "tailor" ? "تفصيل" : "إيجار"}
                      </p>
                      <p className="text-[var(--text-muted)]">
                        {r.customerName} · {r.customerPhone} · تاريخ المناسبة: {r.eventDate} · مقاس {r.sizeLabel}
                      </p>
                    </div>
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus("rental", r.id, e.target.value)}
                      className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-semibold"
                    >
                      <option value="new">جديد</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="ready">جاهز للاستلام</option>
                      <option value="picked-up">تم التسليم</option>
                      <option value="returned">تم الإرجاع</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {tab === "appointments" && (
          <div className="mt-6 space-y-3">
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                لا توجد مواعيد بروفة مسجلة بعد.
              </p>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs"
                >
                  <div>
                    <p className="font-bold text-[var(--text-strong)]">
                      {a.name} — {a.phone}
                    </p>
                    <p className="text-[var(--text-muted)]">
                      الزيارة: {a.visitDate} ({a.visitTime}) · المناسبة: {a.eventDate}{" "}
                      {a.dressCode ? `· الفستان: ${a.dressCode}` : ""}
                    </p>
                  </div>
                  <select
                    value={a.status}
                    onChange={(e) => updateStatus("appointment", a.id, e.target.value)}
                    className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="new">جديد</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="done">تمت الزيارة</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && settings && (
          <form onSubmit={saveSettings} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">رقم الهاتف الأساسي</label>
              <input
                type="text"
                dir="ltr"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">رقم الواتساب (بدون +، مثال: 2010xxxxxxxx)</label>
              <input
                type="text"
                dir="ltr"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="2010xxxxxxxx"
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">العنوان</label>
              <input
                type="text"
                value={settings.addressAr}
                onChange={(e) => setSettings({ ...settings, addressAr: e.target.value })}
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">رابط خرائط جوجل (Google Maps)</label>
              <input
                type="text"
                dir="ltr"
                value={settings.mapsUrl || ""}
                onChange={(e) => setSettings({ ...settings, mapsUrl: e.target.value })}
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">مواعيد العمل</label>
              <input
                type="text"
                value={settings.workingHoursAr}
                onChange={(e) => setSettings({ ...settings, workingHoursAr: e.target.value })}
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">كلمة مرور الإدارة الجديدة (اختياري)</label>
              <input
                type="password"
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="اتركيه فارغاً لعدم التغيير"
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-[var(--brand-gold)] px-6 py-2.5 text-xs font-bold text-[#FFF9F2]"
              >
                حفظ الإعدادات
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
