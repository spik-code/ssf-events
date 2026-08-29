import { createSSRClient } from "@/lib/supabase/ssr";
import type { Booking } from "@/lib/admin-types";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

interface BookingRow extends Booking {
  inquiries: { name: string; phone: string; event_type: string } | null;
}

export default async function BookingsPage() {
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
