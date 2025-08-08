package com.plugin.googleauth

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task

data class GoogleSignInResult(
    val success: Boolean,
    val idToken: String? = null,
    val displayName: String? = null,
    val givenName: String? = null,
    val familyName: String? = null,
    val email: String? = null,
    val profilePictureUri: String? = null,
    val error: String? = null
)

class GoogleAuth(private val activity: Activity) {
    companion object {
        private const val TAG = "GoogleAuth"
    }

    private var googleSignInClient: GoogleSignInClient
    private var currentSignInCallback: ((GoogleSignInResult) -> Unit)? = null
    private var signInLauncher: ActivityResultLauncher<Intent>? = null

    init {
        Log.d(TAG, "GoogleAuth plugin initializing with Google Sign-In SDK")

        // Configure Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getWebClientId())
            .requestEmail()
            .build()

        googleSignInClient = GoogleSignIn.getClient(activity, gso)

        // Initialize activity result launcher if activity supports it
        if (activity is ComponentActivity) {
            signInLauncher = activity.registerForActivityResult(
                ActivityResultContracts.StartActivityForResult()
            ) { result ->
                Log.d(TAG, "Activity result received: ${result.resultCode}")
                if (result.data != null) {
                    val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
                    handleSignInResult(task)
                } else {
                    Log.w(TAG, "No data in activity result")
                    currentSignInCallback?.invoke(
                        GoogleSignInResult(success = false, error = "No data received from sign-in")
                    )
                    currentSignInCallback = null
                }
            }
            Log.d(TAG, "GoogleAuth plugin initialized successfully with ActivityResultLauncher")
        } else {
            Log.w(TAG, "Activity is not ComponentActivity, fallback mode will be used")
        }
    }

    private fun getWebClientId(): String {
        // Try to get the web client ID from resources or use a default
        val packageName = activity.packageName
        val resourceId = activity.resources.getIdentifier(
            "default_web_client_id",
            "string",
            packageName
        )

        return if (resourceId != 0) {
            activity.getString(resourceId)
        } else {
            // Fallback - you should set this in your google-services.json
            Log.w(TAG, "No default_web_client_id found in resources")
            ""
        }
    }

    fun signIn(callback: (GoogleSignInResult) -> Unit) {
        Log.d(TAG, "Starting Google Sign-In flow")
        currentSignInCallback = callback

        val signInIntent = googleSignInClient.signInIntent

        // Use modern ActivityResultLauncher if available, otherwise fallback to deprecated method
        if (signInLauncher != null) {
            Log.d(TAG, "Using ActivityResultLauncher for sign-in")
            signInLauncher!!.launch(signInIntent)
        } else {
            Log.d(TAG, "Using fallback startActivityForResult for sign-in")
            // Fallback for non-ComponentActivity contexts
            @Suppress("DEPRECATION")
            activity.startActivityForResult(signInIntent, 9001)
        }
    }

    fun signOut(callback: (GoogleSignInResult) -> Unit) {
        Log.d(TAG, "Starting Google Sign-Out")

        googleSignInClient.signOut()
            .addOnCompleteListener(activity) {
                Log.d(TAG, "Sign-out completed")
                callback(GoogleSignInResult(success = true))
            }
    }

    fun isSignedIn(): Boolean {
        val account = GoogleSignIn.getLastSignedInAccount(activity)
        return account != null
    }

    fun pong(value: String): String {
        Log.d(TAG, "Pong called with value: $value")
        return "pong: $value"
    }

    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        // This is only used for fallback compatibility when ActivityResultLauncher is not available
        if (requestCode == 9001) {
            Log.d(TAG, "Handling sign-in result (fallback mode)")
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            handleSignInResult(task)
        }
    }

    private fun handleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            Log.d(TAG, "Sign-in successful for: ${account.email}")

            val result = GoogleSignInResult(
                success = true,
                idToken = account.idToken,
                displayName = account.displayName,
                givenName = account.givenName,
                familyName = account.familyName,
                email = account.email,
                profilePictureUri = account.photoUrl?.toString()
            )

            currentSignInCallback?.invoke(result)
        } catch (e: ApiException) {
            Log.w(TAG, "Sign-in failed: ${e.statusCode}")
            val result = GoogleSignInResult(
                success = false,
                error = "Sign-in failed: ${e.message}"
            )
            currentSignInCallback?.invoke(result)
        } finally {
            currentSignInCallback = null
        }
    }
}
