import { format, subDays } from 'date-fns';

interface DateRangeLabelProps {
  days: number;
  batchDate?: string | null;
  label?: string;
}

export default function DateRangeLabel({
  days,
  batchDate,
  label = 'Data range',
}: DateRangeLabelProps) {
  const endDate = batchDate ? new Date(batchDate) : new Date();
  const startDate = subDays(endDate, days);

  const fmt = (d: Date) => format(d, 'MMM d, yyyy');

  return (
    <div className="inline-flex items-center gap-2 bg-verint-purple-bg border border-verint-purple-pale
                    rounded-full px-4 py-1.5 text-sm">
      <span className="w-2 h-2 rounded-full bg-verint-purple live-pulse flex-shrink-0" />
      <span className="text-verint-purple-dark font-medium">{label}:</span>
      <span className="text-verint-purple font-semibold">
        {fmt(startDate)} – {fmt(endDate)}
      </span>
      {batchDate && (
        <span className="text-gray-400 text-xs ml-1">
          (refreshed {format(new Date(batchDate), 'MMM d')})
        </span>
      )}
    </div>
  );
}
