import java.util.Properties

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.plugin.../../plugins/tauri-plugin-google-signin google-signin"
    compileSdk = 34

    defaultConfig {
        minSdk = 21

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    signingConfigs {
        if (System.getenv("CI") == "true" && System.getenv("KEYSTORE_PATH") != null) {
            create("release") {
                storeFile = file(System.getenv("KEYSTORE_PATH"))
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        } else {
            // Load keystore properties from git-ignored file
            val keystoreProperties = Properties().apply {
                val propFile = file("../src-tauri/keystore.properties")
                if (propFile.exists()) {
                    propFile.inputStream().use { load(it) }
                }
            }

            if (keystoreProperties.containsKey("keyAlias")) {
                create("release") {
                    storeFile = file("../src-tauri/${keystoreProperties["storeFile"]}")
                    storePassword = keystoreProperties["storePassword"] as String
                    keyAlias = keystoreProperties["keyAlias"] as String
                    keyPassword = keystoreProperties["keyPassword"] as String
                }
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.findByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }

afterEvaluate {
    if (System.getenv("CI") == "true") {
        val signingConfig = android.signingConfigs.findByName("release")
        // Fail the build if signingConfig is missing or any value is missing
        if (signingConfig == null ||
            signingConfig.storeFile == null ||
            signingConfig.storePassword.isNullOrBlank() ||
            signingConfig.keyAlias.isNullOrBlank() ||
            signingConfig.keyPassword.isNullOrBlank()
        ) {
            throw GradleException("Signing config for release build is missing or incomplete. Please check your environment variables.")
        }
    }
}

dependencies {

    implementation("androidx.core:core-ktx:1.9.0")
    implementation("androidx.appcompat:appcompat:1.6.0")
    implementation("com.google.android.material:material:1.7.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    implementation(project(":tauri-android"))
}
