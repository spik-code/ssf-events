"use server";

import { revalidatePath } from "next/cache";
import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";
import type { InquiryStatus } from "@/lib/admin-types";

/**
 * Server Actions for the admin.
 *
 * Every one re-checks `isAdmin()` before touching anything. A Server Action is a
 * public HTTP endpoint — being rendered inside a protected layout does not
 * protect the action itself. RLS is the final backstop, but this fails fast and
 * with a clear message.
 */

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  return createSSRClient();
}

const STATUSES: InquiryStatus[] = ["new", "contacted", "quoted", "won", "lost"];

export async function updateLeadStatus(id: string, status: string) {
  const supabase = await requireAdmin();
  if (!STATUSES.includes(status as InquiryStatus)) throw new Error("Unknown status.");

  // quoted_at is stamped by a database trigger, not here, so the SLA clock is
  // consistent no matter what updates the row.
  const { error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteLead(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function convertToBooking(
  inquiryId: string,
  confirmedDate: string,
  totalAmount: number | null,
  notes: string | null,
) {
  const supabase = await requireAdmin();

  const { error: bookingError } = await supabase.from("bookings").insert({
    inquiry_id: inquiryId,
    confirmed_date: confirmedDate,
    total_amount: totalAmount,
    notes,
    deposit_status: "pending",
  });
  if (bookingError) throw new Error(bookingError.message);

  await supabase.from("inquiries").update({ status: "won" }).eq("id", inquiryId);

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}
