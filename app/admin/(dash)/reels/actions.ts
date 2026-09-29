"use server";

import { revalidatePath } from "next/cache";
import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";

/** Reel mutations. Every action re-checks admin — a Server Action is a
 *  public endpoint, so being inside a protected layout is not protection. */

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  return createSSRClient();
}

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
    console.error("[reels] ImageKit delete failed:", err);
  }
}

export async function addReel(input: { imagekit_url: string; imagekit_file_id: string | null }) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("reels").insert({
    imagekit_url: input.imagekit_url,
    imagekit_file_id: input.imagekit_file_id,
    is_published: false, // review it before it goes live
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/reels");
  revalidatePath("/");
}

export async function updateReel(
  id: string,
  patch: Partial<{ caption: string | null; is_published: boolean }>,
) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("reels").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reels");
  revalidatePath("/");
}

export async function deleteReel(id: string) {
  const supabase = await requireAdmin();

  const { data: row } = await supabase
    .from("reels")
    .select("imagekit_file_id, poster_file_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("reels").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await deleteFromImageKit(row?.imagekit_file_id ?? null);
  await deleteFromImageKit(row?.poster_file_id ?? null);

  revalidatePath("/admin/reels");
  revalidatePath("/");
}
