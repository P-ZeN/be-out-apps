package com.plugin.googleauth

import android.app.Activity
import android.content.Intent
import android.util.Log
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
        private const val SIGN_IN_REQUEST_CODE = 9001
        private const val TAG = "GoogleAuth"
    }

    private var googleSignInClient: GoogleSignInClient
    private var currentSignInCallback: ((GoogleSignInResult) -> Unit)? = null

    init {
        Log.d(TAG, "GoogleAuth plugin initializing with Google Sign-In SDK")
        
        // Configure Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getWebClientId())
            .requestEmail()
            .build()

        googleSignInClient = GoogleSignIn.getClient(activity, gso)
        Log.d(TAG, "GoogleAuth plugin initialized successfully")
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
        activity.startActivityForResult(signInIntent, SIGN_IN_REQUEST_CODE)
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

    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == SIGN_IN_REQUEST_CODE) {
            Log.d(TAG, "Handling sign-in result")
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
