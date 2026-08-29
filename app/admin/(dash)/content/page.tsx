import { createSSRClient } from "@/lib/supabase/ssr";
import { ContentEditor } from "@/components/admin/ContentEditor";
import type { Service } from "@/lib/types";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const supabase = await createSSRClient();

  const [{ data: services }, { data: settingRows }] = await Promise.all([
    supabase.from("services").select("*").order("order_index", { ascending: true }),
    supabase.from("site_settings").select("key, value"),
  ]);

  const settings: Record<string, unknown> = {};
  for (const r of (settingRows ?? []) as { key: string; value: unknown }[]) {
    settings[r.key] = r.value;
  }

  return (
    <>
      <header className="adm-head">
        <h1 className="h2">Content</h1>
        <p className="note">
          Hero copy, contact details and the service list. Changes show on the site within
          five minutes.
        </p>
      </header>

      <ContentEditor services={(services ?? []) as Service[]} settings={settings} />
    </>
  );
}
