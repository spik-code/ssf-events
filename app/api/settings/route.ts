import { NextResponse } from "next/server";
import { getSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const revalidate = 300;

/** Public display settings as one keyed object (hero copy, metrics, contact). */
export async function GET() {
  return NextResponse.json(await getSettings());
}
