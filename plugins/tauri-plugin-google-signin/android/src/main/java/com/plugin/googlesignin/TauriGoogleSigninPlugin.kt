package com.plugin.googlesignin

import android.util.Log

// Minimal Tauri plugin for Google Sign-in
class TauriGoogleSigninPlugin {

    init {
        Log.d(TAG, "TauriGoogleSigninPlugin initialized successfully")
    }

    companion object {
        private const val TAG = "TauriGoogleSigninPlugin"
    }
}
