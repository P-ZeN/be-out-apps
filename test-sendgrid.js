import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './server/.env' });

// Test SendGrid configuration
async function testSendGrid() {
    console.log("Testing SendGrid configuration...");

    if (!process.env.SENDGRID_API_KEY) {
        console.error("❌ SENDGRID_API_KEY not found in environment");
        return;
    }

    console.log("✅ SendGrid API Key found:", process.env.SENDGRID_API_KEY.substring(0, 15) + "...");
    console.log("📧 Default FROM email:", process.env.DEFAULT_FROM_EMAIL);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Test with a simple email
    const msg = {
        to: process.env.DEFAULT_FROM_EMAIL, // Send to same email to test verification
        from: process.env.DEFAULT_FROM_EMAIL,
        subject: "SendGrid Test Email",
        text: "This is a test email to verify SendGrid configuration.",
        html: "<h1>SendGrid Test</h1><p>This is a test email to verify SendGrid configuration.</p>",
    };

    try {
        console.log("🚀 Attempting to send test email...");
        const result = await sgMail.send(msg);
        console.log("✅ Email sent successfully!");
        console.log("Message ID:", result[0].headers["x-message-id"]);
    } catch (error) {
        console.error("❌ Email sending failed:");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        if (error.response?.body?.errors) {
            console.error("\n📋 Detailed SendGrid Errors:");
            error.response.body.errors.forEach((sgError, index) => {
                console.error(`\n${index + 1}. Error Details:`);
                console.error(`   Message: ${sgError.message}`);
                console.error(`   Field: ${sgError.field || 'N/A'}`);
                console.error(`   Help: ${sgError.help || 'N/A'}`);
            });
        }

        if (error.code === 403) {
            console.error("\n🔍 Common 403 Forbidden causes:");
            console.error("1. Invalid or expired SendGrid API key");
            console.error("2. FROM email not verified in SendGrid account");
            console.error("3. SendGrid account suspended or restricted");
            console.error("4. API key lacks necessary permissions");
        }
    }
}

testSendGrid();
