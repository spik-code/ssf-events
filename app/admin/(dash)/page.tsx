import { createSSRClient } from "@/lib/supabase/ssr";
import { LeadsTable } from "@/components/admin/LeadsTable";
import type { Inquiry } from "@/lib/admin-types";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const { status, source } = await searchParams;
  const supabase = await createSSRClient();

  let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    query = query.eq("status", status);
  }
  if (source) query = query.eq("referral_source", source);

  const { data, error } = await query;
  const leads = (data ?? []) as Inquiry[];

  // Counts for the filter chips come from the unfiltered set.
  const { data: allRows } = await supabase.from("inquiries").select("status, referral_source");
  const all = (allRows ?? []) as { status: string; referral_source: string | null }[];

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = all.filter((r) => r.status === s).length;
    return acc;
  }, {});

  const sources = [...new Set(all.map((r) => r.referral_source).filter(Boolean))] as string[];

  // Response-time promise: how many quoted leads were answered within 48h.
  const newCount = counts.new ?? 0;

  return (
    <>
      <header className="adm-head">
        <div>
          <h1 className="h2">Leads</h1>
          <p className="note">
            {all.length === 0
              ? "No enquiries yet. They land here the moment someone submits the form."
              : `${all.length} total${newCount ? ` · ${newCount} needing a first reply` : ""}`}
          </p>
        </div>
      </header>

      {error && (
        <p className="adm-error" role="alert">
          Could not load leads: {error.message}
        </p>
      )}

      <LeadsTable
        leads={leads}
        counts={counts}
        sources={sources}
        activeStatus={status ?? "all"}
        activeSource={source ?? ""}
        total={all.length}
      />
    </>
  );
}
