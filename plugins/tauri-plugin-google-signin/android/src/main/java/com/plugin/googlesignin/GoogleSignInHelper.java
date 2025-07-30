package com.plugin.googlesignin;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

/**
 * Activity helper to be extended by the main Tauri activity
 */
public class GoogleSignInHelper {
    private static final String TAG = "GoogleSignInHelper";

    public static void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "onActivityResult: requestCode=" + requestCode + ", resultCode=" + resultCode);

        // Forward the result to the GoogleSigninPlugin
        GoogleSigninPlugin instance = GoogleSigninPlugin.getInstance();
        if (instance != null) {
            instance.handleActivityResult(requestCode, resultCode, data);
        }
    }
}
