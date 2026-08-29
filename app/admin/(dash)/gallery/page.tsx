import { createSSRClient } from "@/lib/supabase/ssr";
import { GalleryManager } from "@/components/admin/GalleryManager";
import type { GalleryItem } from "@/lib/types";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryAdminPage() {
  const supabase = await createSSRClient();

  // Admins see unpublished items too — RLS grants them the full table.
  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("order_index", { ascending: true });

  const items = (data ?? []) as GalleryItem[];
  const live = items.filter((i) => i.is_published).length;

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">Gallery</h1>
        <p className="note">
          {items.length} photo{items.length === 1 ? "" : "s"} · {live} live on the site.
          Uploads go straight to ImageKit and start unpublished so you can check them first.
        </p>
      </header>

      {error && (
        <p className="adm-error" role="alert">
          Could not load the gallery: {error.message}
        </p>
      )}

      <GalleryManager items={items} />
    </>
  );
}
