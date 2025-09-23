-- Fix booking confirmation email templates with proper HTML structure and variable names

-- Update French template with proper HTML structure
UPDATE email_templates
SET body = '<!DOCTYPE html>
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Réservation confirmée !</h1>
        </div>
        <div class="content">
            <p>Bonjour {{customerName}},</p>
            <p>Excellente nouvelle ! Votre réservation a été confirmée.</p>
            <div class="booking-details">
                <h3>Détails de la réservation :</h3>
                <p><strong>Événement :</strong> {{eventTitle}}</p>
                <p><strong>Date :</strong> {{eventDate}}</p>
                <p><strong>Lieu :</strong> {{venueName}}</p>
                <p><strong>Billets :</strong> {{quantity}}</p>
                <p><strong>Total :</strong> €{{totalPrice}}</p>
                <p><strong>Référence :</strong> {{bookingReference}}</p>
            </div>
            <p>Vos billets seront disponibles dans votre tableau de bord. Vous pouvez également récupérer vos billets depuis votre page de profil.</p>
            <p>Nous avons hâte de vous voir à l''événement !</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>',
updated_at = NOW()
WHERE name = 'booking_confirmation' AND language = 'fr';

-- Update English template to include profile page information
UPDATE email_templates
SET body = '<!DOCTYPE html>
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Booking Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Great news! Your booking has been confirmed.</p>
            <div class="booking-details">
                <h3>Booking Details:</h3>
                <p><strong>Event:</strong> {{eventTitle}}</p>
                <p><strong>Date:</strong> {{eventDate}}</p>
                <p><strong>Venue:</strong> {{venueName}}</p>
                <p><strong>Tickets:</strong> {{quantity}}</p>
                <p><strong>Total:</strong> €{{totalPrice}}</p>
                <p><strong>Booking Reference:</strong> {{bookingReference}}</p>
            </div>
            <p>Your tickets will be available in your account dashboard. You can also retrieve your tickets from your profile page.</p>
            <p>We look forward to seeing you at the event!</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
updated_at = NOW()
WHERE name = 'booking_confirmation' AND language = 'en';

-- Update Spanish template to include profile page information
UPDATE email_templates
SET body = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reserva Confirmada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; background-color: #28a745; color: white; padding: 20px; border-radius: 10px; }
        .content { margin-bottom: 30px; }
        .booking-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ ¡Reserva Confirmada!</h1>
        </div>
        <div class="content">
            <p>Hola {{customerName}},</p>
            <p>¡Excelentes noticias! Tu reserva ha sido confirmada.</p>
            <div class="booking-details">
                <h3>Detalles de la Reserva:</h3>
                <p><strong>Evento:</strong> {{eventTitle}}</p>
                <p><strong>Fecha:</strong> {{eventDate}}</p>
                <p><strong>Lugar:</strong> {{venueName}}</p>
                <p><strong>Entradas:</strong> {{quantity}}</p>
                <p><strong>Total:</strong> €{{totalPrice}}</p>
                <p><strong>Referencia:</strong> {{bookingReference}}</p>
            </div>
            <p>Tus entradas estarán disponibles en tu panel de cuenta. También puedes recuperar tus entradas desde tu página de perfil.</p>
            <p>¡Esperamos verte en el evento!</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>',
updated_at = NOW()
WHERE name = 'booking_confirmation' AND language = 'es';

-- Verify the updates
SELECT name, language, subject FROM email_templates WHERE name = 'booking_confirmation' ORDER BY language;
