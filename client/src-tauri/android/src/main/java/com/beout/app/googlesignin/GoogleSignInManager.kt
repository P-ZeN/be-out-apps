package com.beout.app.googlesignin

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.CustomCredential
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

class GoogleSignInManager {
    companion object {
        private const val TAG = "GoogleSignInManager"
        private const val WEB_CLIENT_ID = "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"
    }

    private lateinit var credentialManager: CredentialManager
    private var currentActivity: Activity? = null

    fun initialize(context: Context, activity: Activity) {
        credentialManager = CredentialManager.create(context)
        currentActivity = activity
        Log.d(TAG, "GoogleSignInManager initialized")
    }

    fun signIn(
        filterByAuthorizedAccounts: Boolean = true,
        autoSelectEnabled: Boolean = true,
        nonce: String? = null,
        callback: (success: Boolean, result: String, error: String?) -> Unit
    ) {
        val activity = currentActivity
        if (activity == null) {
            callback(false, "", "Activity not available")
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(filterByAuthorizedAccounts)
                    .setServerClientId(WEB_CLIENT_ID)
                    .setAutoSelectEnabled(autoSelectEnabled)
                    .apply {
                        nonce?.let { setNonce(it) }
                    }
                    .build()

                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()

                Log.d(TAG, "Starting credential request with filterByAuthorizedAccounts: $filterByAuthorizedAccounts")

                val result = credentialManager.getCredential(
                    request = request,
                    context = activity
                )

                handleSignInResult(result, callback)

            } catch (e: GetCredentialException) {
                Log.e(TAG, "Sign-in failed", e)
                
                // If no authorized accounts found and we were filtering, try again without filtering
                if (filterByAuthorizedAccounts && e.message?.contains("No credentials available") == true) {
                    Log.d(TAG, "No authorized accounts found, trying sign-up flow")
                    signIn(
                        filterByAuthorizedAccounts = false,
                        autoSelectEnabled = autoSelectEnabled,
                        nonce = nonce,
                        callback = callback
                    )
                } else {
                    callback(false, "", e.message ?: "Unknown error during sign-in")
                }
            }
        }
    }

    private fun handleSignInResult(
        result: GetCredentialResponse,
        callback: (success: Boolean, result: String, error: String?) -> Unit
    ) {
        val credential = result.credential

        when (credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                        
                        // Create result JSON with all the information we need
                        val resultJson = JSONObject().apply {
                            put("idToken", googleIdTokenCredential.idToken)
                            put("displayName", googleIdTokenCredential.displayName ?: "")
                            put("familyName", googleIdTokenCredential.familyName ?: "")
                            put("givenName", googleIdTokenCredential.givenName ?: "")
                            put("id", googleIdTokenCredential.id)
                            put("phoneNumber", googleIdTokenCredential.phoneNumber ?: "")
                            put("profilePictureUri", googleIdTokenCredential.profilePictureUri?.toString() ?: "")
                        }

                        Log.d(TAG, "Sign-in successful for user: ${googleIdTokenCredential.displayName}")
                        callback(true, resultJson.toString(), null)

                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e(TAG, "Invalid Google ID token response", e)
                        callback(false, "", "Invalid Google ID token response: ${e.message}")
                    }
                } else {
                    Log.e(TAG, "Unexpected credential type: ${credential.type}")
                    callback(false, "", "Unexpected credential type")
                }
            }
            else -> {
                Log.e(TAG, "Unexpected credential type: ${credential::class.java.simpleName}")
                callback(false, "", "Unexpected credential type")
            }
        }
    }

    fun signOut(callback: (success: Boolean, error: String?) -> Unit) {
        val activity = currentActivity
        if (activity == null) {
            callback(false, "Activity not available")
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            try {
                credentialManager.clearCredentialState(
                    androidx.credentials.ClearCredentialStateRequest()
                )
                Log.d(TAG, "Sign-out successful")
                callback(true, null)
            } catch (e: Exception) {
                Log.e(TAG, "Sign-out failed", e)
                callback(false, e.message ?: "Unknown error during sign-out")
            }
        }
    }
}
