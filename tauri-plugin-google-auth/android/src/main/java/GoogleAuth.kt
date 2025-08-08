package com.plugin.googleauth

import android.app.Activity
import android.content.Intent
import android.util.Log

// Create minimal data classes that don't depend on Google SDK
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

    // Use lazy initialization to completely defer all Google SDK imports/usage
    private val TAG = "GoogleAuth"

    init {
        Log.d(TAG, "GoogleAuth plugin created - Google SDK imports deferred")
    }

    fun signIn(callback: (GoogleSignInResult) -> Unit) {
        try {
            // Import Google SDK classes only when actually needed
            val gmsAuthSignIn = Class.forName("com.google.android.gms.auth.api.signin.GoogleSignIn")
            val gmsSignInOptions = Class.forName("com.google.android.gms.auth.api.signin.GoogleSignInOptions")
            
            Log.d(TAG, "Google SDK classes loaded successfully")
            
            // Perform actual sign-in logic here
            performActualSignIn(callback)
            
        } catch (e: ClassNotFoundException) {
            Log.e(TAG, "Google Play Services not available", e)
            callback(GoogleSignInResult(false, error = "Google Play Services not available"))
        } catch (e: Exception) {
            Log.e(TAG, "Error during sign-in", e)
            callback(GoogleSignInResult(false, error = "Sign-in error: ${e.message}"))
        }
    }
    
    private fun performActualSignIn(callback: (GoogleSignInResult) -> Unit) {
        // TODO: Implement actual Google Sign-In logic here
        // For now, return a placeholder
        Log.d(TAG, "Placeholder sign-in implementation")
        callback(GoogleSignInResult(false, error = "Sign-in implementation not yet complete"))
    }

    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == SIGN_IN_REQUEST_CODE) {
            Log.d(TAG, "Received sign-in activity result - placeholder implementation")
        }
    }

    fun pong(value: String?): String {
        return value ?: "pong"
    }

    fun signOut(callback: (GoogleSignInResult) -> Unit) {
        Log.d(TAG, "Sign out - placeholder implementation")
        callback(GoogleSignInResult(success = true))
    }

    fun isSignedIn(): Boolean {
        Log.d(TAG, "Is signed in check - placeholder implementation")
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
