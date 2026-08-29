"use client";

/**
 * Global next/image loader. Configured via `images.loaderFile` in next.config.mjs
 * so every <Image> — in Server and Client Components alike — is delivered by
 * ImageKit with width/quality transformations, without passing a function prop
 * across the server/client boundary.
 *
 * Local paths (/media/..., /brand/...) are left alone and served by Next.
 */

const ENDPOINT = (
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/4pihrvfy8a"
).replace(/\/$/, "");

export default function imagekitLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;

  // Anything not under an ImageKit folder is a local public/ asset.
  if (!src.startsWith("/ssf/")) return src;

  const tr = [`w-${width}`, `q-${quality ?? 72}`, "f-auto"].join(",");
  return `${ENDPOINT}${src}?tr=${tr}`;
}
