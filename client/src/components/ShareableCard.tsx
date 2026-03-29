import { useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import type { Founder } from '@shared/types';
import { cn } from '@/lib/utils';

interface ShareableCardProps {
  founder: Founder;
}

export default function ShareableCard({ founder }: ShareableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const scoreColor =
    founder.sassyScore >= 8 ? '#f87171' : founder.sassyScore >= 5 ? '#fbbf24' : '#34d399';

  const whiskeys = Math.round(founder.sassyScore);
  const whiskeyIcons = Array.from({ length: 10 }, (_, i) => (i < whiskeys ? '🥃' : '○'));

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    // Open a minimal print view of the card
    window.print();
  }

  return (
    <div className="space-y-4">
      {/* Shareable card preview */}
      <div
        ref={cardRef}
        className="rounded-3xl bg-zinc-900 border border-white/[0.08] p-6 space-y-4"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {founder.imageUrl ? (
              <img
                src={founder.imageUrl}
                alt={founder.name}
                className="w-14 h-14 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-amber-950 border border-white/10 flex items-center justify-center text-2xl font-black text-amber-700">
                {founder.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-black text-white text-lg leading-tight">{founder.name}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{founder.company}</div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-4xl font-black tabular-nums" style={{ color: scoreColor }}>
              {founder.sassyScore.toFixed(1)}
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5">🥃 sassy score</div>
          </div>
        </div>

        {/* Whiskey meter */}
        <div>
          <div className="text-[11px] text-zinc-600 mb-1.5 font-medium">
            Whiskey units needed to enjoy this convo
          </div>
          <div className="text-xl tracking-wider leading-none">
            {whiskeyIcons.join('')}
          </div>
        </div>

        {/* Score breakdown mini bars */}
        <div className="space-y-1.5">
          {[
            ['Arrogance', founder.scoreBreakdown.arrogance],
            ['Controversial Takes', founder.scoreBreakdown.controversialTakes],
            ['Interruption', founder.scoreBreakdown.interruptionTendency],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-center gap-2">
              <div className="text-[10px] text-zinc-600 w-32 shrink-0">{label}</div>
              <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(Number(value) / 10) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 tabular-nums w-5 text-right">{Number(value).toFixed(0)}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <div className="text-[10px] text-zinc-700 font-medium">sassyfounders.com · purely satirical</div>
          {founder.communityVoteCount > 0 && (
            <div className="text-[10px] text-zinc-700">
              {founder.communityScore?.toFixed(1)} community avg · {founder.communityVoteCount} votes
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border-none cursor-pointer',
            'text-zinc-300 bg-zinc-800 hover:bg-zinc-700'
          )}
        >
          <Download className="w-3.5 h-3.5" />
          Save image
        </button>
        <button
          onClick={handleCopyLink}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border-none cursor-pointer',
            copied ? 'text-emerald-400 bg-emerald-950/50' : 'text-zinc-300 bg-zinc-800 hover:bg-zinc-700'
          )}
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
