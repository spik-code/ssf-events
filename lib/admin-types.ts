import type { EventType } from "./types";

export type InquiryStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export interface Inquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  event_date: string | null;
  event_location: string | null;
  guest_count: number | null;
  budget_range: string | null;
  event_type: EventType;
  message: string | null;
  referral_source: string | null;
  services_needed: string[];
  consent_given: boolean;
  privacy_version: string | null;
  status: InquiryStatus;
  quoted_at: string | null;
  created_at: string;
}

export type DepositStatus = "pending" | "partial" | "paid";

export interface Booking {
  id: string;
  inquiry_id: string | null;
  confirmed_date: string;
  deposit_status: DepositStatus;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
}

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

/** The order a lead normally moves through. */
export const STATUS_FLOW: InquiryStatus[] = ["new", "contacted", "quoted", "won", "lost"];

export const EVENT_LABELS: Record<string, string> = {
  wedding: "Wedding",
  reception: "Reception",
  engagement: "Engagement",
  haldi: "Haldi",
  baby_shower: "Baby shower",
  birthday: "Birthday",
  other: "Other",
};

export const NEED_LABELS: Record<string, string> = {
  decor: "Decor",
  catering: "Catering",
  dj_lighting: "DJ & lighting",
  full: "Full function",
};
