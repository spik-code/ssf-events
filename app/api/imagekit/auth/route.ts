import { NextResponse } from "next/server";
import crypto from "crypto";
import { isAdmin } from "@/lib/supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Signature endpoint for secure client-side ImageKit uploads.
 *
 * Admin-only: without this gate anyone could mint an upload signature and dump
 * files into the media library. The private key never reaches the browser —
 * only a short-lived token/signature pair does.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey || privateKey === "REPLACE_ME") {
    return NextResponse.json(
      { error: "IMAGEKIT_PRIVATE_KEY is not set." },
      { status: 503 },
    );
  }

  const token = crypto.randomUUID();
  // Short window: long enough to upload, short enough that a leaked signature
  // is near-useless.
  const expire = Math.floor(Date.now() / 1000) + 10 * 60;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  });
}
