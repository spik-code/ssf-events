import Link from "next/link";
import { createSSRClient } from "@/lib/supabase/ssr";
import { inr, totals, type Doc } from "@/lib/documents";

export const metadata = { title: "Quotes & bills" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const supabase = await createSSRClient();
  let q = supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (kind === "quotation" || kind === "invoice") q = q.eq("kind", kind);
  const docs = ((await q).data ?? []) as Doc[];

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">Quotes &amp; bills</h1>
        <div className="adm-row-actions">
          <Link className="btn btn-primary" href="/admin/documents/new?kind=quotation">+ Quotation</Link>
          <Link className="btn btn-ghost" href="/admin/documents/new?kind=invoice">+ Bill</Link>
          <Link className="btn btn-ghost" href="/admin/documents">All</Link>
          <Link className="btn btn-ghost" href="/admin/documents?kind=quotation">Quotes</Link>
          <Link className="btn btn-ghost" href="/admin/documents?kind=invoice">Bills</Link>
        </div>
      </header>
      {docs.length === 0 ? (
        <div className="adm-empty"><p className="h3">Nothing here yet</p></div>
      ) : (
        <ul className="adm-list">
          {docs.map((d) => {
            const t = totals(d);
            return (
              <li key={d.id}>
                <div className="adm-rev-top">
                  <Link href={`/admin/documents/${d.id}`}><b>{d.number}</b> · {d.client_name}</Link>
                  <span className={`lead-status s-${d.kind === "invoice" && t.balance === 0 ? "won" : "new"}`}>
                    {d.kind === "invoice" ? (t.balance === 0 ? "paid" : `due ${inr(t.balance)}`) : "quotation"}
                  </span>
                </div>
                <p className="note">
                  {inr(t.total)}
                  {d.event_date ? ` · event ${new Date(d.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
