export async function registerSw() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.warn("SW register failed:", e);
  }
}