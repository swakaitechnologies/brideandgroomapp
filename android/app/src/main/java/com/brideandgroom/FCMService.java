package com.brideandgroom;

import android.util.Log;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class FCMService extends FirebaseMessagingService {
    private static final String TAG = "FCMService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        if (remoteMessage == null) return;
        
        // 1. Check for incoming call
        if (remoteMessage.getData().containsKey("type") &&
                "incoming_call".equals(remoteMessage.getData().get("type"))) {
            try {
                ReactApplication reactApp = (ReactApplication) getApplication();
                ReactInstanceManager manager = reactApp.getReactNativeHost().getReactInstanceManager();
                ReactContext ctx = manager.getCurrentReactContext();
                if (ctx != null) {
                    ctx
                      .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                      .emit("IncomingCall", remoteMessage.getData());
                } else {
                    Log.w(TAG, "ReactContext is null, cannot emit IncomingCall event");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error forwarding incoming call event", e);
            }
            return;
        }

        // 2. Forward other notifications to JavaScript (Foreground listener)
        try {
            ReactApplication reactApp = (ReactApplication) getApplication();
            ReactInstanceManager manager = reactApp.getReactNativeHost().getReactInstanceManager();
            ReactContext ctx = manager.getCurrentReactContext();
            if (ctx != null) {
                com.facebook.react.bridge.WritableMap map = com.facebook.react.bridge.Arguments.createMap();
                com.facebook.react.bridge.WritableMap dataMap = com.facebook.react.bridge.Arguments.createMap();
                
                // Copy data payload
                for (java.util.Map.Entry<String, String> entry : remoteMessage.getData().entrySet()) {
                    dataMap.putString(entry.getKey(), entry.getValue());
                }
                map.putMap("data", dataMap);

                // Copy notification details
                if (remoteMessage.getNotification() != null) {
                    com.facebook.react.bridge.WritableMap notifMap = com.facebook.react.bridge.Arguments.createMap();
                    notifMap.putString("title", remoteMessage.getNotification().getTitle());
                    notifMap.putString("body", remoteMessage.getNotification().getBody());
                    map.putMap("notification", notifMap);
                }

                ctx
                  .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit("onNotificationReceived", map);
                Log.i(TAG, "Successfully forwarded notification to JS");
            } else {
                Log.w(TAG, "ReactContext is null, cannot emit onNotificationReceived event");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error forwarding onNotificationReceived event", e);
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.i(TAG, "Refreshed token: " + token);
        try {
            ReactApplication reactApp = (ReactApplication) getApplication();
            ReactInstanceManager manager = reactApp.getReactNativeHost().getReactInstanceManager();
            ReactContext ctx = manager.getCurrentReactContext();
            if (ctx != null) {
                ctx
                  .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit("onTokenRefresh", token);
            } else {
                Log.w(TAG, "ReactContext is null, cannot emit onTokenRefresh");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error forwarding token refresh event", e);
        }
    }
}
