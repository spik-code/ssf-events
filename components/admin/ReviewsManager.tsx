"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setReviewPublished,
  deleteReview,
  addDirectReview,
} from "@/app/admin/(dash)/reviews/actions";
import { StarRow, GoogleGlyph } from "../icons";
import type { Review } from "@/lib/types";

export function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ author_name: "", rating: 5, text: "", relative_time: "" });

  function toggle(id: string, next: boolean) {
    setError("");
    startTransition(async () => {
      try {
        await setReviewPublished(id, next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update.");
      }
    });
  }

  function remove(id: string, author: string) {
    if (!confirm(`Delete the review from ${author}?`)) return;
    startTransition(async () => {
      try {
        await deleteReview(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete.");
      }
    });
  }

  function create() {
    setError("");
    startTransition(async () => {
      try {
        await addDirectReview(form);
        setForm({ author_name: "", rating: 5, text: "", relative_time: "" });
        setAdding(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add.");
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

      <div className="adm-upload">
        <button className="btn btn-primary" onClick={() => setAdding(!adding)} type="button">
          {adding ? "Cancel" : "Add a customer quote"}
        </button>
        <p className="note">
          For praise a customer gave you directly — WhatsApp, a phone call, in person. Only add
          words someone actually said.
        </p>
      </div>

      {adding && (
        <div className="adm-form adm-add">
          <div className="field">
            <label htmlFor="r-name">Customer name</label>
            <input
              id="r-name"
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              placeholder="e.g. Lakshmi & Ravi"
            />
          </div>
          <div className="field">
            <label htmlFor="r-rating">Rating</label>
            <select
              id="r-rating"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="r-text">What they said</label>
            <textarea
              id="r-text"
              rows={3}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="r-when">When — optional</label>
            <input
              id="r-when"
              value={form.relative_time}
              onChange={(e) => setForm({ ...form, relative_time: e.target.value })}
              placeholder="e.g. last month"
            />
          </div>
          <button className="btn btn-primary" onClick={create} disabled={pending} type="button">
            Add quote
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="adm-empty">
          <p className="h3">Nothing yet</p>
          <p className="note">
            The site shows no reviews section at all until there is something real here — just an
            invitation to leave the first review.
          </p>
        </div>
      ) : (
        <ul className="adm-list">
          {reviews.map((r) => (
            <li key={r.id} className={r.is_published ? "" : "is-off"}>
              <div className="adm-rev-top">
                <StarRow rating={r.rating} />
                <b>{r.author_name}</b>
                {r.source === "google" && <GoogleGlyph />}
                {r.relative_time && <small>{r.relative_time}</small>}
              </div>
              <p className="adm-rev-text">{r.text}</p>
              <div className="adm-row-actions">
                <button
                  className={`adm-mini${r.is_published ? " on" : ""}`}
                  disabled={pending}
                  onClick={() => toggle(r.id, !r.is_published)}
                  type="button"
                >
                  {r.is_published ? "Live" : "Held"}
                </button>
                <button
                  className="adm-mini"
                  disabled={pending}
                  onClick={() => remove(r.id, r.author_name)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
