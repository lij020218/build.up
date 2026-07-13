/**
 * Found.One service worker — 웹 푸시 수신 (Phase A, 2026-07-12)
 * 발송: /api/push/dispatch (web-push VAPID) → 여기서 표시.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Found.One", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Found.One";
  const options = {
    body: data.body || "",
    icon: "/found-one-appicon.svg",
    badge: "/found-one-spiral.svg",
    data: { url: data.url || "/current" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/current";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ("focus" in win) {
          win.navigate(url);
          return win.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
