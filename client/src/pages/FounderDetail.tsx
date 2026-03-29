import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { FounderDetailResponse } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';

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
    <div style={{ textAlign: 'center', padding: '60px', color: '#9d8460' }}>
      <div style={{ fontSize: '48px' }}>🥃</div>
      <p>Loading...</p>
    </div>
  );

  if (error || !founder) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <div style={{ fontSize: '48px' }}>💀</div>
      <p style={{ color: '#ef4444' }}>{error}</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: '16px' }}>← Back to leaderboard</Link>
    </div>
  );

  const breakdown = founder.scoreBreakdown;

  return (
    <div>
      <Link to="/" style={{ fontSize: '13px', color: '#9d8460', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to leaderboard
      </Link>

      <div style={{
        background: '#1a1208',
        border: '1px solid #3d2e10',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#fbbf24' }}>{founder.name}</h2>
            <p style={{ color: '#9d8460', fontSize: '14px', marginTop: '2px' }}>
              {founder.title} · {founder.company}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              color: founder.sassyScore >= 8 ? '#ef4444' : founder.sassyScore >= 5 ? '#f59e0b' : '#22c55e',
              lineHeight: 1,
            }}>
              {founder.sassyScore.toFixed(1)}
            </div>
            <div style={{ fontSize: '12px', color: '#5a4428', marginTop: '4px' }}>🥃 official score</div>
          </div>
        </div>

        <p style={{ color: '#c4a87a', fontSize: '14px', marginTop: '16px', lineHeight: 1.6 }}>
          {founder.bio}
        </p>
      </div>

      {/* Score Breakdown */}
      <div style={{
        background: '#1a1208',
        border: '1px solid #3d2e10',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fbbf24', marginBottom: '16px' }}>
          📊 Sassy Score Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <WhiskeyBar score={breakdown.arrogance} label="Arrogance" />
          <WhiskeyBar score={breakdown.controversialTakes} label="Controversial Takes" />
          <WhiskeyBar score={breakdown.interruptionTendency} label="Interruption Tendency" />
          <WhiskeyBar score={breakdown.humblebragging} label="Humblebragging" />
          <WhiskeyBar score={breakdown.buzzwordDensity} label="Buzzword Density" />
        </div>
      </div>

      {/* Community Vote */}
      <div style={{
        background: '#1a1208',
        border: '1px solid #3d2e10',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fbbf24', marginBottom: '4px' }}>
          🗳️ Submit Your Rating
        </h3>
        <p style={{ color: '#9d8460', fontSize: '13px', marginBottom: '16px' }}>
          How many 🥃 units would you need to enjoy a conversation with {founder.name.split(' ')[0]}?
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={vote}
              onChange={e => setVote(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#d97706' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5a4428', marginTop: '2px' }}>
              <span>0 (delightful)</span>
              <span>5 (tolerable)</span>
              <span>10 (send help)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', minWidth: '40px', textAlign: 'center' }}>
              {vote}
            </span>
            <button
              onClick={handleVote}
              disabled={voting}
              style={{
                padding: '8px 18px',
                background: voting ? '#3d2e10' : '#d97706',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                opacity: voting ? 0.6 : 1,
              }}
            >
              {voting ? '...' : 'Submit'}
            </button>
          </div>
        </div>

        {voteSuccess && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#14532d', borderRadius: '8px', fontSize: '13px', color: '#4ade80' }}>
            ✓ Vote submitted! Thanks for rating.
          </div>
        )}

        {founder.communityVoteCount > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#0f0a04',
            borderRadius: '8px',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>
                {founder.communityScore?.toFixed(1) ?? 'n/a'}
              </div>
              <div style={{ fontSize: '11px', color: '#5a4428' }}>community avg</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#c4a87a' }}>
                {founder.communityVoteCount}
              </div>
              <div style={{ fontSize: '11px', color: '#5a4428' }}>total votes</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
