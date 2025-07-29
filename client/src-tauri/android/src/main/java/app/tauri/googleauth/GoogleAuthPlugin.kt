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
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin

@InvokeArg
class GoogleSignInArgs {
    var filterByAuthorizedAccounts: Boolean = false
    var autoSelectEnabled: Boolean = true
    var nonce: String? = null
}

@TauriPlugin
class GoogleAuthPlugin(private val activity: Activity) : Plugin(activity) {

    companion object {
        private const val TAG = "GoogleAuthPlugin"
        private const val WEB_CLIENT_ID = "835928475738-1m6rdhqh0v3rl1f2b5kbqcg9bek4b3fs.apps.googleusercontent.com"
    }

    @Command
    fun signIn(invoke: Invoke) {
        val args = invoke.parseArgs(GoogleSignInArgs::class.java)

        try {
            Log.d(TAG, "Starting Google Sign-In with nonce: ${args.nonce}")

            val credentialManager = CredentialManager.create(activity)

            val googleIdOption = GetGoogleIdOption.Builder()
                .setServerClientId(WEB_CLIENT_ID)
                .setFilterByAuthorizedAccounts(args.filterByAuthorizedAccounts)
                .setAutoSelectEnabled(args.autoSelectEnabled)
                .apply {
                    args.nonce?.let { setNonce(it) }
                }
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val result = runBlocking {
                try {
                    credentialManager.getCredential(
                        request = request,
                        context = activity
                    )
                } catch (e: GetCredentialException) {
                    Log.e(TAG, "Credential retrieval failed", e)
                    throw e
                }
            }

            Log.d(TAG, "Credential response received")

            val idToken = handleSignInResult(result)

            val response = JSONObject().apply {
                put("success", true)
                put("id_token", idToken)
            }

            invoke.resolve(response)

        } catch (e: Exception) {
            Log.e(TAG, "Google Sign-In failed", e)
            val errorResponse = JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Unknown error occurred")
            }
            invoke.resolve(errorResponse)
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
}
