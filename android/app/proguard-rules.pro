# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/android-sdk/tools/proguard/proguard-android.txt

# React Native
-keep,allowobfuscation,allowshrinking class com.facebook.react.bridge.** { *; }
-keep,allowobfuscation,allowshrinking class com.facebook.react.uimanager.** { *; }
-keep,allowobfuscation,allowshrinking class com.facebook.react.viewmanagers.** { *; }
