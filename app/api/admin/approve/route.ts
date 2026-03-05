import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { sendUserApprovedEmail, sendUserDeniedEmail } from '@/lib/email';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const action = searchParams.get('action'); // 'approve' or 'deny'

  if (!token || !action || !['approve', 'deny'].includes(action)) {
    return new NextResponse(errorPage('Invalid request. Missing token or action.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const supabase = createServiceClient();

  // Look up token
  const { data: tokenRow, error: tokenError } = await supabase
    .from('approval_tokens')
    .select('*, user_profiles(*)')
    .eq('token', token)
    .single();

  if (tokenError || !tokenRow) {
    return new NextResponse(errorPage('Token not found or expired.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (tokenRow.used) {
    return new NextResponse(
      errorPage(`This token has already been used. Action taken: ${tokenRow.action_taken || 'unknown'}.`),
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return new NextResponse(errorPage('This approval link has expired.'), {
      status: 410,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const profile = (tokenRow as { user_profiles: { id: string; email: string; first_name: string; last_name: string; phone: string | null; territory_states: string[]; approved: boolean; denied: boolean; denial_reason: string | null; auth_user_id: string | null; created_at: string; updated_at: string } }).user_profiles;

  if (!profile) {
    return new NextResponse(errorPage('User profile not found.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (action === 'approve') {
    try {
      // Create Supabase auth user
      const tempPassword = generateTempPassword();
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: profile.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: profile.first_name,
          last_name: profile.last_name,
        },
      });

      if (authError) {
        console.error('[approve] Auth user creation error:', authError);
        return new NextResponse(errorPage(`Failed to create account: ${authError.message}`), {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({
          approved: true,
          auth_user_id: authUser.user.id,
        })
        .eq('id', profile.id);

      // Mark token as used
      await supabase
        .from('approval_tokens')
        .update({ used: true, action_taken: 'approved' })
        .eq('id', tokenRow.id);

      // Send approval email to user
      try {
        await sendUserApprovedEmail(profile, tempPassword);
      } catch (emailErr) {
        console.error('[approve] Email error:', emailErr);
      }

      return new NextResponse(
        successPage(
          'User Approved',
          `${profile.first_name} ${profile.last_name} (${profile.email}) has been approved. ` +
          `They will receive login credentials by email.`
        ),
        { headers: { 'Content-Type': 'text/html' } }
      );
    } catch (err) {
      return new NextResponse(errorPage(`Unexpected error: ${String(err)}`), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } else {
    // Deny
    await supabase
      .from('user_profiles')
      .update({ denied: true })
      .eq('id', profile.id);

    await supabase
      .from('approval_tokens')
      .update({ used: true, action_taken: 'denied' })
      .eq('id', tokenRow.id);

    try {
      await sendUserDeniedEmail(profile);
    } catch (emailErr) {
      console.error('[deny] Email error:', emailErr);
    }

    return new NextResponse(
      successPage(
        'Access Denied',
        `${profile.first_name} ${profile.last_name} has been denied access. They will be notified by email.`
      ),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

function errorPage(message: string): string {
  return `<!DOCTYPE html><html><head><title>Error</title>
    <style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;
    min-height:100vh;margin:0;background:#F5F0FA;}
    .box{background:white;border-radius:12px;padding:40px;max-width:480px;text-align:center;
    box-shadow:0 4px 24px rgba(107,47,160,0.15);border:1px solid #D4AEF0;}
    h2{color:#C0392B;}p{color:#555;}</style></head>
    <body><div class="box"><h2>⚠️ Error</h2><p>${message}</p></div></body></html>`;
}

function successPage(title: string, message: string): string {
  const isApproval = title.includes('Approved');
  return `<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;
    min-height:100vh;margin:0;background:#F5F0FA;}
    .box{background:white;border-radius:12px;padding:40px;max-width:480px;text-align:center;
    box-shadow:0 4px 24px rgba(107,47,160,0.15);border:1px solid #D4AEF0;}
    h2{color:${isApproval ? '#1E8449' : '#C0392B'};}p{color:#555;line-height:1.6;}
    .badge{display:inline-block;background:${isApproval ? '#27AE60' : '#C0392B'};
    color:white;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:16px;}
    </style></head>
    <body><div class="box">
    <div style="font-size:48px;margin-bottom:12px;">${isApproval ? '✅' : '❌'}</div>
    <div class="badge">Verint FI Intelligence</div>
    <h2>${title}</h2><p>${message}</p>
    <p style="margin-top:24px;font-size:13px;color:#888;">You can close this window.</p>
    </div></body></html>`;
}
