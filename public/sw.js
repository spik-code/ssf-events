// Push-only worker: no caching, so owners always see live data.
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(d.title || "SSF Events", {
      body: d.body || "",
      icon: "/brand/icon-192.png",
      data: { url: d.url || "/admin" },
    }),
  );
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
