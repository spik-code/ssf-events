"use server";

import { createSSRClient, isAdmin } from "@/lib/supabase/ssr";

export async function saveSubscription(sub: { endpoint: string }) {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  const supabase = await createSSRClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, subscription: sub });
  if (error) throw new Error(error.message);
}

export async function removeSubscription(endpoint: string) {
  if (!(await isAdmin())) throw new Error("Not authorised.");
  const supabase = await createSSRClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
