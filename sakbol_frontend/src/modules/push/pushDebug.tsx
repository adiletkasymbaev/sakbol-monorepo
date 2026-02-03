import { useEffect } from "react";

export function PushDebug() {
  useEffect(() => {
    (async () => {
      console.log("permission:", Notification.permission);

      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        console.log("SW regs:", regs.map(r => r.scope));

        const ready = await navigator.serviceWorker.ready;
        console.log("SW ready scope:", ready.scope);

        const sub = await ready.pushManager.getSubscription();
        console.log("existing sub:", sub?.endpoint);
      }
    })();
  }, []);

  return null;
}