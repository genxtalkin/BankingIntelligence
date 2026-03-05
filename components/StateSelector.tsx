'use client';

import { US_STATES } from '@/types';

interface StateSelectorProps {
  selected: string[];
  onChange: (states: string[]) => void;
  label?: string;
}

export default function StateSelector({
  selected,
  onChange,
  label = 'Territory States',
}: StateSelectorProps) {
  const toggle = (state: string) => {
    if (selected.includes(state)) {
      onChange(selected.filter((s) => s !== state));
    } else {
      onChange([...selected, state]);
    }
  };

  const toggleAll = () => {
    if (selected.length === US_STATES.length) {
      onChange([]);
    } else {
      onChange([...US_STATES]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="form-label mb-0">{label}</label>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-verint-purple hover:underline font-medium"
        >
          {selected.length === US_STATES.length ? 'Clear All' : 'Select All'}
        </button>
      </div>

      {selected.length > 0 && (
        <div className="text-xs text-verint-purple-dark font-medium">
          {selected.length} state{selected.length !== 1 ? 's' : ''} selected:{' '}
          <span className="text-verint-purple">{selected.slice(0, 5).join(', ')}
          {selected.length > 5 ? ` +${selected.length - 5} more` : ''}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto
                      border border-verint-purple-pale rounded-lg p-3 bg-white">
        {US_STATES.map((state) => {
          const isSelected = selected.includes(state);
          return (
            <label
              key={state}
              className={`flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 text-xs
                          transition-colors select-none ${
                isSelected
                  ? 'bg-verint-purple text-white'
                  : 'hover:bg-verint-purple-bg text-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(state)}
                className="sr-only"
              />
              <span
                className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                  isSelected
                    ? 'border-white bg-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-verint-purple" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2"
                          fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {state}
            </label>
          );
        })}
      </div>
    </div>
  );
}
