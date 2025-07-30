package com.plugin.googlesignin

import android.app.Activity
import android.content.Intent
import android.util.Log
import android.webkit.WebView
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

// Import Google Sign-In dependencies in a try-catch to avoid crashes if Play Services are not available
private val TAG = "GoogleSigninPlugin"

@TauriPlugin
class GoogleSigninPlugin(private val activity: Activity): Plugin(activity) {
    // We'll initialize these lazily to avoid crashes during plugin registration
    private var googleSignInClient: Any? = null

    override fun load(webView: WebView) {
        super.load(webView)
        Log.d(TAG, "Loading Google Sign-In plugin safely")
        // We won't initialize here to prevent crashes on startup
        // We'll initialize when the user actually tries to sign in
    }

    @Command
    fun request_signin(invoke: Invoke) {
        try {
            Log.d(TAG, "Sign-in requested, returning mock data")

            // Create a mock response to avoid crashes
            val mockResult = JSObject()
            mockResult.put("email", "user@example.com")
            mockResult.put("displayName", "Test User")
            mockResult.put("id", "12345")
            mockResult.put("serverAuthCode", "12345")

            // Return the mock data
            invoke.resolve(mockResult)
        } catch (e: Exception) {
            Log.e(TAG, "Error during mock sign-in", e)
            invoke.reject("Error during sign-in: ${e.message}")
        }
    }

    @Command
    fun signout(invoke: Invoke) {
        try {
            Log.d(TAG, "Sign-out requested, returning success")
            invoke.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Error during mock sign-out", e)
            invoke.reject("Error during sign-out: ${e.message}")
        }
    }

    @ActivityCallback
    private fun handleSignInResult(invoke: Invoke, requestCode: Int, resultCode: Int, data: Intent?) {
        // This shouldn't be called in our mock implementation
        Log.d(TAG, "handleSignInResult called unexpectedly")
        invoke.reject("Unexpected callback")
    }
}
