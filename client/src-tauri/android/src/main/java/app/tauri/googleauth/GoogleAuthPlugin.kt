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
    }

    private fun getClientId(): String {
        // Try to get the client ID from Tauri configuration first
        return try {
            val config = getPluginConfig()
            val clientIdConfig = config?.getJSONObject("clientId")
            val clientId = clientIdConfig?.getString("android")

            if (!clientId.isNullOrEmpty()) {
                Log.d(TAG, "Successfully loaded client ID from Tauri configuration")
                return clientId
            }

            Log.w(TAG, "Client ID not found in Tauri configuration, trying build config...")

            // Try BuildConfig constant (set at build time)
            val buildConfigClientId = try {
                BuildConfig.GOOGLE_CLIENT_ID
            } catch (e: Exception) {
                Log.w(TAG, "BuildConfig.GOOGLE_CLIENT_ID not available: ${e.message}")
                null
            }

            if (!buildConfigClientId.isNullOrEmpty()) {
                Log.d(TAG, "Using client ID from BuildConfig")
                return buildConfigClientId
            }

            // Try environment variables as last resort
            val envClientId = System.getenv("GOOGLE_CLIENT_ID_ANDROID")
            if (!envClientId.isNullOrEmpty()) {
                Log.d(TAG, "Using client ID from environment variable")
                return envClientId
            }

            throw Exception("No Google client ID configured")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to get client ID: ${e.message}")
            throw Exception("Google client ID not configured. Please set it in tauri.conf.json, BuildConfig, or environment variables.")
        }
    }

    @Command
    fun signIn(invoke: Invoke) {
        val args = invoke.parseArgs(GoogleSignInArgs::class.java)

        try {
            Log.d(TAG, "Starting Google Sign-In with nonce: ${args.nonce}")

            val clientId = getClientId()
            Log.d(TAG, "Using client ID: $clientId")

            val credentialManager = CredentialManager.create(activity)

            val googleIdOption = GetGoogleIdOption.Builder()
                .setServerClientId(clientId)
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
                put("idToken", idToken)
                // Note: Additional user info would require additional API calls
                // For now, we're just returning the ID token which contains the user info
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

    @Command
    fun signOut(invoke: Invoke) {
        try {
            Log.d(TAG, "Google Sign-Out requested")

            // For Google Identity Services, there's no explicit sign-out method
            // The credential is automatically cleared when the app is closed
            val response = JSONObject().apply {
                put("success", true)
                put("message", "Sign-out completed")
            }

            invoke.resolve(response)

        } catch (e: Exception) {
            Log.e(TAG, "Google Sign-Out failed", e)
            val errorResponse = JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Sign-out failed")
            }
            invoke.resolve(errorResponse)
        }
    }

    @Command
    fun isSignedIn(invoke: Invoke) {
        try {
            Log.d(TAG, "Checking sign-in status")

            // For Google Identity Services, we don't maintain persistent sign-in state
            // Each sign-in is independent
            val response = JSONObject().apply {
                put("success", true)
                put("isSignedIn", false)
                put("message", "Each sign-in is independent with Google Identity Services")
            }

            invoke.resolve(response)

        } catch (e: Exception) {
            Log.e(TAG, "Check sign-in status failed", e)
            val errorResponse = JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Status check failed")
            }
            invoke.resolve(errorResponse)
        }
    }
}
