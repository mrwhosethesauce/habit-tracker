const { Resend } = require('resend');

let client;
function getClient() {
  if (!client) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

async function sendPasswordResetEmail(to, resetUrl) {
  const resend = getClient();
  // resend.dev works without a verified domain, but only delivers to the
  // email address the Resend account itself was signed up with — fine for
  // a single-user deployment, a real blocker once other people sign up.
  const from = process.env.RESEND_FROM_EMAIL || 'Habit Tracker <onboarding@resend.dev>';

  await resend.emails.send({
    from,
    to,
    subject: 'Reset your Habit Tracker password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111827;">Reset your password</h2>
        <p style="color: #374151;">
          We got a request to reset the password for your Habit Tracker account.
          This link expires in 1 hour.
        </p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">
            Reset password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
