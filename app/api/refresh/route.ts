/**
 * Manual data refresh endpoint — called by the Refresh button in the Navbar.
 *
 * Runs the full data refresh synchronously (same logic as the cron job) and
 * returns when complete. The UI shows a "please wait" banner while this runs.
 *
 * Requires Vercel Pro (or higher) for maxDuration > 10s — same requirement as
 * the cron route.
 */
import { NextResponse } from 'next/server';
import { runDataRefresh } from '@/lib/refresh-data';

export const maxDuration = 300; // 5 minutes — matches the cron route

export async function POST() {
  const result = await runDataRefresh();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
