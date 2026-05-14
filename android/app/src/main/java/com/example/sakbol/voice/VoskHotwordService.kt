package com.example.sakbol.voice

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.RecognitionListener
import org.vosk.android.SpeechService
import org.json.JSONObject
import java.io.File
import java.lang.ref.WeakReference
import java.util.ArrayDeque
import com.example.sakbol.MainActivity
import com.example.sakbol.WebAppInterface

class VoskHotwordService : Service(), RecognitionListener {

    companion object {
        var webViewRef: WeakReference<android.webkit.WebView>? = null
        var mainActivityRef: WeakReference<MainActivity>? = null
        private const val CH_ID = "vosk_hotword"
        private const val NOTIF_ID = 777
        private const val TAG = "VOSK"

        const val ACTION_PAUSE = "com.example.sakbol.PAUSE"
        const val ACTION_RESUME = "com.example.sakbol.RESUME"
        const val ACTION_ENABLE_NOTIFICATIONS = "com.example.sakbol.ENABLE_NOTIFICATIONS"
        const val ACTION_DISABLE_NOTIFICATIONS = "com.example.sakbol.DISABLE_NOTIFICATIONS"
    }

    private var model: Model? = null
    private var rec: Recognizer? = null
    private var speechService: SpeechService? = null
    private var paused = false
    private var notificationsEnabled = false

    // последнее общее срабатывание (для дебаунса)
    private var lastTriggerTs = 0L

    // cooldown для предупреждений и для экстренных вызовов (ms)
    private val WARNING_COOLDOWN = 2000L
    private val EMERGENCY_COOLDOWN = 3000L // Уменьшили для более быстрой реакции
    private var lastWarningTs = 0L
    private var lastEmergencyTs = 0L

    // НЕМЕДЛЕННАЯ отправка SOS при распознавании ключевых слов
    private val IMMEDIATE_SOS_WORDS = setOf(
        "sos", "эс о эс", "сос", "отправь sos", "отправить sos", 
        "помогите", "вызывайте", "вызовите"
    )

    // буфер последних совпадений ключевых слов (ключевое слово, группа, ts)
    private val recentHits: ArrayDeque<Hit> = ArrayDeque()
    private val MAX_BUFFER = 5
    private val MAX_GAP_MS = 5000L // максимальный интервал между словами, чтобы считать "подряд"

    data class Hit(val word: String, val group: String, val ts: Long)

    // наборы слов
    private val warningWords = setOf(
        "всё готово", "все готово", "проверю позже", "давай завтра",
        "пора домой", "на месте", "чай остыл", "ключи у тебя",
        "где документы", "собака спит", "уже выехала"
    )

    // группы для экстренных служб: слова, которые относятся к каждой группе
    private val ambulanceWords = setOf("скорая", "скорую", "скорая помощь", "больной", "плохо", "врач")
    private val policeWords = setOf("полиция", "милиция", "милицию", "позвоните милицию", "полицию", "преступление", "грабитель")
    private val fireWords = setOf("пожар", "пожарные", "горит", "огонь", "пламя", "дым")

    override fun onCreate() {
        super.onCreate()
        // Сервис запускается без foreground notification по умолчанию
        initVoskAndStart()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PAUSE -> if (!paused) {
                paused = true
                pauseListening()
                if (notificationsEnabled) updateNotification(isPaused = true)
            }
            ACTION_RESUME -> if (paused) {
                paused = false
                resumeListening()
                if (notificationsEnabled) updateNotification(isPaused = false)
            }
            ACTION_ENABLE_NOTIFICATIONS -> {
                notificationsEnabled = true
                startAsForeground()
                updateNotification(isPaused = paused)
            }
            ACTION_DISABLE_NOTIFICATIONS -> {
                notificationsEnabled = false
                stopForeground(STOP_FOREGROUND_REMOVE)
            }
        }
        
        // Обрабатываем extras для совместимости
        intent?.let {
            if (it.getBooleanExtra("startForeground", false) && !notificationsEnabled) {
                notificationsEnabled = true
                startAsForeground()
                updateNotification(isPaused = paused)
            }
            if (it.getBooleanExtra("stopForeground", false) && notificationsEnabled) {
                notificationsEnabled = false
                stopForeground(STOP_FOREGROUND_REMOVE)
            }
        }
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        try { speechService?.stop() } catch (_: Exception) {}
        try { speechService?.shutdown() } catch (_: Exception) {}
        try { rec?.close() } catch (_: Exception) {}
        try { model?.close() } catch (_: Exception) {}
        super.onDestroy()
    }

    /* ----------------- Notifications ----------------- */

    private fun startAsForeground() {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(CH_ID, "Voice SOS", NotificationManager.IMPORTANCE_LOW)
            nm.createNotificationChannel(ch)
        }
        startForeground(NOTIF_ID, buildNotification(isPaused = false))
    }

    private fun buildNotification(isPaused: Boolean): Notification {
        val pauseIntent = Intent(this, VoskHotwordService::class.java).apply { action = ACTION_PAUSE }
        val resumeIntent = Intent(this, VoskHotwordService::class.java).apply { action = ACTION_RESUME }

        val pausePI = PendingIntent.getService(
            this, 0, pauseIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val resumePI = PendingIntent.getService(
            this, 1, resumeIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CH_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Sakbol: Голосовой SOS")
            .setContentText(if (isPaused) "Прослушивание приостановлено" else "Слушаю ключевые слова…")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .apply {
                if (isPaused) {
                    addAction(android.R.drawable.ic_media_play, "Продолжить", resumePI)
                } else {
                    addAction(android.R.drawable.ic_media_pause, "Приостановить", pausePI)
                }
            }
            .build()
    }

    private fun updateNotification(isPaused: Boolean) {
        if (!notificationsEnabled) return
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID, buildNotification(isPaused))
    }

    /* ----------------- Vosk init / control ----------------- */

    private fun initVoskAndStart() {
        Thread {
            runCatching {
                val modelDir = File(filesDir, "vosk-ru-small")
                if (!File(modelDir, "conf").exists()) {
                    copyAssetDirToFiles(this, "models/ru", modelDir)
                }
                require(File(modelDir, "conf").exists()) { "Vosk model not found after copy" }

                model = Model(modelDir.absolutePath)

                val grammarJson = """
                    ["уже выехала",
                    "все готово",
                    "всё готово",
                    "чай остыл",
                    "где документы",
                    "ключи у тебя",
                    "давай завтра",
                    "проверю позже",
                    "на месте",
                    "собака спит",
                    "пора домой",
                    "сос","эс о эс",
                    "sos","отправь sos","отправить sos",
                    "помогите","вызывайте","вызовите",
                    "скорая","скорую","скорая помощь","больной","плохо","врач",
                    "полиция","милиция","преступление","грабитель",
                    "пожар","пожарные","горит","огонь","пламя","дым"
                ]
                """.trimIndent().replace("\n", "")
                rec = Recognizer(model, 16000.0f, grammarJson)

                resumeListening()
                Log.d(TAG, "Listening started")
            }.onFailure { e ->
                Log.e(TAG, "Init failed", e)
                stopSelf()
            }
        }.start()
    }

    private fun pauseListening() {
        try { speechService?.stop() } catch (_: Exception) {}
        try { speechService?.shutdown() } catch (_: Exception) {}
        speechService = null
        Log.d(TAG, "Listening paused")
    }

    private fun resumeListening() {
        if (rec == null || paused) return
        try {
            speechService = SpeechService(rec, 16000.0f)
            speechService?.startListening(this@VoskHotwordService)
            Log.d(TAG, "Listening resumed")
        } catch (e: Exception) {
            Log.e(TAG, "Resume failed", e)
        }
    }

    /* ----------------- RecognitionListener ----------------- */

    override fun onPartialResult(hypothesis: String?) {
        if (paused) return
        val word = runCatching { JSONObject(hypothesis ?: "").optString("partial") }
            .getOrDefault("").lowercase().trim()
        if (word.isNotEmpty()) Log.d(TAG, "partial=$word")
        checkTrigger(word)
    }

    override fun onResult(hypothesis: String?) {
        if (paused) return
        val text = runCatching { JSONObject(hypothesis ?: "").optString("text") }
            .getOrDefault("").lowercase().trim()
        Log.d(TAG, "final=$text")
        checkTrigger(text)
    }

    override fun onFinalResult(hypothesis: String?) {
        Log.d(TAG, "finalResult=$hypothesis")
    }

    override fun onError(e: Exception?) { Log.e(TAG, "onError", e) }

    override fun onTimeout() {
        if (!paused) {
            Log.w(TAG, "onTimeout -> restart listening")
            runCatching { speechService?.startListening(this) }
        }
    }

    /* ----------------- Trigger logic ----------------- */

    private fun checkTrigger(text: String) {
        if (text.isEmpty()) return

        val now = System.currentTimeMillis()
        // небольшой глобальный дебаунс (чтобы не шлёпать по каждой частичной строке)
        if (now - lastTriggerTs < 300) return
        lastTriggerTs = now

        // 1) Проверим НЕМЕДЛЕННЫЙ SOS
        for (w in IMMEDIATE_SOS_WORDS) {
            if (w in text) {
                if (now - lastEmergencyTs >= EMERGENCY_COOLDOWN) {
                    lastEmergencyTs = now
                    // НЕМЕДЛЕННАЯ отправка SOS во фронтенд
                    sendImmediateSOS("ambulance", listOf(w), now)
                    return // Сразу выходим после отправки экстренного сигнала
                }
            }
        }

        // 2) Проверим предупреждение
        for (w in warningWords) {
            if (w in text) {
                if (now - lastWarningTs >= WARNING_COOLDOWN) {
                    lastWarningTs = now
                    sendWarningToWeb(w, now)
                }
                break
            }
        }

        // 3) Проверим экстренные ключевые слова и буфер
        val foundGroup = detectGroup(text)
        if (foundGroup != null) {
            val matchedWord = foundGroup.second
            val groupName = foundGroup.first
            pushHit(matchedWord, groupName, now)
            checkEmergencyBuffer(now)
        } else {
            pruneOldHits(now)
        }
    }

    // возвращает Pair<group, matchedWord> или null
    private fun detectGroup(text: String): Pair<String, String>? {
        // проверяем каждую группу
        for (w in ambulanceWords) {
            if (w in text) return Pair("ambulance", w)
        }
        for (w in policeWords) {
            if (w in text) return Pair("police", w)
        }
        for (w in fireWords) {
            if (w in text) return Pair("fire", w)
        }
        return null
    }

    private fun pushHit(word: String, group: String, ts: Long) {
        recentHits.addLast(Hit(word, group, ts))
        if (recentHits.size > MAX_BUFFER) {
            recentHits.removeFirst()
        }
        Log.d(TAG, "pushHit: $word/$group at $ts; buffer=${recentHits.size}")
        pruneOldHits(ts)
    }

    private fun pruneOldHits(now: Long) {
        while (recentHits.isNotEmpty() && now - recentHits.first.ts > MAX_GAP_MS) {
            recentHits.removeFirst()
        }
    }

    private fun checkEmergencyBuffer(now: Long) {
        pruneOldHits(now)

        if (recentHits.size < 3) return

        // Берём последние 3 элемента
        val list = recentHits.toList()
        val size = list.size
        val last3 = list.subList(size - 3, size)

        val first = last3[0]
        val sameGroup = last3.all { it.group == first.group }
        val gapOk = (now - first.ts) <= MAX_GAP_MS

        if (sameGroup && gapOk) {
            if (now - lastEmergencyTs >= EMERGENCY_COOLDOWN) {
                lastEmergencyTs = now
                recentHits.clear()

                val words = last3.map { it.word }
                onEmergencyDetected(first.group, words, now)
            }
        }
    }

    /**
     * НЕМЕДЛЕННАЯ отправка SOS во фронтенд
     * Фронтенд сам отправляет запрос на бэкенд
     */
    private fun sendImmediateSOS(service: String, words: List<String>, timestamp: Long) {
        Log.i(TAG, "IMMEDIATE SOS -> service=$service words=$words")
        
        // Отправляем во фронтенд через MainActivity/WebAppInterface
        mainActivityRef?.get()?.let { activity ->
            activity.runOnUiThread {
                val webView = webViewRef?.get()
                webView?.let { wv ->
                    val payload = JSONObject().apply {
                        put("type", "emergency_immediate")
                        put("service", service)
                        put("words", words)
                        put("timestamp", timestamp)
                        put("priority", "immediate")
                        put("source", "voice_recognition")
                    }
                    wv.evaluateJavascript(
                        "window.onNativeSOS && window.onNativeSOS(${payload.toString()})", null
                    )
                }
            }
        } ?: run {
            Log.w(TAG, "Cannot send SOS - MainActivity reference is null")
        }
    }

    private fun sendWarningToWeb(word: String, timestamp: Long) {
        Log.i(TAG, "WARNING detected -> JS: $word")
        
        mainActivityRef?.get()?.let { activity ->
            activity.runOnUiThread {
                val webView = webViewRef?.get()
                webView?.let { wv ->
                    val payload = JSONObject().apply {
                        put("type", "warning")
                        put("word", word)
                        put("timestamp", timestamp)
                        put("source", "voice_recognition")
                    }
                    wv.evaluateJavascript(
                        "window.onNativeWarning && window.onNativeWarning(${payload.toString()})", null
                    )
                }
            }
        }
    }

    private fun onEmergencyDetected(group: String, words: List<String>, timestamp: Long) {
        Log.i(TAG, "EMERGENCY detected -> group=$group words=$words")
        
        val serviceName = when (group) {
            "ambulance" -> "ambulance"
            "police" -> "police"
            "fire" -> "fire"
            else -> "unknown"
        }
        
        // Отправляем во фронтенд
        mainActivityRef?.get()?.let { activity ->
            activity.runOnUiThread {
                val webView = webViewRef?.get()
                webView?.let { wv ->
                    val payload = JSONObject().apply {
                        put("type", "emergency")
                        put("service", serviceName)
                        put("words", words)
                        put("timestamp", timestamp)
                        put("priority", "high")
                        put("source", "voice_recognition")
                    }
                    wv.evaluateJavascript(
                        "window.onNativeSOS && window.onNativeSOS(${payload.toString()})", null
                    )
                }
            }
        }
    }
}
