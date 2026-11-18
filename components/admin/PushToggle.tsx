"use client";

import { useEffect, useState } from "react";
import { saveSubscription, removeSubscription } from "@/app/admin/(dash)/push-actions";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(b64: string) {
  const raw = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Registers the worker and turns new-enquiry alerts on/off for this device. */
export function PushToggle() {
  const [state, setState] = useState<"unsupported" | "off" | "on" | "blocked">("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((r) => r.pushManager.getSubscription())
      .then((s) => setState(s ? "on" : Notification.permission === "denied" ? "blocked" : "off"))
      .catch(() => {});
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await removeSubscription(existing.endpoint);
        await existing.unsubscribe();
        setState("off");
      } else if ((await Notification.requestPermission()) === "granted") {
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY!) });
        await saveSubscription(JSON.parse(JSON.stringify(sub)));
        setState("on");
      } else {
        setState("blocked");
      }
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") return null;
  return (
    <button className="adm-view" disabled={busy || state === "blocked"} onClick={toggle} title={state === "blocked" ? "Notifications are blocked in browser settings" : undefined}>
      {state === "on" ? "🔔 Alerts on" : state === "blocked" ? "🔕 Blocked" : "🔔 Turn on alerts"}
    </button>
  );
}
