#!/bin/bash

# Script to copy custom Android files to the generated Tauri Android project

echo "Copying GoogleAuthPlugin to generated Android project..."

# Copy the plugin file
mkdir -p "gen/android/app/src/main/java/com/beout/app/plugins"
cp "android/src/main/java/com/beout/app/plugins/GoogleAuthPlugin.kt" "gen/android/app/src/main/java/com/beout/app/plugins/"

if [ $? -eq 0 ]; then
    echo "GoogleAuthPlugin copied successfully!"
else
    echo "Failed to copy GoogleAuthPlugin"
    exit 1
fi

# Check if dependencies are already in build.gradle.kts
if grep -q "androidx.credentials:credentials" "gen/android/app/build.gradle.kts"; then
    echo "Dependencies already present in build.gradle.kts"
else
    echo "Adding Google Authentication dependencies to build.gradle.kts..."

    # Add dependencies before the closing brace of the dependencies block
    sed -i '/^dependencies {/,/^}/ {
        /^}/ i\
    // Google Authentication dependencies
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    }' "gen/android/app/build.gradle.kts"

    echo "Dependencies added to build.gradle.kts"
fi

echo "Android files setup complete!"
