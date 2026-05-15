package com.example.sakbol

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.JavascriptInterface
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.sakbol.voice.VoskHotwordService
import java.lang.ref.WeakReference
import com.google.android.gms.location.*
import com.google.android.gms.location.FusedLocationProviderClient
import org.json.JSONObject
import android.util.Log

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private val startUrl = "https://mobie.sakbol.app/"

    private val REQ_PERMS = 1001       // микрофон/уведомления
    private val REQ_LOC_PERMS = 2001   // геолокация

    private lateinit var fused: FusedLocationProviderClient
    private lateinit var locationRequest: LocationRequest
    private var locationCallback: LocationCallback? = null
    private lateinit var webAppInterface: WebAppInterface

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        // Создаем JavaScript Interface
        webAppInterface = WebAppInterface(this, webView)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadsImagesAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            allowFileAccess = true
            userAgentString = "$userAgentString AppWebView/sakbol"
        }

        // Добавляем JavaScript Interface
        webView.addJavascriptInterface(webAppInterface, "SakbolNative")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Сообщаем фронтенду что нативный код готов
                webView.post {
                    webView.evaluateJavascript(
                        "window.SakbolNativeReady && window.SakbolNativeReady()", null
                    )
                }
                // Сразу шлём текущую локацию во фронтенд
                getCurrentLocationAndSend()
            }
        }
        webView.webChromeClient = object : WebChromeClient() {}

        if (savedInstanceState == null) {
            webView.loadUrl(startUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }

        // --- Fused Location init ---
        fused = LocationServices.getFusedLocationProviderClient(this)
        locationRequest = LocationRequest.Builder(30_000L)
            .setMinUpdateIntervalMillis(25_000L)
            .setPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val loc = result.lastLocation ?: return
                val lat = loc.latitude
                val lon = loc.longitude
                
                // Отправляем координаты во фронтенд
                val locationData = JSONObject().apply {
                    put("latitude", lat)
                    put("longitude", lon)
                    put("timestamp", System.currentTimeMillis())
                }
                
                webView.post {
                    webView.evaluateJavascript(
                        "window.onNativeLocationUpdate && window.onNativeLocationUpdate(${locationData.toString()})", null
                    )
                }
            }
        }

        // Разрешения: сначала для микрофона (Vosk), затем для геолокации
        requestMicPermsThenStartService()
        ensureLocationPermsAndStart()
    }

    override fun onResume() {
        super.onResume()
        ensureLocationPermsAndStart()
    }

    override fun onPause() {
        super.onPause()
        stopLocation()
    }

    internal fun hasMicPerm(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    internal fun hasPostNotifPerm(): Boolean =
        if (Build.VERSION.SDK_INT >= 33)
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        else true

    fun requestMicPermsThenStartService() {
        val need = mutableListOf<String>()
        if (!hasMicPerm()) need += Manifest.permission.RECORD_AUDIO
        if (need.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, need.toTypedArray(), REQ_PERMS)
        } else {
            startHotwordService()
        }
    }

    fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this, 
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS), 
                    REQ_PERMS
                )
            }
        }
    }

    fun ensureLocationPermsAndStart() {
        val need = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            need += Manifest.permission.ACCESS_FINE_LOCATION
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            need += Manifest.permission.ACCESS_COARSE_LOCATION
        }
        if (need.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, need.toTypedArray(), REQ_LOC_PERMS)
        } else {
            startLocation()
        }
    }

    fun startLocation() {
        if (!::fused.isInitialized || locationCallback == null) return
        try {
            fused.requestLocationUpdates(
                locationRequest,
                locationCallback as LocationCallback,
                mainLooper
            )
            // Сообщаем фронтенду что геолокация активна
            webView.post {
                webView.evaluateJavascript(
                    "window.onLocationStatusChange && window.onLocationStatusChange(true)", null
                )
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    /**
     * Получить текущую локацию однократно и сразу отправить во фронтенд.
     * Вызывается из WebAppInterface.requestCurrentLocation()
     */
    @SuppressLint("MissingPermission")
    fun getCurrentLocationAndSend() {
        if (!::fused.isInitialized) return
        try {
            fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { loc ->
                    if (loc != null) {
                        val locationData = JSONObject().apply {
                            put("latitude", loc.latitude)
                            put("longitude", loc.longitude)
                            put("timestamp", System.currentTimeMillis())
                        }
                        webView.post {
                            webView.evaluateJavascript(
                                "window.onNativeLocationUpdate && window.onNativeLocationUpdate(${locationData.toString()})", null
                            )
                        }
                        Log.d("LOCATION", "Sent current location: ${loc.latitude}, ${loc.longitude}")
                    } else {
                        Log.w("LOCATION", "getCurrentLocation returned null")
                    }
                }
                .addOnFailureListener { e ->
                    Log.e("LOCATION", "getCurrentLocation failed", e)
                }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    fun stopLocation() {
        if (!::fused.isInitialized || locationCallback == null) return
        fused.removeLocationUpdates(locationCallback as LocationCallback)
        // Сообщаем фронтенду что геолокация остановлена
        webView.post {
            webView.evaluateJavascript(
                "window.onLocationStatusChange && window.onLocationStatusChange(false)", null
            )
        }
    }

    fun startHotwordService() {
        VoskHotwordService.webViewRef = WeakReference(webView)
        VoskHotwordService.mainActivityRef = WeakReference(this)
        val i = Intent(this, VoskHotwordService::class.java)
        // Не запускаем как foreground service пока уведомления не включены через фронтенд
        i.putExtra("startForeground", false)
        ContextCompat.startForegroundService(this, i)
    }

    fun enableVoiceNotifications() {
        // Включаем foreground notification
        val i = Intent(this, VoskHotwordService::class.java)
        i.putExtra("startForeground", true)
        ContextCompat.startForegroundService(this, i)
    }

    fun disableVoiceNotifications() {
        // Отключаем foreground notification, но сервис продолжает работать
        val i = Intent(this, VoskHotwordService::class.java)
        i.putExtra("stopForeground", true)
        ContextCompat.startForegroundService(this, i)
    }

    fun pauseVoiceListening() {
        val i = Intent(this, VoskHotwordService::class.java)
        i.action = VoskHotwordService.ACTION_PAUSE
        ContextCompat.startForegroundService(this, i)
    }

    fun resumeVoiceListening() {
        val i = Intent(this, VoskHotwordService::class.java)
        i.action = VoskHotwordService.ACTION_RESUME
        ContextCompat.startForegroundService(this, i)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        when (requestCode) {
            REQ_PERMS -> {
                val micGranted = permissions.zip(grantResults.toList())
                    .any { (p, r) -> p == Manifest.permission.RECORD_AUDIO && r == PackageManager.PERMISSION_GRANTED }
                val notifGranted = if (Build.VERSION.SDK_INT >= 33) {
                    permissions.zip(grantResults.toList())
                        .any { (p, r) -> p == Manifest.permission.POST_NOTIFICATIONS && r == PackageManager.PERMISSION_GRANTED }
                } else true

                // Сообщаем фронтенду о результатах
                val result = JSONObject().apply {
                    put("microphone", micGranted)
                    put("notifications", notifGranted)
                }
                webView.post {
                    webView.evaluateJavascript(
                        "window.onPermissionsResult && window.onPermissionsResult(${result.toString()})", null
                    )
                }

                if (micGranted) {
                    startHotwordService()
                }
            }
            REQ_LOC_PERMS -> {
                val fineGranted = permissions.zip(grantResults.toList())
                    .any { (p, r) -> p == Manifest.permission.ACCESS_FINE_LOCATION && r == PackageManager.PERMISSION_GRANTED }
                val coarseGranted = permissions.zip(grantResults.toList())
                    .any { (p, r) -> p == Manifest.permission.ACCESS_COARSE_LOCATION && r == PackageManager.PERMISSION_GRANTED }

                // Сообщаем фронтенду о результатах
                val result = JSONObject().apply {
                    put("fineLocation", fineGranted)
                    put("coarseLocation", coarseGranted)
                }
                webView.post {
                    webView.evaluateJavascript(
                        "window.onLocationPermissionResult && window.onLocationPermissionResult(${result.toString()})", null
                    )
                }

                if (fineGranted || coarseGranted) {
                    startLocation()
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        stopLocation()
        (webView.parent as? android.view.ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }
}
