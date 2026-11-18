import { notFound } from "next/navigation";
import { createSSRClient } from "@/lib/supabase/ssr";
import { DocEditor, type DocDraft } from "@/components/admin/DocEditor";
import type { Doc, DocKind } from "@/lib/documents";

export const metadata = { title: "Quotation / bill" };
export const dynamic = "force-dynamic";

/** `/admin/documents/new?kind=quotation|invoice&lead=<inquiry id>` or `/admin/documents/<id>`. */
export default async function DocPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string; lead?: string }>;
}) {
  const { id } = await params;
  const { kind, lead } = await searchParams;
  const supabase = await createSSRClient();

  let initial: DocDraft;
  if (id === "new") {
    const k: DocKind = kind === "invoice" ? "invoice" : "quotation";
    initial = {
      kind: k, client_name: "", client_phone: null, event_date: null, venue: null,
      items: [{ desc: "", qty: 1, rate: 0 }], discount: 0, paid: 0, notes: null,
      inquiry_id: null, booking_id: null,
    };
    if (lead) {
      const { data: l } = await supabase.from("inquiries").select("id,name,phone,event_date,event_location").eq("id", lead).maybeSingle();
      // Link to the lead's booking (if it has one) so the bill counts toward that event's profit.
      const { data: bk } = await supabase.from("bookings").select("id").eq("inquiry_id", lead).limit(1).maybeSingle();
      if (l) initial = { ...initial, client_name: l.name, client_phone: l.phone, event_date: l.event_date, venue: l.event_location, inquiry_id: l.id, booking_id: bk?.id ?? null };
    }
  } else {
    const { data } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    initial = data as Doc;
  }

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">
          {initial.kind === "invoice" ? "Bill" : "Quotation"} {initial.number ?? "(new)"}
        </h1>
      </header>
      <DocEditor initial={initial} />
    </>
  );
}
