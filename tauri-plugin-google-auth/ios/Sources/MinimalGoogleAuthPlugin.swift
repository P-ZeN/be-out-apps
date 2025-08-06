import Foundation
import UIKit
import GoogleSignIn
import WebKit

// Minimal plugin implementation without Tauri dependency for testing
class GoogleAuthPlugin: NSObject {

    public func load(webview: WKWebView) {
        print("GoogleAuthPlugin: Minimal implementation loaded")

        // Simple hardcoded configuration test
        let hardcodedClientId = "1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"
        let config = GIDConfiguration(clientID: hardcodedClientId)
        GIDSignIn.sharedInstance.configuration = config
        print("GoogleAuthPlugin: Configured with client ID: \(hardcodedClientId)")
    }

    @objc func ping() {
        print("GoogleAuthPlugin: ping called")
    }

    @objc func googleSignIn() {
        print("GoogleAuthPlugin: googleSignIn called")
    }

    @objc func googleSignOut() {
        print("GoogleAuthPlugin: googleSignOut called")
        GIDSignIn.sharedInstance.signOut()
    }

    @objc func isSignedIn() {
        print("GoogleAuthPlugin: isSignedIn called")
        let isSignedIn = GIDSignIn.sharedInstance.currentUser != nil
        print("GoogleAuthPlugin: Current sign-in status: \(isSignedIn)")
    }
}

// Minimal plugin registration
@_cdecl("init_plugin_google_auth")
func initPluginGoogleAuth() -> UnsafeMutableRawPointer {
    let plugin = GoogleAuthPlugin()
    return Unmanaged.passRetained(plugin).toOpaque()
}
