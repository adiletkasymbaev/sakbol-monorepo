# Настройка Firebase Cloud Messaging (FCM)

## 1. Создание проекта в Firebase Console

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Нажмите "Add project" или выберите существующий
3. Включите **Cloud Messaging API**

## 2. Создание сервисного аккаунта

1. В Firebase Console перейдите в **Project Settings** (⚙️)
2. Откройте вкладку **Service accounts**
3. Нажмите **Generate new private key**
4. Скачайте JSON файл с ключами

## 3. Настройка на сервере

1. Скопируйте скачанный JSON файл в папку проекта:
   ```
   d:\Projects\sakbol\sakbol_backend\firebase_config.json
   ```

2. **ИЛИ** используйте пример:
   ```bash
   cp firebase_config.json.example firebase_config.json
   ```
   И заполните его данными из скачанного JSON.

## 4. Установка зависимостей

```bash
cd d:\Projects\sakbol\sakbol_backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

## 5. Проверка работы

Проверьте, что Firebase инициализируется:
```bash
python manage.py shell
>>> from push.service import get_firebase_app
>>> app = get_firebase_app()
>>> print(app)
```

## API Endpoints

### Web Push (браузер)
- `GET /push/public-key/` — получить публичный ключ VAPID
- `POST /push/subscribe/` — сохранить подписку браузера

### FCM (мобильные приложения)
- `POST /push/fcm/register/` — зарегистрировать FCM токен
- `GET /push/fcm/devices/` — список устройств
- `POST /push/fcm/unregister/` — отписаться от уведомлений

## Пример регистрации FCM токена (Flutter/Dart)

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> registerFCMToken() async {
  final messaging = FirebaseMessaging.instance;
  final token = await messaging.getToken();
  
  if (token != null) {
    await http.post(
      Uri.parse('$apiUrl/push/fcm/register/'),
      headers: {'Authorization': 'Bearer $accessToken'},
      body: {
        'registration_id': token,
        'device_type': 'android', // или 'ios'
      },
    );
  }
}
```

## Пример регистрации Web Push (JavaScript)

```javascript
// 1. Получить публичный ключ
const { publicKey } = await fetch('/push/public-key/').then(r => r.json());

// 2. Подписаться на push
const subscription = await navigator.serviceWorker.ready
  .pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  });

// 3. Отправить подписку на сервер
await fetch('/push/subscribe/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
    auth: arrayBufferToBase64(subscription.getKey('auth')),
  }),
});
```
