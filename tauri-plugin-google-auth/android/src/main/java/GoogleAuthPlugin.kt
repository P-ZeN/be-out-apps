package com.plugin.googleauth

import android.app.Activity
import android.content.Intent
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

@InvokeArg
class PingArgs {
    var value: String? = null
}

@InvokeArg
class GoogleSignInArgs {
    var filterByAuthorizedAccounts: Boolean? = null
    var autoSelectEnabled: Boolean? = null
    var nonce: String? = null
    var webClientId: String? = null
}

@TauriPlugin
class GoogleAuthPlugin(private val activity: Activity): Plugin(activity) {
    companion object {
        private var instance: GoogleAuthPlugin? = null

        fun getInstance(): GoogleAuthPlugin? = instance
    }

    private val implementation = GoogleAuth(activity)

    override fun load(webView: android.webkit.WebView) {
        super.load(webView)
        // Register this instance globally so MainActivity can access it
        instance = this
    }

    // This method can be called from the main activity to handle activity results
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        implementation.handleActivityResult(requestCode, resultCode, data)
    }

    @Command
    fun ping(invoke: Invoke) {
        val args = invoke.parseArgs(PingArgs::class.java)

        val ret = JSObject()
        ret.put("value", implementation.pong(args.value ?: "default value :("))
        invoke.resolve(ret)
    }

    @Command
    fun signIn(invoke: Invoke) {
        val args = invoke.parseArgs(GoogleSignInArgs::class.java)

        implementation.signIn { result ->
            val ret = JSObject()
            ret.put("success", result.success)
            if (result.success) {
                ret.put("idToken", result.idToken)
                ret.put("displayName", result.displayName)
                ret.put("givenName", result.givenName)
                ret.put("familyName", result.familyName)
                ret.put("email", result.email)
                ret.put("profilePictureUri", result.profilePictureUri)
            } else {
                ret.put("error", result.error)
            }
            invoke.resolve(ret)
        }
    }

    @Command
    fun signOut(invoke: Invoke) {
        implementation.signOut { result ->
            val ret = JSObject()
            ret.put("success", result.success)
            if (!result.success) {
                ret.put("error", result.error)
            }
            invoke.resolve(ret)
        }
    }

    @Command
    fun isSignedIn(invoke: Invoke) {
        val isSignedIn = implementation.isSignedIn()
        val ret = JSObject()
        ret.put("isSignedIn", isSignedIn)
        invoke.resolve(ret)
    }
}
