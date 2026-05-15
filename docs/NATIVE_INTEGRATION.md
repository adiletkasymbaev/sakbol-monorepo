# Native Android Integration

Документация по интеграции нативного Android приложения с фронтендом.

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Android WebView                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              JavaScript Interface                    │   │
│  │            (WebAppInterface.kt)                      │   │
│  └────────────────┬────────────────────────────────────┘   │
│                   │                                         │
│           window.SakbolNative                               │
│                   │                                         │
│  ┌────────────────▼────────────────────────────────────┐   │
│  │              Frontend (React)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │   │
│  │  │Native Bridge│  │NativeService│  │   useNative  │ │   │
│  │  └─────────────┘  └─────────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP API
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Django)                         │
│              /api/sos/trigger/                              │
│              /api/location/update/                          │
└─────────────────────────────────────────────────────────────┘
```

## Основные компоненты

### Android (Kotlin)

#### 1. MainActivity.kt
- Создает WebView и загружает фронтенд
- Добавляет JavaScript Interface (`SakbolNative`)
- Управляет разрешениями (микрофон, уведомления, геолокация)
- Запускает VoskHotwordService

#### 2. WebAppInterface.kt
JavaScript Interface для связи с фронтендом:
- `requestNotificationPermission()` - запрос разрешения на уведомления
- `requestLocationPermission()` - запрос разрешения на геолокацию
- `enableVoiceNotifications()` - включить foreground notification
- `disableVoiceNotifications()` - отключить foreground notification
- `pauseVoiceListening()` - приостановить прослушивание
- `resumeVoiceListening()` - возобновить прослушивание
- `checkPermissions()` - проверить текущие разрешения

#### 3. VoskHotwordService.kt
Сервис распознавания голоса:
- Работает в фоне (foreground service)
- Распознает ключевые слова с помощью Vosk
- Отправляет события во фронтенд через WebView
- НЕ отправляет запросы на бэкенд напрямую

### Frontend (React/TypeScript)

#### 1. nativeBridge.ts
Основной мост для связи с Android:
```typescript
import { nativeBridge } from './nativeBridge';

// Проверить, нативное ли приложение
if (nativeBridge.isNativeApp()) {
  // ...
}

// Запросить разрешения
nativeBridge.requestNotificationPermission();
nativeBridge.requestLocationPermission();

// Подписаться на события
nativeBridge.onSOS((data) => {
  console.log('SOS:', data);
});

nativeBridge.onLocationUpdate((data) => {
  console.log('Location:', data.latitude, data.longitude);
});
```

#### 2. nativeService.ts
Сервис для отправки данных на бэкенд:
```typescript
import { nativeService } from './nativeService';

// Инициализация (вызывается автоматически)
nativeService.initialize();

// Ручная отправка SOS
await nativeService.sendSOSToBackend({
  type: 'emergency',
  service: 'ambulance',
  words: ['скорая', 'помощь'],
  timestamp: Date.now(),
  priority: 'immediate',
  source: 'voice_recognition'
});
```

#### 3. useNative.ts
React Hook для работы с нативным функционалом:
```typescript
import { useNative, useSOSListener } from './useNative';

function MyComponent() {
  const { 
    isNative, 
    lastLocation, 
    enableNotifications,
    permissions 
  } = useNative();

  useSOSListener((data) => {
    // Обработка SOS
  });

  return (
    <button onClick={enableNotifications}>
      Включить уведомления
    </button>
  );
}
```

## Ключевые слова для SOS

### Немедленный вызов (мгновенная отправка)
- `sos`, `эс о эс`, `сос`
- `отправь sos`, `отправить sos`
- `помогите`, `вызывайте`, `вызовите`

### Скорая помощь
- `скорая`, `скорую`, `скорая помощь`
- `больной`, `плохо`, `врач`

### Полиция
- `полиция`, `милиция`
- `преступление`, `грабитель`

### Пожарные
- `пожар`, `пожарные`, `горит`
- `огонь`, `пламя`, `дым`

### Предупреждения (без SOS)
- `всё готово`, `все готово`
- `чай остыл`, `ключи у тебя`
- `пора домой`, `уже выехала`
- `проверю позже`, `давай завтра`
- `на месте`, `собака спит`, `где документы`

## API Endpoints

### POST /api/sos/trigger/
Отправка SOS сигнала.

**Request:**
```json
{
  "type": "emergency_immediate",
  "service": "ambulance",
  "words": ["sos", "помогите"],
  "timestamp": 1699999999999,
  "priority": "immediate",
  "source": "voice_recognition",
  "location": {
    "latitude": 55.7558,
    "longitude": 37.6173
  }
}
```

### POST /api/location/update/
Отправка геолокации.

**Request:**
```json
{
  "latitude": 55.7558,
  "longitude": 37.6173,
  "timestamp": 1699999999999,
  "accuracy": 10,
  "source": "native_gps"
}
```

## Жизненный цикл

### При старте приложения
1. `MainActivity.onCreate()` создает WebView
2. Добавляется JavaScript Interface
3. Загружается фронтенд (`https://mobie.sakbol.app/`)
4. Запрашиваются разрешения (микрофон, уведомления, геолокация)
5. Запускается `VoskHotwordService` (без foreground notification)

### При готовности фронтенда
1. `window.SakbolNativeReady()` вызывается из Android
2. `nativeService.initialize()` проверяет разрешения
3. При необходимости запрашивает недостающие разрешения

### При распознавании ключевых слов
1. `VoskHotwordService` распознает слово
2. Отправляет событие во фронтенд через `window.onNativeSOS()`
3. `nativeService` перехватывает событие
4. Отправляет HTTP запрос на бэкенд
5. Показывает уведомление пользователю

## Управление уведомлениями

По умолчанию foreground notification отключен. Пользователь может включить его в настройках:

```typescript
// Включить foreground notification
nativeService.enableNotifications();

// Отключить foreground notification
nativeService.disableNotifications();
```

## Безопасность

1. Все запросы к бэкенду требуют Bearer токен
2. SOS сигналы отправляются только через фронтенд
3. Геолокация отправляется только с согласия пользователя
4. Разрешения запрашиваются явно

## Отладка

### Android Studio
```bash
# Логи Vosk
adb logcat -s VOSK:D

# Все логи приложения
adb logcat -s MainActivity:D WebAppInterface:D VoskHotwordService:D
```

### Browser Console
```javascript
// Проверить доступность нативного моста
console.log(window.SakbolNative);

// Проверить текущие разрешения
console.log(JSON.parse(window.SakbolNative.checkPermissions()));
```

## Тестирование

### В браузере (эмуляция)
```typescript
// В консоли браузера
window.onNativeSOS({
  type: 'emergency_immediate',
  service: 'ambulance',
  words: ['sos'],
  timestamp: Date.now(),
  priority: 'immediate',
  source: 'voice_recognition'
});
```

### В Android эмуляторе
1. Разрешить микрофон в настройках эмулятора
2. Включить звук с компьютера
3. Произнести ключевые слова

## Известные ограничения

1. Vosk требует загрузки модели (~50MB) при первом запуске
2. Распознавание работает только на русском языке
3. Необходим доступ к микрофону для работы голосового SOS
4. Foreground notification требует Android 8.0+ (API 26)

## Поддержка

При возникновении проблем:
1. Проверить логи в Android Studio
2. Убедиться что все разрешения granted
3. Проверить подключение к интернету
4. Убедиться что токен авторизации валиден
