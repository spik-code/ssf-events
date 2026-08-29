"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateSetting,
  updateService,
  addService,
  deleteService,
} from "@/app/admin/(dash)/content/actions";
import type { Service } from "@/lib/types";

/** Text settings that are safe to edit as plain single-line/multi-line strings. */
const TEXT_SETTINGS: { key: string; label: string; multiline?: boolean; help?: string }[] = [
  { key: "hero_headline", label: "Hero headline", help: "Split on the first '. ' — the second sentence is styled in the accent script." },
  { key: "hero_subcopy", label: "Hero sub-copy", multiline: true },
  { key: "contact_phone", label: "Phone (displayed)" },
  { key: "whatsapp_number", label: "WhatsApp number", help: "Digits only, with country code. e.g. 919353568207" },
  { key: "contact_email", label: "Email" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "google_reviews_url", label: "Google review link" },
  { key: "google_maps_url", label: "Google Maps link" },
];

export function ContentEditor({
  services,
  settings,
}: {
  services: Service[];
  settings: Record<string, unknown>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  function saveSetting(key: string, value: string) {
    setError("");
    startTransition(async () => {
      try {
        await updateSetting(key, value);
        setSaved(key);
        setTimeout(() => setSaved(null), 2500);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  function saveService(id: string, patch: Parameters<typeof updateService>[1]) {
    setError("");
    startTransition(async () => {
      try {
        await updateService(id, patch);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  function create() {
    setError("");
    startTransition(async () => {
      try {
        await addService(newName, newDesc);
        setNewName("");
        setNewDesc("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add.");
      }
    });
  }

  function remove(id: string, name: string) {
    if (!confirm(`Delete the "${name}" service?`)) return;
    startTransition(async () => {
      try {
        await deleteService(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete.");
      }
    });
  }

  return (
    <>
      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}

      <section className="adm-sec">
        <h2>Site text</h2>
        <div className="adm-form">
          {TEXT_SETTINGS.map((s) => {
            const current = typeof settings[s.key] === "string" ? (settings[s.key] as string) : "";
            return (
              <div className="field" key={s.key}>
                <label htmlFor={`s-${s.key}`}>{s.label}</label>
                {s.multiline ? (
                  <textarea
                    id={`s-${s.key}`}
                    defaultValue={current}
                    onBlur={(e) => e.target.value !== current && saveSetting(s.key, e.target.value)}
                  />
                ) : (
                  <input
                    id={`s-${s.key}`}
                    defaultValue={current}
                    onBlur={(e) => e.target.value !== current && saveSetting(s.key, e.target.value)}
                  />
                )}
                <small className="adm-help">
                  {saved === s.key ? <span className="adm-ok">Saved</span> : s.help}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="adm-sec">
        <h2>Services</h2>
        <ul className="adm-list">
          {services.map((svc) => (
            <li key={svc.id} className={svc.is_active ? "" : "is-off"}>
              <input
                className="adm-inline"
                defaultValue={svc.name}
                onBlur={(e) => e.target.value !== svc.name && saveService(svc.id, { name: e.target.value })}
              />
              <textarea
                className="adm-inline small"
                defaultValue={svc.description}
                rows={2}
                onBlur={(e) =>
                  e.target.value !== svc.description &&
                  saveService(svc.id, { description: e.target.value })
                }
              />
              <div className="adm-row-actions">
                <button
                  className={`adm-mini${svc.is_active ? " on" : ""}`}
                  disabled={pending}
                  onClick={() => saveService(svc.id, { is_active: !svc.is_active })}
                  type="button"
                >
                  {svc.is_active ? "Active" : "Hidden"}
                </button>
                <button
                  className="adm-mini"
                  disabled={pending}
                  onClick={() => remove(svc.id, svc.name)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="adm-form adm-add">
          <div className="field">
            <label htmlFor="new-svc">Add a service</label>
            <input
              id="new-svc"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Service name"
            />
          </div>
          <div className="field">
            <label htmlFor="new-desc">Description</label>
            <textarea
              id="new-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              placeholder="What it covers"
            />
          </div>
          <button className="btn btn-primary" onClick={create} disabled={pending || !newName.trim()} type="button">
            Add service
          </button>
        </div>
      </section>
    </>
  );
}
