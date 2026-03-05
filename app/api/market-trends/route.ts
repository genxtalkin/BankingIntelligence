import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServiceClient();

  // Get the most recent batch
  const { data: latestBatch } = await supabase
    .from('market_trends_cache')
    .select('batch_date')
    .order('batch_date', { ascending: false })
    .limit(1)
    .single();

  if (!latestBatch) {
    return NextResponse.json({ trends: [], batchDate: null });
  }

  const { data: trends, error } = await supabase
    .from('market_trends_cache')
    .select('*')
    .eq('batch_date', latestBatch.batch_date)
    .order('relevance_score', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[market-trends API] Supabase error:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }

  return NextResponse.json({
    trends: trends || [],
    batchDate: latestBatch.batch_date,
  });
}
