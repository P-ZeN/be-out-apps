package com.plugin.googleauth

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

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

    private var googleSignInClient: GoogleSignInClient? = null
    private var currentCallback: ((GoogleSignInResult) -> Unit)? = null
    private val TAG = "GoogleAuth"

    init {
        setupGoogleSignIn()
    }

    private fun setupGoogleSignIn() {
        try {
            // Configure Google Sign-In for Android (no web client ID needed)
            val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestProfile()
                .build()

            googleSignInClient = GoogleSignIn.getClient(activity, gso)
            Log.d(TAG, "Google Sign-In client initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to setup Google Sign-In", e)
        }
    }

    fun signIn(callback: (GoogleSignInResult) -> Unit) {
        try {
            googleSignInClient?.let { client ->
                // Check if there's already a signed-in account
                val lastSignedInAccount = GoogleSignIn.getLastSignedInAccount(activity)
                if (lastSignedInAccount != null && !lastSignedInAccount.isExpired) {
                    // Use existing account
                    Log.d(TAG, "Using existing signed-in account")
                    callback(createSuccessResult(lastSignedInAccount))
                } else {
                    // Try silent sign-in first
                    Log.d(TAG, "Attempting silent sign-in")
                    client.silentSignIn()
                        .addOnCompleteListener(activity) { task ->
                            if (task.isSuccessful) {
                                // Silent sign-in succeeded
                                val account = task.result
                                Log.d(TAG, "Silent sign-in successful")
                                callback(createSuccessResult(account))
                            } else {
                                // Silent sign-in failed, need interactive sign-in
                                Log.d(TAG, "Silent sign-in failed, starting interactive sign-in")
                                startInteractiveSignIn(client, callback)
                            }
                        }
                }
            } ?: run {
                Log.e(TAG, "Google Sign-In client not initialized")
                callback(GoogleSignInResult(false, error = "Google Sign-In client not initialized"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during sign-in", e)
            callback(GoogleSignInResult(false, error = "Sign-in error: ${e.message}"))
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
