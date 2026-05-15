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
    private var isLocationRunning = false
    private var isDestroyed = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("SAKBOL", "=== onCreate ===")
        webView = WebView(this)
        setContentView(webView)

        webAppInterface = WebAppInterface(this, webView)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadsImagesAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            allowFileAccess = true
            userAgentString = "$userAgentString AppWebView/sakbol"
        }

        webView.addJavascriptInterface(webAppInterface, "SakbolNative")
        Log.d("SAKBOL", "JS Interface SakbolNative added")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("SAKBOL", "onPageFinished: $url")
                if (isDestroyed) {
                    Log.w("SAKBOL", "onPageFinished but isDestroyed=true")
                    return
                }
                webView.post {
                    if (isDestroyed) {
                        Log.w("SAKBOL", "post skipped: isDestroyed")
                        return@post
                    }
                    webView.evaluateJavascript(
                        "window.SakbolNativeReady && window.SakbolNativeReady()", null
                    )
                    Log.d("SAKBOL", "SakbolNativeReady() called")
                }
                // НЕ шлём локацию здесь — она придёт через locationCallback после startLocation()
                Log.d("SAKBOL", "onPageFinished done")
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
                if (isDestroyed) {
                    Log.w("SAKBOL", "locationCallback: isDestroyed, skipping")
                    return
                }
                val loc = result.lastLocation ?: run {
                    Log.w("SAKBOL", "locationCallback: lastLocation is null")
                    return
                }
                val lat = loc.latitude
                val lon = loc.longitude
                Log.d("SAKBOL", "locationCallback: lat=$lat lon=$lon")
                
                val locationData = JSONObject().apply {
                    put("latitude", lat)
                    put("longitude", lon)
                    put("timestamp", System.currentTimeMillis())
                }
                
                webView.post {
                    if (isDestroyed) {
                        Log.w("SAKBOL", "locationCallback post: isDestroyed")
                        return@post
                    }
                    webView.evaluateJavascript(
                        "window.onNativeLocationUpdate && window.onNativeLocationUpdate(${locationData.toString()})", null
                    )
                    Log.d("SAKBOL", "Sent location to JS: $lat, $lon")
                }
            }
        }

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
        Log.d("SAKBOL", "ensureLocationPermsAndStart called")
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
            Log.d("SAKBOL", "Requesting location permissions: $need")
            ActivityCompat.requestPermissions(this, need.toTypedArray(), REQ_LOC_PERMS)
        } else {
            Log.d("SAKBOL", "Location permissions OK, starting location")
            startLocation()
        }
    }

    fun startLocation() {
        Log.d("SAKBOL", "startLocation called, isLocationRunning=$isLocationRunning")
        if (!::fused.isInitialized || locationCallback == null || isLocationRunning) {
            Log.w("SAKBOL", "startLocation skipped: fused=${::fused.isInitialized} callback=${locationCallback != null} running=$isLocationRunning")
            return
        }
        try {
            fused.requestLocationUpdates(
                locationRequest,
                locationCallback as LocationCallback,
                mainLooper
            )
            isLocationRunning = true
            Log.d("SAKBOL", "Location updates STARTED")
            if (isDestroyed) {
                Log.w("SAKBOL", "startLocation: isDestroyed after start")
                return
            }
            webView.post {
                if (isDestroyed) return@post
                webView.evaluateJavascript(
                    "window.onLocationStatusChange && window.onLocationStatusChange(true)", null
                )
            }
        } catch (e: SecurityException) {
            Log.e("SAKBOL", "startLocation SecurityException", e)
            e.printStackTrace()
        }
    }

    /**
     * Получить текущую локацию однократно и сразу отправить во фронтенд.
     * Безопасен к многократным вызовам — не запускает обновления, а делает разовый запрос.
     */
    @SuppressLint("MissingPermission")
    fun getCurrentLocationAndSend() {
        Log.d("SAKBOL", "getCurrentLocationAndSend called")
        if (!::fused.isInitialized || isDestroyed) {
            Log.w("SAKBOL", "getCurrentLocationAndSend skipped: fused=${::fused.isInitialized} destroyed=$isDestroyed")
            return
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
            && ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.w("SAKBOL", "getCurrentLocationAndSend: no location permissions")
            return
        }
        try {
            fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { loc ->
                    if (isDestroyed || loc == null) {
                        Log.w("SAKBOL", "getCurrentLocation success but loc is null or destroyed")
                        return@addOnSuccessListener
                    }
                    val locationData = JSONObject().apply {
                        put("latitude", loc.latitude)
                        put("longitude", loc.longitude)
                        put("timestamp", System.currentTimeMillis())
                    }
                    webView.post {
                        if (isDestroyed) return@post
                        webView.evaluateJavascript(
                            "window.onNativeLocationUpdate && window.onNativeLocationUpdate(${locationData.toString()})", null
                        )
                    }
                    Log.d("SAKBOL", "getCurrentLocationAndSend SUCCESS: ${loc.latitude}, ${loc.longitude}")
                }
                .addOnFailureListener { e ->
                    Log.e("SAKBOL", "getCurrentLocationAndSend FAILED", e)
                }
        } catch (e: SecurityException) {
            Log.e("SAKBOL", "getCurrentLocationAndSend SecurityException", e)
            e.printStackTrace()
        }
    }

    fun stopLocation() {
        Log.d("SAKBOL", "stopLocation called, isLocationRunning=$isLocationRunning")
        if (!::fused.isInitialized || locationCallback == null || !isLocationRunning) {
            Log.w("SAKBOL", "stopLocation skipped: fused=${::fused.isInitialized} callback=${locationCallback != null} running=$isLocationRunning")
            return
        }
        try {
            fused.removeLocationUpdates(locationCallback as LocationCallback)
            Log.d("SAKBOL", "Location updates REMOVED")
        } catch (e: Exception) {
            Log.e("SAKBOL", "stopLocation exception", e)
        }
        isLocationRunning = false
        if (isDestroyed) return
        webView.post {
            if (isDestroyed) return@post
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
        // Используем startService вместо startForegroundService, т.к. foreground notification отключен
        startService(i)
        Log.d("SAKBOL", "startHotwordService: started via startService (no foreground)")
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
        if (isDestroyed) return

        when (requestCode) {
            REQ_PERMS -> {
                val micGranted = permissions.zip(grantResults.toList())
                    .any { (p, r) -> p == Manifest.permission.RECORD_AUDIO && r == PackageManager.PERMISSION_GRANTED }
                val notifGranted = if (Build.VERSION.SDK_INT >= 33) {
                    permissions.zip(grantResults.toList())
                        .any { (p, r) -> p == Manifest.permission.POST_NOTIFICATIONS && r == PackageManager.PERMISSION_GRANTED }
                } else true

                val result = JSONObject().apply {
                    put("microphone", micGranted)
                    put("notifications", notifGranted)
                }
                webView.post {
                    if (isDestroyed) return@post
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

                val result = JSONObject().apply {
                    put("fineLocation", fineGranted)
                    put("coarseLocation", coarseGranted)
                }
                webView.post {
                    if (isDestroyed) return@post
                    webView.evaluateJavascript(
                        "window.onLocationPermissionResult && window.onLocationPermissionResult(${result.toString()})", null
                    )
                }

                if (fineGranted || coarseGranted) {
                    startLocation()
                    // Сразу шлём текущую локацию во фронтенд
                    getCurrentLocationAndSend()
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        Log.d("SAKBOL", "=== onDestroy ===")
        isDestroyed = true
        stopLocation()
        (webView.parent as? android.view.ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
        Log.d("SAKBOL", "=== onDestroy DONE ===")
    }
}
