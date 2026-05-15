# Быстрый старт - Native Android Integration

## Что было сделано

### 1. Уведомления ( foreground service )
- **Было**: Foreground notification показывался сразу при старте
- **Стало**: Notification скрыт по умолчанию, пользователь включает через настройки
- Разрешение на уведомления запрашивается при старте, но notification не показывается

### 2. Геолокация в WebView
- Нативный код отправляет координаты во фронтенд через `window.onNativeLocationUpdate()`
- Фронтенд отправляет координаты на бэкенд через API
- Поддержка fallback для браузера (navigator.geolocation)

### 3. SOS с голоса
- При распознавании ключевых слов (sos, помощь, скорая, пожар и т.д.)
- Немедленная отправка события во фронтенд
- Фронтенд отправляет запрос на бэкенд
- Показывается уведомление пользователю

## Файлы

### Android (Kotlin)
```
android/app/src/main/java/com/example/sakbol/
├── MainActivity.kt           # Обновлен - добавлен JS Interface
├── WebAppInterface.kt        # Новый - мост для WebView
└── voice/
    ├── VoskHotwordService.kt # Обновлен - SOS сразу во фронтенд
    └── AssetUtils.kt         # Новый - копирование Vosk модели
```

### Frontend (React)
```
sakbol_frontend/src/
├── shared/
│   ├── services/
│   │   ├── nativeBridge.ts   # Новый - мост с Android
│   │   └── nativeService.ts  # Новый - отправка на бэкенд
│   └── hooks/
│       └── useNative.ts      # Новый - React hooks
└── modules/
    ├── settings/
    │   ├── NativeSettings.tsx        # Новый - настройки
    │   └── NativeSettings.module.css # Новый - стили
    └── notifications/
        ├── SOSNotification.tsx        # Новый - экран SOS
        └── SOSNotification.module.css # Новый - стили
```

### Документация
```
docs/
└── NATIVE_INTEGRATION.md     # Полная документация
```

## Ключевые изменения в коде

### MainActivity.kt
```kotlin
// Добавлен JavaScript Interface
webAppInterface = WebAppInterface(this, webView)
webView.addJavascriptInterface(webAppInterface, "SakbolNative")

// Сервис запускается БЕЗ foreground notification
i.putExtra("startForeground", false)
```

### VoskHotwordService.kt
```kotlin
// Немедленная отправка SOS во фронтенд
private fun sendImmediateSOS(service: String, words: List<String>, timestamp: Long) {
    mainActivityRef?.get()?.runOnUiThread {
        val payload = JSONObject().apply {
            put("type", "emergency_immediate")
            put("service", service)
            put("words", words)
            put("timestamp", timestamp)
            put("priority", "immediate")
        }
        webView.evaluateJavascript(
            "window.onNativeSOS && window.onNativeSOS(${payload.toString()})", null
        )
    }
}
```

### nativeBridge.ts
```typescript
// Автоматическая инициализация
constructor() {
    this.isNative = this.detectNative();
    this.setupGlobalHandlers();
}

// Отправка событий в React
onSOS(callback: (data: SOSData) => void) {
    this.callbacks.onSOS = callback;
}
```

### nativeService.ts
```typescript
// Отправка SOS на бэкенд
async sendSOSToBackend(data: SOSData): Promise<void> {
    const token = localStorage.getItem('access_token');
    const payload: SOSSendData = {
        type: data.type,
        service: data.service,
        words: data.words,
        timestamp: data.timestamp,
        priority: data.priority || 'immediate',
        source: data.source,
        location: this.lastLocation ? {
            latitude: this.lastLocation.latitude,
            longitude: this.lastLocation.longitude,
        } : undefined,
    };
    
    await axios.post(this.sosEndpoint, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}
```

## Как использовать

### 1. Инициализация (автоматическая)
```typescript
// В App.tsx добавлен:
<SOSNotification />  // Показывает SOS экран
```

### 2. Настройки
```typescript
// Перейти по адресу /native-settings
import { NativeSettings } from './modules/settings/NativeSettings';

// Или использовать компонент
<NativeSettings />
```

### 3. React Hook
```typescript
import { useNative, useSOSListener } from './shared/hooks/useNative';

function MyComponent() {
  const { isNative, lastLocation, enableNotifications } = useNative();
  
  useSOSListener((data) => {
    console.log('SOS triggered:', data);
  });
  
  return <button onClick={enableNotifications}>Включить</button>;
}
```

## Поток данных

### SOS Flow
```
Голос -> Vosk -> VoskHotwordService -> window.onNativeSOS() -> 
nativeService.sendSOSToBackend() -> POST /api/sos/trigger/ -> 
Backend -> Показ уведомления
```

### Location Flow
```
GPS -> FusedLocationProvider -> window.onNativeLocationUpdate() ->
nativeService.sendLocationToBackend() -> POST /api/location/update/ ->
Backend
```

### Notification Flow
```
Пользователь -> /native-settings -> enableNotifications() ->
SakbolNative.enableVoiceNotifications() -> MainActivity ->
VoskHotwordService.startForeground() -> Notification показывается
```

## Тестирование

### В эмуляторе Android
```bash
# Собрать APK
./gradlew assembleDebug

# Установить
adb install app/build/outputs/apk/debug/app-debug.apk

# Смотреть логи
adb logcat -s VOSK:D MainActivity:D
```

### В браузере
```javascript
// Эмуляция SOS
window.onNativeSOS({
  type: 'emergency_immediate',
  service: 'ambulance',
  words: ['sos'],
  timestamp: Date.now(),
  priority: 'immediate',
  source: 'voice_recognition'
});

// Эмуляция геолокации
window.onNativeLocationUpdate({
  latitude: 55.7558,
  longitude: 37.6173,
  timestamp: Date.now()
});
```

## API Endpoints для бэкенда

Нужно добавить на бэкенде:

### POST /api/sos/trigger/
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sos_trigger(request):
    data = request.data
    # type: 'emergency_immediate' | 'emergency' | 'warning'
    # service: 'ambulance' | 'police' | 'fire' | 'unknown'
    # words: string[]
    # priority: 'immediate' | 'high' | 'normal'
    # location: {latitude, longitude} | null
    ...
```

### POST /api/location/update/
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def location_update(request):
    data = request.data
    # latitude, longitude, timestamp, accuracy, source
    ...
```

## Что делает каждый файл

| Файл | Назначение |
|------|-----------|
| MainActivity.kt | Главная активность Android, WebView, разрешения |
| WebAppInterface.kt | JavaScript Bridge между Android и WebView |
| VoskHotwordService.kt | Фоновый сервис распознавания голоса |
| nativeBridge.ts | TypeScript API для работы с Android |
| nativeService.ts | Отправка данных на бэкенд |
| useNative.ts | React hooks для компонентов |
| NativeSettings.tsx | UI для настроек нативного приложения |
| SOSNotification.tsx | UI для показа SOS уведомлений |

## Важно!

1. **Все запросы идут через фронтенд** - нативный код только отправляет события
2. **Уведомления отключены по умолчанию** - пользователь сам включает
3. **Геолокация отправляется автоматически** - если есть разрешение
4. **SOS отправляется мгновенно** - при распознавании ключевых слов

## Дальнейшие шаги

1. Добавить endpoints на бэкенд
2. Протестировать на реальном устройстве
3. Добавить fallback для iOS (если нужно)
4. Оптимизировать батарею (уменьшить частоту геолокации)
