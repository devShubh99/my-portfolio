/**
 * Mailer module — pluggable email interface.
 * Default: ConsoleMailer (logs to stdout).
 * Swap to SMTP or SendGrid by changing MAILER_PROVIDER in .env.
 */

interface MailerOptions {
    to: string;
    subject: string;
    html: string;
}

interface MailerProvider {
    send(options: MailerOptions): Promise<void>;
}

// ── Console Mailer (default) ──
class ConsoleMailer implements MailerProvider {
    async send(options: MailerOptions): Promise<void> {
        console.log("\n╔══════════════════════════════════════════════╗");
        console.log("║           📧  EMAIL (Console Mailer)         ║");
        console.log("╠══════════════════════════════════════════════╣");
        console.log(`║ To:      ${options.to}`);
        console.log(`║ Subject: ${options.subject}`);
        console.log("╠══════════════════════════════════════════════╣");
        console.log(options.html);
        console.log("╚══════════════════════════════════════════════╝\n");
    }
}

// ── SMTP Mailer (placeholder — swap in real implementation) ──
class SMTPMailer implements MailerProvider {
    async send(options: MailerOptions): Promise<void> {
        // To implement: use nodemailer or similar
        // const transporter = nodemailer.createTransport({
        //   host: process.env.SMTP_HOST,
        //   port: parseInt(process.env.SMTP_PORT || "587"),
        //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        // });
        // await transporter.sendMail({ from: process.env.SMTP_FROM, ...options });
        console.log("[SMTP Mailer] Would send email to:", options.to);
    }
}

// ── Factory ──
function createMailer(): MailerProvider {
    const provider = process.env.MAILER_PROVIDER || "console";
    switch (provider) {
        case "smtp":
            return new SMTPMailer();
        case "console":
        default:
            return new ConsoleMailer();
    }
}

const mailer = createMailer();

export async function sendPasswordResetEmail(
    email: string,
    resetToken: string
) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    await mailer.send({
        to: email,
        subject: "Password Reset — StockFolio",
        html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    });
}

export default mailer;
