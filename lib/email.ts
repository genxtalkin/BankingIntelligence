import { Resend } from 'resend';
import { UserProfile } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'genxtalkin@gmail.com';
const FROM_EMAIL = 'Verint FI Intel <onboarding@resend.dev>';

// ─── Admin Notification on new signup ────────────────────────────────────────
export async function sendAdminApprovalEmail(
  user: UserProfile,
  token: string
): Promise<void> {
  const approveUrl = `${APP_URL}/admin/approve/${token}?action=approve`;
  const denyUrl = `${APP_URL}/admin/approve/${token}?action=deny`;

  const statesList = user.territory_states.length
    ? user.territory_states.join(', ')
    : 'None selected';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4A1870, #6B2FA0); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Verint FI Intelligence</h1>
        <p style="color: #D4AEF0; margin: 8px 0 0;">New User Access Request</p>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0d4f0; border-top: none;">
        <h2 style="color: #4A1870; margin-top: 0;">New Signup Request</h2>
        <p style="color: #555;">A new user has requested access to the Verint FI Intelligence sales tool:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e0d4f0;">
            <td style="padding: 10px; font-weight: bold; color: #4A1870; width: 35%;">Name</td>
            <td style="padding: 10px; color: #333;">${user.first_name} ${user.last_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e0d4f0;">
            <td style="padding: 10px; font-weight: bold; color: #4A1870;">Email</td>
            <td style="padding: 10px; color: #333;">${user.email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e0d4f0;">
            <td style="padding: 10px; font-weight: bold; color: #4A1870;">Phone</td>
            <td style="padding: 10px; color: #333;">${user.phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #4A1870;">Territory States</td>
            <td style="padding: 10px; color: #333;">${statesList}</td>
          </tr>
        </table>

        <p style="color: #555; margin: 20px 0 10px;"><strong>Action Required:</strong> Please approve or deny this request:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${approveUrl}"
             style="display: inline-block; background: #6B2FA0; color: white;
                    padding: 14px 32px; border-radius: 6px; text-decoration: none;
                    font-weight: bold; font-size: 16px; margin: 0 10px;">
            ✓ Approve Access
          </a>
          <a href="${denyUrl}"
             style="display: inline-block; background: #c0392b; color: white;
                    padding: 14px 32px; border-radius: 6px; text-decoration: none;
                    font-weight: bold; font-size: 16px; margin: 0 10px;">
            ✗ Deny Access
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e0d4f0; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          Submitted on ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET<br/>
          This approval link expires in 7 days.<br/>
          Verint FI Intelligence Platform
        </p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `[Verint FI Intel] New Access Request: ${user.first_name} ${user.last_name}`,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send admin approval email:', err);
    throw err;
  }
}

// ─── User approval confirmation ───────────────────────────────────────────────
export async function sendUserApprovedEmail(
  user: UserProfile,
  tempPassword: string
): Promise<void> {
  const loginUrl = `${APP_URL}/auth/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4A1870, #6B2FA0); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Verint FI Intelligence</h1>
        <p style="color: #D4AEF0; margin: 8px 0 0;">Your Access Has Been Approved!</p>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0d4f0; border-top: none;">
        <h2 style="color: #4A1870; margin-top: 0;">Welcome, ${user.first_name}!</h2>
        <p style="color: #555;">Great news — your account has been approved by the administrator. You now have full access to the Verint FI Intelligence sales platform.</p>

        <div style="background: #f0e8f8; border-left: 4px solid #6B2FA0; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0; color: #4A1870;"><strong>Your Login Credentials:</strong></p>
          <p style="margin: 8px 0 0; color: #555;">Email: <strong>${user.email}</strong></p>
          <p style="margin: 4px 0 0; color: #555;">Temporary Password: <strong style="font-family: monospace; background: white; padding: 2px 6px; border-radius: 3px;">${tempPassword}</strong></p>
          <p style="margin: 8px 0 0; color: #888; font-size: 12px;">Please change your password after your first login.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}"
             style="display: inline-block; background: #6B2FA0; color: white;
                    padding: 14px 40px; border-radius: 6px; text-decoration: none;
                    font-weight: bold; font-size: 16px;">
            Login to Verint FI Intel →
          </a>
        </div>

        <p style="color: #555;">The platform provides:</p>
        <ul style="color: #555; padding-left: 20px;">
          <li>Real-time Mind Cloud &amp; Word Map visualizations of FI security trends</li>
          <li>Top 20 weekly market trend summaries with direct article links</li>
          <li>Territory-specific intelligence for your sales region</li>
        </ul>

        <hr style="border: none; border-top: 1px solid #e0d4f0; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          Verint FI Intelligence Platform<br/>
          Questions? Contact your administrator at ${ADMIN_EMAIL}
        </p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `[Verint FI Intel] Your Account Has Been Approved!`,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send user approved email:', err);
    throw err;
  }
}

// ─── User denial notification ─────────────────────────────────────────────────
export async function sendUserDeniedEmail(user: UserProfile): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4A1870, #6B2FA0); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Verint FI Intelligence</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0d4f0; border-top: none;">
        <h2 style="color: #4A1870; margin-top: 0;">Access Request Update</h2>
        <p style="color: #555;">Hello ${user.first_name},</p>
        <p style="color: #555;">After review, your access request for the Verint FI Intelligence platform was not approved at this time.</p>
        <p style="color: #555;">If you believe this was in error, please contact your administrator at <a href="mailto:${ADMIN_EMAIL}" style="color: #6B2FA0;">${ADMIN_EMAIL}</a>.</p>

        <hr style="border: none; border-top: 1px solid #e0d4f0; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">Verint FI Intelligence Platform</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `[Verint FI Intel] Access Request Update`,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send user denied email:', err);
  }
}
