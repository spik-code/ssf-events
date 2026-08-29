import { NextResponse } from "next/server";
import { getGallery } from "@/lib/queries";

export const runtime = "nodejs";
export const revalidate = 300;

/** Public gallery feed. `?category=` filters; always returns an array. */
export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category") ?? undefined;
  const items = await getGallery(category);
  return NextResponse.json({ items });
}
