/**
 * Mailer module — pluggable email interface.
 * Default: ConsoleMailer (logs to stdout).
 * Swap to SMTP or SendGrid by changing MAILER_PROVIDER in .env.
 */

import nodemailer from "nodemailer";

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

// ── SMTP Mailer (Nodemailer) ──
class SMTPMailer implements MailerProvider {
    private transporter: nodemailer.Transporter | null = null;

    private getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            console.log(`[SMTP Mailer] Initializing with host=${process.env.SMTP_HOST}, user=${process.env.SMTP_USER}`);
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: parseInt(process.env.SMTP_PORT || "587"),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        return this.transporter;
    }

    async send(options: MailerOptions): Promise<void> {
        try {
            const info = await this.getTransporter().sendMail({
                from: `"StockFolio" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            console.log(`[SMTP Mailer] Email sent to: ${options.to}, messageId: ${info.messageId}`);
        } catch (error: any) {
            console.error(`[SMTP Mailer] Failed to send email to ${options.to}:`, error.message);
            throw error;
        }
    }
}

// ── Factory (lazy) ──
let _mailer: MailerProvider | null = null;

function getMailer(): MailerProvider {
    if (!_mailer) {
        const provider = process.env.MAILER_PROVIDER || "";
        const hasSmtpConfig = !!(process.env.SMTP_HOST || process.env.SMTP_USER);
        const useSmtp = provider === "smtp" || (hasSmtpConfig && provider !== "console");
        console.log(`[Mailer] Initializing — MAILER_PROVIDER=${provider}, SMTP_USER=${process.env.SMTP_USER || "not set"}, using: ${useSmtp ? "smtp" : "console"}`);
        if (useSmtp) {
            _mailer = new SMTPMailer();
        } else {
            _mailer = new ConsoleMailer();
        }
    }
    return _mailer;
}

const mailer = { send: (options: MailerOptions) => getMailer().send(options) };

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

export async function sendOtpEmail(
    email: string,
    code: string,
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
) {
    const isVerification = type === "EMAIL_VERIFICATION";
    const subject = isVerification
        ? "Verify Your Email — StockFolio"
        : "Password Reset OTP — StockFolio";

    await mailer.send({
        to: email,
        subject,
        html: `
      <h2>${isVerification ? "Email Verification" : "Password Reset"}</h2>
      <p>Your one-time verification code is:</p>
      <h1 style="letter-spacing: 8px; font-size: 36px; font-family: monospace; background: #f4f4f4; padding: 16px 24px; display: inline-block; border-radius: 8px;">${code}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    });
}

export default mailer;
