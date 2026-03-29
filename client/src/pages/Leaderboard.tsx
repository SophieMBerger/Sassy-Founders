import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Founder } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BarChart3, Users, Flame, SlidersHorizontal, Trophy, Loader2 } from 'lucide-react';

type ViewMode = 'official' | 'community' | 'pairwise' | 'manual';

const MODES: { id: ViewMode; label: string; icon: React.ReactNode; highlight?: boolean }[] = [
  { id: 'official', label: 'Official', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'community', label: 'Community', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'pairwise', label: "Who's Sassier?", icon: <Flame className="w-3.5 h-3.5" />, highlight: true },
  { id: 'manual', label: 'Rate Manually', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
];

export default function Leaderboard() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('official');

  useEffect(() => {
    fetch('/api/founders')
      .then(r => r.json())
      .then(data => { setFounders(data.founders); setLoading(false); })
      .catch(() => { setError('Failed to load founders'); setLoading(false); });
  }, []);

  const refreshFounders = () => {
    fetch('/api/founders')
      .then(r => r.json())
      .then(data => setFounders(data.founders))
      .catch(() => {});
  };

  const sorted = [...founders].sort((a, b) => {
    if (viewMode === 'community') {
      const aScore = a.communityScore ?? a.sassyScore;
      const bScore = b.communityScore ?? b.sassyScore;
      return bScore - aScore;
    }
    if (viewMode === 'pairwise') {
      return (b.eloScore ?? 1500) - (a.eloScore ?? 1500);
    }
    return b.sassyScore - a.sassyScore;
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold text-amber-100">Sassy Leaderboard</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Ranked by whiskey units needed to survive a conversation. Higher = sassier.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border',
              viewMode === mode.id
                ? 'bg-amber-950 text-amber-300 border-amber-700/60 shadow-sm'
                : mode.highlight
                ? 'bg-zinc-900 text-amber-600/70 border-amber-900/40 hover:bg-amber-950/40 hover:text-amber-500'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300'
            )}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'manual' ? (
        <ManualRankMode founders={founders} onVotesSubmitted={refreshFounders} />
      ) : viewMode === 'pairwise' ? (
        <PairwiseMode founders={founders} onVoted={refreshFounders} />
      ) : (
        <div className="space-y-2">
          {sorted.map((founder, index) => (
            <FounderRow
              key={founder.id}
              founder={founder}
              rank={index + 1}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PairwiseMode({ founders, onVoted }: { founders: Founder[]; onVoted: () => void }) {
  const [pair, setPair] = useState<[Founder, Founder] | null>(null);
  const [votesThisSession, setVotesThisSession] = useState(0);
  const [animating, setAnimating] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const getNextPair = () => {
    fetch('/api/founders/pair')
      .then(r => r.json())
      .then(data => setPair(data.founders as [Founder, Founder]))
      .catch(() => {});
  };

  useEffect(() => { getNextPair(); }, []);

  const handleVote = async (winnerId: number, loserId: number) => {
    setAnimating(winnerId);
    try {
      await fetch('/api/pairwise/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, loserId }),
      });
      setVotesThisSession(v => v + 1);
      onVoted();
    } catch { /* continue */ }
    setTimeout(() => { setAnimating(null); getNextPair(); }, 350);
  };

  if (showLeaderboard) {
    const sorted = [...founders].sort((a, b) => (b.eloScore ?? 1500) - (a.eloScore ?? 1500));
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowLeaderboard(false)}>
            ← Keep Voting
          </Button>
          <span className="text-xs text-zinc-500">
            Pairwise Leaderboard · {votesThisSession} votes this session
          </span>
        </div>
        <div className="space-y-2">
          {sorted.map((founder, index) => (
            <Card key={founder.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <RankBadge rank={index + 1} />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-zinc-100">{founder.name}</span>
                  <span className="text-xs text-zinc-500 ml-2">{founder.company}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-500">{(founder.eloScore ?? 1500).toFixed(0)}</div>
                  <div className="text-[10px] text-zinc-600">Elo</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-zinc-500 mb-1.5">Tap the sassier founder. Results update the Elo leaderboard.</p>
        {votesThisSession > 0 && (
          <span className="text-xs text-zinc-600">
            {votesThisSession} vote{votesThisSession !== 1 ? 's' : ''} cast ·{' '}
            <button
              onClick={() => setShowLeaderboard(true)}
              className="text-amber-600 hover:text-amber-500 bg-transparent border-none cursor-pointer text-xs underline"
            >
              See rankings
            </button>
          </span>
        )}
      </div>

      {pair ? (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
          {([pair[0], null, pair[1]] as (Founder | null)[]).map((founder, i) => {
            if (founder === null) {
              return (
                <div key="vs" className="flex items-center justify-center text-zinc-700 font-bold text-sm">
                  VS
                </div>
              );
            }
            const isChosen = animating === founder.id;
            const isRejected = animating !== null && animating !== founder.id;
            const founderIndex = i === 0 ? 0 : 1;
            return (
              <button
                key={founder.id}
                onClick={() => {
                  if (animating === null) {
                    const other = pair[founderIndex === 0 ? 1 : 0];
                    handleVote(founder.id, other.id);
                  }
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-250 cursor-pointer text-center w-full',
                  isChosen
                    ? 'bg-amber-950/60 border-amber-600 scale-[1.03]'
                    : isRejected
                    ? 'bg-zinc-950 border-zinc-900 opacity-35'
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 hover:border-amber-800/50'
                )}
              >
                {founder.imageUrl ? (
                  <img
                    src={founder.imageUrl}
                    alt={founder.name}
                    className={cn(
                      'w-20 h-20 rounded-full object-cover border-2',
                      isChosen ? 'border-amber-500' : 'border-zinc-700',
                      isRejected && 'grayscale'
                    )}
                  />
                ) : (
                  <div className="text-4xl">{isChosen ? '🔥' : '🧑‍💼'}</div>
                )}
                <div>
                  <div className="font-bold text-base text-zinc-100">{founder.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{founder.company}</div>
                  <div className="text-xs text-zinc-600 italic mt-1 leading-snug max-w-[160px] mx-auto">
                    "{founder.title}"
                  </div>
                </div>
                <Badge variant={isChosen ? 'default' : 'outline'} className="text-xs">
                  Sassier →
                </Badge>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-600">
          <div className="text-5xl mb-3">🥃</div>
          <p>Loading matchup...</p>
        </div>
      )}

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={getNextPair}>
          Skip this matchup →
        </Button>
      </div>
    </div>
  );
}

function ManualRankMode({ founders, onVotesSubmitted }: { founders: Founder[]; onVotesSubmitted: () => void }) {
  const [votes, setVotes] = useState<Record<number, number>>(() =>
    Object.fromEntries(founders.map(f => [f.id, 5]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const ratedCount = Object.values(votes).filter(v => v !== 5).length;

  async function handleSubmitAll() {
    setSubmitting(true);
    let count = 0;
    for (const [founderId, units] of Object.entries(votes)) {
      try {
        await fetch(`/api/founders/${founderId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ whiskeyUnits: units }),
        });
        count++;
      } catch { /* continue */ }
    }
    setSubmitCount(count);
    setSubmitting(false);
    setSubmitted(true);
    onVotesSubmitted();
    setTimeout(() => setSubmitted(false), 4000);
  }

  const ranked = [...founders].sort((a, b) => (votes[b.id] ?? 5) - (votes[a.id] ?? 5));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold text-amber-300 text-sm mb-0.5">🥃 Your Personal Ranking</div>
            <div className="text-xs text-zinc-500">
              Drag the sliders — your list re-ranks live. Submit to add to community averages.
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {ratedCount > 0 && (
              <Badge variant="outline" className="text-xs">{ratedCount} modified</Badge>
            )}
            <Button
              variant="amber"
              size="sm"
              onClick={handleSubmitAll}
              disabled={submitting}
            >
              {submitting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Submitting...</> : `Submit All ${founders.length} Ratings`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {submitted && (
        <div className="px-4 py-3 bg-emerald-950/60 border border-emerald-800/40 rounded-lg text-sm text-emerald-400">
          ✓ {submitCount} ratings submitted! Community averages updated.
        </div>
      )}

      <div className="space-y-2.5">
        {ranked.map((founder, index) => (
          <ManualRankRow
            key={founder.id}
            founder={founder}
            rank={index + 1}
            value={votes[founder.id] ?? 5}
            onChange={v => setVotes(prev => ({ ...prev, [founder.id]: v }))}
          />
        ))}
      </div>
    </div>
  );
}

function ManualRankRow({
  founder,
  rank,
  value,
  onChange,
}: {
  founder: Founder;
  rank: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setLocalValue(value);
  }, [value]);

  const scoreColor =
    localValue >= 8 ? 'text-red-400' : localValue >= 5 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="grid grid-cols-[44px_1fr_52px] items-center gap-3">
          <RankBadge rank={rank} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap mb-2">
              <span className="font-semibold text-sm text-zinc-100">{founder.name}</span>
              <span className="text-xs text-zinc-500">{founder.company}</span>
              {founder.communityScore !== null && (
                <span className="text-xs text-zinc-700">
                  community avg: {founder.communityScore.toFixed(1)} ({founder.communityVoteCount} votes)
                </span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={localValue}
              onChange={e => setLocalValue(Number(e.target.value))}
              onPointerDown={() => { dragging.current = true; }}
              onPointerUp={e => {
                dragging.current = false;
                onChange(Number((e.target as HTMLInputElement).value));
              }}
              onKeyUp={e => onChange(Number((e.target as HTMLInputElement).value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-700 mt-1">
              <span>0 = delightful</span>
              <span>5 = tolerable</span>
              <span>10 = send help</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={cn('text-xl font-bold leading-none', scoreColor)}>
              {localValue.toFixed(1)}
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5">🥃</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FounderRow({ founder, rank, viewMode }: { founder: Founder; rank: number; viewMode: ViewMode }) {
  const score =
    viewMode === 'community' && founder.communityScore !== null
      ? founder.communityScore
      : founder.sassyScore;
  const isPairwise = viewMode === 'pairwise';

  const scoreColor =
    score >= 8 ? 'text-red-400' : score >= 5 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <Link to={`/founders/${founder.id}`} className="no-underline block group">
      <Card className="transition-colors duration-150 group-hover:border-amber-800/50 group-hover:bg-zinc-800/60">
        <CardContent className="pt-3 pb-3">
          <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
            <RankBadge rank={rank} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-sm text-zinc-100">{founder.name}</span>
                <span className="text-xs text-zinc-500">{founder.company}</span>
              </div>
              <div className="mt-1.5">
                <WhiskeyBar score={score} size="sm" />
              </div>
              {founder.communityVoteCount > 0 && (
                <div className="text-[11px] text-zinc-700 mt-1">
                  {founder.communityVoteCount} vote{founder.communityVoteCount !== 1 ? 's' : ''} · community avg: {founder.communityScore?.toFixed(1) ?? 'n/a'}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {isPairwise ? (
                <>
                  <div className="text-lg font-bold text-amber-500 leading-none">
                    {(founder.eloScore ?? 1500).toFixed(0)}
                  </div>
                  <div className="text-[10px] text-zinc-600">Elo</div>
                </>
              ) : (
                <>
                  <div className={cn('text-2xl font-bold leading-none', scoreColor)}>
                    {score.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-zinc-600">🥃 units</div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medals = ['🥇', '🥈', '🥉'];
  const borderColor =
    rank === 1
      ? 'border-amber-400 text-amber-400'
      : rank === 2
      ? 'border-zinc-400 text-zinc-400'
      : rank === 3
      ? 'border-amber-600 text-amber-600'
      : 'border-zinc-700 text-zinc-600';

  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full bg-zinc-800 border-2 flex items-center justify-center font-bold text-sm flex-shrink-0',
        borderColor
      )}
    >
      {rank <= 3 ? medals[rank - 1] : rank}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-3">
      <div className="text-5xl">🥃</div>
      <p className="text-sm">Pouring the rankings...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
      <div className="text-5xl">💀</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
