package com.example.sakbol

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/**
 * JavaScript Interface для связи WebView с нативным кодом Android
 * Все запросы (SOS, уведомления, геолокация) обрабатываются через фронтенд
 */
class WebAppInterface(private val activity: MainActivity, private val webView: WebView) {

    /**
     * Запросить разрешение на уведомления
     * Вызывается из фронтенда
     */
    @JavascriptInterface
    fun requestNotificationPermission() {
        activity.runOnUiThread {
            activity.requestNotificationPermission()
        }
    }

    /**
     * Запросить разрешение на геолокацию
     * Вызывается из фронтенда
     */
    @JavascriptInterface
    fun requestLocationPermission() {
        activity.runOnUiThread {
            activity.ensureLocationPermsAndStart()
        }
    }

    /**
     * Включить foreground notification для голосового сервиса
     * Вызывается из фронтенда
     */
    @JavascriptInterface
    fun enableVoiceNotifications() {
        activity.runOnUiThread {
            activity.enableVoiceNotifications()
        }
    }

    /**
     * Отключить foreground notification для голосового сервиса
     * Вызывается из фронтенда
     */
    @JavascriptInterface
    fun disableVoiceNotifications() {
        activity.runOnUiThread {
            activity.disableVoiceNotifications()
        }
    }

    /**
     * Приостановить прослушивание голоса
     * Вызывается из фронтенда
     */
    @JavascriptInterface
    fun pauseVoiceListening() {
        activity.runOnUiThread {
            activity.pauseVoiceListening()
        }
    }

    /**
     * Возобновить прослушивание голоса
     * Вызывается из фронтенда
     */
    @JavascriptInterface
    fun resumeVoiceListening() {
        activity.runOnUiThread {
            activity.resumeVoiceListening()
        }
    }

    /**
     * Проверить статус разрешений
     * @return JSON строка со статусами разрешений
     */
    @JavascriptInterface
    fun checkPermissions(): String {
        val permissions = JSONObject().apply {
            put("microphone", activity.hasMicPerm())
            put("notifications", activity.hasPostNotifPerm())
            put("fineLocation", activity.checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED)
            put("coarseLocation", activity.checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED)
        }
        return permissions.toString()
    }

    /**
     * Получить текущую геолокацию (одноразовый запрос)
     * Результат отправляется через window.onNativeLocationUpdate
     */
    @JavascriptInterface
    fun requestCurrentLocation() {
        activity.runOnUiThread {
            activity.ensureLocationPermsAndStart()
            // Сразу запрашиваем текущую локацию и шлём во фронтенд
            activity.getCurrentLocationAndSend()
        }
    }

    /**
     * Отправить SOS сигнал немедленно
     * Вызывается нативным кодом при распознавании ключевых слов
     * Данные передаются во фронтенд для отправки на бэкенд
     */
    fun sendSOSToWebView(type: String, service: String, words: List<String>, timestamp: Long) {
        val payload = JSONObject().apply {
            put("type", type)
            put("service", service)
            put("words", words)
            put("timestamp", timestamp)
            put("source", "voice_recognition")
        }
        
        activity.runOnUiThread {
            webView.evaluateJavascript(
                "window.onNativeSOS && window.onNativeSOS(${payload.toString()})", null
            )
        }
    }

    /**
     * Отправить предупреждение во фронтенд
     */
    fun sendWarningToWebView(word: String, timestamp: Long) {
        val payload = JSONObject().apply {
            put("type", "warning")
            put("word", word)
            put("timestamp", timestamp)
            put("source", "voice_recognition")
        }
        
        activity.runOnUiThread {
            webView.evaluateJavascript(
                "window.onNativeWarning && window.onNativeWarning(${payload.toString()})", null
            )
        }
    }
}
