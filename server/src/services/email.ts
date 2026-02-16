import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendThankYouEmail(to: string, name: string) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: 'Bahamas Technology Town Hall <noreply@bahamastech.ai>',
      to,
      subject: 'Thank You for Your Feedback - Bahamas Technology Town Hall',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3fafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; text-align: center;">
      <div style="width: 56px; height: 56px; background: #00B4D8; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-weight: bold; font-size: 20px; line-height: 56px;">BS</span>
      </div>
      <h1 style="color: #111827; font-size: 24px; margin: 0 0 8px;">Thank You, ${name}!</h1>
      <p style="color: #6B7280; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
        Your feedback has been received. Your voice matters in shaping the technology future of The Bahamas.
      </p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; text-align: left; margin-bottom: 24px;">
        <h3 style="color: #374151; font-size: 14px; margin: 0 0 8px;">What happens next?</h3>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 0;">
          Your responses will be analyzed alongside other submissions to help shape national technology policy, infrastructure investment, and digital skills programs.
        </p>
      </div>
      <a href="https://bahamastech.ai" style="display: inline-block; background: #00B4D8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Visit bahamastech.ai
      </a>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
        Commonwealth of The Bahamas - Technology Town Hall
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
  } catch (err) {
    console.error('Failed to send thank-you email:', err);
  }
}
