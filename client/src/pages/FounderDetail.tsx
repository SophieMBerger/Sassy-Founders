import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { FounderDetailResponse } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';
import CarbonAd from '../components/CarbonAd';
import PremiumGate from '../components/PremiumGate';
import ShareableCard from '../components/ShareableCard';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, BarChart3, Loader2, Share2, Users, ExternalLink } from 'lucide-react';

const BREAKDOWN_LABELS: Record<string, string> = {
  arrogance: 'Arrogance',
  controversialTakes: 'Controversial Takes',
  interruptionTendency: 'Interruption Tendency',
  humblebragging: 'Humblebragging',
  buzzwordDensity: 'Buzzword Density',
};

export default function FounderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [founder, setFounder] = useState<FounderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vote, setVote] = useState<number>(5);
  const [voting, setVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    fetch(`/api/founders/${id}`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then((data: FounderDetailResponse) => {
        setFounder(data);
        if (data.myVote !== null) setVote(data.myVote);
        setLoading(false);
      })
      .catch(() => { setError('Founder not found'); setLoading(false); });
  }, [id, user]);

  async function handleVote() {
    if (!user) { setShowLogin(true); return; }
    if (!founder) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/founders/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ whiskeyUnits: vote }),
      });
      if (res.status === 401) { setShowLogin(true); return; }
      const updated = await res.json();
      setFounder(prev => prev ? { ...prev, ...updated, myVote: vote } : prev);
      setVoteSuccess(true);
      setTimeout(() => setVoteSuccess(false), 3000);
    } catch { /* ignore */ } finally { setVoting(false); }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl animate-pulse-glow">
        🥃
      </div>
      <p className="text-sm text-zinc-600">Loading...</p>
    </div>
  );

  if (error || !founder) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="text-5xl">💀</div>
      <p className="text-sm text-red-400">{error}</p>
      <Link to="/" className="text-sm">← Back to leaderboard</Link>
    </div>
  );

  const breakdown = founder.scoreBreakdown;
  const scoreTextClass = founder.sassyScore >= 8 ? 'text-red-400' : founder.sassyScore >= 5 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to leaderboard
      </Link>

      {/* Profile Hero */}
      <div className="relative overflow-hidden rounded-3xl mesh-bg border border-white/[0.06] p-8">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-700/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex items-start gap-5">
            {founder.imageUrl ? (
              <img
                src={founder.imageUrl}
                alt={founder.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 shadow-xl flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-950 to-zinc-900 border border-white/10 flex items-center justify-center text-3xl font-black text-amber-700 flex-shrink-0">
                {founder.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-3xl font-black text-white leading-tight">{founder.name}</h2>
              <p className="text-sm text-zinc-500 mt-1 font-medium">
                {founder.title} · <span className="text-amber-600/70">{founder.company}</span>
              </p>
              <p className="text-sm text-zinc-400 mt-4 leading-relaxed max-w-xl">{founder.bio}</p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right sm:text-right">
            <div className={cn('text-6xl font-black tabular-nums leading-none', scoreTextClass)}>
              {founder.sassyScore.toFixed(1)}
            </div>
            <div className="text-xs text-zinc-600 mt-1 font-medium">🥃 official score</div>
            {founder.communityVoteCount > 0 && (
              <div className="mt-3 px-3 py-1.5 rounded-full glass text-xs text-zinc-500 font-medium inline-block">
                {founder.communityScore?.toFixed(1)} community avg · {founder.communityVoteCount} votes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-3xl bg-zinc-900/40 border border-white/[0.05] p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <h3 className="font-bold text-sm text-zinc-200">Sassy Score Breakdown</h3>
        </div>
        <div className="space-y-3.5">
          {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
            <WhiskeyBar
              key={key}
              score={(breakdown as unknown as Record<string, number>)[key]}
              label={label}
              showValue
              size="md"
            />
          ))}
        </div>
      </div>

      {/* Ad unit — hidden for Sipster Club members */}
      <CarbonAd hide={!!user?.isPremium} />

      {/* Shareable Card — Sipster Club exclusive */}
      <div className="rounded-3xl bg-zinc-900/40 border border-white/[0.05] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Share2 className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <h3 className="font-bold text-sm text-zinc-200">Shareable Whiskey Card</h3>
        </div>
        <PremiumGate featureLabel="shareable infographic cards">
          <ShareableCard founder={founder} />
        </PremiumGate>
      </div>

      {/* Community Vote */}
      <div className="rounded-3xl bg-zinc-900/40 border border-white/[0.05] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <h3 className="font-bold text-sm text-zinc-200">
            {founder.myVote !== null ? 'Update Your Rating' : 'Submit Your Rating'}
          </h3>
        </div>

        {!user ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-500">
              Sign in to rate {founder.name.split(' ')[0]} — your vote is tracked across sessions.
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors border-none cursor-pointer shadow-lg shadow-amber-900/30"
            >
              Sign in to vote
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-5">
              How many 🥃 units to enjoy a conversation with {founder.name.split(' ')[0]}?
              {founder.myVote !== null && (
                <span className="text-amber-600/80 ml-2">Your current vote: {founder.myVote}</span>
              )}
            </p>

            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <input
                  type="range" min={0} max={10} step={0.5} value={vote}
                  onChange={e => setVote(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-zinc-700 mt-1">
                  <span>0 (delightful)</span>
                  <span>5 (tolerable)</span>
                  <span>10 (send help)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center">
                  <span className={cn('text-xl font-black tabular-nums', vote >= 8 ? 'text-red-400' : vote >= 5 ? 'text-amber-400' : 'text-emerald-400')}>
                    {vote}
                  </span>
                </div>
                <button
                  onClick={handleVote}
                  disabled={voting}
                  className={cn(
                    'px-6 py-2.5 rounded-2xl text-sm font-bold text-white border-none transition-all',
                    voting ? 'bg-zinc-700 opacity-60 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30'
                  )}
                >
                  {voting ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />...</span>
                    : founder.myVote !== null ? 'Update Vote' : 'Submit'}
                </button>
              </div>
            </div>

            {voteSuccess && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-800/30 text-sm text-emerald-400 font-medium">
                ✓ Vote {founder.myVote !== null ? 'updated' : 'submitted'}! Thanks for rating.
              </div>
            )}
          </>
        )}

        {founder.communityVoteCount > 0 && (
          <div className="flex gap-8 mt-5 pt-5 border-t border-white/[0.05]">
            <div>
              <div className="text-2xl font-black text-amber-400 tabular-nums">
                {founder.communityScore?.toFixed(1) ?? 'n/a'}
              </div>
              <div className="text-xs text-zinc-700 mt-0.5">community avg</div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-300 tabular-nums">
                {founder.communityVoteCount}
              </div>
              <div className="text-xs text-zinc-700 mt-0.5">total votes</div>
            </div>
          </div>
        )}
      </div>

      {/* Whiskey Recommendation — Affiliate */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-950/20 to-zinc-900/40 border border-amber-500/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base">
            🥃
          </div>
          <h3 className="font-bold text-sm text-zinc-200">Recommended whiskey to survive this conversation</h3>
        </div>

        <p className="text-sm text-zinc-500 mb-4">
          {founder.sassyScore >= 8
            ? `With a ${founder.sassyScore.toFixed(1)}/10 sassy score, you'll need something strong. We recommend a premium single malt.`
            : founder.sassyScore >= 5
            ? `At ${founder.sassyScore.toFixed(1)}/10, a smooth bourbon should do the trick.`
            : `Only ${founder.sassyScore.toFixed(1)}/10? A light whiskey sour will suffice.`}
        </p>

        <a
          href={`https://www.reservebar.com/collections/whiskey?utm_source=sassyfounders&utm_medium=affiliate&utm_campaign=founder_profile&utm_content=${encodeURIComponent(founder.name)}`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-amber-300 bg-amber-950/50 hover:bg-amber-950/80 border border-amber-500/30 hover:border-amber-500/50 transition-all no-underline shadow-lg shadow-amber-950/50"
        >
          Browse whiskey selection
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <p className="text-[10px] text-zinc-700 mt-3">
          Affiliate link · SassyFounders may earn a commission
        </p>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
