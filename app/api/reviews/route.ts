import { NextResponse } from "next/server";
import { getReviews, averageRating } from "@/lib/queries";

export const runtime = "nodejs";
export const revalidate = 300;

/** Public reviews feed. Returns an empty list until real reviews exist. */
export async function GET() {
  const reviews = await getReviews();
  return NextResponse.json({
    reviews,
    count: reviews.length,
    average: averageRating(reviews),
  });
}
