"use server";

import { revalidatePath } from "next/cache";
import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";
import { clean, cleanMultiline } from "@/lib/sanitize";
import type { DocItem, DocKind } from "@/lib/documents";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  return createSSRClient();
}

const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : 0);

export interface DocInput {
  id?: string;
  kind: DocKind;
  client_name: string;
  client_phone: string | null;
  event_date: string | null;
  venue: string | null;
  items: DocItem[];
  discount: number;
  paid: number;
  notes: string | null;
  inquiry_id?: string | null;
  booking_id?: string | null;
}

/** Creates or updates a quotation/bill; returns its id. Numbers: Q-2026-001 / INV-2026-001. */
export async function saveDocument(input: DocInput): Promise<string> {
  const supabase = await requireAdmin();
  const kind: DocKind = input.kind === "invoice" ? "invoice" : "quotation";
  const client_name = clean(input.client_name, 120);
  const items = (Array.isArray(input.items) ? input.items : [])
    .map((i) => ({ desc: clean(i.desc, 300) ?? "", qty: num(i.qty), rate: num(i.rate) }))
    .filter((i) => i.desc && i.qty > 0);
  if (!client_name) throw new Error("Client name is required.");
  if (!items.length) throw new Error("Add at least one item with a quantity.");

  const row = {
    client_name,
    client_phone: clean(input.client_phone, 32),
    event_date: input.event_date && /^\d{4}-\d{2}-\d{2}$/.test(input.event_date) ? input.event_date : null,
    venue: clean(input.venue, 200),
    items,
    discount: num(input.discount),
    paid: num(input.paid),
    notes: cleanMultiline(input.notes, 1000),
    inquiry_id: input.inquiry_id || null,
    booking_id: input.booking_id || null,
  };

  if (input.id) {
    const { error } = await supabase.from("documents").update(row).eq("id", input.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/documents");
    return input.id;
  }

  const prefix = `${kind === "invoice" ? "INV" : "Q"}-${new Date().getFullYear()}-`;
  const { count } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .like("number", `${prefix}%`);
  // `number` is unique: step past any gap or collision.
  for (let n = (count ?? 0) + 1, tries = 0; tries < 5; n++, tries++) {
    const { data, error } = await supabase
      .from("documents")
      .insert({ ...row, kind, number: `${prefix}${String(n).padStart(3, "0")}` })
      .select("id")
      .single();
    if (data) {
      revalidatePath("/admin/documents");
      return data.id;
    }
    if (error?.code !== "23505") throw new Error(error?.message ?? "Could not save.");
  }
  throw new Error("Could not allocate a number. Try again.");
}

export async function deleteDocument(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/documents");
}

/** Copies a quotation into a new invoice (same items, nothing paid yet). */
export async function quotationToInvoice(id: string): Promise<string> {
  const supabase = await requireAdmin();
  const { data: q, error } = await supabase.from("documents").select("*").eq("id", id).single();
  if (error || !q) throw new Error("Quotation not found.");
  return saveDocument({ ...q, kind: "invoice", id: undefined, paid: 0 });
}
