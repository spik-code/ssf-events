import Link from "next/link";
import { createSSRClient } from "@/lib/supabase/ssr";
import type { Booking } from "@/lib/admin-types";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

interface BookingRow extends Booking {
  inquiries: { name: string; phone: string; event_type: string } | null;
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const supabase = await createSSRClient();

  const { data } = await supabase
    .from("bookings")
    .select("*, inquiries(name, phone, event_type)")
    .order("confirmed_date", { ascending: true });

  const bookings = (data ?? []) as BookingRow[];

  // Two bookings on one date is allowed (different halls, different times) but
  // worth flagging so it is never a surprise.
  const byDate = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.confirmed_date] = (acc[b.confirmed_date] ?? 0) + 1;
    return acc;
  }, {});

  // Month grid (?m=YYYY-MM): days with a booking are marked, 2+ turn red.
  const now = new Date();
  const [yy, mm] = /^\d{4}-\d{2}$/.test(m ?? "") ? m!.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const first = new Date(yy, mm - 1, 1);
  const days = new Date(yy, mm, 0).getDate();
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const upcoming = bookings.filter((b) => new Date(b.confirmed_date) >= new Date());

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">Bookings</h1>
        <p className="note">
          {bookings.length === 0
            ? "No bookings yet. Mark a lead as Won to create one."
            : `${bookings.length} total · ${upcoming.length} upcoming`}
        </p>
      </header>

      <section className="cal" aria-label="Booking calendar">
        <div className="cal-nav">
          <Link href={`/admin/bookings?m=${ym(new Date(yy, mm - 2, 1))}`} aria-label="Previous month">‹</Link>
          <b>{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</b>
          <Link href={`/admin/bookings?m=${ym(new Date(yy, mm, 1))}`} aria-label="Next month">›</Link>
        </div>
        <div className="cal-grid">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
          {cells.map((day, i) => {
            if (!day) return <span key={i} />;
            const n = byDate[`${yy}-${String(mm).padStart(2, "0")}-${String(day).padStart(2, "0")}`] ?? 0;
            return <span key={i} className={`cal-day${n ? " has" : ""}${n > 1 ? " clash" : ""}`}>{day}</span>;
          })}
        </div>
      </section>

      {bookings.length === 0 ? (
        <div className="adm-empty">
          <p className="h3">Nothing booked yet</p>
          <p className="note">
            Confirmed dates appear here, with a warning when two land on the same day.
          </p>
        </div>
      ) : (
        <ul className="adm-list">
          {bookings.map((b) => (
            <li key={b.id}>
              <div className="adm-rev-top">
                <b>
                  {new Date(b.confirmed_date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </b>
                {byDate[b.confirmed_date] > 1 && (
                  <span className="lead-stale" title="Another booking shares this date">
                    {byDate[b.confirmed_date]} on this day
                  </span>
                )}
                <span className={`lead-status s-${b.deposit_status === "paid" ? "won" : "new"}`}>
                  {b.deposit_status}
                </span>
              </div>
              <p className="note">
                {b.inquiries?.name ?? "—"}
                {b.inquiries?.phone ? ` · ${b.inquiries.phone}` : ""}
                {b.total_amount ? ` · ₹${Number(b.total_amount).toLocaleString("en-IN")}` : ""}
              </p>
              {b.notes && <p className="adm-rev-text">{b.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
