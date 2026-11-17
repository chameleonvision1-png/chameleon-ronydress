import { isAdmin } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdmin();
  if (!authed) {
    return (
      <AdminDashboard
        initialAuthed={false}
        initialDresses={[]}
        initialRentals={[]}
        initialAppointments={[]}
        initialBlocked={[]}
        initialSettings={null}
      />
    );
  }

  const db = await readDB(true);
  const { adminPassword: _pw, ...safeSettings } = db.settings;
  void _pw;

  return (
    <AdminDashboard
      initialAuthed={true}
      initialDresses={db.dresses}
      initialRentals={db.rentalRequests}
      initialAppointments={db.appointments}
      initialBlocked={db.blockedDates}
      initialSettings={safeSettings}
    />
  );
}
