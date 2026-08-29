"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ik } from "@/lib/imagekit";
import {
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from "@/app/admin/(dash)/gallery/actions";
import type { GalleryItem } from "@/lib/types";

const CATEGORIES = [
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "mandap", label: "Mandap" },
  { value: "haldi", label: "Haldi" },
  { value: "celebration", label: "Celebration" },
  { value: "decor", label: "Decor" },
];

interface IkAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Upload straight from the browser to ImageKit, signed by our server.
   * The file never passes through the Next.js server, so there is no body-size
   * limit to worry about.
   */
  async function upload(files: FileList) {
    setError("");
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}…`);

        const authRes = await fetch("/api/imagekit/auth");
        if (!authRes.ok) {
          const j = await authRes.json().catch(() => ({}));
          throw new Error(j.error || "Could not get an upload signature.");
        }
        const auth: IkAuth = await authRes.json();

        const form = new FormData();
        form.append("file", file);
        form.append("fileName", file.name.replace(/[^\w.-]/g, "_"));
        form.append("folder", "/ssf/gallery");
        form.append("useUniqueFileName", "true");
        form.append("publicKey", auth.publicKey);
        form.append("token", auth.token);
        form.append("expire", String(auth.expire));
        form.append("signature", auth.signature);

        const up = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: "POST",
          body: form,
        });
        const result = await up.json();
        if (!up.ok) throw new Error(result?.message || "ImageKit rejected the upload.");

        await addGalleryItem({
          imagekit_url: result.filePath,
          imagekit_file_id: result.fileId,
          caption: "",
          alt: "",
          category: "wedding",
          location: "",
          venue: "",
        });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function patch(id: string, p: Parameters<typeof updateGalleryItem>[1]) {
    setError("");
    startTransition(async () => {
      try {
        await updateGalleryItem(id, p);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  function remove(id: string, caption: string | null) {
    if (!confirm(`Delete "${caption || "this photo"}"? It is removed from ImageKit too.`)) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteGalleryItem(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete.");
      }
    });
  }

  return (
    <>
      <div className="adm-upload">
        <label className="btn btn-primary">
          {uploading ? progress || "Uploading…" : "Upload photos"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={uploading}
            onChange={(e) => e.target.files?.length && upload(e.target.files)}
          />
        </label>
        <p className="note">
          Straight to ImageKit. New photos arrive unpublished — add a caption, then tick Live.
        </p>
      </div>

      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="adm-empty">
          <p className="h3">No photos yet</p>
          <p className="note">Upload a few and they appear here.</p>
        </div>
      ) : (
        <div className="adm-grid">
          {items.map((item) => (
            <figure className={`adm-card${item.is_published ? "" : " is-draft"}`} key={item.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ik(item.imagekit_url, { width: 400, quality: 60 })}
                alt={item.alt || item.caption || ""}
                loading="lazy"
              />
              <figcaption className="adm-card-b">
                <input
                  className="adm-inline"
                  defaultValue={item.caption ?? ""}
                  placeholder="Caption"
                  onBlur={(e) => {
                    if (e.target.value !== (item.caption ?? "")) {
                      patch(item.id, { caption: e.target.value || null });
                    }
                  }}
                />
                <input
                  className="adm-inline small"
                  defaultValue={item.location ?? ""}
                  placeholder="Location"
                  onBlur={(e) => {
                    if (e.target.value !== (item.location ?? "")) {
                      patch(item.id, { location: e.target.value || null });
                    }
                  }}
                />
                <select
                  className="adm-inline small"
                  defaultValue={item.category}
                  onChange={(e) => patch(item.id, { category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="adm-row-actions">
                  <button
                    className={`adm-mini${item.is_published ? " on" : ""}`}
                    disabled={pending}
                    onClick={() => patch(item.id, { is_published: !item.is_published })}
                    type="button"
                  >
                    {item.is_published ? "Live" : "Draft"}
                  </button>
                  <button
                    className={`adm-mini${item.featured ? " on" : ""}`}
                    disabled={pending}
                    onClick={() => patch(item.id, { featured: !item.featured })}
                    type="button"
                  >
                    Featured
                  </button>
                  <button
                    className="adm-mini"
                    disabled={pending}
                    onClick={() => remove(item.id, item.caption)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
