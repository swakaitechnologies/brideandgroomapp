package com.brideandgroom

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.google.firebase.FirebaseApp

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    val otaFile = java.io.File(applicationContext.filesDir, "ota/index.android.bundle")
    val jsBundlePath = if (otaFile.exists()) otaFile.absolutePath else null
    val useDev = if (otaFile.exists()) false else com.facebook.react.common.build.ReactBuildConfig.DEBUG

    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(PushNotificationPackage())
        },
      jsBundleFilePath = jsBundlePath,
      useDevSupport = useDev
    )
  }

  override fun onCreate() {
    super.onCreate()
    FirebaseApp.initializeApp(this)
    loadReactNative(this)
  }
}

