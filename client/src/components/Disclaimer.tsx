import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Disclaimer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-y border-amber-900/40 bg-amber-950/20">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-start gap-2.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-amber-600">SATIRE DISCLAIMER · </span>
          <span className="text-xs text-amber-900/80">
            This site is entirely fictional and comedic. All scores are invented for humor.
            No real data, no real research, no real shade (well, maybe a little).{' '}
          </span>
          {expanded && (
            <span className="text-xs text-amber-900/60 block mt-1.5">
              The "sassy scores" are made-up numbers generated for entertainment purposes only.
              We do not endorse or defame any real person. The rankings do not reflect any factual
              assessment of anyone's character, personality, or conversational difficulty.
              This is a joke. Please laugh. If you are one of these founders: hi, we think you're
              probably fine in small doses. 🥃
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-0.5 text-xs text-zinc-700 hover:text-zinc-500 transition-colors flex-shrink-0 bg-transparent border-none"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> less</>
          ) : (
            <>more <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      </div>
    </div>
  );
}
