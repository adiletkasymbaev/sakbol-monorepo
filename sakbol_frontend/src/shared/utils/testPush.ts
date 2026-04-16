// Тестовый файл для проверки push-уведомлений
// Вызови в консоли браузера: window.testPush()

import { getPushSubscriptionStatus } from "../services/pushService";
import api from "../services/axios";
import { enablePushOnSiteEnter } from "../../modules/push/enablePush";

export function testPush() {
  console.log("=== PUSH NOTIFICATIONS TEST ===");
  console.log("1. Checking API connection...");
  
  api.get("/push/public-key/")
    .then(response => {
      console.log("✓ Public key received:", response.data.publicKey.slice(0, 30) + "...");
    })
    .catch(error => {
      console.error("✗ Failed to get public key:", error);
    });
  
  console.log("2. Checking subscription status...");
  getPushSubscriptionStatus()
    .then(status => {
      console.log("✓ Status:", status);
    })
    .catch(error => {
      console.error("✗ Failed to get status:", error);
    });
  
  console.log("3. Attempting to enable push...");
  enablePushOnSiteEnter()
    .then(() => {
      console.log("✓ Push enable attempt completed");
      return getPushSubscriptionStatus();
    })
    .then(status => {
      console.log("✓ Final status:", status);
      console.log("=== TEST COMPLETE ===");
    })
    .catch(error => {
      console.error("✗ Push enable failed:", error);
      console.error("=== TEST FAILED ===");
    });
}

// Делаем функцию глобальной
(window as any).testPush = testPush;
console.log("Push test loaded. Call window.testPush() in console to test.");
