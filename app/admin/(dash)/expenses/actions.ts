"use server";

import { revalidatePath } from "next/cache";
import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";
import { clean } from "@/lib/sanitize";
import { attempt } from "@/lib/action-result";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  return createSSRClient();
}

async function add(f: {
  label: string;
  vendor: string;
  amount: number;
  spent_on: string;
  booking_id: string;
}) {
  const supabase = await requireAdmin();
  const label = clean(f.label, 200);
  const amount = Number(f.amount);
  if (!label || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("A label and an amount above 0 are required.");
  }
  const { error } = await supabase.from("expenses").insert({
    label,
    vendor: clean(f.vendor, 120),
    amount,
    spent_on: /^\d{4}-\d{2}-\d{2}$/.test(f.spent_on) ? f.spent_on : undefined,
    booking_id: f.booking_id || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/expenses");
}

async function remove(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/expenses");
}

export async function addExpense(f: Parameters<typeof add>[0]) {
  return attempt(() => add(f));
}
export async function deleteExpense(id: string) {
  return attempt(() => remove(id));
}
