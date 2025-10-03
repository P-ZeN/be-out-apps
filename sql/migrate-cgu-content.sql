-- Migration for CGU (Conditions Générales d'Utilisation) content
-- Run this after the schema has been created

BEGIN;

-- Update French CGU content
UPDATE content_translations
SET
    content = '<h2>Introduction</h2>
<p>Les présentes Conditions Générales d''Utilisation (ci-après « CGU ») régissent l''utilisation de l''application <strong>Be Out</strong>, éditée par <strong>Wendy David, auto-entrepreneuse</strong>. En téléchargeant, installant ou utilisant l''Application, l''Utilisateur accepte sans réserve les présentes CGU et s''engage à en respecter l''ensemble des dispositions.</p>

<h2>Article 1 - Définitions</h2>
<p><strong>« Application »</strong> désigne l''application « Be Out » éditée par Wendy David donnant accès aux Services, qui est disponible gratuitement dans l''« Apple Store » d''Apple et le « Google Play Store » de Google pour être téléchargée par l''Utilisateur sur son terminal Apple iOS et Android. L''Application comprend également les Contenus, les logiciels, les programmes, les outils (de programmation, de navigation, …), les bases de données, les systèmes d''exploitation, la documentation et tous autres éléments et services qui la compose, les mises à jour et les nouvelles versions qui peuvent être apportées à l''Application.</p>
<p><strong>« Contenu »</strong> désigne sans que cette liste soit limitative, la structure de l''Application, le contenu éditorial, les illustrations, les chartes graphiques, les marques, les logos, les sigles, les dénominations sociales, les contenus visuels ainsi que tout autre contenu présent au sein de l''Application et/ou tout autre élément composant l''Application.</p>
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
<li>Ne pas procéder à toute adaptation, modification, traduction, transcription, arrangement, compilation, décompilation, assemblage, désassemblage, transcodage, ni appliquer la rétro-ingénierie (ou « Reverse Engineering ») de tout ou partie de l''Application, des Services et/ou du Contenu</li>
<li>Ne pas exporter l''Application, de fusionner tout ou partie de l''Application avec d''autres programmes informatiques</li>
<li>Ne pas publier de contenu illicite, offensant, violent ou discriminatoire</li>
<li>Ne pas porter atteinte aux droits de propriété intellectuelle d''un tiers</li>
<li>Ne pas utiliser l''Application à des fins commerciales ou de revente de billets sans autorisation expresse de Be Out</li>
<li>Ne pas perturber ou endommager l''Application ou les systèmes informatiques associés</li>
</ul>

<h2>Article 4 – Responsabilité de Be Out</h2>
<p>Be Out assure la bonne exécution des transactions et la mise à disposition des billets achetés. Toutefois, Be Out ne peut garantir le respect des présentes CGU par les utilisateurs.</p>
<p>Be Out décline toute responsabilité en cas de perte, de dommage ou de préjudice lié :</p>
<ul>
<li>Au déroulement, au contenu ou à l''annulation d''un événement, qui relèvent de la responsabilité exclusive des Organisateurs</li>
<li>À une utilisation frauduleuse, une perte ou un vol de billets par l''Utilisateur</li>
</ul>
<p>En cas d''annulation d''un événement par l''Organisateur, Be Out procèdera au remboursement des sommes versées, hors frais annexes (transport, hébergement, etc.).</p>
<p>L''Application est fournie « telle quelle » et « comme disponible » sans garantie quelle qu''elle soit. Il appartient à tout Utilisateur de prendre toutes les mesures appropriées de façon à protéger ses propres données et/ou logiciels stockés sur ses équipements informatique et téléphonique contre toute atteinte.</p>

<h2>Article 5 – Propriété intellectuelle</h2>
<p>Tous les Contenus présents sur l''Application Be Out, y compris les textes, images, logos, bases de données et marques, sont la propriété exclusive de Be Out ou de ses partenaires.</p>
<p>Aucun droit de propriété intellectuelle, qu''il s''agisse notamment de droits d''auteur, de marques, de brevets, de secrets d''affaires ou de tout autre droit protégé, n''est transféré ou conféré à l''utilisateur du seul fait de l''utilisation de l''Application. L''Utilisateur bénéficie uniquement d''un droit d''accès et d''usage personnel, non exclusif et non transférable, conformément aux présentes CGU.</p>
<p>Sans préjudice des dispositions du présent article, aucune des dispositions des CGU ne peut être interprétée comme une cession, un transfert, une vente, une concession, une licence, un prêt, une location, une autorisation d''exploitation consentie directement ou indirectement par l''éditeur au profit de l''Utilisateur sur l''Application son Contenu et/ou les Services.</p>

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

-- Update English CGU content
UPDATE content_translations
SET
    content = '<h2>Introduction</h2>
<p>These General Terms of Use (hereinafter "GTU") govern the use of the <strong>Be Out</strong> application, published by <strong>Wendy David, sole proprietor</strong>. By downloading, installing or using the Application, the User unreservedly accepts these GTU and undertakes to comply with all of their provisions.</p>

<h2>Article 1 - Definitions</h2>
<p><strong>"Application"</strong> means the "Be Out" application published by Wendy David providing access to the Services, which is available free of charge in Apple''s "Apple Store" and Google''s "Google Play Store" for download by the User on their Apple iOS and Android terminal. The Application also includes the Content, software, programs, tools (programming, navigation, etc.), databases, operating systems, documentation and all other elements and services that compose it, updates and new versions that may be made to the Application.</p>
<p><strong>"Content"</strong> means, without this list being exhaustive, the structure of the Application, editorial content, illustrations, graphic charters, trademarks, logos, symbols, corporate names, visual content as well as any other content present within the Application and/or any other element composing the Application.</p>
<p><strong>"Services"</strong> means the various functionalities and services offered by the Application.</p>
<p><strong>"User"</strong> means a natural person who has downloaded the Application for their own needs, within the framework of strictly personal and non-commercial use, without direct or indirect profit motive.</p>

<h2>Article 2 – Application description</h2>
<p>Be Out is a mobile application allowing Users to access last-minute tickets at reduced prices for cultural and sporting events. Partner organizers (hereinafter "Organizers") (venues, clubs, associations, producers, etc.) put their unsold items online directly on the Application.</p>
<p>The User can consult via Be Out information relating to the event, venue and performance associated with the ticket. Partners undertake to offer a reduction on the places made available, without any minimum amount condition imposed by Be Out.</p>

<h2>Article 3 – Rights and obligations of Users</h2>
<p>By using the Be Out Application, the User undertakes to:</p>
<ul>
<li>Respect the laws and regulations in force</li>
<li>Not reproduce the Application, in whole or in part, permanently or temporarily, by any means and in any form</li>
<li>Not proceed with any adaptation, modification, translation, transcription, arrangement, compilation, decompilation, assembly, disassembly, transcoding, or apply reverse engineering of all or part of the Application, Services and/or Content</li>
<li>Not export the Application, merge all or part of the Application with other computer programs</li>
<li>Not publish illicit, offensive, violent or discriminatory content</li>
<li>Not infringe the intellectual property rights of a third party</li>
<li>Not use the Application for commercial purposes or ticket resale without express authorization from Be Out</li>
<li>Not disrupt or damage the Application or associated computer systems</li>
</ul>

<h2>Article 4 – Be Out''s responsibility</h2>
<p>Be Out ensures the proper execution of transactions and the provision of purchased tickets. However, Be Out cannot guarantee compliance with these GTU by users.</p>
<p>Be Out disclaims any responsibility in case of loss, damage or prejudice related to:</p>
<ul>
<li>The conduct, content or cancellation of an event, which are the exclusive responsibility of the Organizers</li>
<li>Fraudulent use, loss or theft of tickets by the User</li>
</ul>
<p>In case of event cancellation by the Organizer, Be Out will proceed with the refund of sums paid, excluding ancillary costs (transport, accommodation, etc.).</p>
<p>The Application is provided "as is" and "as available" without any warranty whatsoever. It is up to each User to take all appropriate measures to protect their own data and/or software stored on their computer and telephone equipment against any damage.</p>

<h2>Article 5 – Intellectual property</h2>
<p>All Content present on the Be Out Application, including texts, images, logos, databases and trademarks, are the exclusive property of Be Out or its partners.</p>
<p>No intellectual property rights, whether notably copyrights, trademarks, patents, trade secrets or any other protected rights, are transferred or conferred to the user solely by using the Application. The User only benefits from a personal, non-exclusive and non-transferable right of access and use, in accordance with these GTU.</p>
<p>Without prejudice to the provisions of this article, none of the provisions of the GTU can be interpreted as an assignment, transfer, sale, concession, license, loan, rental, exploitation authorization granted directly or indirectly by the publisher for the benefit of the User on the Application, its Content and/or Services.</p>

<h2>Article 6 – Modifications of the GTU</h2>
<p>Be Out reserves the right to modify these GTU at any time. Modifications will take effect upon their publication on the Application.</p>

<h2>Article 7 – Contract termination</h2>
<p>Be Out reserves the right to suspend or terminate the account of a User who does not comply with these GTU or applicable regulations, without notice or compensation.</p>

<h2>Article 8 – Applicable law and competent jurisdiction</h2>
<p>These GTU are governed by French law. Any dispute relating to the use of the Application will be subject to the exclusive jurisdiction of French courts.</p>
<p>For any questions regarding these GTU or the Be Out Application, the User can contact the publisher at the following address: <strong>contact@be-out.app</strong></p>',
    title = 'Terms of Use'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-utilisation')
AND language = 'en';

-- Update Spanish CGU content
UPDATE content_translations
SET
    content = '<h2>Introducción</h2>
<p>Estos Términos Generales de Uso (en adelante "TGU") rigen el uso de la aplicación <strong>Be Out</strong>, publicada por <strong>Wendy David, autónoma</strong>. Al descargar, instalar o usar la Aplicación, el Usuario acepta sin reservas estos TGU y se compromete a cumplir con todas sus disposiciones.</p>

<h2>Artículo 1 - Definiciones</h2>
<p><strong>"Aplicación"</strong> significa la aplicación "Be Out" publicada por Wendy David que proporciona acceso a los Servicios, que está disponible gratuitamente en la "Apple Store" de Apple y "Google Play Store" de Google para ser descargada por el Usuario en su terminal Apple iOS y Android. La Aplicación también incluye el Contenido, software, programas, herramientas (programación, navegación, etc.), bases de datos, sistemas operativos, documentación y todos los demás elementos y servicios que la componen, actualizaciones y nuevas versiones que puedan realizarse a la Aplicación.</p>
<p><strong>"Contenido"</strong> significa, sin que esta lista sea exhaustiva, la estructura de la Aplicación, contenido editorial, ilustraciones, cartas gráficas, marcas comerciales, logotipos, símbolos, nombres corporativos, contenido visual así como cualquier otro contenido presente dentro de la Aplicación y/o cualquier otro elemento que componga la Aplicación.</p>
<p><strong>"Servicios"</strong> significa las diversas funcionalidades y servicios ofrecidos por la Aplicación.</p>
<p><strong>"Usuario"</strong> significa una persona física que ha descargado la Aplicación para sus propias necesidades, dentro del marco de uso estrictamente personal y no comercial, sin motivo de lucro directo o indirecto.</p>

<h2>Artículo 2 – Descripción de la aplicación</h2>
<p>Be Out es una aplicación móvil que permite a los Usuarios acceder a boletos de último minuto a precios reducidos para eventos culturales y deportivos. Los organizadores socios (en adelante "Organizadores") (lugares, clubes, asociaciones, productores, etc.) ponen sus artículos no vendidos en línea directamente en la Aplicación.</p>
<p>El Usuario puede consultar a través de Be Out información relacionada con el evento, lugar y actuación asociados con el boleto. Los socios se comprometen a ofrecer una reducción en los lugares puestos a disposición, sin ninguna condición de cantidad mínima impuesta por Be Out.</p>

<h2>Artículo 3 – Derechos y obligaciones de los Usuarios</h2>
<p>Al usar la Aplicación Be Out, el Usuario se compromete a:</p>
<ul>
<li>Respetar las leyes y regulaciones vigentes</li>
<li>No reproducir la Aplicación, en todo o en parte, permanente o temporalmente, por cualquier medio y en cualquier forma</li>
<li>No proceder con ninguna adaptación, modificación, traducción, transcripción, arreglo, compilación, descompilación, ensamblaje, desensamblaje, transcodificación, o aplicar ingeniería inversa de toda o parte de la Aplicación, Servicios y/o Contenido</li>
<li>No exportar la Aplicación, fusionar toda o parte de la Aplicación con otros programas de computadora</li>
<li>No publicar contenido ilícito, ofensivo, violento o discriminatorio</li>
<li>No infringir los derechos de propiedad intelectual de un tercero</li>
<li>No usar la Aplicación para fines comerciales o reventa de boletos sin autorización expresa de Be Out</li>
<li>No interrumpir o dañar la Aplicación o sistemas informáticos asociados</li>
</ul>

<h2>Artículo 4 – Responsabilidad de Be Out</h2>
<p>Be Out asegura la ejecución adecuada de transacciones y la provisión de boletos comprados. Sin embargo, Be Out no puede garantizar el cumplimiento de estos TGU por parte de los usuarios.</p>
<p>Be Out rechaza cualquier responsabilidad en caso de pérdida, daño o perjuicio relacionado con:</p>
<ul>
<li>La conducta, contenido o cancelación de un evento, que son responsabilidad exclusiva de los Organizadores</li>
<li>Uso fraudulento, pérdida o robo de boletos por parte del Usuario</li>
</ul>
<p>En caso de cancelación del evento por parte del Organizador, Be Out procederá con el reembolso de las sumas pagadas, excluyendo costos auxiliares (transporte, alojamiento, etc.).</p>

<h2>Artículo 5 – Propiedad intelectual</h2>
<p>Todo el Contenido presente en la Aplicación Be Out, incluyendo textos, imágenes, logotipos, bases de datos y marcas comerciales, son propiedad exclusiva de Be Out o sus socios.</p>
<p>El Usuario solo se beneficia de un derecho personal, no exclusivo y no transferible de acceso y uso, de acuerdo con estos TGU.</p>

<h2>Artículo 6 – Modificaciones de los TGU</h2>
<p>Be Out se reserva el derecho de modificar estos TGU en cualquier momento. Las modificaciones tomarán efecto al momento de su publicación en la Aplicación.</p>

<h2>Artículo 7 – Terminación del contrato</h2>
<p>Be Out se reserva el derecho de suspender o terminar la cuenta de un Usuario que no cumpla con estos TGU o regulaciones aplicables, sin aviso o compensación.</p>

<h2>Artículo 8 – Ley aplicable y jurisdicción competente</h2>
<p>Estos TGU se rigen por la ley francesa. Cualquier disputa relacionada con el uso de la Aplicación estará sujeta a la jurisdicción exclusiva de los tribunales franceses.</p>
<p>Para cualquier pregunta sobre estos TGU o la Aplicación Be Out, el Usuario puede contactar a la editora en la siguiente dirección: <strong>contact@be-out.app</strong></p>',
    title = 'Términos de Uso'
WHERE page_id = (SELECT id FROM content_pages WHERE slug = 'conditions-generales-utilisation')
AND language = 'es';

COMMIT;
