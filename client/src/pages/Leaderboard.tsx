import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Founder } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';
import CarbonAd from '../components/CarbonAd';
import { cn } from '@/lib/utils';
import { BarChart3, Users, Flame, ChevronRight, LayoutGrid } from 'lucide-react';

const PARTICLES = [
  { tx: 75, ty: -65, emoji: '🔥', delay: 0 },
  { tx: 90, ty: 0, emoji: '✨', delay: 35 },
  { tx: 75, ty: 65, emoji: '🔥', delay: 70 },
  { tx: 0, ty: -85, emoji: '⚡', delay: 15 },
  { tx: -75, ty: -65, emoji: '💫', delay: 55 },
  { tx: -90, ty: 0, emoji: '🔥', delay: 5 },
  { tx: -75, ty: 65, emoji: '✨', delay: 45 },
  { tx: 0, ty: 85, emoji: '🌟', delay: 25 },
];

function VoteParticles({ show, small = false }: { show: boolean; small?: boolean }) {
  if (!show) return null;
  const s = small ? 0.6 : 1;
  return (
    <>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-particle"
          style={{
            '--tx': `${Math.round(p.tx * s)}px`,
            '--ty': `${Math.round(p.ty * s)}px`,
            animationDelay: `${p.delay}ms`,
            fontSize: small ? '13px' : '18px',
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </>
  );
}

type ViewMode = 'official' | 'community' | 'pairwise' | 'compare';

const MODES: { id: ViewMode; label: string; icon: React.ReactNode; hot?: boolean }[] = [
  { id: 'official', label: 'Official', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'community', label: 'Community', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'pairwise', label: "Who's Sassier?", icon: <Flame className="w-3.5 h-3.5" />, hot: true },
  { id: 'compare', label: 'Compare All', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
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

      {/* Ad unit — below mode selector, above content */}
      <CarbonAd />

      {/* Content */}
      {viewMode === 'pairwise' ? (
        <PairwiseMode founders={founders} onVoted={refreshFounders} />
      ) : viewMode === 'compare' ? (
        <CompareMode founders={founders} onVoted={refreshFounders} />
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
    setTimeout(() => { setAnimating(null); getNextPair(); }, 650);
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
                  'relative flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 w-full text-center',
                  isChosen ? 'animate-vote-winner bg-amber-950/40 border-amber-500/60 glow-amber' :
                  isRejected ? 'animate-vote-loser bg-zinc-950/50 border-zinc-900' :
                  'transition-all duration-300 bg-zinc-900/50 border-white/[0.06] hover:bg-zinc-800/60 hover:border-amber-900/30 hover:scale-[1.01]'
                )}
              >
                <VoteParticles show={isChosen} />
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
                  'px-5 py-2 rounded-full text-xs font-bold border',
                  isChosen
                    ? 'animate-badge-pop bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'transition-all bg-white/[0.04] text-zinc-500 border-white/[0.06]'
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

type SortKey = 'official' | 'community' | 'elo';

function CompareMode({ founders, onVoted }: { founders: Founder[]; onVoted: () => void }) {
  const [sortKey, setSortKey] = useState<SortKey>('official');
  const [showVoting, setShowVoting] = useState(false);
  const [votesThisSession, setVotesThisSession] = useState(0);

  const officialRanked = [...founders].sort((a, b) => b.sassyScore - a.sassyScore);
  const communityRanked = [...founders].sort((a, b) => (b.communityScore ?? b.sassyScore) - (a.communityScore ?? a.sassyScore));
  const eloRanked = [...founders].sort((a, b) => (b.eloScore ?? 1500) - (a.eloScore ?? 1500));

  const officialRankMap = new Map(officialRanked.map((f, i) => [f.id, i + 1]));
  const communityRankMap = new Map(communityRanked.map((f, i) => [f.id, i + 1]));
  const eloRankMap = new Map(eloRanked.map((f, i) => [f.id, i + 1]));

  const sorted = sortKey === 'community' ? communityRanked : sortKey === 'elo' ? eloRanked : officialRanked;

  const colBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      className={cn(
        'text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
        sortKey === key
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
          : 'text-zinc-600 border-white/[0.06] hover:text-zinc-400 bg-transparent'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 font-medium">Sort by:</span>
          {colBtn('official', '🏆 Official')}
          {colBtn('community', '👥 Community')}
          {colBtn('elo', "🔥 Who's Sassier")}
        </div>
        <button
          onClick={() => setShowVoting(v => !v)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all',
            showVoting
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'text-zinc-500 border-white/[0.06] hover:text-zinc-300 bg-transparent'
          )}
        >
          <Flame className="w-3 h-3" />
          {showVoting ? 'Hide Voting' : 'Vote Now'}
        </button>
      </div>

      <div className={cn('grid gap-4', showVoting ? 'lg:grid-cols-[1fr_380px]' : 'grid-cols-1')}>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[auto_1fr_80px_80px_80px] gap-3 px-5 pb-1 text-[10px] font-semibold text-zinc-700 uppercase tracking-wider">
            <div className="w-9" />
            <div>Founder</div>
            <div className="text-center">Official</div>
            <div className="text-center">Community</div>
            <div className="text-center">Sassier</div>
          </div>

          {sorted.map((founder, index) => {
            const officialRank = officialRankMap.get(founder.id)!;
            const communityRank = communityRankMap.get(founder.id)!;
            const eloRank = eloRankMap.get(founder.id)!;
            const currentRank = index + 1;

            return (
              <Link to={`/founders/${founder.id}`} key={founder.id} className="no-underline block group">
                <div className={cn(
                  'relative grid grid-cols-[auto_1fr_80px_80px_80px] gap-3 items-center px-5 py-3.5 rounded-2xl border transition-all duration-200',
                  currentRank <= 3
                    ? 'bg-gradient-to-r from-amber-950/30 to-transparent border-amber-900/30 hover:border-amber-700/40'
                    : 'bg-zinc-900/40 border-white/[0.05] hover:bg-zinc-800/50 hover:border-white/10'
                )}>
                  <RankBadge rank={currentRank} />
                  <div className="flex items-center gap-3 min-w-0">
                    {founder.imageUrl ? (
                      <img src={founder.imageUrl} alt={founder.name} className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center text-sm flex-shrink-0">
                        {founder.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{founder.name}</div>
                      <div className="text-[11px] text-zinc-600 truncate">{founder.company}</div>
                    </div>
                  </div>
                  <ScoreCell value={founder.sassyScore.toFixed(1)} unit="🥃" rank={officialRank} active={sortKey === 'official'} />
                  <ScoreCell value={(founder.communityScore ?? founder.sassyScore).toFixed(1)} unit="🥃" rank={communityRank} active={sortKey === 'community'} dim={!founder.communityScore} />
                  <ScoreCell value={(founder.eloScore ?? 1500).toFixed(0)} unit="elo" rank={eloRank} active={sortKey === 'elo'} />
                </div>
              </Link>
            );
          })}
        </div>

        {showVoting && (
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-3xl border border-white/[0.06] bg-zinc-900/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-white">Who's Sassier?</span>
              </div>
              <p className="text-xs text-zinc-600">Tap the sassier founder to update Elo rankings.</p>
              <InlineVoting onVoted={() => { onVoted(); setVotesThisSession(v => v + 1); }} />
              {votesThisSession > 0 && (
                <p className="text-[11px] text-zinc-700 text-center">{votesThisSession} vote{votesThisSession !== 1 ? 's' : ''} this session</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCell({ value, unit, rank, active, dim }: { value: string; unit: string; rank: number; active: boolean; dim?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center gap-0.5', dim && 'opacity-40')}>
      <div className={cn('text-sm font-black tabular-nums leading-none', active ? 'text-amber-300' : 'text-zinc-400')}>
        {value}
        <span className="text-[9px] font-medium ml-0.5 opacity-60">{unit}</span>
      </div>
      <span className="text-[10px] text-zinc-700">#{rank}</span>
    </div>
  );
}

function InlineVoting({ onVoted }: { onVoted: () => void }) {
  const [pair, setPair] = useState<[Founder, Founder] | null>(null);
  const [animating, setAnimating] = useState<number | null>(null);

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
      onVoted();
    } catch { /* continue */ }
    setTimeout(() => { setAnimating(null); getNextPair(); }, 650);
  };

  if (!pair) return (
    <div className="text-center py-8 text-zinc-700">
      <div className="text-3xl mb-2">🥃</div>
      <p className="text-xs">Loading matchup...</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
        {([pair[0], null, pair[1]] as (Founder | null)[]).map((founder, i) => {
          if (!founder) return (
            <div key="vs" className="flex items-center justify-center">
              <div className="w-6 h-6 rounded-full glass flex items-center justify-center text-[10px] font-black text-zinc-700">VS</div>
            </div>
          );
          const isChosen = animating === founder.id;
          const isRejected = animating !== null && animating !== founder.id;
          const founderIndex = i === 0 ? 0 : 1;
          return (
            <button
              key={founder.id}
              onClick={() => { if (animating === null) handleVote(founder.id, pair[founderIndex === 0 ? 1 : 0].id); }}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 w-full text-center',
                isChosen ? 'animate-vote-winner bg-amber-950/40 border-amber-500/60 glow-amber' :
                isRejected ? 'animate-vote-loser border-zinc-900 bg-zinc-950/50' :
                'transition-all duration-300 bg-zinc-800/50 border-white/[0.06] hover:bg-zinc-800/80 hover:border-amber-900/40'
              )}
            >
              <VoteParticles show={isChosen} small />
              {founder.imageUrl ? (
                <img src={founder.imageUrl} alt={founder.name} className="w-14 h-14 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-zinc-700/60 border border-white/5 flex items-center justify-center text-2xl">
                  {isChosen ? '🔥' : founder.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-bold text-xs text-white leading-tight">{founder.name}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{founder.company}</div>
              </div>
              <div className={cn(
                'px-3 py-1 rounded-full text-[10px] font-bold border',
                isChosen ? 'animate-badge-pop bg-amber-500/20 text-amber-300 border-amber-500/40' : 'transition-all text-zinc-600 border-white/[0.06] bg-transparent'
              )}>
                {isChosen ? '🔥 Sassier!' : 'Sassier →'}
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={getNextPair}
        className="w-full py-1.5 rounded-full text-xs text-zinc-700 border border-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-500 transition-all bg-transparent"
      >
        Skip →
      </button>
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
