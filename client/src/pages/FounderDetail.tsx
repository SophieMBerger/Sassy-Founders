import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { FounderDetailResponse } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowLeft, BarChart3, Loader2, Users } from 'lucide-react';

export default function FounderDetail() {
  const { id } = useParams<{ id: string }>();
  const [founder, setFounder] = useState<FounderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vote, setVote] = useState<number>(5);
  const [voting, setVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/founders/${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => { setFounder(data); setLoading(false); })
      .catch(() => { setError('Founder not found'); setLoading(false); });
  }, [id]);

  async function handleVote() {
    if (!founder) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/founders/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whiskeyUnits: vote }),
      });
      const updated = await res.json();
      setFounder(prev => prev ? { ...prev, ...updated } : prev);
      setVoteSuccess(true);
      setTimeout(() => setVoteSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setVoting(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-3">
      <div className="text-5xl">🥃</div>
      <p className="text-sm">Loading...</p>
    </div>
  );

  if (error || !founder) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-5xl">💀</div>
      <p className="text-sm text-red-400">{error}</p>
      <Link to="/" className="text-sm">← Back to leaderboard</Link>
    </div>
  );

  const breakdown = founder.scoreBreakdown;
  const scoreColor =
    founder.sassyScore >= 8 ? 'text-red-400' : founder.sassyScore >= 5 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to leaderboard
      </Link>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
            <div>
              <h2 className="text-2xl font-bold text-amber-300">{founder.name}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {founder.title} · {founder.company}
              </p>
            </div>
            <div className="text-right">
              <div className={cn('text-5xl font-bold leading-none', scoreColor)}>
                {founder.sassyScore.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-600 mt-1">🥃 official score</div>
            </div>
          </div>
          <Separator className="mb-4" />
          <p className="text-sm text-zinc-400 leading-relaxed">{founder.bio}</p>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Sassy Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <WhiskeyBar score={breakdown.arrogance} label="Arrogance" />
          <WhiskeyBar score={breakdown.controversialTakes} label="Controversial Takes" />
          <WhiskeyBar score={breakdown.interruptionTendency} label="Interruption Tendency" />
          <WhiskeyBar score={breakdown.humblebragging} label="Humblebragging" />
          <WhiskeyBar score={breakdown.buzzwordDensity} label="Buzzword Density" />
        </CardContent>
      </Card>

      {/* Community Vote */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-amber-500" />
            Submit Your Rating
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-500">
            How many 🥃 units would you need to enjoy a conversation with {founder.name.split(' ')[0]}?
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={vote}
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
              <span className="text-2xl font-bold text-amber-400 w-10 text-center">{vote}</span>
              <Button
                variant="amber"
                size="sm"
                onClick={handleVote}
                disabled={voting}
              >
                {voting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />...</> : 'Submit'}
              </Button>
            </div>
          </div>

          {voteSuccess && (
            <div className="px-3 py-2 bg-emerald-950/60 border border-emerald-800/40 rounded-lg text-sm text-emerald-400">
              ✓ Vote submitted! Thanks for rating.
            </div>
          )}

          {founder.communityVoteCount > 0 && (
            <>
              <Separator />
              <div className="flex gap-6 flex-wrap">
                <div>
                  <div className="text-xl font-bold text-amber-400">
                    {founder.communityScore?.toFixed(1) ?? 'n/a'}
                  </div>
                  <div className="text-xs text-zinc-600">community avg</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-zinc-300">
                    {founder.communityVoteCount}
                  </div>
                  <div className="text-xs text-zinc-600">total votes</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
