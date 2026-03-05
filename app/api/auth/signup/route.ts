import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { sendAdminApprovalEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, phone, territory_states } = body;

    // Basic validation
    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check for existing signup
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id, approved, denied')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.approved) {
        return NextResponse.json(
          { error: 'An account with this email already exists and is approved. Please log in.' },
          { status: 409 }
        );
      }
      if (existing.denied) {
        return NextResponse.json(
          { error: 'Your access request was previously denied. Please contact the administrator.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'A signup request with this email is already pending approval.' },
        { status: 409 }
      );
    }

    // Create user profile (pending)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        territory_states: territory_states || [],
        approved: false,
        denied: false,
      })
      .select()
      .single();

    if (profileError || !profile) {
      console.error('[signup] Profile insert error:', profileError);
      return NextResponse.json({ error: 'Failed to create signup request' }, { status: 500 });
    }

    // Create approval token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: tokenError } = await supabase
      .from('approval_tokens')
      .insert({
        user_profile_id: profile.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('[signup] Token insert error:', tokenError);
      // Don't fail the signup — token can be re-generated later
    }

    // Send admin notification email
    try {
      await sendAdminApprovalEmail(profile, token);
    } catch (emailErr) {
      console.error('[signup] Email send error:', emailErr);
      // Don't fail the signup if email fails
    }

    return NextResponse.json({
      success: true,
      message:
        'Your access request has been submitted. An administrator will review it and ' +
        'you will receive an email once your account is approved.',
    });
  } catch (err) {
    console.error('[signup] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
