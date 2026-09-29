import { createSSRClient } from "@/lib/supabase/ssr";
import { ReelsManager } from "@/components/admin/ReelsManager";
import type { ReelItem } from "@/lib/types";

export const metadata = { title: "Reels" };
export const dynamic = "force-dynamic";

export default async function ReelsAdminPage() {
  const supabase = await createSSRClient();

  // Admins see unpublished reels too — RLS grants them the full table.
  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as ReelItem[];
  const live = items.filter((i) => i.is_published).length;

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">Reels</h1>
        <p className="note">
          {items.length} clip{items.length === 1 ? "" : "s"} · {live} live on the site, newest
          first. Uploads start unpublished so you can check them first.
        </p>
      </header>

      {error && (
        <p className="adm-error" role="alert">
          Could not load the reels: {error.message}
        </p>
      )}

      <ReelsManager items={items} />
    </>
  );
}
