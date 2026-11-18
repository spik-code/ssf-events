export type DocKind = "quotation" | "invoice";
export interface DocItem {
  desc: string;
  qty: number;
  rate: number;
}
export interface Doc {
  id: string;
  kind: DocKind;
  number: string;
  client_name: string;
  client_phone: string | null;
  event_date: string | null;
  venue: string | null;
  items: DocItem[];
  discount: number;
  paid: number;
  notes: string | null;
  inquiry_id: string | null;
  booking_id: string | null;
  created_at: string;
}

// "Rs." not the rupee sign: the built-in PDF fonts have no ₹ glyph.
export const inr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

export function totals(d: Pick<Doc, "items" | "discount" | "paid">) {
  const subtotal = d.items.reduce((s, i) => s + i.qty * i.rate, 0);
  const total = Math.max(0, subtotal - (d.discount || 0));
  return { subtotal, total, balance: Math.max(0, total - (d.paid || 0)) };
}

export const TERMS: Record<DocKind, string[]> = {
  quotation: [
    "Booking is confirmed on receipt of the 50% advance. Items are subject to availability until then.",
    "This quotation is valid for 30 days from the date above.",
    "Extra time or additional items are charged separately.",
  ],
  invoice: [
    "Balance is payable on or before the event date unless agreed otherwise.",
    "Thank you for choosing SSF Events.",
  ],
};
