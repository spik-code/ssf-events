import { NextResponse } from "next/server";
import { getServices } from "@/lib/queries";

export const runtime = "nodejs";
export const revalidate = 300;

/** Public capability list — names and descriptions only, never prices. */
export async function GET() {
  return NextResponse.json({ services: await getServices() });
}
