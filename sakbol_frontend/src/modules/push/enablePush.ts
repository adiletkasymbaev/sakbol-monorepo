import api from "../../shared/services/axios";
import { pushService } from "../../shared/services/pushService";
import { registerSw } from "./registerSw";

type PushSubDTO = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function urlBase64ToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getVapidPublicKey(): Promise<string> {
  // Должно вернуть { publicKey: "B...." }
  const { data } = await api.get("/push/public-key/");
  if (!data?.publicKey || typeof data.publicKey !== "string") {
    throw new Error("Backend did not return publicKey");
  }
  return data.publicKey;
}

function subToDto(sub: PushSubscription): PushSubDTO {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
  };
}

async function ensureSubscribed(vapidPublicKey: string): Promise<PushSubDTO> {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker not supported");
  if (!("PushManager" in window)) throw new Error("Push API not supported");

  // гарантируем, что SW зарегистрирован
  await registerSw();

  // ждём активный SW
  const reg = await navigator.serviceWorker.ready;

  // 1) если подписка уже есть — проверим, подходит ли она под текущий public key
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    try {
      // Проверка: совпадает ли applicationServerKey (VAPID public key)
      // options.applicationServerKey может быть ArrayBuffer/Uint8Array
      const opts = existing.options?.applicationServerKey;
      if (opts) {
        const a = new Uint8Array(
          opts instanceof ArrayBuffer ? opts : (opts as ArrayBufferLike)
        );
        const b = urlBase64ToUint8Array(vapidPublicKey);

        const same =
          a.length === b.length && a.every((v, i) => v === b[i]);

        if (!same) {
          // ключ поменялся → старую подписку надо удалить
          await existing.unsubscribe();
        } else {
          // ключ тот же → используем существующую подписку
          return subToDto(existing);
        }
      } else {
        // на всякий — если нет applicationServerKey, лучше пересоздать
        await existing.unsubscribe();
      }
    } catch {
      // если не смогли сравнить — пересоздадим
      await existing.unsubscribe();
    }
  }

  // 2) создаём новую подписку
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  return subToDto(sub);
}

/**
 * Вызови при старте приложения.
 * Поведение:
 * - если permission granted → подписка/отправка на бэк
 * - если default/denied → пытаемся requestPermission() каждый заход (как ты хотел)
 */
export async function enablePushOnSiteEnter() {
  if (!("Notification" in window)) return;

  try {
    // хотим "спрашивать каждый заход", если не granted
    if (Notification.permission !== "granted") {
      const res = await Notification.requestPermission();
      if (res !== "granted") return; // denied/default — выходим
    }

    // permission granted
    const vapidPublicKey = await getVapidPublicKey();
    const dto = await ensureSubscribed(vapidPublicKey);

    // отправляем на бэк (у тебя pushService.subscribe)
    await pushService.subscribe(dto);
  } catch (e) {
    console.warn("enablePushOnSiteEnter error:", e);
  }
}