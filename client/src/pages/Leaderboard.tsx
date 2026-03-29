import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Founder } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';
import { cn } from '@/lib/utils';
import { BarChart3, Users, Flame, ChevronRight } from 'lucide-react';

type ViewMode = 'official' | 'community' | 'pairwise';

const MODES: { id: ViewMode; label: string; icon: React.ReactNode; hot?: boolean }[] = [
  { id: 'official', label: 'Official', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'community', label: 'Community', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'pairwise', label: "Who's Sassier?", icon: <Flame className="w-3.5 h-3.5" />, hot: true },
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
      return (b.communityScore ?? b.sassyScore) - (a.communityScore ?? a.sassyScore);
    }
    if (viewMode === 'pairwise') {
      return (b.eloScore ?? 1500) - (a.eloScore ?? 1500);
    }
    return b.sassyScore - a.sassyScore;
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mesh-bg border border-white/[0.06] px-8 py-12">
        {/* Decorative orbs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-orange-700/8 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-amber text-xs font-semibold text-amber-400 mb-5">
            <Flame className="w-3 h-3" />
            <span>Sassiness Index 2025</span>
          </div>
          <h1 className="text-5xl font-black leading-tight mb-3">
            <span className="text-gradient">Sassy Founders</span>
            <br />
            <span className="text-white/90">Leaderboard</span>
          </h1>
          <p className="text-zinc-400 text-base max-w-xl leading-relaxed">
            Ranked by whiskey units needed to survive a conversation.
            Higher score = more bourbon required.
          </p>
          {founders.length > 0 && (
            <div className="flex items-center gap-6 mt-6">
              <Stat label="Founders ranked" value={String(founders.length)} />
              <div className="w-px h-8 bg-white/10" />
              <Stat label="Top sassy score" value={`${sorted[0]?.sassyScore.toFixed(1) ?? '—'} 🥃`} />
              <div className="w-px h-8 bg-white/10" />
              <Stat label="Community votes" value={String(founders.reduce((s, f) => s + f.communityVoteCount, 0))} />
            </div>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={cn(
              'relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border',
              viewMode === mode.id
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-900/20'
                : 'bg-transparent text-zinc-500 border-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-300 hover:border-white/10'
            )}
          >
            {mode.icon}
            {mode.label}
            {mode.hot && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 border border-[#080808]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'pairwise' ? (
        <PairwiseMode founders={founders} onVoted={refreshFounders} />
      ) : (
        <div className="space-y-2">
          {sorted.map((founder, index) => (
            <FounderRow key={founder.id} founder={founder} rank={index + 1} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-zinc-600 mt-0.5">{label}</div>
    </div>
  );
}

function FounderRow({ founder, rank, viewMode }: { founder: Founder; rank: number; viewMode: ViewMode }) {
  const score = viewMode === 'community' && founder.communityScore !== null
    ? founder.communityScore
    : founder.sassyScore;
  const isPairwise = viewMode === 'pairwise';
  const isTop3 = rank <= 3;

  const scoreTextClass =
    score >= 8 ? 'text-red-400' : score >= 5 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <Link to={`/founders/${founder.id}`} className="no-underline block group">
      <div className={cn(
        'relative flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200',
        isTop3
          ? 'bg-gradient-to-r from-amber-950/30 to-transparent border-amber-900/30 hover:border-amber-700/40 hover:from-amber-950/50'
          : 'bg-zinc-900/40 border-white/[0.05] hover:bg-zinc-800/50 hover:border-white/10'
      )}>
        {/* Rank */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0',
          rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
          rank === 2 ? 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30' :
          rank === 3 ? 'bg-orange-800/20 text-orange-500 border border-orange-700/30' :
          'bg-zinc-800/50 text-zinc-600 border border-white/5'
        )}>
          {rank <= 3 ? (['🥇', '🥈', '🥉'][rank - 1]) : rank}
        </div>

        {/* Avatar placeholder / image */}
        {founder.imageUrl ? (
          <img
            src={founder.imageUrl}
            alt={founder.name}
            className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-lg flex-shrink-0">
            {founder.name.charAt(0)}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-semibold text-sm text-white">{founder.name}</span>
            <span className="text-xs text-zinc-600 font-medium">{founder.company}</span>
            {founder.communityVoteCount > 0 && (
              <span className="hidden sm:inline text-[10px] text-zinc-700">
                {founder.communityVoteCount} votes
              </span>
            )}
          </div>
          <WhiskeyBar score={score} size="sm" />
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isPairwise ? (
            <div className="text-right">
              <div className="text-lg font-black text-amber-400 tabular-nums leading-none">{(founder.eloScore ?? 1500).toFixed(0)}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">elo</div>
            </div>
          ) : (
            <div className="text-right">
              <div className={cn('text-2xl font-black tabular-nums leading-none', scoreTextClass)}>
                {score.toFixed(1)}
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5">🥃 units</div>
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        </div>
      </div>
    </Link>
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
    setTimeout(() => { setAnimating(null); getNextPair(); }, 400);
  };

  if (showLeaderboard) {
    const sorted = [...founders].sort((a, b) => (b.eloScore ?? 1500) - (a.eloScore ?? 1500));
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowLeaderboard(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-300 transition-all bg-transparent"
          >
            ← Keep Voting
          </button>
          <span className="text-xs text-zinc-600">{votesThisSession} votes this session</span>
        </div>
        <div className="space-y-2">
          {sorted.map((founder, index) => (
            <div key={founder.id} className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-zinc-900/40 border border-white/[0.05]">
              <RankBadge rank={index + 1} />
              <div className="flex-1">
                <span className="font-semibold text-sm text-white">{founder.name}</span>
                <span className="text-xs text-zinc-600 ml-2">{founder.company}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-amber-400 tabular-nums leading-none">{(founder.eloScore ?? 1500).toFixed(0)}</div>
                <div className="text-[10px] text-zinc-700 mt-0.5">Elo</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-zinc-500">Tap the sassier founder to update the Elo rankings.</p>
        {votesThisSession > 0 && (
          <p className="text-xs text-zinc-700 mt-1">
            {votesThisSession} vote{votesThisSession !== 1 ? 's' : ''} ·{' '}
            <button
              onClick={() => setShowLeaderboard(true)}
              className="text-amber-600 hover:text-amber-500 underline bg-transparent border-none text-xs cursor-pointer"
            >
              See rankings
            </button>
          </p>
        )}
      </div>

      {pair ? (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
          {([pair[0], null, pair[1]] as (Founder | null)[]).map((founder, i) => {
            if (!founder) return (
              <div key="vs" className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs font-black text-zinc-600">VS</div>
              </div>
            );
            const isChosen = animating === founder.id;
            const isRejected = animating !== null && animating !== founder.id;
            const founderIndex = i === 0 ? 0 : 1;
            return (
              <button
                key={founder.id}
                onClick={() => {
                  if (animating === null) {
                    handleVote(founder.id, pair[founderIndex === 0 ? 1 : 0].id);
                  }
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 transition-all duration-300 w-full text-center',
                  isChosen ? 'bg-amber-950/40 border-amber-500/60 scale-[1.02] glow-amber' :
                  isRejected ? 'bg-zinc-950/50 border-zinc-900 opacity-30 scale-95' :
                  'bg-zinc-900/50 border-white/[0.06] hover:bg-zinc-800/60 hover:border-amber-900/30 hover:scale-[1.01]'
                )}
              >
                {founder.imageUrl ? (
                  <img
                    src={founder.imageUrl}
                    alt={founder.name}
                    className={cn('w-24 h-24 rounded-2xl object-cover border-2 transition-all',
                      isChosen ? 'border-amber-500/60' : 'border-white/10'
                    )}
                  />
                ) : (
                  <div className={cn('w-24 h-24 rounded-2xl flex items-center justify-center text-4xl border-2 transition-all',
                    isChosen ? 'bg-amber-950/50 border-amber-500/40' : 'bg-zinc-800/60 border-white/5'
                  )}>
                    {isChosen ? '🔥' : founder.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-black text-lg text-white leading-tight">{founder.name}</div>
                  <div className="text-xs text-zinc-500 mt-1">{founder.company}</div>
                  <div className="text-xs text-zinc-700 italic mt-2 leading-relaxed max-w-[160px] mx-auto">
                    "{founder.title}"
                  </div>
                </div>
                <div className={cn(
                  'px-5 py-2 rounded-full text-xs font-bold border transition-all',
                  isChosen
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                )}>
                  {isChosen ? '🔥 Sassier!' : 'Sassier →'}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-700">
          <div className="text-5xl mb-3">🥃</div>
          <p>Loading matchup...</p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={getNextPair}
          className="px-5 py-2 rounded-full text-sm text-zinc-600 border border-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-400 transition-all bg-transparent"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <div className={cn(
      'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0',
      rank === 1 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
      rank === 2 ? 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/25' :
      rank === 3 ? 'bg-orange-800/15 text-orange-500 border border-orange-700/25' :
      'bg-zinc-800/50 text-zinc-600 border border-white/5'
    )}>
      {rank <= 3 ? (['🥇', '🥈', '🥉'][rank - 1]) : rank}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl animate-pulse-glow">
        🥃
      </div>
      <p className="text-sm text-zinc-600 font-medium">Pouring the rankings...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="text-5xl">💀</div>
      <p className="text-sm text-red-500">{message}</p>
    </div>
  );
}
