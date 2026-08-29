"use server";

import { revalidatePath } from "next/cache";
import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  return createSSRClient();
}

/** site_settings stores jsonb, so plain strings are stored as JSON strings. */
export async function updateSetting(key: string, value: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function updateService(
  id: string,
  patch: Partial<{ name: string; description: string; order_index: number; is_active: boolean }>,
) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("services").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function addService(name: string, description: string) {
  const supabase = await requireAdmin();
  if (!name.trim()) throw new Error("A service needs a name.");

  const { data: last } = await supabase
    .from("services")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("services").insert({
    name: name.trim(),
    description: description.trim(),
    order_index: (last?.order_index ?? 0) + 1,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function deleteService(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
  revalidatePath("/");
}
