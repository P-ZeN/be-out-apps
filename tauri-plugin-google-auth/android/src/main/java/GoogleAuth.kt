package com.plugin.googleauth

import android.app.Activity
import android.content.Intent
import android.util.Log

// Simple data class that doesn't require Google SDK imports
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
    }

    private val TAG = "GoogleAuth"

    init {
        Log.d(TAG, "GoogleAuth plugin created - Google SDK loading deferred")
    }

    fun signIn(callback: (GoogleSignInResult) -> Unit) {
        Log.d(TAG, "signIn called - implementing dynamic Google SDK loading")
        
        // TODO: Implement dynamic loading of Google Play Services
        // For now, return a placeholder response
        callback(GoogleSignInResult(
            success = false,
            error = "Google Sign-In not yet implemented - dynamic loading required"
        ))
    }

    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == SIGN_IN_REQUEST_CODE) {
            Log.d(TAG, "Activity result received - placeholder implementation")
        }
    }

    fun pong(value: String?): String {
        return value ?: "pong"
    }

    fun signOut(callback: (GoogleSignInResult) -> Unit) {
        Log.d(TAG, "signOut called - placeholder implementation")
        callback(GoogleSignInResult(success = true))
    }

    fun isSignedIn(): Boolean {
        Log.d(TAG, "isSignedIn called - placeholder implementation")
        return false
    }
}

    private fun startInteractiveSignIn(client: GoogleSignInClient, callback: (GoogleSignInResult) -> Unit) {
        try {
            // Store the callback for when the result comes back
            currentCallback = callback

            // Launch the sign-in intent
            val signInIntent = client.signInIntent
            activity.startActivityForResult(signInIntent, SIGN_IN_REQUEST_CODE)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start interactive sign-in", e)
            callback(GoogleSignInResult(false, error = "Failed to start interactive sign-in: ${e.message}"))
        }
    }

    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == SIGN_IN_REQUEST_CODE) {
            Log.d(TAG, "Received sign-in activity result")
            try {
                val task = GoogleSignIn.getSignedInAccountFromIntent(data)
                val account = task.getResult(ApiException::class.java)
                currentCallback?.invoke(createSuccessResult(account))
            } catch (e: ApiException) {
                Log.e(TAG, "Sign-in failed with status code: ${e.statusCode}", e)
                val errorMessage = when (e.statusCode) {
                    12501 -> "Sign-in was cancelled by user"
                    12502 -> "Sign-in is currently in progress"
                    else -> "Sign-in failed with code: ${e.statusCode}"
                }
                currentCallback?.invoke(GoogleSignInResult(false, error = errorMessage))
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error during sign-in", e)
                currentCallback?.invoke(GoogleSignInResult(false, error = "Unexpected error: ${e.message}"))
            } finally {
                currentCallback = null
            }
        }
    }

    private fun createSuccessResult(account: GoogleSignInAccount): GoogleSignInResult {
        return GoogleSignInResult(
            success = true,
            idToken = account.idToken,
            displayName = account.displayName,
            givenName = account.givenName,
            familyName = account.familyName,
            email = account.email,
            profilePictureUri = account.photoUrl?.toString()
        )
    }

    fun pong(value: String?): String {
        return value ?: "pong"
    }

    fun signOut(callback: (GoogleSignInResult) -> Unit) {
        try {
            googleSignInClient?.signOut()?.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "User signed out successfully")
                    callback(GoogleSignInResult(success = true))
                } else {
                    val errorMessage = task.exception?.message ?: "Sign out failed"
                    Log.e(TAG, "Sign out failed: $errorMessage")
                    callback(GoogleSignInResult(success = false, error = errorMessage))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during sign out", e)
            callback(GoogleSignInResult(success = false, error = e.message))
        }
    }

    fun isSignedIn(): Boolean {
        return try {
            val account = GoogleSignIn.getLastSignedInAccount(activity)
            account != null
        } catch (e: Exception) {
            Log.e(TAG, "Error checking sign-in status", e)
            false
        }
    }
}
