import Foundation
import UIKit
import GoogleSignIn
import SwiftRs
import Tauri
import WebKit

class GoogleAuthPlugin: Plugin {

    public override func load(webview: WKWebView) {
        super.load(webview: webview)

        print("GoogleAuthPlugin: Starting initialization...")

        var configurationSuccess = false

        // Method 1: Try to configure from GoogleService-Info.plist
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") {
            print("GoogleAuthPlugin: Found GoogleService-Info.plist at path: \(path)")
            if let clientId = getClientIdFromPlist(path: path) {
                let config = GIDConfiguration(clientID: clientId)
                GIDSignIn.sharedInstance.configuration = config
                configurationSuccess = true
                print("GoogleAuthPlugin: Successfully configured with plist client ID: \(clientId)")
            } else {
                print("GoogleAuthPlugin: Failed to extract client ID from GoogleService-Info.plist")
            }
        } else {
            print("GoogleAuthPlugin: GoogleService-Info.plist not found in bundle")
        }

        // Method 2: Try fallback configuration from bundle
        if !configurationSuccess {
            print("GoogleAuthPlugin: Attempting fallback configuration...")
            if let bundleClientId = getBundleClientId() {
                let config = GIDConfiguration(clientID: bundleClientId)
                GIDSignIn.sharedInstance.configuration = config
                configurationSuccess = true
                print("GoogleAuthPlugin: Successfully configured with bundle client ID: \(bundleClientId)")
            } else {
                print("GoogleAuthPlugin: No bundle client ID found")
            }
        }

        // Method 3: Use hardcoded client ID as last resort
        if !configurationSuccess {
            print("GoogleAuthPlugin: Using hardcoded client ID as last resort...")
            let hardcodedClientId = "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"
            let config = GIDConfiguration(clientID: hardcodedClientId)
            GIDSignIn.sharedInstance.configuration = config
            configurationSuccess = true
            print("GoogleAuthPlugin: Configured with hardcoded client ID: \(hardcodedClientId)")
        }

        // Verify final configuration
        if configurationSuccess {
            if let config = GIDSignIn.sharedInstance.configuration {
                print("GoogleAuthPlugin: ✅ Google Sign-In successfully configured")
                print("GoogleAuthPlugin: Client ID: \(config.clientID)")
            } else {
                print("GoogleAuthPlugin: ❌ Configuration failed - GIDSignIn.sharedInstance.configuration is nil")
            }
        } else {
            print("GoogleAuthPlugin: ❌ CRITICAL ERROR - Failed to configure Google Sign-In with any method")
        }

        // Check iOS version compatibility
        if #available(iOS 9.0, *) {
            print("GoogleAuthPlugin: iOS version compatible with Google Sign-In")
        } else {
            print("GoogleAuthPlugin: WARNING - iOS version may not be compatible")
        }

        print("GoogleAuthPlugin: Initialization complete")
        }

        print("GoogleAuthPlugin: Initialization completed")
    }

    private func getClientIdFromPlist(path: String) -> String? {
        guard let plist = NSDictionary(contentsOfFile: path),
              let clientId = plist["CLIENT_ID"] as? String else {
            return nil
        }
        return clientId
    }

    private func getBundleClientId() -> String? {
        // Try multiple approaches to get client ID from bundle

        // Method 1: Try GoogleClientID from Info.plist
        if let clientId = Bundle.main.object(forInfoDictionaryKey: "GoogleClientID") as? String {
            print("GoogleAuthPlugin: Found GoogleClientID in Info.plist: \(clientId)")
            return clientId
        }

        // Method 2: Try to get from google-signin plugin config
        if let pluginConfig = Bundle.main.object(forInfoDictionaryKey: "google-signin") as? [String: Any],
           let clientIds = pluginConfig["clientId"] as? [String: String],
           let iosClientId = clientIds["ios"] {
            print("GoogleAuthPlugin: Found iOS client ID in plugin config: \(iosClientId)")
            return iosClientId
        }

        // Method 3: Try direct bundle identifier based lookup
        let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
        print("GoogleAuthPlugin: Bundle identifier: \(bundleId)")

        // Method 4: Check if the client ID is embedded in any other way
        if let infoPlist = Bundle.main.infoDictionary {
            print("GoogleAuthPlugin: Available Info.plist keys: \(infoPlist.keys)")
            // Look for any key that might contain client ID
            for (key, value) in infoPlist {
                if key.lowercased().contains("client") && key.lowercased().contains("id") {
                    print("GoogleAuthPlugin: Found potential client ID key: \(key) = \(value)")
                }
            }
        }

        print("GoogleAuthPlugin: No client ID found in bundle")
        return nil
    }

    @objc func ping(_ invoke: Invoke) {
        do {
            let args = try invoke.parseArgs(PingRequest.self)
            let value = args.value ?? "default"
            invoke.resolve(["value": value])
        } catch {
            invoke.reject("Failed to parse arguments", code: "PARSE_ERROR")
        }
    }

    @objc func google_sign_in(_ invoke: Invoke) {
        // Enhanced error handling and logging
        print("GoogleAuthPlugin: googleSignIn called")

        // Ensure we're on the main thread for UI operations
        DispatchQueue.main.async {
            do {
                let args = try invoke.parseArgs(GoogleSignInRequest.self)
                print("GoogleAuthPlugin: Parsed arguments successfully")

                // Check if Google Sign-In is properly configured
                guard GIDSignIn.sharedInstance.configuration != nil else {
                    print("GoogleAuthPlugin: ERROR - Google Sign-In not configured")
                    invoke.reject("Google Sign-In not configured. Missing GoogleService-Info.plist or configuration setup.", code: "NOT_CONFIGURED")
                    return
                }
                print("GoogleAuthPlugin: Google Sign-In configuration verified")

                guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                      let rootViewController = windowScene.windows.first?.rootViewController else {
                    print("GoogleAuthPlugin: ERROR - No root view controller found")
                    invoke.reject("No root view controller found", code: "NO_VIEW_CONTROLLER")
                    return
                }
                print("GoogleAuthPlugin: Root view controller found")

                // Configure additional options if provided
                if let webClientId = args.webClientId {
                    print("GoogleAuthPlugin: Configuring with provided web client ID")
                    let config = GIDConfiguration(clientID: webClientId)
                    GIDSignIn.sharedInstance.configuration = config
                }

                print("GoogleAuthPlugin: Starting sign-in process")

                // Perform sign-in with enhanced error handling
                GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController) { result, error in
                    print("GoogleAuthPlugin: Sign-in completion handler called")

                    if let error = error {
                        print("GoogleAuthPlugin: Sign-in failed with error: \(error.localizedDescription)")
                        print("GoogleAuthPlugin: Error details: \(error)")
                        invoke.reject("Google Sign-In failed: \(error.localizedDescription)", code: "SIGNIN_FAILED")
                        return
                    }

                    guard let result = result else {
                        print("GoogleAuthPlugin: No sign-in result received")
                        invoke.reject("No sign-in result", code: "NO_RESULT")
                        return
                    }

                    print("GoogleAuthPlugin: Sign-in successful, processing result")

                    let user = result.user
                    let profile = user.profile
                    let idToken = user.idToken?.tokenString
                    let accessToken = user.accessToken.tokenString

                    print("GoogleAuthPlugin: User ID: \(user.userID ?? "unknown")")
                    print("GoogleAuthPlugin: User email: \(profile?.email ?? "unknown")")
                    print("GoogleAuthPlugin: Has ID token: \(idToken != nil)")

                    let response: [String: Any] = [
                        "success": true,
                        "token": accessToken,
                        "idToken": idToken ?? "",
                        "displayName": profile?.name ?? "",
                        "email": profile?.email ?? "",
                        "userId": user.userID ?? "",
                        "photoUrl": profile?.imageURL(withDimension: 320)?.absoluteString ?? "",
                        "givenName": profile?.givenName ?? "",
                        "familyName": profile?.familyName ?? ""
                    ]

                    print("GoogleAuthPlugin: Resolving with success response")
                    invoke.resolve(response)
                }
            } catch {
                print("GoogleAuthPlugin: Failed to parse arguments: \(error)")
                invoke.reject("Failed to parse arguments: \(error.localizedDescription)", code: "PARSE_ERROR")
            }
        }
    }

    @objc func google_sign_out(_ invoke: Invoke) {
        GIDSignIn.sharedInstance.signOut()
        invoke.resolve(["success": true])
    }

    @objc func is_signed_in(_ invoke: Invoke) {
        let isSignedIn = GIDSignIn.sharedInstance.currentUser != nil
        invoke.resolve(["isSignedIn": isSignedIn])
    }
}

// MARK: - Request/Response Models

struct PingRequest: Decodable {
    let value: String?
}

struct GoogleSignInRequest: Decodable {
    let filterByAuthorizedAccounts: Bool?
    let autoSelectEnabled: Bool?
    let nonce: String?
    let webClientId: String?
}

// MARK: - Plugin Registration

@_cdecl("init_plugin_google_auth")
func initPluginGoogleAuth() -> Plugin {
    return GoogleAuthPlugin()
}
