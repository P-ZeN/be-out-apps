-- Migration for Mentions Légales content
-- Run this after the schema has been created

BEGIN;

-- Update French Mentions Légales content
UPDATE content_translations
SET
    content = '<p>Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l''économie numérique, il est précisé aux utilisateurs de l''application Be Out l''identité des différents intervenants dans le cadre de sa réalisation et de son suivi.</p>

<h2>1. Éditeur de l''application</h2>
<ul>
<li><strong>Nom et prénom :</strong> Wendy David</li>
<li><strong>Adresse professionnelle (siège) :</strong> [Adresse à compléter]</li>
<li><strong>Statut :</strong> Auto-entrepreneur</li>
<li><strong>Numéro SIRET :</strong> [À compléter]</li>
<li><strong>Code APE :</strong> [À compléter]</li>
<li><strong>Directeur de la publication :</strong> Wendy David</li>
<li><strong>Contact (email) :</strong> contact@be-out.app</li>
<li><strong>Contact (téléphone) :</strong> [À compléter]</li>
</ul>

<h2>2. Hébergement</h2>
<p>L''application Be Out est hébergée par des services cloud sécurisés respectant les normes européennes de protection des données.</p>
<ul>
<li><strong>Hébergeur :</strong> [Nom de l''hébergeur]</li>
<li><strong>Adresse :</strong> [Adresse de l''hébergeur]</li>
<li><strong>Téléphone :</strong> [Téléphone de l''hébergeur]</li>
</ul>

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

-- Update English Mentions Légales content
UPDATE content_translations
SET
    content = '<p>In accordance with law n°2004-575 of June 21, 2004 for confidence in the digital economy, the identity of the various parties involved in the realization and monitoring of the Be Out application is specified to users.</p>

<h2>1. Application Publisher</h2>
<ul>
<li><strong>Name:</strong> Wendy David</li>
<li><strong>Professional address (headquarters):</strong> [Address to be completed]</li>
<li><strong>Status:</strong> Sole proprietor</li>
<li><strong>SIRET number:</strong> [To be completed]</li>
<li><strong>APE code:</strong> [To be completed]</li>
<li><strong>Publication Director:</strong> Wendy David</li>
<li><strong>Contact (email):</strong> contact@be-out.app</li>
<li><strong>Contact (phone):</strong> [To be completed]</li>
</ul>

<h2>2. Hosting</h2>
<p>The Be Out application is hosted by secure cloud services complying with European data protection standards.</p>
<ul>
<li><strong>Host:</strong> [Host name]</li>
<li><strong>Address:</strong> [Host address]</li>
<li><strong>Phone:</strong> [Host phone]</li>
</ul>

<h2>3. Intellectual Property</h2>
<p>All content of the application (texts, images, logos, graphics, videos, etc.) is protected by copyright and intellectual property law.</p>
<p>Any reproduction, representation, modification, publication, adaptation of all or part of the application elements, regardless of the means or process used, is prohibited, except with prior written authorization from the publisher.</p>

<h2>4. Responsibility</h2>
<p>The publisher cannot be held responsible for direct or indirect damage caused to the user''s equipment when accessing the application, resulting either from the use of equipment that does not meet the specified specifications, or from the appearance of a bug or incompatibility.</p>

<h2>5. Cookies and trackers</h2>
<p>The application may use trackers or similar technologies (e.g.: cookies, SDK, audience analysis tools).</p>
<p>The user is informed that they can configure their preferences regarding data collection and oppose their deposit from the dedicated interface in the application.</p>

<h2>6. Consumer mediation</h2>
<p>In accordance with articles L.616-1 and R.616-1 of the consumer code, any consumer has the right to resort free of charge to a consumer mediator in case of dispute with the publisher.</p>
<p>European online dispute resolution platform: <strong>https://ec.europa.eu/consumers/odr/</strong></p>

<h2>7. Personal data</h2>
<p>The management of personal data collected via the Be Out application is detailed in our Privacy Policy, accessible from the application.</p>

<h2>8. Applicable law and competent jurisdiction</h2>
<p>These legal notices are governed by French law.</p>
<p>In case of dispute, and failing an amicable solution, exclusive jurisdiction is attributed to competent French courts.</p>',
    title = 'Legal Notice'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'mentions-legales')
AND language = 'en';

-- Update Spanish Mentions Légales content
UPDATE content_translations
SET
    content = '<p>De acuerdo con la ley n°2004-575 del 21 de junio de 2004 para la confianza en la economía digital, se especifica a los usuarios de la aplicación Be Out la identidad de las diversas partes involucradas en la realización y seguimiento de la aplicación.</p>

<h2>1. Editor de la Aplicación</h2>
<ul>
<li><strong>Nombre:</strong> Wendy David</li>
<li><strong>Dirección profesional (sede):</strong> [Dirección a completar]</li>
<li><strong>Estado:</strong> Autónoma</li>
<li><strong>Número SIRET:</strong> [A completar]</li>
<li><strong>Código APE:</strong> [A completar]</li>
<li><strong>Director de Publicación:</strong> Wendy David</li>
<li><strong>Contacto (email):</strong> contact@be-out.app</li>
<li><strong>Contacto (teléfono):</strong> [A completar]</li>
</ul>

<h2>2. Alojamiento</h2>
<p>La aplicación Be Out está alojada por servicios en la nube seguros que cumplen con los estándares europeos de protección de datos.</p>
<ul>
<li><strong>Anfitrión:</strong> [Nombre del anfitrión]</li>
<li><strong>Dirección:</strong> [Dirección del anfitrión]</li>
<li><strong>Teléfono:</strong> [Teléfono del anfitrión]</li>
</ul>

<h2>3. Propiedad Intelectual</h2>
<p>Todo el contenido de la aplicación (textos, imágenes, logotipos, gráficos, videos, etc.) está protegido por derechos de autor y ley de propiedad intelectual.</p>
<p>Cualquier reproducción, representación, modificación, publicación, adaptación de todos o parte de los elementos de la aplicación, independientemente de los medios o proceso utilizado, está prohibida, excepto con autorización escrita previa del editor.</p>

<h2>4. Responsabilidad</h2>
<p>El editor no puede ser considerado responsable por daños directos o indirectos causados al equipo del usuario al acceder a la aplicación, resultando ya sea del uso de equipo que no cumple con las especificaciones indicadas, o de la aparición de un error o incompatibilidad.</p>

<h2>5. Cookies y rastreadores</h2>
<p>La aplicación puede usar rastreadores o tecnologías similares (ej.: cookies, SDK, herramientas de análisis de audiencia).</p>
<p>El usuario está informado de que puede configurar sus preferencias sobre la recolección de datos y oponerse a su depósito desde la interfaz dedicada en la aplicación.</p>

<h2>6. Mediación del consumidor</h2>
<p>De acuerdo con los artículos L.616-1 y R.616-1 del código del consumidor, cualquier consumidor tiene el derecho de recurrir gratuitamente a un mediador del consumidor en caso de disputa con el editor.</p>
<p>Plataforma europea de resolución de disputas en línea: <strong>https://ec.europa.eu/consumers/odr/</strong></p>

<h2>7. Datos personales</h2>
<p>La gestión de datos personales recopilados a través de la aplicación Be Out se detalla en nuestra Política de Privacidad, accesible desde la aplicación.</p>

<h2>8. Ley aplicable y jurisdicción competente</h2>
<p>Estos avisos legales se rigen por la ley francesa.</p>
<p>En caso de disputa, y faltando una solución amistosa, se atribuye jurisdicción exclusiva a los tribunales franceses competentes.</p>',
    title = 'Aviso Legal'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'mentions-legales')
AND language = 'es';

COMMIT;
