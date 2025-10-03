-- Migration for Politique de Confidentialité content
-- Run this after the schema has been created

BEGIN;

-- Update French Politique de Confidentialité content
UPDATE content_translations
SET
    content = '<p>La société Be Out, opérée par Wendy David – Auto-entrepreneur (SIRET à venir), attache une grande importance à la protection des données personnelles de ses utilisateurs. La présente Politique de Confidentialité explique quelles données nous collectons, pourquoi, comment elles sont utilisées, avec qui elles peuvent être partagées, et quels sont vos droits.</p>
<p><strong>Contact RGPD :</strong></p>
<p>Adresse du siège : [adresse complète]</p>
<p>E-mail RGPD : <strong>contact@be-out.app</strong></p>

<h2>1. Responsable du traitement</h2>
<p>Be Out, opérée par Wendy David – Auto-entrepreneur (SIRET à venir) est responsable du traitement des données collectées via l''Application.</p>

<h2>2. Données collectées</h2>
<ul>
<li><strong>Données d''identification :</strong> prénom, nom, adresse e-mail, numéro de téléphone.</li>
<li><strong>Données de connexion / usage :</strong> identifiants de compte, historique de navigation dans l''App, pages consultées, événements recherchés.</li>
<li><strong>Données de paiement :</strong> nous ne stockons pas directement vos données bancaires sensibles — ces données sont traitées via des prestataires sécurisés (ex. Stripe, PayPal).</li>
<li><strong>Données de réservation / transaction :</strong> événements réservés, horodatage, statuts des transactions.</li>
<li><strong>Préférences :</strong> vos choix (notifications, filtres, alertes), centres d''intérêt.</li>
</ul>

<h2>3. Finalités du traitement</h2>
<p>Nous utilisons vos données pour :</p>
<ul>
<li>Créer et gérer votre compte utilisateur.</li>
<li>Gérer vos réservations et paiements.</li>
<li>Vous envoyer des notifications, newsletters ou offres ciblées (si vous y consentez).</li>
<li>Améliorer, personnaliser et sécuriser l''expérience utilisateur.</li>
<li>Détecter, prévenir et lutter contre la fraude.</li>
<li>Répondre à vos demandes de support ou réclamations.</li>
</ul>

<h2>4. Base légale du traitement</h2>
<p>Nos traitements reposent sur les fondements suivants :</p>
<ul>
<li><strong>Exécution d''un contrat :</strong> pour gérer votre compte, vos réservations, paiements.</li>
<li><strong>Consentement :</strong> pour les communications marketing (newsletter, notifications).</li>
<li><strong>Intérêt légitime :</strong> optimisation de l''Application, prévention de la fraude, sécurité.</li>
</ul>

<h2>5. Destinataires des données</h2>
<p>Vos données peuvent être partagées avec :</p>
<ul>
<li>Les salles / organisateurs partenaires (pour confirmer les réservations).</li>
<li>Nos prestataires techniques (hébergement, services de paiement, emailing).</li>
<li>Les autorités compétentes si la loi l''exige (ex. en cas de demande légale).</li>
</ul>
<p>Chacun de ces partenaires est soumis à des obligations contractuelles de confidentialité et de protection.</p>

<h2>6. Durée de conservation</h2>
<ul>
<li><strong>Données de compte :</strong> conservées tant que vous utilisez l''Application (et pendant une durée raisonnable après fermeture de compte, pour archiver les données légales).</li>
<li><strong>Données de réservation / transaction :</strong> conservées pendant 5 ans, conformément aux obligations légales en matière comptable / fiscale.</li>
<li><strong>Données marketing :</strong> conservées jusqu''au retrait de votre consentement (si vous désactivez les mails / notifications).</li>
</ul>

<h2>7. Vos droits</h2>
<p>Vous disposez des droits suivants :</p>
<ul>
<li><strong>Droit d''accès :</strong> demander la copie des données que nous détenons.</li>
<li><strong>Droit de rectification :</strong> corriger des données inexactes.</li>
<li><strong>Droit à la suppression :</strong> demander l''effacement de vos données (dans les limites légales).</li>
<li><strong>Droit à la limitation du traitement.</strong></li>
<li><strong>Droit d''opposition :</strong> notamment aux traitements à finalité marketing.</li>
<li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré, couramment utilisé.</li>
</ul>
<p>Pour exercer vos droits, contactez-nous via l''adresse <strong>contact@be-out.app</strong>. Nous traiterons votre demande sous 30 jours au maximum.</p>

<h2>8. Désinscription & suppression du compte</h2>
<p>Pour vous désinscrire de la newsletter : lien de désabonnement présent en bas de chaque e-mail envoyé.</p>
<p>Pour supprimer votre compte : envoyez une demande à <strong>contact@be-out.app</strong> avec l''objet « Suppression de compte », ou utilisez l''option dans l''Application (Paramètres > Supprimer mon compte).</p>
<p>Après suppression, vos données seront effacées ou anonymisées dans un délai raisonnable, sauf si une conservation est légalement requise.</p>

<h2>9. Sécurité des données</h2>
<p>Nous stockons vos données sur des serveurs sécurisés localisés en France / UE. Nous mettons en œuvre des mesures techniques et organisationnelles (chiffrement, contrôle d''accès, sauvegardes, etc.) pour prévenir toute perte, accès non autorisé ou divulgation.</p>

<h2>10. Cookies & traceurs</h2>
<p>Nous utilisons des cookies / traceurs pour :</p>
<ul>
<li>Assurer le fonctionnement de l''Application (cookies nécessaires).</li>
<li>Analyser l''usage (statistiques anonymes).</li>
<li>Vous proposer des contenus personnalisés (si vous y consentez).</li>
</ul>
<p>Vous pouvez accepter, refuser ou retirer votre consentement à tout moment via les paramètres de l''Application.</p>

<h2>11. Modification de la politique</h2>
<p>Nous pouvons être amenés à modifier la présente Politique de Confidentialité (ex. pour respecter une nouvelle législation). La date de la version en vigueur sera toujours indiquée en haut du document. En cas de modification significative, nous vous informerons par notification ou e-mail.</p>',
    meta_description = 'Politique de confidentialité et protection des données personnelles conformément au RGPD pour l''application Be Out.'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'politique-confidentialite')
AND language = 'fr';

-- Update English Politique de Confidentialité content
UPDATE content_translations
SET
    content = '<p>Be Out company, operated by Wendy David – Sole proprietor (SIRET to come), attaches great importance to protecting the personal data of its users. This Privacy Policy explains what data we collect, why, how it is used, with whom it may be shared, and what your rights are.</p>
<p><strong>GDPR Contact:</strong></p>
<p>Headquarters address: [complete address]</p>
<p>GDPR Email: <strong>contact@be-out.app</strong></p>

<h2>1. Data Controller</h2>
<p>Be Out, operated by Wendy David – Sole proprietor (SIRET to come) is responsible for processing data collected via the Application.</p>

<h2>2. Data Collected</h2>
<ul>
<li><strong>Identification data:</strong> first name, last name, email address, phone number.</li>
<li><strong>Connection/usage data:</strong> account identifiers, app browsing history, pages viewed, events searched.</li>
<li><strong>Payment data:</strong> we do not directly store your sensitive banking data — this data is processed via secure providers (e.g. Stripe, PayPal).</li>
<li><strong>Reservation/transaction data:</strong> reserved events, timestamps, transaction statuses.</li>
<li><strong>Preferences:</strong> your choices (notifications, filters, alerts), interests.</li>
</ul>

<h2>3. Processing Purposes</h2>
<p>We use your data to:</p>
<ul>
<li>Create and manage your user account.</li>
<li>Manage your reservations and payments.</li>
<li>Send you notifications, newsletters or targeted offers (if you consent).</li>
<li>Improve, personalize and secure the user experience.</li>
<li>Detect, prevent and fight fraud.</li>
<li>Respond to your support requests or complaints.</li>
</ul>

<h2>4. Legal Basis for Processing</h2>
<p>Our processing is based on the following foundations:</p>
<ul>
<li><strong>Contract execution:</strong> to manage your account, reservations, payments.</li>
<li><strong>Consent:</strong> for marketing communications (newsletter, notifications).</li>
<li><strong>Legitimate interest:</strong> Application optimization, fraud prevention, security.</li>
</ul>

<h2>5. Data Recipients</h2>
<p>Your data may be shared with:</p>
<ul>
<li>Partner venues/organizers (to confirm reservations).</li>
<li>Our technical providers (hosting, payment services, emailing).</li>
<li>Competent authorities if required by law (e.g. in case of legal request).</li>
</ul>
<p>Each of these partners is subject to contractual obligations of confidentiality and protection.</p>

<h2>6. Retention Period</h2>
<ul>
<li><strong>Account data:</strong> retained as long as you use the Application (and for a reasonable period after account closure, to archive legal data).</li>
<li><strong>Reservation/transaction data:</strong> retained for 5 years, in accordance with legal obligations in accounting/tax matters.</li>
<li><strong>Marketing data:</strong> retained until withdrawal of your consent (if you disable emails/notifications).</li>
</ul>

<h2>7. Your Rights</h2>
<p>You have the following rights:</p>
<ul>
<li><strong>Right of access:</strong> request a copy of the data we hold.</li>
<li><strong>Right of rectification:</strong> correct inaccurate data.</li>
<li><strong>Right to erasure:</strong> request deletion of your data (within legal limits).</li>
<li><strong>Right to restrict processing.</strong></li>
<li><strong>Right to object:</strong> particularly to marketing processing.</li>
<li><strong>Right to portability:</strong> retrieve your data in a structured, commonly used format.</li>
</ul>
<p>To exercise your rights, contact us via <strong>contact@be-out.app</strong>. We will process your request within a maximum of 30 days.</p>

<h2>8. Unsubscription & Account Deletion</h2>
<p>To unsubscribe from the newsletter: unsubscribe link present at the bottom of each email sent.</p>
<p>To delete your account: send a request to <strong>contact@be-out.app</strong> with the subject "Account Deletion", or use the option in the Application (Settings > Delete my account).</p>
<p>After deletion, your data will be erased or anonymized within a reasonable time, unless retention is legally required.</p>

<h2>9. Data Security</h2>
<p>We store your data on secure servers located in France/EU. We implement technical and organizational measures (encryption, access control, backups, etc.) to prevent any loss, unauthorized access or disclosure.</p>

<h2>10. Cookies & Trackers</h2>
<p>We use cookies/trackers to:</p>
<ul>
<li>Ensure the Application''s operation (necessary cookies).</li>
<li>Analyze usage (anonymous statistics).</li>
<li>Offer you personalized content (if you consent).</li>
</ul>
<p>You can accept, refuse or withdraw your consent at any time via the Application settings.</p>

<h2>11. Policy Modification</h2>
<p>We may modify this Privacy Policy (e.g. to comply with new legislation). The date of the current version will always be indicated at the top of the document. In case of significant modification, we will inform you by notification or email.</p>',
    title = 'Privacy Policy'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'politique-confidentialite')
AND language = 'en';

-- Update Spanish Politique de Confidentialité content
UPDATE content_translations
SET
    content = '<p>La empresa Be Out, operada por Wendy David – Autónoma (SIRET por venir), otorga gran importancia a la protección de los datos personales de sus usuarios. Esta Política de Privacidad explica qué datos recopilamos, por qué, cómo se utilizan, con quién pueden compartirse y cuáles son sus derechos.</p>
<p><strong>Contacto RGPD:</strong></p>
<p>Dirección de la sede: [dirección completa]</p>
<p>Email RGPD: <strong>contact@be-out.app</strong></p>

<h2>1. Responsable del Tratamiento</h2>
<p>Be Out, operada por Wendy David – Autónoma (SIRET por venir) es responsable del procesamiento de datos recopilados a través de la Aplicación.</p>

<h2>2. Datos Recopilados</h2>
<ul>
<li><strong>Datos de identificación:</strong> nombre, apellido, dirección de correo electrónico, número de teléfono.</li>
<li><strong>Datos de conexión/uso:</strong> identificadores de cuenta, historial de navegación en la App, páginas vistas, eventos buscados.</li>
<li><strong>Datos de pago:</strong> no almacenamos directamente sus datos bancarios sensibles — estos datos son procesados a través de proveedores seguros (ej. Stripe, PayPal).</li>
<li><strong>Datos de reserva/transacción:</strong> eventos reservados, marcas de tiempo, estados de transacciones.</li>
<li><strong>Preferencias:</strong> sus elecciones (notificaciones, filtros, alertas), intereses.</li>
</ul>

<h2>3. Propósitos del Procesamiento</h2>
<p>Utilizamos sus datos para:</p>
<ul>
<li>Crear y gestionar su cuenta de usuario.</li>
<li>Gestionar sus reservas y pagos.</li>
<li>Enviarle notificaciones, boletines u ofertas dirigidas (si consiente).</li>
<li>Mejorar, personalizar y asegurar la experiencia del usuario.</li>
<li>Detectar, prevenir y combatir el fraude.</li>
<li>Responder a sus solicitudes de soporte o quejas.</li>
</ul>

<h2>4. Base Legal para el Procesamiento</h2>
<p>Nuestro procesamiento se basa en los siguientes fundamentos:</p>
<ul>
<li><strong>Ejecución del contrato:</strong> para gestionar su cuenta, reservas, pagos.</li>
<li><strong>Consentimiento:</strong> para comunicaciones de marketing (boletín, notificaciones).</li>
<li><strong>Interés legítimo:</strong> optimización de la Aplicación, prevención del fraude, seguridad.</li>
</ul>

<h2>5. Destinatarios de Datos</h2>
<p>Sus datos pueden ser compartidos con:</p>
<ul>
<li>Lugares/organizadores socios (para confirmar reservas).</li>
<li>Nuestros proveedores técnicos (alojamiento, servicios de pago, emailing).</li>
<li>Autoridades competentes si lo requiere la ley (ej. en caso de solicitud legal).</li>
</ul>
<p>Cada uno de estos socios está sujeto a obligaciones contractuales de confidencialidad y protección.</p>

<h2>6. Período de Retención</h2>
<ul>
<li><strong>Datos de cuenta:</strong> retenidos mientras use la Aplicación (y por un período razonable después del cierre de cuenta, para archivar datos legales).</li>
<li><strong>Datos de reserva/transacción:</strong> retenidos por 5 años, de acuerdo con obligaciones legales en asuntos contables/fiscales.</li>
<li><strong>Datos de marketing:</strong> retenidos hasta la retirada de su consentimiento (si desactiva emails/notificaciones).</li>
</ul>

<h2>7. Sus Derechos</h2>
<p>Usted tiene los siguientes derechos:</p>
<ul>
<li><strong>Derecho de acceso:</strong> solicitar una copia de los datos que poseemos.</li>
<li><strong>Derecho de rectificación:</strong> corregir datos inexactos.</li>
<li><strong>Derecho al borrado:</strong> solicitar la eliminación de sus datos (dentro de límites legales).</li>
<li><strong>Derecho a restringir el procesamiento.</strong></li>
<li><strong>Derecho a oponerse:</strong> particularmente al procesamiento de marketing.</li>
<li><strong>Derecho a la portabilidad:</strong> recuperar sus datos en un formato estructurado, comúnmente utilizado.</li>
</ul>
<p>Para ejercer sus derechos, contáctenos a través de <strong>contact@be-out.app</strong>. Procesaremos su solicitud en un máximo de 30 días.</p>

<h2>8. Desuscripción y Eliminación de Cuenta</h2>
<p>Para desuscribirse del boletín: enlace de desuscripción presente en la parte inferior de cada correo electrónico enviado.</p>
<p>Para eliminar su cuenta: envíe una solicitud a <strong>contact@be-out.app</strong> con el asunto "Eliminación de Cuenta", o use la opción en la Aplicación (Configuración > Eliminar mi cuenta).</p>
<p>Después de la eliminación, sus datos serán borrados o anonimizados dentro de un tiempo razonable, a menos que la retención sea legalmente requerida.</p>

<h2>9. Seguridad de Datos</h2>
<p>Almacenamos sus datos en servidores seguros ubicados en Francia/UE. Implementamos medidas técnicas y organizacionales (cifrado, control de acceso, respaldos, etc.) para prevenir cualquier pérdida, acceso no autorizado o divulgación.</p>

<h2>10. Cookies y Rastreadores</h2>
<p>Utilizamos cookies/rastreadores para:</p>
<ul>
<li>Asegurar el funcionamiento de la Aplicación (cookies necesarias).</li>
<li>Analizar el uso (estadísticas anónimas).</li>
<li>Ofrecerle contenido personalizado (si consiente).</li>
</ul>
<p>Puede aceptar, rechazar o retirar su consentimiento en cualquier momento a través de la configuración de la Aplicación.</p>

<h2>11. Modificación de la Política</h2>
<p>Podemos modificar esta Política de Privacidad (ej. para cumplir con nueva legislación). La fecha de la versión actual siempre se indicará en la parte superior del documento. En caso de modificación significativa, le informaremos por notificación o correo electrónico.</p>',
    title = 'Política de Privacidad'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'politique-confidentialite')
AND language = 'es';

COMMIT;
