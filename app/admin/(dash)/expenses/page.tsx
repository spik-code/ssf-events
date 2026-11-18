import { createSSRClient } from "@/lib/supabase/ssr";
import { ExpenseForm, DeleteExpense } from "@/components/admin/ExpenseForm";
import { inr, totals, type Doc } from "@/lib/documents";

export const metadata = { title: "Expenses" };
export const dynamic = "force-dynamic";

interface Exp { id: string; booking_id: string | null; label: string; vendor: string | null; amount: number; spent_on: string }
interface Bk { id: string; confirmed_date: string; inquiries: { name: string } | null }

export default async function ExpensesPage() {
  const supabase = await createSSRClient();
  const [{ data: e }, { data: b }, { data: d }] = await Promise.all([
    supabase.from("expenses").select("*").order("spent_on", { ascending: false }),
    supabase.from("bookings").select("id, confirmed_date, inquiries(name)").order("confirmed_date", { ascending: false }),
    supabase.from("documents").select("*").eq("kind", "invoice"),
  ]);
  const expenses = (e ?? []) as Exp[];
  const bookings = (b ?? []) as unknown as Bk[];
  const invoices = (d ?? []) as Doc[];

  const spent = expenses.reduce((s, x) => s + Number(x.amount), 0);
  const billed = invoices.reduce((s, x) => s + totals(x).total, 0);
  const received = invoices.reduce((s, x) => s + Number(x.paid), 0);
  const label = (bk: Bk) =>
    `${bk.inquiries?.name ?? "Booking"} · ${new Date(bk.confirmed_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  // Per event: money received on bills linked to the booking minus its expenses.
  const perEvent = bookings
    .map((bk) => {
      const inc = invoices.filter((i) => i.booking_id === bk.id).reduce((s, i) => s + Number(i.paid), 0);
      const out = expenses.filter((x) => x.booking_id === bk.id).reduce((s, x) => s + Number(x.amount), 0);
      return { bk, inc, out };
    })
    .filter((r) => r.inc || r.out);

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">Expenses</h1>
        <p className="note">
          Billed {inr(billed)} · Received {inr(received)} · Spent {inr(spent)} · Net cash {inr(received - spent)}
        </p>
      </header>
      <ExpenseForm bookings={bookings.map((bk) => ({ id: bk.id, label: label(bk) }))} />

      {perEvent.length > 0 && (
        <>
          <h2 className="h3" style={{ marginTop: 32 }}>Profit per event</h2>
          <ul className="adm-list">
            {perEvent.map(({ bk, inc, out }) => (
              <li key={bk.id}>
                <b>{label(bk)}</b>
                <p className="note">Received {inr(inc)} · Spent {inr(out)} · Profit {inr(inc - out)}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="h3" style={{ marginTop: 32 }}>All expenses</h2>
      <ul className="adm-list">
        {expenses.map((x) => (
          <li key={x.id}>
            <div className="adm-rev-top">
              <b>{x.label}</b>
              <span>{inr(Number(x.amount))}</span>
              <DeleteExpense id={x.id} />
            </div>
            <p className="note">
              {new Date(x.spent_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {x.vendor ? ` · ${x.vendor}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
