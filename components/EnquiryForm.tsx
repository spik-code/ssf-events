"use client";

import { useState, useRef } from "react";
import { ChatIcon } from "./icons";
import { SITE } from "@/lib/site";
import { SERVICE_NEEDS } from "@/lib/content";
import { PRIVACY_VERSION } from "@/lib/legal";

type Status = "idle" | "sending" | "ok" | "error";

const FUNCTIONS: { value: string; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "engagement", label: "Engagement / betrothal" },
  { value: "haldi", label: "Haldi" },
  { value: "baby_shower", label: "Baby shower / naming" },
  { value: "birthday", label: "Birthday" },
  { value: "other", label: "Other" },
];

/**
 * Posts the enquiry to /api/enquiry (Supabase insert + Resend notification),
 * then offers a pre-filled WhatsApp handoff. If the API is down the WhatsApp
 * link still works, so an enquiry is never simply lost.
 *
 * `whatsapp` is the number the page resolved from site_settings, so changing it
 * in the admin changes where the handoff goes.
 */
export function EnquiryForm({ whatsapp = SITE.whatsapp }: { whatsapp?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [toast, setToast] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6000);
  }

  /** Human-readable labels for the ticked service checkboxes. */
  function needLabels(d: FormData) {
    return d
      .getAll("services_needed")
      .map((v) => SERVICE_NEEDS.find((n) => n.value === v)?.label)
      .filter(Boolean) as string[];
  }

  function whatsappUrl(d: FormData) {
    const lines = [
      "Hi SSF Events, I'd like a quote for my function.",
      "",
      `Name: ${d.get("name")}`,
      `Phone: ${d.get("phone")}`,
      `Function: ${FUNCTIONS.find((f) => f.value === d.get("event_type"))?.label ?? d.get("event_type")}`,
      d.get("event_date") ? `Date: ${d.get("event_date")}` : "",
      d.get("event_location") ? `Venue/town: ${d.get("event_location")}` : "",
      d.get("guest_count") ? `Guests: ${d.get("guest_count")}` : "",
      needLabels(d).length ? `Needs: ${needLabels(d).join(", ")}` : "",
      d.get("message") ? `Details: ${d.get("message")}` : "",
    ].filter(Boolean);
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);

    if (!d.get("name") || !d.get("phone") || !d.get("event_type")) {
      showToast("Add your name, phone and the type of function.");
      return;
    }

    if (!d.get("consent")) {
      showToast("Please tick the consent box so we're allowed to reply.");
      return;
    }

    setStatus("sending");

    // Capture UTM / referral so paid-social traffic is attributable.
    const params = new URLSearchParams(window.location.search);
    const referral = params.get("utm_source") || (params.get("gclid") ? "google" : null);

    const payload = {
      name: String(d.get("name")),
      phone: String(d.get("phone")),
      email: d.get("email") ? String(d.get("email")) : undefined,
      event_type: String(d.get("event_type")),
      event_date: d.get("event_date") ? String(d.get("event_date")) : undefined,
      event_location: d.get("event_location") ? String(d.get("event_location")) : undefined,
      guest_count: d.get("guest_count") ? Number(d.get("guest_count")) : undefined,
      message: d.get("message") ? String(d.get("message")) : undefined,
      referral_source: referral || undefined,
      services_needed: d.getAll("services_needed").map(String),
      consent: true,
      privacy_version: PRIVACY_VERSION,
    };

    let saved = false;
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      saved = res.ok;
    } catch {
      saved = false;
    }

    setStatus(saved ? "ok" : "error");
    showToast(
      saved
        ? "Got it — we'll call you back. Opening WhatsApp so you can add photos."
        : "Couldn't reach our server. Opening WhatsApp so your message still gets through.",
    );

    window.open(whatsappUrl(d), "_blank", "noopener");
    if (saved) form.reset();
  }

  return (
    <>
      <form className="form reveal" ref={formRef} onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="f-name">Your name</label>
          <input id="f-name" name="name" type="text" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="f-phone">Phone</label>
          <input id="f-phone" name="phone" type="tel" autoComplete="tel" required />
        </div>
        <div className="field">
          <label htmlFor="f-type">Function</label>
          <select id="f-type" name="event_type" required defaultValue="">
            <option value="">Select one</option>
            {FUNCTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-date">Event date</label>
          <input id="f-date" name="event_date" type="date" />
        </div>
        <div className="field">
          <label htmlFor="f-email">Email &mdash; optional</label>
          <input id="f-email" name="email" type="email" autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="f-guests">Guests &mdash; approx.</label>
          <input id="f-guests" name="guest_count" type="number" min={2} inputMode="numeric" />
        </div>
        <div className="field full">
          <label htmlFor="f-place">Venue or town</label>
          <input
            id="f-place"
            name="event_location"
            type="text"
            placeholder="Hall name, or which town"
          />
        </div>
        <div className="field full">
          <span className="lbl-as-legend">What do you need?</span>
          <div className="needs">
            {SERVICE_NEEDS.map((n) => (
              <label className="need" key={n.value}>
                <input type="checkbox" name="services_needed" value={n.value} />
                {n.label}
              </label>
            ))}
          </div>
        </div>
        <div className="field full">
          <label htmlFor="f-msg">What you have in mind</label>
          <textarea
            id="f-msg"
            name="message"
            placeholder="Rough guest count, colours you like, the parts you already have sorted&hellip;"
          />
        </div>
        <div className="consent-row">
          <label className="consent">
            <input type="checkbox" name="consent" />
            <span>
              I&rsquo;ve read the{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                privacy note
              </a>{" "}
              and I&rsquo;m okay with {SITE.name} contacting me about this enquiry.
            </span>
          </label>
        </div>
        <div className="full act">
          <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
            <ChatIcon />
            {status === "sending" ? "Sending…" : "Send enquiry"}
          </button>
          <p>Reaches our phone and inbox. No mailing list, no call centre.</p>
        </div>
      </form>

      <div className={`toast${toast ? " is-up" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
