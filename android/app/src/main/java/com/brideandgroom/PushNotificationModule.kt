package com.brideandgroom

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.google.firebase.messaging.FirebaseMessaging

import android.content.Intent
import android.app.Activity

@ReactModule(name = PushNotificationModule.NAME)
class PushNotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    companion object {
        const val NAME = "PushNotificationModule"
        private const val TAG = "PushNotificationModule"
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun getToken(promise: Promise) {
        try {
            FirebaseMessaging.getInstance().token
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val token = task.result
                        Log.i(TAG, "FCM token retrieved successfully")
                        promise.resolve(token)
                    } else {
                        Log.e(TAG, "Failed to get FCM token", task.exception)
                        promise.reject("TOKEN_ERROR", "Failed to get FCM token", task.exception)
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "Exception getting FCM token", e)
            promise.reject("TOKEN_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val granted = ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
                promise.resolve(granted)
            } else {
                // Pre-Android 13 doesn't need runtime permission for notifications
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception checking permission", e)
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val activity = reactApplicationContext.currentActivity
                if (activity == null) {
                    promise.reject("NO_ACTIVITY", "No current activity available")
                    return
                }

                val granted = ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED

                if (granted) {
                    promise.resolve(true)
                } else {
                    // Request the permission - the OS will show its dialog
                    ActivityCompat.requestPermissions(
                        activity,
                        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                        1001
                    )
                    // Resolve true optimistically; the token fetch will confirm
                    promise.resolve(true)
                }
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception requesting permission", e)
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun deleteToken(promise: Promise) {
        try {
            FirebaseMessaging.getInstance().deleteToken()
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        promise.resolve(null)
                    } else {
                        promise.reject("DELETE_ERROR", "Failed to delete FCM token", task.exception)
                    }
                }
        } catch (e: Exception) {
            promise.reject("DELETE_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun getInitialNotification(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.resolve(null)
                return
            }
            val intent = activity.intent
            if (intent == null) {
                promise.resolve(null)
                return
            }
            val extras = intent.extras
            if (extras != null && (extras.containsKey("google.message_id") || extras.containsKey("type"))) {
                val map = Arguments.createMap()
                val dataMap = Arguments.createMap()
                extras.keySet().forEach { key ->
                    val value = extras.get(key)
                    if (value != null) {
                        dataMap.putString(key, value.toString())
                    }
                }
                map.putMap("data", dataMap)
                // Clear key so we don't process it again on subsequent calls
                intent.removeExtra("google.message_id")
                intent.removeExtra("type")
                promise.resolve(map)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in getInitialNotification", e)
            promise.reject("NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun reloadApp() {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            val app = reactApplicationContext.applicationContext as? MainApplication
            app?.reactHost?.reload("OTA Update")
            return
        }
        activity.runOnUiThread {
            try {
                val intent = activity.packageManager.getLaunchIntentForPackage(activity.packageName)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    activity.startActivity(intent)
                    activity.finish()
                    // Force terminate current process to rebuild ReactHost with new bundle path on boot
                    Runtime.getRuntime().exit(0)
                } else {
                    val app = reactApplicationContext.applicationContext as? MainApplication
                    app?.reactHost?.reload("OTA Update")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error reloading app via launch intent", e)
                val app = reactApplicationContext.applicationContext as? MainApplication
                app?.reactHost?.reload("OTA Update")
            }
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        // No-op
    }

    override fun onNewIntent(intent: Intent) {
        val extras = intent.extras
        if (extras != null && (extras.containsKey("google.message_id") || extras.containsKey("type"))) {
            try {
                val map = Arguments.createMap()
                val dataMap = Arguments.createMap()
                extras.keySet().forEach { key ->
                    val value = extras.get(key)
                    if (value != null) {
                        dataMap.putString(key, value.toString())
                    }
                }
                map.putMap("data", dataMap)
                // Send event to JS
                reactApplicationContext
                    .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onNotificationOpenedApp", map)
            } catch (e: Exception) {
                Log.e(TAG, "Error emitting onNotificationOpenedApp", e)
            }
        }
    }
}
