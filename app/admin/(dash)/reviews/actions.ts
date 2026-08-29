"use server";

import { revalidatePath } from "next/cache";
import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  return createSSRClient();
}

export async function setReviewPublished(id: string, is_published: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("reviews").update({ is_published }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

/** Add a quote a customer gave you directly (WhatsApp, in person, SMS). */
export async function addDirectReview(input: {
  author_name: string;
  rating: number;
  text: string;
  relative_time: string;
}) {
  const supabase = await requireAdmin();
  if (!input.author_name.trim()) throw new Error("Whose words are these?");
  if (!input.text.trim()) throw new Error("The review needs some text.");

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));

  const { error } = await supabase.from("reviews").insert({
    source: "direct",
    author_name: input.author_name.trim(),
    rating,
    text: input.text.trim(),
    relative_time: input.relative_time.trim() || null,
    reviewed_at: new Date().toISOString(),
    is_published: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
