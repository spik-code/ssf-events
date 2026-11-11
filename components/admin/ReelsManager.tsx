"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ikVideo, ikPoster } from "@/lib/imagekit";
import { addReel, updateReel, deleteReel } from "@/app/admin/(dash)/reels/actions";
import { updateSetting } from "@/app/admin/(dash)/content/actions";
import type { ReelItem } from "@/lib/types";

interface IkAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

interface IkUploadResult {
  filePath: string;
  fileId: string;
  message?: string;
}

/** POST to ImageKit with upload progress — videos are big enough that fetch's silence is a problem. */
function uploadWithProgress(form: FormData, onProgress: (pct: number) => void) {
  return new Promise<IkUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: IkUploadResult | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body) resolve(body);
      else reject(new Error(body?.message || "ImageKit rejected the upload."));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check the connection and try again."));
    xhr.send(form);
  });
}

export function ReelsManager({ items }: { items: ReelItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // Only what was set during this visit; the saved value shows under Content.
  const [hero, setHero] = useState("");

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
        const label = files.length > 1 ? `Uploading ${i + 1} of ${files.length}` : "Uploading";
        setProgress(`${label}…`);

        const authRes = await fetch("/api/imagekit/auth");
        if (!authRes.ok) {
          const j = await authRes.json().catch(() => ({}));
          throw new Error(j.error || "Could not get an upload signature.");
        }
        const auth: IkAuth = await authRes.json();

        const form = new FormData();
        form.append("file", file);
        form.append("fileName", file.name.replace(/[^\w.-]/g, "_"));
        form.append("folder", "/ssf/reels");
        form.append("useUniqueFileName", "true");
        form.append("publicKey", auth.publicKey);
        form.append("token", auth.token);
        form.append("expire", String(auth.expire));
        form.append("signature", auth.signature);

        const result = await uploadWithProgress(form, (pct) => setProgress(`${label} ${pct}%`));

        await addReel({ imagekit_url: result.filePath, imagekit_file_id: result.fileId });
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

  function patch(id: string, p: Parameters<typeof updateReel>[1]) {
    setError("");
    startTransition(async () => {
      try {
        await updateReel(id, p);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  function setAsHero(path: string) {
    setError("");
    startTransition(async () => {
      try {
        await updateSetting("hero_video_url", path);
        setHero(path);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  function remove(id: string, caption: string | null) {
    if (!confirm(`Delete "${caption || "this clip"}"? It is removed from ImageKit too.`)) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteReel(id);
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
          {uploading ? progress || "Uploading…" : "Upload clips"}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            multiple
            hidden
            disabled={uploading}
            onChange={(e) => e.target.files?.length && upload(e.target.files)}
          />
        </label>
        <p className="note">
          Straight to ImageKit — keep this page open until it finishes. New clips arrive
          unpublished: add a caption, then tick Live. The cover is picked from the video
          automatically.
        </p>
      </div>

      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="adm-empty">
          <p className="h3">No clips yet</p>
          <p className="note">Upload a few and they appear here.</p>
        </div>
      ) : (
        <div className="adm-grid">
          {items.map((item) => (
            <figure className={`adm-card${item.is_published ? "" : " is-draft"}`} key={item.id}>
              <video
                src={ikVideo(item.imagekit_url)}
                poster={ikPoster(item.imagekit_url, item.poster_url, 400)}
                controls
                playsInline
                preload="none"
              />
              <figcaption className="adm-card-b">
                <input
                  className="adm-inline"
                  defaultValue={item.caption ?? ""}
                  placeholder="Caption, e.g. Reception · Kolar"
                  onBlur={(e) => {
                    if (e.target.value !== (item.caption ?? "")) {
                      patch(item.id, { caption: e.target.value || null });
                    }
                  }}
                />

                <div className="adm-row-actions">
                  <button
                    className={`adm-mini${item.is_published ? " on" : ""}`}
                    disabled={pending}
                    onClick={() => patch(item.id, { is_published: !item.is_published })}
                    type="button"
                  >
                    {item.is_published ? "Live" : "Draft"}
                  </button>
                  {/* Plays this clip, muted and looped, behind the home page hero.
                      Clear it again under Content → Hero video. */}
                  <button
                    className={`adm-mini${hero === item.imagekit_url ? " on" : ""}`}
                    disabled={pending}
                    onClick={() => setAsHero(item.imagekit_url)}
                    type="button"
                  >
                    {hero === item.imagekit_url ? "In hero" : "Use in hero"}
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
