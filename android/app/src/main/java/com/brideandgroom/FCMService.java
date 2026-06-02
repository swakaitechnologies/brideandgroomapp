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
        if (remoteMessage.getData().containsKey("type") &&
                "incoming_call".equals(remoteMessage.getData().get("type"))) {
            // Forward the payload to JavaScript
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
