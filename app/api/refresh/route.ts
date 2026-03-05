import { NextResponse } from 'next/server';

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || '';

  // Fire and forget — the cron job can take several minutes
  fetch(`${appUrl}/api/cron/refresh-data`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${cronSecret}` },
  }).catch(() => {});

  return NextResponse.json({ message: 'Refresh started' });
}
