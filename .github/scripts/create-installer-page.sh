#!/bin/bash

# This script creates the HTML installer page for mobile apps

HAS_IOS="$1"
HAS_ANDROID="$2"
GITHUB_PAGES_URL="$3"
IPA_NAME="$4"
APK_NAME="$5"
BUILD_NUMBER="$6"
COMMIT_SHA="$7"
BRANCH_NAME="$8"
BUILD_DATE="$9"

# Create the base HTML structure
cat > web-installer/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installateur Be Out Mobile</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 700px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            background: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .platform-section {
            margin: 30px 0;
            padding: 20px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            background: #fff;
        }
        .install-button {
            display: inline-block;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            margin: 15px 10px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .ios-button {
            background: linear-gradient(135deg, #007AFF, #0051D5);
        }
        .android-button {
            background: linear-gradient(135deg, #34A853, #137333);
        }
        .install-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #856404;
        }
        .step {
            text-align: left;
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #007AFF;
        }
        .android-step {
            border-left-color: #34A853;
        }
        .build-info {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            color: #666;
            font-size: 14px;
        }
        .device-detection {
            margin: 20px 0;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 8px;
            color: #1565c0;
        }
        .platform-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
    </style>
    <script>
        function detectPlatform() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
            const isAndroid = /android/i.test(userAgent);
            return { isIOS, isAndroid };
        }

        function updateUI() {
            const { isIOS, isAndroid } = detectPlatform();
            const detectionDiv = document.getElementById('device-detection');

            if (isIOS) {
                detectionDiv.innerHTML = '📱 Appareil iOS détecté - Installation iOS recommandée';
                detectionDiv.style.background = '#e3f2fd';
            } else if (isAndroid) {
                detectionDiv.innerHTML = '📱 Appareil Android détecté - Installation Android recommandée';
                detectionDiv.style.background = '#e8f5e8';
            } else {
                detectionDiv.innerHTML = '💻 Ordinateur détecté - Choisissez votre plateforme mobile ci-dessous';
                detectionDiv.style.background = '#f3e5f5';
            }
        }

        window.onload = updateUI;
    </script>
</head>
<body>
    <div class="container">
        <h1>📱 Application Mobile Be Out</h1>
        <p>Installez la dernière version de développement de Be Out sur votre appareil mobile</p>

        <div class="build-info">
            <h2>📋 Version #${BUILD_NUMBER}</h2>
            <p><strong>Commit :</strong> <code>${COMMIT_SHA}</code></p>
            <p><strong>Branche :</strong> ${BRANCH_NAME}</p>
            <p><strong>Date de génération :</strong> ${BUILD_DATE}</p>
EOF

if [ "$HAS_IOS" = "true" ]; then
    echo "            <p><strong>Fichier iOS IPA :</strong> ${IPA_NAME}</p>" >> web-installer/index.html
fi

if [ "$HAS_ANDROID" = "true" ]; then
    echo "            <p><strong>Fichier Android APK :</strong> ${APK_NAME}</p>" >> web-installer/index.html
fi

cat >> web-installer/index.html << 'EOF'
        </div>

        <div id="device-detection" class="device-detection">
            Détection de votre appareil...
        </div>
EOF

# Add iOS section if available
if [ "$HAS_IOS" = "true" ]; then
    cat >> web-installer/index.html << EOF

        <div class="platform-section">
            <div class="platform-icon">🍎</div>
            <h2>iOS (iPhone/iPad)</h2>

            <div class="warning">
                <strong>⚠️ Prérequis iOS :</strong>
                <ul style="text-align: left; margin: 10px 0;">
                    <li>L'UDID de votre appareil doit être enregistré dans le profil de provisioning</li>
                    <li>Fonctionne uniquement dans Safari (pas Chrome ou autres)</li>
                    <li>Vous devrez faire confiance au certificat développeur après l'installation</li>
                </ul>
            </div>

            <a href="itms-services://?action=download-manifest&url=${GITHUB_PAGES_URL}/manifest.plist" class="install-button ios-button">
                📥 Installer l'App iOS
            </a>

            <h3>Étapes d'installation iOS :</h3>
            <div class="step">
                <strong>1.</strong> Appuyez sur "Installer l'App iOS" ci-dessus (fonctionne uniquement dans Safari iOS)
            </div>
            <div class="step">
                <strong>2.</strong> Quand demandé, appuyez sur "Installer" pour télécharger l'app
            </div>
            <div class="step">
                <strong>3.</strong> Allez dans Réglages → Général → Gestion VPN et appareils
            </div>
            <div class="step">
                <strong>4.</strong> Trouvez votre certificat développeur et appuyez sur "Faire confiance"
            </div>
            <div class="step">
                <strong>5.</strong> Activez le Mode Développeur dans Réglages → Confidentialité et sécurité → Mode développeur
            </div>
            <div class="step">
                <strong>6.</strong> L'app devrait maintenant fonctionner sur votre écran d'accueil
            </div>
        </div>
EOF
fi

# Add Android section if available
if [ "$HAS_ANDROID" = "true" ]; then
    cat >> web-installer/index.html << EOF

        <div class="platform-section">
            <div class="platform-icon">🤖</div>
            <h2>Android</h2>

            <div class="warning">
                <strong>⚠️ Prérequis Android :</strong>
                <ul style="text-align: left; margin: 10px 0;">
                    <li>Activez "Installer des apps inconnues" pour votre navigateur</li>
                    <li>Ceci est un APK de débogage/non signé pour les tests</li>
                    <li>Vous pourriez voir des avertissements de sécurité - c'est normal pour les versions de développement</li>
                </ul>
            </div>

            <a href="${GITHUB_PAGES_URL}/${APK_NAME}" class="install-button android-button" download>
                📥 Télécharger l'APK Android
            </a>

            <h3>Étapes d'installation Android :</h3>
            <div class="step android-step">
                <strong>1.</strong> Appuyez sur "Télécharger l'APK Android" ci-dessus
            </div>
            <div class="step android-step">
                <strong>2.</strong> Quand le téléchargement est terminé, appuyez sur le fichier APK dans vos notifications
            </div>
            <div class="step android-step">
                <strong>3.</strong> Si demandé, activez "Installer des apps inconnues" pour votre navigateur
            </div>
            <div class="step android-step">
                <strong>4.</strong> Appuyez sur "Installer" quand Android demande confirmation
            </div>
            <div class="step android-step">
                <strong>5.</strong> L'app apparaîtra dans votre tiroir d'applications une fois installée
            </div>
        </div>
EOF
fi

# Add build information footer
cat >> web-installer/index.html << 'EOF'
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3>🆘 Besoin d'aide ?</h3>
            <p>Si vous rencontrez des problèmes :</p>
            <ul style="text-align: left;">
                <li><strong>iOS :</strong> Assurez-vous que l'UDID de votre appareil est enregistré chez le développeur</li>
                <li><strong>Android :</strong> Activez "Sources inconnues" dans les paramètres de sécurité Android</li>
                <li><strong>Les deux :</strong> Ce sont des versions de développement - certaines fonctionnalités peuvent ne pas fonctionner parfaitement</li>
            </ul>
            <p>Contactez l'équipe de développement si vous continuez à avoir des problèmes.</p>
        </div>
    </div>
</body>
</html>
EOF
