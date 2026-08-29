import { createSSRClient } from "@/lib/supabase/ssr";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import type { Review } from "@/lib/types";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function ReviewsAdminPage() {
  const supabase = await createSSRClient();

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .order("reviewed_at", { ascending: false, nullsFirst: false });

  const reviews = (data ?? []) as Review[];
  const live = reviews.filter((r) => r.is_published).length;
  const held = reviews.length - live;

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">Reviews</h1>
        <p className="note">
          {reviews.length === 0
            ? "No reviews yet. Google reviews appear here once the Places API key is set and the sync runs."
            : `${reviews.length} total · ${live} live${held ? ` · ${held} held back` : ""}`}
        </p>
      </header>

      <ReviewsManager reviews={reviews} />
    </>
  );
}
