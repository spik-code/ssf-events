"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDocument, deleteDocument, quotationToInvoice } from "@/app/admin/(dash)/documents/actions";
import { inr, totals, type Doc, type DocItem, type DocKind } from "@/lib/documents";
import { unwrap } from "@/lib/action-result";
import { sharePdf } from "@/lib/pdf";

export type DocDraft = Omit<Doc, "id" | "number" | "created_at"> & { id?: string; number?: string; created_at?: string };

export function DocEditor({ initial }: { initial: DocDraft }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [d, setD] = useState<DocDraft>(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof DocDraft>(k: K, v: DocDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const setItem = (i: number, patch: Partial<DocItem>) =>
    set("items", d.items.map((it, n) => (n === i ? { ...it, ...patch } : it)));
  const t = totals(d);
  const isInv = d.kind === "invoice";

  function run(fn: () => Promise<void>) {
    setError("");
    start(async () => {
      try {
        await fn();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  /** Saves, then reloads the saved row so the PDF carries its real number and date. */
  const save = async () => {
    const id = unwrap(await saveDocument({ ...d, kind: d.kind as DocKind }));
    if (!d.id) router.replace(`/admin/documents/${id}`);
    else router.refresh();
    return id;
  };

  return (
    <div className="adm-form" style={{ maxWidth: 760 }}>
      <div className="field">
        <label>Client name</label>
        <input value={d.client_name} onChange={(e) => set("client_name", e.target.value)} />
      </div>
      <div className="field">
        <label>Phone</label>
        <input inputMode="tel" value={d.client_phone ?? ""} onChange={(e) => set("client_phone", e.target.value)} />
      </div>
      <div className="field">
        <label>Event date</label>
        <input type="date" value={d.event_date ?? ""} onChange={(e) => set("event_date", e.target.value || null)} />
      </div>
      <div className="field">
        <label>Venue</label>
        <input value={d.venue ?? ""} onChange={(e) => set("venue", e.target.value)} />
      </div>

      <h2 className="h3">Items</h2>
      {d.items.map((it, i) => (
        <div key={i} className="doc-item">
          <input placeholder="Item / description" value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} />
          <input aria-label="Quantity" type="number" inputMode="decimal" min="0" value={it.qty || ""} placeholder="Qty" onChange={(e) => setItem(i, { qty: Number(e.target.value) })} />
          <input aria-label="Rate" type="number" inputMode="decimal" min="0" value={it.rate || ""} placeholder="Rate" onChange={(e) => setItem(i, { rate: Number(e.target.value) })} />
          <b>{inr(it.qty * it.rate)}</b>
          <button type="button" className="btn btn-ghost" aria-label="Remove item" onClick={() => set("items", d.items.filter((_, n) => n !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost" onClick={() => set("items", [...d.items, { desc: "", qty: 1, rate: 0 }])}>
        + Add item
      </button>

      <div className="field">
        <label>Discount (Rs.)</label>
        <input type="number" inputMode="decimal" min="0" value={d.discount || ""} onChange={(e) => set("discount", Number(e.target.value))} />
      </div>
      {isInv && (
        <div className="field">
          <label>Received so far (Rs.)</label>
          <input type="number" inputMode="decimal" min="0" value={d.paid || ""} onChange={(e) => set("paid", Number(e.target.value))} />
        </div>
      )}
      <div className="field">
        <label>Notes (printed above the terms)</label>
        <textarea value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <p className="doc-total">
        <span>Subtotal {inr(t.subtotal)}</span>
        <b>Total {inr(t.total)}</b>
        {isInv ? <b>Balance {inr(t.balance)}</b> : <span>Advance (50%) {inr(t.total / 2)}</span>}
      </p>

      {error && <p className="note" role="alert" style={{ color: "var(--red, #b4322a)" }}>{error}</p>}

      <div className="adm-row-actions">
        <button className="btn btn-primary" disabled={pending} onClick={() => run(async () => void (await save()))}>
          {pending ? "Working…" : "Save"}
        </button>
        {d.id && (
          <button
            className="btn btn-ghost"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await save();
                // Re-read so the PDF has the server's number and created_at.
                const { createClient } = await import("@/lib/supabase/browser");
                const { data } = await createClient().from("documents").select("*").eq("id", d.id!).single();
                if (data) await sharePdf(data as Doc);
              })
            }
          >
            Share PDF
          </button>
        )}
        {d.id && d.kind === "quotation" && (
          <button className="btn btn-ghost" disabled={pending} onClick={() => run(async () => router.push(`/admin/documents/${unwrap(await quotationToInvoice(d.id!))}`))}>
            Make bill
          </button>
        )}
        {d.id && (
          <button
            className="btn btn-ghost"
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this document?")) return;
              run(async () => {
                unwrap(await deleteDocument(d.id!));
                router.push("/admin/documents");
              });
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
