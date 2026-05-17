import { env } from "@/config/env";
import { isResendEnabled, resendClient } from "@/lib/resend";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!isResendEnabled || !resendClient) {
    console.warn(
      `[mailer] RESEND_API_KEY/EMAIL_FROM not set - logging email instead of sending:\n` +
        `  to: ${to}\n  subject: ${subject}\n  html: ${html}`,
    );
    return;
  }

  try {
    await resendClient.emails.send({
      // biome-ignore lint/style/noNonNullAssertion: guaranteed non-null when isResendEnabled is true
      from: env.EMAIL_FROM!,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Error sending email via Resend:", error);
  }
}

function emailLayout(content: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      ${content}
    </div>
  `;
}

export function resetPasswordEmailHtml({ url }: { url: string }) {
  return emailLayout(`
    <h1 style="font-size: 20px; margin-bottom: 16px;">Reset your password</h1>
    <p style="font-size: 14px; color: #3f3f3f; margin-bottom: 24px;">
      Click the link below to choose a new password. If you didn't request this, you can safely ignore this email.
    </p>
    <a href="${url}" style="display: inline-block; background: #ff385c; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Reset password
    </a>
  `);
}

export function verifyEmailHtml({ url }: { url: string }) {
  return emailLayout(`
    <h1 style="font-size: 20px; margin-bottom: 16px;">Verify your email address</h1>
    <p style="font-size: 14px; color: #3f3f3f; margin-bottom: 24px;">
      Click the link below to confirm this is your email address.
    </p>
    <a href="${url}" style="display: inline-block; background: #ff385c; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Verify email
    </a>
  `);
}
