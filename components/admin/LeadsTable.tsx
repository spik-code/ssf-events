"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus, deleteLead } from "@/app/admin/(dash)/actions";
import {
  STATUS_FLOW,
  STATUS_LABELS,
  EVENT_LABELS,
  NEED_LABELS,
  type Inquiry,
  type InquiryStatus,
} from "@/lib/admin-types";
import { PhoneIcon, ChatIcon, MailIcon } from "../icons";
import { SITE } from "@/lib/site";

function waHref(lead: Inquiry) {
  const digits = lead.phone.replace(/[^\d]/g, "");
  // Indian mobile numbers arrive with or without the country code.
  const withCc = digits.length === 10 ? `91${digits}` : digits;
  const text = `Hi ${lead.name}, this is ${SITE.name} about your ${
    EVENT_LABELS[lead.event_type] ?? "event"
  } enquiry.`;
  return `https://wa.me/${withCc}?text=${encodeURIComponent(text)}`;
}

function when(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Hours since the enquiry arrived — drives the "needs a reply" warning. */
function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

export function LeadsTable({
  leads,
  counts,
  sources,
  activeStatus,
  activeSource,
  total,
}: {
  leads: Inquiry[];
  counts: Record<string, number>;
  sources: string[];
  activeStatus: string;
  activeSource: string;
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  // Search narrows whatever the status/source chips already loaded.
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? leads.filter((l) =>
        [l.name, l.phone, l.email, l.event_location].some((v) => v?.toLowerCase().includes(needle)),
      )
    : leads;

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`/admin${params.toString() ? `?${params}` : ""}`);
  }

  function changeStatus(id: string, status: string) {
    setError("");
    startTransition(async () => {
      try {
        await updateLeadStatus(id, status);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update.");
      }
    });
  }

  function remove(id: string, name: string) {
    if (!confirm(`Delete the enquiry from ${name}? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteLead(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete.");
      }
    });
  }

  if (total === 0) {
    return (
      <div className="adm-empty">
        <p className="h3">No enquiries yet</p>
        <p className="note">
          When someone submits the form on the site, they appear here straight away — name,
          phone, date, venue and what they need.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="adm-filters">
        <input
          className="adm-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, venue or email"
          aria-label="Search leads"
        />
        <div className="chips">
          <button
            className={`chip${activeStatus === "all" ? " is-on" : ""}`}
            onClick={() => setFilter("status", "all")}
          >
            All {total}
          </button>
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              className={`chip${activeStatus === s ? " is-on" : ""}`}
              onClick={() => setFilter("status", s)}
            >
              {STATUS_LABELS[s]} {counts[s] ?? 0}
            </button>
          ))}
        </div>

        {sources.length > 0 && (
          <div className="chips">
            <button
              className={`chip${!activeSource ? " is-on" : ""}`}
              onClick={() => setFilter("source", "")}
            >
              Any source
            </button>
            {sources.map((s) => (
              <button
                key={s}
                className={`chip${activeSource === s ? " is-on" : ""}`}
                onClick={() => setFilter("source", s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="note adm-none">Nothing matches that {q ? "search" : "filter"}.</p>
      ) : (
        <ul className="leads">
          {shown.map((lead, i) => {
            const isOpen = open === lead.id;
            const stale = lead.status === "new" && hoursSince(lead.created_at) > 48;

            return (
              <li
                key={lead.id}
                className={`lead s-edge-${lead.status}${isOpen ? " is-open" : ""}`}
                style={{ "--i": i } as CSSProperties}
              >
                <button
                  className="lead-row"
                  onClick={() => setOpen(isOpen ? null : lead.id)}
                  aria-expanded={isOpen}
                >
                  <span className="lead-who">
                    <b>{lead.name}</b>
                    <span className="lead-meta">
                      {EVENT_LABELS[lead.event_type] ?? lead.event_type}
                      {lead.event_location ? ` · ${lead.event_location}` : ""}
                      {lead.guest_count ? ` · ${lead.guest_count} guests` : ""}
                    </span>
                  </span>

                  <span className="lead-when">
                    {when(lead.created_at)}
                    {stale && (
                      <span className="lead-stale" title="Over 48 hours with no reply">
                        needs reply
                      </span>
                    )}
                  </span>

                  <span className={`lead-status s-${lead.status}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </button>

                {isOpen && (
                  <div className="lead-body">
                    <dl className="lead-facts">
                      <div>
                        <dt>Phone</dt>
                        <dd>
                          <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a>
                        </dd>
                      </div>
                      {lead.email && (
                        <div>
                          <dt>Email</dt>
                          <dd>
                            <a href={`mailto:${lead.email}`}>{lead.email}</a>
                          </dd>
                        </div>
                      )}
                      {lead.event_date && (
                        <div>
                          <dt>Event date</dt>
                          <dd>
                            {new Date(lead.event_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </dd>
                        </div>
                      )}
                      {lead.services_needed?.length > 0 && (
                        <div>
                          <dt>Needs</dt>
                          <dd>
                            {lead.services_needed.map((n) => NEED_LABELS[n] ?? n).join(", ")}
                          </dd>
                        </div>
                      )}
                      {lead.referral_source && (
                        <div>
                          <dt>Came from</dt>
                          <dd>{lead.referral_source}</dd>
                        </div>
                      )}
                      {lead.quoted_at && (
                        <div>
                          <dt>Quoted</dt>
                          <dd>{when(lead.quoted_at)}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Consent</dt>
                        <dd>
                          {lead.consent_given
                            ? `Given${lead.privacy_version ? ` · notice ${lead.privacy_version}` : ""}`
                            : "Not recorded"}
                        </dd>
                      </div>
                    </dl>

                    {lead.message && <p className="lead-msg">{lead.message}</p>}

                    <div className="lead-actions">
                      <a className="btn btn-primary" href={waHref(lead)} target="_blank" rel="noopener noreferrer">
                        <ChatIcon />
                        WhatsApp
                      </a>
                      <a className="btn btn-ghost" href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>
                        <PhoneIcon />
                        Call
                      </a>
                      {lead.email && (
                        <a className="btn btn-ghost" href={`mailto:${lead.email}`}>
                          <MailIcon />
                          Email
                        </a>
                      )}

                      <label className="lead-set">
                        <span className="sr-only">Status</span>
                        <select
                          value={lead.status}
                          disabled={pending}
                          onChange={(e) => changeStatus(lead.id, e.target.value)}
                        >
                          {STATUS_FLOW.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        className="lead-del"
                        onClick={() => remove(lead.id, lead.name)}
                        disabled={pending}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
