-- Legal Pages Content Migration
-- This script updates the existing legal pages with actual content from the hard-coded JSX files
-- Run this after the initial schema has been created

BEGIN;

-- Update CGU (Conditions Générales d'Utilisation) content
UPDATE content_translations
SET
    content = '<h2>Introduction</h2>
<p>Les présentes Conditions Générales d''Utilisation (ci-après « CGU ») régissent l''utilisation de l''application <strong>Be Out</strong>, éditée par <strong>Wendy David, auto-entrepreneuse</strong>. En téléchargeant, installant ou utilisant l''Application, l''Utilisateur accepte sans réserve les présentes CGU et s''engage à en respecter l''ensemble des dispositions.</p>

<h2>Article 1 - Définitions</h2>
<p><strong>« Application »</strong> désigne l''application « Be Out » éditée par Wendy David donnant accès aux Services, qui est disponible gratuitement dans l''« Apple Store » d''Apple et le « Google Play Store » de Google pour être téléchargée par l''Utilisateur sur son terminal Apple iOS et Android.</p>
<p><strong>« Contenu »</strong> désigne sans que cette liste soit limitative, la structure de l''Application, le contenu éditorial, les illustrations, les chartes graphiques, les marques, les logos, les sigles, les dénominations sociales, les contenus visuels ainsi que tout autre contenu présent au sein de l''Application.</p>
<p><strong>« Services »</strong> désignent les différentes fonctionnalités et services proposées par l''Application.</p>
<p><strong>« Utilisateur »</strong> désigne une personne physique ayant téléchargé l''Application pour ses besoins propres, dans le cadre d''un usage strictement personnel et non commercial, sans but lucratif direct ou indirect.</p>

<h2>Article 2 – Description de l''application</h2>
<p>Be Out est une application mobile permettant aux Utilisateurs d''accéder à des billets de dernière minute à prix réduits pour des événements culturels et sportifs. Les organisateurs partenaires (ci-après les « Organisateurs ») (salles de spectacle, clubs, associations, producteurs, etc.) mettent en ligne leurs invendus directement sur l''Application.</p>
<p>L''Utilisateur peut consulter via Be Out des informations relatives à l''événement, au lieu et à la représentation associés au billet. Les partenaires s''engagent à proposer une réduction sur les places mises à disposition, sans condition de montant minimum imposée par Be Out.</p>

<h2>Article 3 – Droits et obligations des Utilisateurs</h2>
<p>En utilisant l''Application Be Out, l''Utilisateur s''engage à :</p>
<ul>
<li>Respecter les lois et réglementations en vigueur</li>
<li>Ne pas reproduire de façon permanente ou provisoire l''Application, en tout ou partie, par tout moyen et sous toute forme</li>
<li>Ne pas procéder à toute adaptation, modification, traduction, transcription, arrangement, compilation, décompilation, assemblage, désassemblage, transcodage, ni appliquer la rétro-ingénierie</li>
<li>Ne pas publier de contenu illicite, offensant, violent ou discriminatoire</li>
<li>Ne pas porter atteinte aux droits de propriété intellectuelle d''un tiers</li>
<li>Ne pas utiliser l''Application à des fins commerciales ou de revente de billets sans autorisation expresse de Be Out</li>
<li>Ne pas perturber ou endommager l''Application ou les systèmes informatiques associés</li>
</ul>

<h2>Article 4 – Responsabilité de Be Out</h2>
<p>Be Out assure la bonne exécution des transactions et la mise à disposition des billets achetés. Toutefois, Be Out ne peut garantir le respect des présentes CGU par les utilisateurs.</p>
<p>Be Out décline toute responsabilité en cas de perte, de dommage ou de préjudice lié au déroulement, au contenu ou à l''annulation d''un événement, qui relèvent de la responsabilité exclusive des Organisateurs, ou à une utilisation frauduleuse, une perte ou un vol de billets par l''Utilisateur.</p>
<p>En cas d''annulation d''un événement par l''Organisateur, Be Out procèdera au remboursement des sommes versées, hors frais annexes (transport, hébergement, etc.).</p>

<h2>Article 5 – Propriété intellectuelle</h2>
<p>Tous les Contenus présents sur l''Application Be Out, y compris les textes, images, logos, bases de données et marques, sont la propriété exclusive de Be Out ou de ses partenaires.</p>
<p>L''Utilisateur bénéficie uniquement d''un droit d''accès et d''usage personnel, non exclusif et non transférable, conformément aux présentes CGU.</p>

<h2>Article 6 – Modifications des CGU</h2>
<p>Be Out se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entreront en vigueur dès leur publication sur l''Application.</p>

<h2>Article 7 – Résiliation du contrat</h2>
<p>Be Out se réserve le droit de suspendre ou de résilier le compte d''un Utilisateur ne respectant pas les présentes CGU ou la réglementation applicable, sans préavis ni indemnité.</p>

<h2>Article 8 – Loi applicable et juridiction compétente</h2>
<p>Les présentes CGU sont régies par le droit français. Tout litige relatif à l''utilisation de l''Application sera soumis à la compétence exclusive des tribunaux français.</p>
<p>Pour toute question relative aux présentes CGU ou à l''Application Be Out, l''Utilisateur peut contacter l''éditrice à l''adresse suivante : <strong>contact@be-out.app</strong></p>',
    meta_description = 'Conditions générales d''utilisation de l''application Be Out pour les événements culturels et sportifs à prix réduits.'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-utilisation')
AND language = 'fr';

-- Update CGV (Conditions Générales de Vente) content
UPDATE content_translations
SET
    content = '<h2>Préambule</h2>
<p>Les présentes conditions générales de vente (ci-après « CGV ») s''appliquent à toutes les prestations conclues via l''application mobile et le site web <strong>Be Out</strong>, propriété de la société Be Out.</p>
<p>En validant son achat, l''Utilisateur reconnaît avoir pris connaissance et accepté les présentes CGV. Toute réservation est définitive et non remboursable, sauf en cas d''annulation de l''événement par le Partenaire.</p>

<h2>Article 1 – Contenu et champ d''application</h2>
<p>Les présentes CGV encadrent la vente d''offres <strong>culturelles et sportives</strong> (billets, invitations, accès de dernière minute, etc.) proposées sur l''application mobile et le site web Be Out. Elles s''appliquent à l''exclusion de toutes autres conditions, notamment celles propres aux Partenaires ou à d''autres canaux de distribution.</p>

<h2>Article 2 – Droit de rétractation</h2>
<p>Conformément à l''article L221-28 du Code de la consommation, le droit de rétractation ne s''applique pas aux prestations de loisirs fournies à une date ou période déterminée, ce qui inclut les événements culturels et sportifs proposés via Be Out.</p>

<h2>Article 3 – Description du Service</h2>
<p>Be Out permet à ses Utilisateurs d''accéder à des offres de dernière minute dans les domaines de la culture et du sport, à prix réduits. Be Out agit en qualité d''intermédiaire technique entre les Partenaires (théâtres, cinémas, salles de concert, clubs sportifs, organisateurs d''événements, etc.) et les Utilisateurs.</p>

<h2>Article 4 – Prix</h2>
<p>Les prix sont exprimés en euros, toutes taxes comprises (TTC). Ils sont fermes et définitifs, sauf mention particulière indiquée dans l''offre.</p>

<h2>Article 5 – Paiement</h2>
<p>Le paiement est réalisé en ligne via des prestataires sécurisés (ex : Stripe, Apple Pay, etc.). La commande est considérée comme validée uniquement après encaissement effectif du montant dû. Une confirmation d''achat est envoyée par email et le justificatif est disponible dans l''espace « Mes Réservations » de l''application.</p>

<h2>Article 6 – Compte et données</h2>
<p>Lors de la création d''un compte, l''Utilisateur renseigne : Nom, Prénom, Adresse email, Numéro de téléphone (optionnel). Ces informations sont utilisées pour assurer le bon déroulement de la commande et peuvent être communiquées aux Partenaires afin de garantir l''accès à la prestation.</p>

<h2>Article 7 – Processus d''achat</h2>
<ol>
<li>L''Utilisateur sélectionne une offre disponible via l''application.</li>
<li>Il confirme son achat en procédant au paiement sécurisé.</li>
<li>Une confirmation est envoyée par email et le billet/QR code est accessible dans l''espace « Mes Réservations ».</li>
</ol>

<h2>Article 8 – Annulation et remboursement</h2>
<p>Toutes les commandes sont fermes et définitives. Un remboursement est uniquement possible si l''événement est annulé par le Partenaire ou le lieu est fermé de manière exceptionnelle. Dans ces cas, Be Out procède au remboursement intégral dans un délai de 14 jours maximum.</p>

<h2>Article 9 – Responsabilités</h2>
<p>Be Out agit exclusivement comme intermédiaire. La société n''est pas responsable de la qualité, du contenu ou du déroulement des prestations fournies par les Partenaires. En cas d''annulation, de modification ou de litige lié à un événement, la responsabilité incombe au Partenaire.</p>

<h2>Article 10 – Propriété intellectuelle</h2>
<p>L''application, son contenu, son design et la marque <strong>Be Out</strong> sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou utilisation sans autorisation préalable est interdite.</p>

<h2>Article 11 – Données personnelles</h2>
<p>Les données personnelles collectées sont traitées conformément à la Politique de Confidentialité de Be Out et au RGPD. L''Utilisateur dispose d''un droit d''accès, de rectification et de suppression de ses données.</p>

<h2>Article 12 – Service client</h2>
<p>Pour toute question ou réclamation, l''Utilisateur peut contacter Be Out à l''adresse : <strong>contact@be-out.app</strong></p>

<h2>Article 13 – Modifications des CGV</h2>
<p>Be Out se réserve le droit de modifier les présentes CGV à tout moment. Les Utilisateurs seront informés de toute modification par notification dans l''application, via le site web ou par email.</p>

<h2>Article 14 – Droit applicable et juridiction</h2>
<p>Les présentes CGV sont régies par le droit français. En cas de litige, les tribunaux français compétents seront seuls compétents après tentative de résolution amiable.</p>',
    meta_description = 'Conditions générales de vente pour l''achat de billets d''événements culturels et sportifs sur Be Out.'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-vente')
AND language = 'fr';

-- Update Mentions Légales content
UPDATE content_translations
SET
    content = '<p>Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l''économie numérique, il est précisé aux utilisateurs de l''application Be Out l''identité des différents intervenants dans le cadre de sa réalisation et de son suivi.</p>

<h2>1. Éditeur de l''application</h2>
<ul>
<li><strong>Nom et prénom :</strong> Wendy David</li>
<li><strong>Statut :</strong> Auto-entrepreneur</li>
<li><strong>Directeur de la publication :</strong> Wendy David</li>
<li><strong>Contact (email) :</strong> contact@be-out.app</li>
</ul>

<h2>2. Hébergement</h2>
<p>L''application Be Out est hébergée par des services cloud sécurisés respectant les normes européennes de protection des données.</p>

<h2>3. Propriété intellectuelle</h2>
<p>L''ensemble du contenu de l''application (textes, images, logos, graphismes, vidéos, etc.) est protégé par le droit d''auteur et la propriété intellectuelle.</p>
<p>Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de l''application, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de l''éditeur.</p>

<h2>4. Responsabilité</h2>
<p>L''éditeur ne pourra être tenu responsable des dommages directs ou indirects causés au matériel de l''utilisateur lors de l''accès à l''application, résultant soit de l''utilisation d''un matériel ne répondant pas aux spécifications indiquées, soit de l''apparition d''un bug ou d''une incompatibilité.</p>

<h2>5. Cookies et traceurs</h2>
<p>L''application peut être amenée à utiliser des traceurs ou technologies similaires (ex. : cookies, SDK, outils d''analyse d''audience).</p>
<p>L''utilisateur est informé qu''il peut paramétrer ses préférences concernant la collecte de données et s''opposer à leur dépôt depuis l''interface dédiée dans l''application.</p>

<h2>6. Médiation de la consommation</h2>
<p>Conformément aux articles L.616-1 et R.616-1 du code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation en cas de litige avec l''éditeur.</p>
<p>Plateforme européenne de règlement en ligne des litiges : <strong>https://ec.europa.eu/consumers/odr/</strong></p>

<h2>7. Données personnelles</h2>
<p>La gestion des données personnelles collectées via l''application Be Out est détaillée dans notre Politique de confidentialité, accessible depuis l''application.</p>

<h2>8. Droit applicable et juridiction compétente</h2>
<p>Les présentes mentions légales sont régies par le droit français.</p>
<p>En cas de litige, et à défaut de solution amiable, compétence exclusive est attribuée aux tribunaux français compétents.</p>',
    meta_description = 'Mentions légales de l''application Be Out, informations sur l''éditeur, l''hébergement et les conditions d''utilisation.'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'mentions-legales')
AND language = 'fr';

-- Update Politique de Confidentialité content (already have the content from earlier)
UPDATE content_translations
SET
    content = '<p>La société Be Out, opérée par Wendy David – Auto-entrepreneur, attache une grande importance à la protection des données personnelles de ses utilisateurs. La présente Politique de Confidentialité explique quelles données nous collectons, pourquoi, comment elles sont utilisées, avec qui elles peuvent être partagées, et quels sont vos droits.</p>
<p><strong>Contact RGPD :</strong> contact@be-out.app</p>

<h2>1. Responsable du traitement</h2>
<p>Be Out, opérée par Wendy David – Auto-entrepreneur est responsable du traitement des données collectées via l''Application.</p>

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
<p>Pour vous désinscrire de la newsletter : lien de désinscription présent en bas de chaque e-mail envoyé.</p>
<p>Pour supprimer votre compte : envoyez une demande à <strong>contact@be-out.app</strong> avec l''objet « Suppression de compte », ou utilisez l''option dans l''Application (Paramètres > Supprimer mon compte).</p>

<h2>9. Sécurité des données</h2>
<p>Nous stockons vos données sur des serveurs sécurisés localisés en France / UE. Nous mettons en œuvre des mesures techniques et organisationnelles (chiffrement, contrôle d''accès, sauvegardes, etc.) pour prévenir toute perte, accès non autorisé ou divulgation.</p>

<h2>10. Cookies & traceurs</h2>
<p>Nous utilisons des cookies / traceurs pour assurer le fonctionnement de l''Application (cookies nécessaires), analyser l''usage (statistiques anonymes), et vous proposer des contenus personnalisés (si vous y consentez).</p>
<p>Vous pouvez accepter, refuser ou retirer votre consentement à tout moment via les paramètres de l''Application.</p>

<h2>11. Modification de la politique</h2>
<p>Nous pouvons être amenés à modifier la présente Politique de Confidentialité (ex. pour respecter une nouvelle législation). La date de la version en vigueur sera toujours indiquée en haut du document. En cas de modification significative, nous vous informerons par notification ou e-mail.</p>',
    meta_description = 'Politique de confidentialité et protection des données personnelles conformément au RGPD pour l''application Be Out.'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'politique-confidentialite')
AND language = 'fr';

-- Add basic English translations for legal pages
UPDATE content_translations
SET
    content = '<h2>Introduction</h2>
<p>These General Terms of Use (hereinafter "GTU") govern the use of the <strong>Be Out</strong> application, published by <strong>Wendy David, sole proprietor</strong>. By downloading, installing or using the Application, the User unreservedly accepts these GTU and undertakes to comply with all of their provisions.</p>

<h2>Article 1 - Definitions</h2>
<p><strong>"Application"</strong> means the "Be Out" application published by Wendy David providing access to the Services, which is available free of charge in Apple''s "Apple Store" and Google''s "Google Play Store" for download by the User on their Apple iOS and Android terminal.</p>
<p><strong>"Content"</strong> means, without this list being exhaustive, the structure of the Application, editorial content, illustrations, graphic charters, trademarks, logos, symbols, corporate names, visual content as well as any other content present within the Application.</p>
<p><strong>"Services"</strong> means the various functionalities and services offered by the Application.</p>
<p><strong>"User"</strong> means a natural person who has downloaded the Application for their own needs, within the framework of strictly personal and non-commercial use, without direct or indirect profit motive.</p>

<h2>Article 2 – Application description</h2>
<p>Be Out is a mobile application allowing Users to access last-minute tickets at reduced prices for cultural and sporting events. Partner organizers (hereinafter "Organizers") (venues, clubs, associations, producers, etc.) put their unsold items online directly on the Application.</p>

<h2>Contact</h2>
<p>For any questions regarding these GTU or the Be Out Application, the User can contact the publisher at the following address: <strong>contact@be-out.app</strong></p>',
    title = 'Terms of Use'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-utilisation')
AND language = 'en';

UPDATE content_translations
SET
    content = '<h2>Preamble</h2>
<p>These general terms of sale (hereinafter "GTS") apply to all services concluded via the <strong>Be Out</strong> mobile application and website, owned by Be Out company.</p>
<p>By validating their purchase, the User acknowledges having read and accepted these GTS. Any reservation is final and non-refundable, except in case of event cancellation by the Partner.</p>

<h2>Article 1 – Content and scope</h2>
<p>These GTS frame the sale of <strong>cultural and sporting</strong> offers (tickets, invitations, last-minute access, etc.) offered on the Be Out mobile application and website.</p>

<h2>Customer Service</h2>
<p>For any questions or complaints, the User can contact Be Out at: <strong>contact@be-out.app</strong></p>',
    title = 'Terms of Sale'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-vente')
AND language = 'en';

UPDATE content_translations
SET
    content = '<h2>1. Application Publisher</h2>
<ul>
<li><strong>Name:</strong> Wendy David</li>
<li><strong>Status:</strong> Sole proprietor</li>
<li><strong>Publication Director:</strong> Wendy David</li>
<li><strong>Contact (email):</strong> contact@be-out.app</li>
</ul>

<h2>2. Hosting</h2>
<p>The Be Out application is hosted by secure cloud services complying with European data protection standards.</p>

<h2>3. Intellectual Property</h2>
<p>All content of the application (texts, images, logos, graphics, videos, etc.) is protected by copyright and intellectual property law.</p>',
    title = 'Legal Notice'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'mentions-legales')
AND language = 'en';

UPDATE content_translations
SET
    content = '<p>Be Out company, operated by Wendy David – Sole proprietor, attaches great importance to protecting the personal data of its users. This Privacy Policy explains what data we collect, why, how it is used, with whom it may be shared, and what your rights are.</p>
<p><strong>GDPR Contact:</strong> contact@be-out.app</p>

<h2>1. Data Controller</h2>
<p>Be Out, operated by Wendy David – Sole proprietor is responsible for processing data collected via the Application.</p>

<h2>2. Data Collected</h2>
<ul>
<li><strong>Identification data:</strong> first name, last name, email address, phone number.</li>
<li><strong>Connection/usage data:</strong> account identifiers, app browsing history, pages viewed, events searched.</li>
<li><strong>Payment data:</strong> we do not directly store your sensitive banking data — this data is processed via secure providers (e.g. Stripe, PayPal).</li>
</ul>

<h2>Your Rights</h2>
<p>To exercise your rights, contact us via <strong>contact@be-out.app</strong>. We will process your request within a maximum of 30 days.</p>',
    title = 'Privacy Policy'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'politique-confidentialite')
AND language = 'en';

-- Add basic Spanish translations for legal pages
UPDATE content_translations
SET
    content = '<h2>Introducción</h2>
<p>Estos Términos Generales de Uso (en adelante "TGU") rigen el uso de la aplicación <strong>Be Out</strong>, publicada por <strong>Wendy David, autónoma</strong>. Al descargar, instalar o usar la Aplicación, el Usuario acepta sin reservas estos TGU y se compromete a cumplir con todas sus disposiciones.</p>

<h2>Contacto</h2>
<p>Para cualquier pregunta sobre estos TGU o la Aplicación Be Out, el Usuario puede contactar a la editora en la siguiente dirección: <strong>contact@be-out.app</strong></p>',
    title = 'Términos de Uso'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-utilisation')
AND language = 'es';

UPDATE content_translations
SET
    content = '<h2>Preámbulo</h2>
<p>Estos términos generales de venta (en adelante "TGV") se aplican a todos los servicios contratados a través de la aplicación móvil y el sitio web <strong>Be Out</strong>, propiedad de la empresa Be Out.</p>

<h2>Atención al Cliente</h2>
<p>Para cualquier pregunta o reclamación, el Usuario puede contactar a Be Out en: <strong>contact@be-out.app</strong></p>',
    title = 'Términos de Venta'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-vente')
AND language = 'es';

UPDATE content_translations
SET
    content = '<h2>1. Editor de la Aplicación</h2>
<ul>
<li><strong>Nombre:</strong> Wendy David</li>
<li><strong>Estado:</strong> Autónoma</li>
<li><strong>Director de Publicación:</strong> Wendy David</li>
<li><strong>Contacto (email):</strong> contact@be-out.app</li>
</ul>

<h2>2. Alojamiento</h2>
<p>La aplicación Be Out está alojada por servicios en la nube seguros que cumplen con los estándares europeos de protección de datos.</p>',
    title = 'Aviso Legal'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'mentions-legales')
AND language = 'es';

UPDATE content_translations
SET
    content = '<p>La empresa Be Out, operada por Wendy David – Autónoma, otorga gran importancia a la protección de los datos personales de sus usuarios. Esta Política de Privacidad explica qué datos recopilamos, por qué, cómo se utilizan, con quién pueden compartirse y cuáles son sus derechos.</p>
<p><strong>Contacto RGPD:</strong> contact@be-out.app</p>

<h2>Sus Derechos</h2>
<p>Para ejercer sus derechos, contáctenos a través de <strong>contact@be-out.app</strong>. Procesaremos su solicitud en un máximo de 30 días.</p>',
    title = 'Política de Privacidad'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'politique-confidentialite')
AND language = 'es';

COMMIT;

-- Verification queries (optional - run to check the migration worked)
-- SELECT cp.slug, ct.language, ct.title, LENGTH(ct.content) as content_length
-- FROM content_pages cp
-- JOIN content_translations ct ON cp.id = ct.page_id
-- WHERE cp.category = 'legal'
-- ORDER BY cp.slug, ct.language;
