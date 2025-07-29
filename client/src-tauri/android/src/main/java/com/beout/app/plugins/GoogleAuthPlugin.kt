package app.tauri.googleauth

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
import kotlinx.coroutines.runBlocking
import org.json.JSONObject

class GoogleAuthPlugin {

    companion object {
        private const val TAG = "GoogleAuthPlugin"
        private const val WEB_CLIENT_ID = "835928475738-1m6rdhqh0v3rl1f2b5kbqcg9bek4b3fs.apps.googleusercontent.com"
    }

    fun signIn(filterByAuthorizedAccounts: Boolean, autoSelectEnabled: Boolean, nonce: String?): String {
        return try {
            Log.d(TAG, "Starting Google Sign-In with nonce: $nonce")

            val context = getCurrentActivity() ?: throw Exception("No current activity available")

            val credentialManager = CredentialManager.create(context)

            val googleIdOption = GetGoogleIdOption.Builder()
                .setServerClientId(WEB_CLIENT_ID)
                .setFilterByAuthorizedAccounts(filterByAuthorizedAccounts)
                .setAutoSelectEnabled(autoSelectEnabled)
                .apply {
                    nonce?.let { setNonce(it) }
                }
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val result = runBlocking {
                try {
                    credentialManager.getCredential(
                        request = request,
                        context = context
                    )
                } catch (e: GetCredentialException) {
                    Log.e(TAG, "Credential retrieval failed", e)
                    throw e
                }
            }

            Log.d(TAG, "Credential response received")

            val idToken = handleSignInResult(result)

            JSONObject().apply {
                put("success", true)
                put("id_token", idToken)
            }.toString()

        } catch (e: Exception) {
            Log.e(TAG, "Google Sign-In failed", e)
            JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Unknown error occurred")
            }.toString()
        }
    }

    private fun handleSignInResult(result: GetCredentialResponse): String {
        val credential = result.credential

        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            try {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken

                Log.d(TAG, "Successfully retrieved ID token")
                Log.d(TAG, "User ID: ${googleIdTokenCredential.id}")
                Log.d(TAG, "User name: ${googleIdTokenCredential.displayName}")
                Log.d(TAG, "User email: ${googleIdTokenCredential.profilePictureUri}")

                return idToken
            } catch (e: GoogleIdTokenParsingException) {
                Log.e(TAG, "Invalid Google ID token response", e)
                throw Exception("Invalid Google ID token response: ${e.message}")
            }
        } else {
            Log.e(TAG, "Unexpected credential type: ${credential.type}")
            throw Exception("Unexpected credential type received")
        }
    }

    private fun getCurrentActivity(): Activity? {
        // This method should be provided by the Tauri plugin framework
        // For now, we'll use a simple approach
        return try {
            val activityThreadClass = Class.forName("android.app.ActivityThread")
            val currentActivityThreadMethod = activityThreadClass.getDeclaredMethod("currentActivityThread")
            currentActivityThreadMethod.isAccessible = true
            val activityThread = currentActivityThreadMethod.invoke(null)

            val getApplicationMethod = activityThreadClass.getDeclaredMethod("getApplication")
            getApplicationMethod.isAccessible = true
            val application = getApplicationMethod.invoke(activityThread)

            // Try to get the current activity from application
            // This is a simplified approach - in a real plugin, you'd get this from Tauri
            null // Placeholder - Tauri will provide the activity context
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get current activity", e)
            null
        }
    }
}
