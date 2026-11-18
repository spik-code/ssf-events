"use client";

import { useState, useTransition } from "react";
import { addExpense, deleteExpense } from "@/app/admin/(dash)/expenses/actions";

export function ExpenseForm({ bookings }: { bookings: { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [f, setF] = useState({ label: "", vendor: "", amount: 0, spent_on: "", booking_id: "" });

  function submit() {
    setError("");
    start(async () => {
      try {
        await addExpense(f);
        setF({ ...f, label: "", vendor: "", amount: 0 });
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="adm-form">
      <div className="field"><label>What was it for</label><input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></div>
      <div className="field"><label>Vendor</label><input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></div>
      <div className="field"><label>Amount (Rs.)</label><input type="number" inputMode="decimal" min="0" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} /></div>
      <div className="field"><label>Date</label><input type="date" value={f.spent_on} onChange={(e) => setF({ ...f, spent_on: e.target.value })} /></div>
      <div className="field">
        <label>Event (optional)</label>
        <select value={f.booking_id} onChange={(e) => setF({ ...f, booking_id: e.target.value })}>
          <option value="">General / not for one event</option>
          {bookings.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </div>
      {error && <p className="note" role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={pending} onClick={submit}>{pending ? "Saving…" : "Add expense"}</button>
    </div>
  );
}

export function DeleteExpense({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn btn-ghost" disabled={pending} aria-label="Delete expense" onClick={() => start(() => deleteExpense(id))}>
      ✕
    </button>
  );
}
