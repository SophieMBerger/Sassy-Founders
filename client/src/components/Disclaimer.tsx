import { useState } from 'react';
import { Info } from 'lucide-react';

export default function Disclaimer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-white/[0.04] bg-amber-950/10">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-start gap-2">
        <Info className="w-3 h-3 text-amber-700 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-xs text-amber-900/70">
          <span className="font-semibold text-amber-700">SATIRE — </span>
          Entirely fictional & comedic. All scores invented for humor.{' '}
          {expanded && (
            <span className="text-amber-900/50">
              No real research, no real shade (well, maybe a little). The rankings don't reflect any factual assessment of character or personality. This is a joke. If you're one of these founders: hi, you're probably fine in small doses. 🥃
            </span>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="ml-1.5 text-amber-800/60 hover:text-amber-700 underline bg-transparent border-none text-xs transition-colors"
          >
            {expanded ? 'less' : 'read more'}
          </button>
        </div>
      </div>
    </div>
  );
}
