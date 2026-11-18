import { redirect } from "next/navigation";
import { createSSRClient, getUser, isAdmin } from "@/lib/supabase/ssr";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * The authorisation gate for every admin page except login.
 *
 * Three independent checks protect this area:
 *   1. proxy.ts       — redirects signed-out requests before any page renders
 *   2. this layout    — signed in is not the same as authorised; check the roster
 *   3. Postgres RLS   — even with a session, queries only return admin rows
 */
export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/admin/login");

  // Roster check and the badge count are independent: run them together.
  const supabase = await createSSRClient();
  const [admin, { count }] = await Promise.all([
    isAdmin(),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);
  if (!admin) {
    return (
      <main className="auth">
        <div className="auth-card">
          <h1 className="h2">Not an admin</h1>
          <p className="note">
            You&rsquo;re signed in as <b>{user.email}</b>, but that address isn&rsquo;t on the{" "}
            {SITE.name} admin roster, so there&rsquo;s nothing here for you.
          </p>
          <SignOutButton />
        </div>
      </main>
    );
  }

  // `count` (unanswered enquiries) is the badge on the Leads tab, from every page.
  return (
    <div className="adm">
      <AdminNav email={user.email ?? ""} newLeads={count ?? 0} />
      <main className="adm-main">{children}</main>
    </div>
  );
}
