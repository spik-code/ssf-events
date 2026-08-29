"use server";

import { revalidatePath } from "next/cache";
import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";

/** Gallery mutations. Every action re-checks admin — a Server Action is a
 *  public endpoint, so being inside a protected layout is not protection. */

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  return createSSRClient();
}

const CATEGORIES = ["wedding", "reception", "mandap", "haldi", "celebration", "decor"];

/** Remove the file from ImageKit too, so deleting here doesn't leave orphans. */
async function deleteFromImageKit(fileId: string | null) {
  if (!fileId) return;
  const key = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!key || key === "REPLACE_ME") return;

  try {
    await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      },
    });
  } catch (err) {
    // A failed CDN delete must not block the database delete.
    console.error("[gallery] ImageKit delete failed:", err);
  }
}

export async function addGalleryItem(input: {
  imagekit_url: string;
  imagekit_file_id: string | null;
  caption: string;
  alt: string;
  category: string;
  location: string;
  venue: string;
}) {
  const supabase = await requireAdmin();

  const category = CATEGORIES.includes(input.category) ? input.category : "wedding";

  // New items go to the end of the running order.
  const { data: last } = await supabase
    .from("gallery_items")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("gallery_items").insert({
    imagekit_url: input.imagekit_url,
    imagekit_file_id: input.imagekit_file_id,
    caption: input.caption.trim() || null,
    alt: input.alt.trim() || null,
    category,
    location: input.location.trim() || null,
    venue: input.venue.trim() || null,
    order_index: (last?.order_index ?? 0) + 1,
    is_published: false, // review it before it goes live
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/gallery");
  revalidatePath("/");
}

export async function updateGalleryItem(
  id: string,
  patch: Partial<{
    caption: string | null;
    alt: string | null;
    category: string;
    location: string | null;
    venue: string | null;
    is_published: boolean;
    featured: boolean;
    order_index: number;
  }>,
) {
  const supabase = await requireAdmin();
  if (patch.category && !CATEGORIES.includes(patch.category)) {
    throw new Error("Unknown category.");
  }
  const { error } = await supabase.from("gallery_items").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gallery");
  revalidatePath("/");
}

export async function deleteGalleryItem(id: string) {
  const supabase = await requireAdmin();

  const { data: row } = await supabase
    .from("gallery_items")
    .select("imagekit_file_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await deleteFromImageKit(row?.imagekit_file_id ?? null);

  revalidatePath("/admin/gallery");
  revalidatePath("/");
}
