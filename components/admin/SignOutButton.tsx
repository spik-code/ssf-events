"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    // refresh() re-runs the server layout, which then redirects to login.
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      className={compact ? "adm-signout" : "btn btn-ghost"}
      onClick={signOut}
      disabled={busy}
      type="button"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
