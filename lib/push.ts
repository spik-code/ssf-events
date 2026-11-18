import { setVapidDetails, sendNotification } from "web-push";
import { createServiceClient } from "@/lib/supabase/server";

/** Sends a notification to every subscribed owner device. Never throws. */
export async function pushToOwners(payload: { title: string; body: string; url?: string }) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const db = createServiceClient();
  if (!pub || !priv || !db) return;

  setVapidDetails(`mailto:${process.env.ENQUIRY_NOTIFICATION_EMAIL || "admin@example.com"}`, pub, priv);
  const { data } = await db.from("push_subscriptions").select("endpoint, subscription");
  await Promise.all(
    (data ?? []).map(async (row) => {
      try {
        await sendNotification(row.subscription, JSON.stringify(payload));
      } catch (err) {
        // 404/410 = device unsubscribed; drop it so we stop retrying.
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
      }
    }),
  );
}
