package com.plugin.googlesignin

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import org.json.JSONObject

// Simplified Google Sign-in helper class that can work with Tauri
class GoogleSigninPlugin(private val activity: Activity) {

    private lateinit var googleSignInClient: GoogleSignInClient

    // Interface for result callbacks
    interface SignInCallback {
        fun onResult(result: String)
    }

    init {
        instance = this

        // Initialize Google Sign-In with the Android client ID
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("1064619689471-7lr8e71tr6h55as83o8gn4bdnhabavpu.apps.googleusercontent.com")
            .requestEmail()
            .requestProfile()
            .build()

        googleSignInClient = GoogleSignIn.getClient(activity, gso)
        Log.d(TAG, "GoogleSigninPlugin initialized")
    }

    fun signIn(callback: SignInCallback?) {
        Log.d(TAG, "signIn called")

        try {
            // Store the callback for later use
            currentCallback = callback

            // Start the sign-in flow
            val signInIntent = googleSignInClient.signInIntent
            activity.startActivityForResult(signInIntent, RC_SIGN_IN)

            Log.d(TAG, "Sign-in intent started, waiting for result")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting sign-in intent", e)
            val result = createErrorResult("Error starting sign-in: ${e.message}")
            callback?.onResult(result)
        }
    }

    fun signOut(callback: SignInCallback?) {
        Log.d(TAG, "signOut called")

        googleSignInClient.signOut().addOnCompleteListener(activity) { task ->
            val result = if (task.isSuccessful) {
                Log.d(TAG, "Sign-out successful")
                createSuccessResult()
            } else {
                Log.e(TAG, "Sign-out failed", task.exception)
                createErrorResult("Sign-out failed: ${task.exception?.message}")
            }
            callback?.onResult(result)
        }
    }

    // Handle activity result - this should be called from MainActivity
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        Log.d(TAG, "handleActivityResult: requestCode=$requestCode, resultCode=$resultCode")

        if (requestCode == RC_SIGN_IN && currentCallback != null) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            handleSignInResult(task)
        }
    }

    private fun handleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            Log.d(TAG, "Sign-in successful: ${account.email}")

            val result = createUserResult(account)
            currentCallback?.onResult(result)
            currentCallback = null

        } catch (e: ApiException) {
            Log.w(TAG, "Sign-in failed", e)

            val result = createErrorResult("Sign-in failed: ${e.message} (${e.statusCode})")
            currentCallback?.onResult(result)
            currentCallback = null
        }
    }

    private fun createUserResult(account: GoogleSignInAccount): String {
        val result = JSONObject()
        result.put("success", true)

        val userInfo = JSONObject()
        userInfo.put("id", account.id ?: "")
        userInfo.put("email", account.email ?: "")
        userInfo.put("name", account.displayName ?: "")
        userInfo.put("photoUrl", account.photoUrl?.toString() ?: "")
        userInfo.put("idToken", account.idToken ?: "")

        result.put("user", userInfo)
        return result.toString()
    }

    private fun createSuccessResult(): String {
        val result = JSONObject()
        result.put("success", true)
        return result.toString()
    }

    private fun createErrorResult(error: String): String {
        val result = JSONObject()
        result.put("success", false)
        result.put("error", error)
        return result.toString()
    }

    companion object {
        private const val TAG = "GoogleSigninPlugin"
        private const val RC_SIGN_IN = 9001
        private var instance: GoogleSigninPlugin? = null
        private var currentCallback: SignInCallback? = null

        // Static method to get the instance for MainActivity
        @JvmStatic
        fun getInstance(): GoogleSigninPlugin? {
            return instance
        }
    }
}
