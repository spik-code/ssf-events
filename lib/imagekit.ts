/**
 * ImageKit URL helpers.
 *
 * Every gallery / portfolio image is stored in ImageKit and referenced by its
 * path (e.g. "/ssf/gallery/22_C3mwzlILf0Q.webp"). The database stores the path;
 * the UI builds a delivery URL with transformations here.
 */

const ENDPOINT = (
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/4pihrvfy8a"
).replace(/\/$/, "");

export interface IkTransform {
  width?: number;
  height?: number;
  quality?: number;
  crop?: "maintain_ratio" | "at_least" | "at_max" | "force" | "pad_resize";
  focus?: string;
  blur?: number;
}

/** Build a full ImageKit delivery URL from a stored path (or pass through an absolute URL). */
export function ik(path: string, t: IkTransform = {}): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const clean = path.startsWith("/") ? path : `/${path}`;
  const parts: string[] = [];
  if (t.width) parts.push(`w-${t.width}`);
  if (t.height) parts.push(`h-${t.height}`);
  parts.push(`q-${t.quality ?? 72}`);
  if (t.crop) parts.push(`c-${t.crop}`);
  if (t.focus) parts.push(`fo-${t.focus}`);
  if (t.blur) parts.push(`bl-${t.blur}`);
  parts.push("f-auto");

  return `${ENDPOINT}${clean}?tr=${parts.join(",")}`;
}

/** next/image custom loader — keeps every <Image> on ImageKit's CDN + transforms. */
export function imagekitLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return ik(src, { width, quality: quality ?? 72 });
}

export const IMAGEKIT_ENDPOINT = ENDPOINT;
