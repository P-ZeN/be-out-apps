-- Insert booking confirmation email templates in multiple languages
-- This file should be executed in the database to create the missing email templates

-- English template
INSERT INTO email_templates (name, language, subject, body, description, variables, is_active, created_at, updated_at)
VALUES (
    'booking_confirmation',
    'en',
    'Booking Confirmed - {{eventTitle}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; background-color: #28a745; color: white; padding: 20px; border-radius: 10px; }
        .content { margin-bottom: 30px; }
        .booking-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Booking Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi {{userName}},</p>
            <p>Great news! Your booking has been confirmed.</p>
            <div class="booking-details">
                <h3>Booking Details:</h3>
                <p><strong>Event:</strong> {{eventTitle}}</p>
                <p><strong>Date:</strong> {{eventDate}}</p>
                <p><strong>Time:</strong> {{eventTime}}</p>
                <p><strong>Venue:</strong> {{eventLocation}}</p>
                <p><strong>Tickets:</strong> {{ticketCount}}</p>
                <p><strong>Total:</strong> {{totalAmount}}</p>
                <p><strong>Booking Reference:</strong> {{bookingReference}}</p>
            </div>
            <p>Your PDF tickets are attached to this email. You can also view your tickets in your account dashboard.</p>
            <p><a href="{{bookingUrl}}" class="button">View Booking Details</a></p>
            <p>We look forward to seeing you at the event!</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Booking confirmation email with PDF tickets attached',
    '{"userName": "Customer name", "eventTitle": "Event name", "eventDate": "Event date", "eventTime": "Event time", "eventLocation": "Event venue", "ticketCount": "Number of tickets", "totalAmount": "Total amount paid", "bookingReference": "Booking reference number", "bookingUrl": "Link to booking details", "appName": "Application name", "currentYear": "Current year"}',
    true,
    NOW(),
    NOW()
);

-- French template
INSERT INTO email_templates (name, language, subject, body, description, variables, is_active, created_at, updated_at)
VALUES (
    'booking_confirmation',
    'fr',
    'Réservation confirmée - {{eventTitle}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réservation confirmée</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; background-color: #28a745; color: white; padding: 20px; border-radius: 10px; }
        .content { margin-bottom: 30px; }
        .booking-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Réservation confirmée !</h1>
        </div>
        <div class="content">
            <p>Bonjour {{userName}},</p>
            <p>Excellente nouvelle ! Votre réservation a été confirmée.</p>
            <div class="booking-details">
                <h3>Détails de la réservation :</h3>
                <p><strong>Événement :</strong> {{eventTitle}}</p>
                <p><strong>Date :</strong> {{eventDate}}</p>
                <p><strong>Heure :</strong> {{eventTime}}</p>
                <p><strong>Lieu :</strong> {{eventLocation}}</p>
                <p><strong>Billets :</strong> {{ticketCount}}</p>
                <p><strong>Total :</strong> {{totalAmount}}</p>
                <p><strong>Référence de réservation :</strong> {{bookingReference}}</p>
            </div>
            <p>Vos billets PDF sont joints à cet email. Vous pouvez également consulter vos billets dans votre tableau de bord.</p>
            <p><a href="{{bookingUrl}}" class="button">Voir les détails de la réservation</a></p>
            <p>Nous avons hâte de vous voir à l''événement !</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>',
    'Email de confirmation de réservation avec billets PDF joints',
    '{"userName": "Nom du client", "eventTitle": "Nom de l''événement", "eventDate": "Date de l''événement", "eventTime": "Heure de l''événement", "eventLocation": "Lieu de l''événement", "ticketCount": "Nombre de billets", "totalAmount": "Montant total payé", "bookingReference": "Numéro de référence", "bookingUrl": "Lien vers les détails", "appName": "Nom de l''application", "currentYear": "Année courante"}',
    true,
    NOW(),
    NOW()
);

-- Spanish template
INSERT INTO email_templates (name, language, subject, body, description, variables, is_active, created_at, updated_at)
VALUES (
    'booking_confirmation',
    'es',
    'Reserva confirmada - {{eventTitle}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reserva confirmada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; background-color: #28a745; color: white; padding: 20px; border-radius: 10px; }
        .content { margin-bottom: 30px; }
        .booking-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ ¡Reserva confirmada!</h1>
        </div>
        <div class="content">
            <p>Hola {{userName}},</p>
            <p>¡Excelentes noticias! Su reserva ha sido confirmada.</p>
            <div class="booking-details">
                <h3>Detalles de la reserva:</h3>
                <p><strong>Evento:</strong> {{eventTitle}}</p>
                <p><strong>Fecha:</strong> {{eventDate}}</p>
                <p><strong>Hora:</strong> {{eventTime}}</p>
                <p><strong>Lugar:</strong> {{eventLocation}}</p>
                <p><strong>Boletos:</strong> {{ticketCount}}</p>
                <p><strong>Total:</strong> {{totalAmount}}</p>
                <p><strong>Referencia de reserva:</strong> {{bookingReference}}</p>
            </div>
            <p>Sus boletos PDF están adjuntos a este correo. También puede ver sus boletos en su panel de control.</p>
            <p><a href="{{bookingUrl}}" class="button">Ver detalles de la reserva</a></p>
            <p>¡Esperamos verle en el evento!</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>',
    'Email de confirmación de reserva con boletos PDF adjuntos',
    '{"userName": "Nombre del cliente", "eventTitle": "Nombre del evento", "eventDate": "Fecha del evento", "eventTime": "Hora del evento", "eventLocation": "Lugar del evento", "ticketCount": "Número de boletos", "totalAmount": "Cantidad total pagada", "bookingReference": "Número de referencia", "bookingUrl": "Enlace a los detalles", "appName": "Nombre de la aplicación", "currentYear": "Año actual"}',
    true,
    NOW(),
    NOW()
);
