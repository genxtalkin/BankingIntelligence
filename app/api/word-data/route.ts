import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServiceClient();

  // Get the most recent batch date
  const { data: latestBatch } = await supabase
    .from('word_frequencies_cache')
    .select('batch_date')
    .order('batch_date', { ascending: false })
    .limit(1)
    .single();

  if (!latestBatch) {
    return NextResponse.json({ words: [], batchDate: null });
  }

  const { data: words, error } = await supabase
    .from('word_frequencies_cache')
    .select('*')
    .eq('batch_date', latestBatch.batch_date)
    .order('frequency', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[word-data API] Supabase error:', error);
    return NextResponse.json({ error: 'Failed to fetch word data' }, { status: 500 });
  }

  return NextResponse.json({
    words: words || [],
    batchDate: latestBatch.batch_date,
  });
}
