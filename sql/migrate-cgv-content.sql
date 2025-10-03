-- Migration for CGV (Conditions Générales de Vente) content
-- Run this after the schema has been created

BEGIN;

-- Update French CGV content
UPDATE content_translations
SET
    content = '<h2>Préambule</h2>
<p>Les présentes conditions générales de vente (ci-après « CGV ») s''appliquent à toutes les prestations conclues via l''application mobile et le site web <strong>Be Out</strong>, propriété de la société Be Out.</p>
<p>Be Out est un service de Wendy David, auto-entrepreneuse, située à l''adresse professionnelle qui sera communiquée, avec pour adresse mail : <strong>contact@be-out.app</strong></p>
<p>En validant son achat, l''Utilisateur reconnaît avoir pris connaissance et accepté les présentes CGV. Toute réservation est définitive et non remboursable, sauf en cas d''annulation de l''événement par le Partenaire.</p>

<h2>Article 1 – Contenu et champ d''application</h2>
<p>Les présentes CGV encadrent la vente d''offres <strong>culturelles et sportives</strong> (billets, invitations, accès de dernière minute, etc.) proposées sur l''application mobile et le site web Be Out. Elles s''appliquent à l''exclusion de toutes autres conditions, notamment celles propres aux Partenaires ou à d''autres canaux de distribution. Toute commande via Be Out vaut acceptation pleine et entière des présentes conditions.</p>

<h2>Article 2 – Droit de rétractation</h2>
<p>Conformément à l''article L221-28 du Code de la consommation, le droit de rétractation ne s''applique pas aux prestations de loisirs fournies à une date ou période déterminée, ce qui inclut les événements culturels et sportifs proposés via Be Out.</p>

<h2>Article 3 – Description du Service</h2>
<p>Be Out permet à ses Utilisateurs d''accéder à des offres de dernière minute dans les domaines de la culture et du sport, à prix réduits. Be Out agit en qualité d''intermédiaire technique entre les Partenaires (théâtres, cinémas, salles de concert, clubs sportifs, organisateurs d''événements, etc.) et les Utilisateurs. L''achat effectué via Be Out donne droit à une prestation fournie directement par le Partenaire.</p>

<h2>Article 4 – Prix</h2>
<p>Les prix sont exprimés en euros, toutes taxes comprises (TTC). Ils sont fermes et définitifs, sauf mention particulière indiquée dans l''offre.</p>

<h2>Article 5 – Paiement</h2>
<p>Le paiement est réalisé en ligne via des prestataires sécurisés (ex : Stripe, Apple Pay, etc.). La commande est considérée comme validée uniquement après encaissement effectif du montant dû. Une confirmation d''achat est envoyée par email et le justificatif (billet, QR code ou autre preuve d''accès) est disponible dans l''espace « Mes Réservations » de l''application.</p>

<h2>Article 6 – Compte et données</h2>
<p>Lors de la création d''un compte, l''Utilisateur renseigne : Nom, Prénom, Adresse email, Numéro de téléphone (optionnel). Ces informations sont utilisées pour assurer le bon déroulement de la commande et peuvent être communiquées aux Partenaires afin de garantir l''accès à la prestation. Avec accord explicite de l''Utilisateur, ses données peuvent également être utilisées à des fins promotionnelles (ex : newsletters).</p>

<h2>Article 7 – Processus d''achat</h2>
<ol>
<li>L''Utilisateur sélectionne une offre disponible via l''application.</li>
<li>Il confirme son achat en procédant au paiement sécurisé.</li>
<li>Une confirmation est envoyée par email et le billet/QR code est accessible dans l''espace « Mes Réservations ».</li>
</ol>

<h2>Article 8 – Annulation et remboursement</h2>
<p>Toutes les commandes sont fermes et définitives. Un remboursement est uniquement possible si : l''événement est annulé par le Partenaire ou le lieu est fermé de manière exceptionnelle. Dans ces cas, Be Out procède au remboursement intégral dans un délai de 14 jours maximum.</p>

<h2>Article 9 – Responsabilités</h2>
<p>Be Out agit exclusivement comme intermédiaire. La société n''est pas responsable de la qualité, du contenu ou du déroulement des prestations fournies par les Partenaires. En cas d''annulation, de modification ou de litige lié à un événement culturel ou sportif, la responsabilité incombe au Partenaire.</p>

<h2>Article 10 – Propriété intellectuelle</h2>
<p>L''application, son contenu, son design et la marque <strong>Be Out</strong> sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou utilisation sans autorisation préalable est interdite.</p>

<h2>Article 11 – Données personnelles</h2>
<p>Les données personnelles collectées sont traitées conformément à la Politique de Confidentialité de Be Out et au RGPD. L''Utilisateur dispose d''un droit d''accès, de rectification et de suppression de ses données en contactant Be Out à l''adresse <strong>contact@be-out.app</strong>.</p>

<h2>Article 12 – Service client</h2>
<p>Pour toute question ou réclamation, l''Utilisateur peut contacter Be Out à l''adresse : <strong>contact@be-out.app</strong></p>

<h2>Article 13 – Modifications des CGV</h2>
<p>Be Out se réserve le droit de modifier les présentes CGV à tout moment. Les Utilisateurs seront informés de toute modification par notification dans l''application, via le site web ou par email.</p>

<h2>Article 14 – Droit applicable et juridiction</h2>
<p>Les présentes CGV sont régies par le droit français. En cas de litige, les tribunaux français compétents seront seuls compétents après tentative de résolution amiable.</p>',
    meta_description = 'Conditions générales de vente pour l''achat de billets d''événements culturels et sportifs sur Be Out.'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-vente')
AND language = 'fr';

-- Update English CGV content
UPDATE content_translations
SET
    content = '<h2>Preamble</h2>
<p>These general terms of sale (hereinafter "GTS") apply to all services concluded via the <strong>Be Out</strong> mobile application and website, owned by Be Out company.</p>
<p>Be Out is a service of Wendy David, sole proprietor, located at the professional address that will be communicated, with email address: <strong>contact@be-out.app</strong></p>
<p>By validating their purchase, the User acknowledges having read and accepted these GTS. Any reservation is final and non-refundable, except in case of event cancellation by the Partner.</p>

<h2>Article 1 – Content and scope</h2>
<p>These GTS frame the sale of <strong>cultural and sporting</strong> offers (tickets, invitations, last-minute access, etc.) offered on the Be Out mobile application and website. They apply to the exclusion of all other conditions, particularly those specific to Partners or other distribution channels. Any order via Be Out constitutes full and complete acceptance of these conditions.</p>

<h2>Article 2 – Right of withdrawal</h2>
<p>In accordance with article L221-28 of the Consumer Code, the right of withdrawal does not apply to leisure services provided on a specific date or period, which includes cultural and sporting events offered via Be Out.</p>

<h2>Article 3 – Service description</h2>
<p>Be Out allows its Users to access last-minute offers in the fields of culture and sport, at reduced prices. Be Out acts as a technical intermediary between Partners (theaters, cinemas, concert halls, sports clubs, event organizers, etc.) and Users. Purchases made via Be Out give right to a service provided directly by the Partner.</p>

<h2>Article 4 – Prices</h2>
<p>Prices are expressed in euros, all taxes included (ATI). They are firm and final, except for special mention indicated in the offer.</p>

<h2>Article 5 – Payment</h2>
<p>Payment is made online via secure providers (e.g. Stripe, Apple Pay, etc.). The order is considered validated only after effective collection of the amount due. A purchase confirmation is sent by email and the proof (ticket, QR code or other access proof) is available in the "My Reservations" space of the application.</p>

<h2>Article 6 – Account and data</h2>
<p>When creating an account, the User provides: Last name, First name, Email address, Phone number (optional). This information is used to ensure the smooth running of the order and may be communicated to Partners to guarantee access to the service. With explicit agreement from the User, their data may also be used for promotional purposes (e.g. newsletters).</p>

<h2>Article 7 – Purchase process</h2>
<ol>
<li>The User selects an available offer via the application.</li>
<li>They confirm their purchase by proceeding with secure payment.</li>
<li>A confirmation is sent by email and the ticket/QR code is accessible in the "My Reservations" space.</li>
</ol>

<h2>Article 8 – Cancellation and refund</h2>
<p>All orders are firm and final. A refund is only possible if: the event is cancelled by the Partner or the venue is exceptionally closed. In these cases, Be Out proceeds with the full refund within a maximum period of 14 days.</p>

<h2>Article 9 – Responsibilities</h2>
<p>Be Out acts exclusively as an intermediary. The company is not responsible for the quality, content or conduct of services provided by Partners. In case of cancellation, modification or dispute related to a cultural or sporting event, the responsibility lies with the Partner.</p>

<h2>Article 10 – Intellectual property</h2>
<p>The application, its content, design and the <strong>Be Out</strong> brand are protected by intellectual property law. Any reproduction or use without prior authorization is prohibited.</p>

<h2>Article 11 – Personal data</h2>
<p>Personal data collected is processed in accordance with Be Out''s Privacy Policy and GDPR. The User has the right to access, rectify and delete their data by contacting Be Out at <strong>contact@be-out.app</strong>.</p>

<h2>Article 12 – Customer service</h2>
<p>For any questions or complaints, the User can contact Be Out at: <strong>contact@be-out.app</strong></p>

<h2>Article 13 – Modifications of the GTS</h2>
<p>Be Out reserves the right to modify these GTS at any time. Users will be informed of any modification by notification in the application, via the website or by email.</p>

<h2>Article 14 – Applicable law and jurisdiction</h2>
<p>These GTS are governed by French law. In case of dispute, competent French courts will have sole jurisdiction after attempting amicable resolution.</p>',
    title = 'Terms of Sale'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-vente')
AND language = 'en';

-- Update Spanish CGV content
UPDATE content_translations
SET
    content = '<h2>Preámbulo</h2>
<p>Estos términos generales de venta (en adelante "TGV") se aplican a todos los servicios contratados a través de la aplicación móvil y el sitio web <strong>Be Out</strong>, propiedad de la empresa Be Out.</p>
<p>Be Out es un servicio de Wendy David, autónoma, ubicada en la dirección profesional que será comunicada, con dirección de correo electrónico: <strong>contact@be-out.app</strong></p>
<p>Al validar su compra, el Usuario reconoce haber leído y aceptado estos TGV. Cualquier reserva es final y no reembolsable, excepto en caso de cancelación del evento por parte del Socio.</p>

<h2>Artículo 1 – Contenido y alcance</h2>
<p>Estos TGV enmarcan la venta de ofertas <strong>culturales y deportivas</strong> (boletos, invitaciones, acceso de último minuto, etc.) ofrecidas en la aplicación móvil y sitio web Be Out. Se aplican con exclusión de todas las demás condiciones, particularmente aquellas específicas de los Socios u otros canales de distribución. Cualquier pedido a través de Be Out constituye aceptación completa de estas condiciones.</p>

<h2>Artículo 2 – Derecho de retractación</h2>
<p>De acuerdo con el artículo L221-28 del Código del Consumidor, el derecho de retractación no se aplica a los servicios de ocio proporcionados en una fecha o período específico, lo que incluye eventos culturales y deportivos ofrecidos a través de Be Out.</p>

<h2>Artículo 3 – Descripción del servicio</h2>
<p>Be Out permite a sus Usuarios acceder a ofertas de último minuto en los campos de la cultura y el deporte, a precios reducidos. Be Out actúa como intermediario técnico entre los Socios (teatros, cines, salas de conciertos, clubes deportivos, organizadores de eventos, etc.) y los Usuarios. Las compras realizadas a través de Be Out dan derecho a un servicio proporcionado directamente por el Socio.</p>

<h2>Artículo 4 – Precios</h2>
<p>Los precios se expresan en euros, todos los impuestos incluidos (TII). Son firmes y finales, excepto por mención especial indicada en la oferta.</p>

<h2>Artículo 5 – Pago</h2>
<p>El pago se realiza en línea a través de proveedores seguros (ej. Stripe, Apple Pay, etc.). El pedido se considera validado solo después de la recaudación efectiva del monto adeudado. Se envía una confirmación de compra por correo electrónico y la prueba (boleto, código QR u otra prueba de acceso) está disponible en el espacio "Mis Reservas" de la aplicación.</p>

<h2>Artículo 6 – Cuenta y datos</h2>
<p>Al crear una cuenta, el Usuario proporciona: Apellido, Nombre, Dirección de correo electrónico, Número de teléfono (opcional). Esta información se utiliza para asegurar el buen funcionamiento del pedido y puede ser comunicada a los Socios para garantizar el acceso al servicio. Con acuerdo explícito del Usuario, sus datos también pueden ser utilizados para fines promocionales (ej. boletines).</p>

<h2>Artículo 7 – Proceso de compra</h2>
<ol>
<li>El Usuario selecciona una oferta disponible a través de la aplicación.</li>
<li>Confirman su compra procediendo con el pago seguro.</li>
<li>Se envía una confirmación por correo electrónico y el boleto/código QR es accesible en el espacio "Mis Reservas".</li>
</ol>

<h2>Artículo 8 – Cancelación y reembolso</h2>
<p>Todos los pedidos son firmes y finales. Un reembolso solo es posible si: el evento es cancelado por el Socio o el lugar está excepcionalmente cerrado. En estos casos, Be Out procede con el reembolso completo dentro de un período máximo de 14 días.</p>

<h2>Artículo 9 – Responsabilidades</h2>
<p>Be Out actúa exclusivamente como intermediario. La empresa no es responsable de la calidad, contenido o conducta de los servicios proporcionados por los Socios. En caso de cancelación, modificación o disputa relacionada con un evento cultural o deportivo, la responsabilidad recae en el Socio.</p>

<h2>Artículo 10 – Propiedad intelectual</h2>
<p>La aplicación, su contenido, diseño y la marca <strong>Be Out</strong> están protegidos por la ley de propiedad intelectual. Cualquier reproducción o uso sin autorización previa está prohibido.</p>

<h2>Artículo 11 – Datos personales</h2>
<p>Los datos personales recopilados se procesan de acuerdo con la Política de Privacidad de Be Out y el RGPD. El Usuario tiene derecho a acceder, rectificar y eliminar sus datos contactando a Be Out en <strong>contact@be-out.app</strong>.</p>

<h2>Artículo 12 – Atención al cliente</h2>
<p>Para cualquier pregunta o queja, el Usuario puede contactar a Be Out en: <strong>contact@be-out.app</strong></p>

<h2>Artículo 13 – Modificaciones de los TGV</h2>
<p>Be Out se reserva el derecho de modificar estos TGV en cualquier momento. Los usuarios serán informados de cualquier modificación por notificación en la aplicación, a través del sitio web o por correo electrónico.</p>

<h2>Artículo 14 – Ley aplicable y jurisdicción</h2>
<p>Estos TGV se rigen por la ley francesa. En caso de disputa, los tribunales competentes franceses tendrán jurisdicción exclusiva después de intentar una resolución amistosa.</p>',
    title = 'Términos de Venta'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-vente')
AND language = 'es';

COMMIT;
