import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Founder } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';

type ViewMode = 'official' | 'community' | 'manual';

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
    return b.sassyScore - a.sassyScore;
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
          🏆 Sassy Leaderboard
        </h2>
        <p style={{ color: '#9d8460', fontSize: '14px' }}>
          Ranked by whiskey units needed to survive a conversation. Higher = sassier.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <ModeButton active={viewMode === 'official'} onClick={() => setViewMode('official')}>
          📊 Official Ranking
        </ModeButton>
        <ModeButton active={viewMode === 'community'} onClick={() => setViewMode('community')}>
          🗳️ Community Ranking
        </ModeButton>
        <ModeButton active={viewMode === 'manual'} onClick={() => setViewMode('manual')} highlight>
          ✏️ Rate Them Yourself
        </ModeButton>
      </div>

      {viewMode === 'manual' ? (
        <ManualRankMode founders={founders} onVotesSubmitted={refreshFounders} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    const entries = Object.entries(votes);
    let count = 0;
    for (const [founderId, units] of entries) {
      try {
        await fetch(`/api/founders/${founderId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ whiskeyUnits: units }),
        });
        count++;
      } catch {
        // continue
      }
    }
    setSubmitCount(count);
    setSubmitting(false);
    setSubmitted(true);
    onVotesSubmitted();
    setTimeout(() => setSubmitted(false), 4000);
  }

  // Sort by current user votes desc for a "preview ranking"
  const ranked = [...founders].sort((a, b) => (votes[b.id] ?? 5) - (votes[a.id] ?? 5));

  return (
    <div>
      <div style={{
        background: '#1a1208',
        border: '1px solid #d97706',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '2px' }}>
            🥃 Your Personal Ranking
          </div>
          <div style={{ fontSize: '13px', color: '#9d8460' }}>
            Drag the sliders — your list re-ranks live. Submit to add to community averages.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {ratedCount > 0 && (
            <span style={{ fontSize: '12px', color: '#d97706' }}>
              {ratedCount} modified
            </span>
          )}
          <button
            onClick={handleSubmitAll}
            disabled={submitting}
            style={{
              padding: '9px 20px',
              background: submitting ? '#3d2e10' : '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              opacity: submitting ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {submitting ? 'Submitting...' : `Submit All ${founders.length} Ratings`}
          </button>
        </div>
      </div>

      {submitted && (
        <div style={{
          padding: '12px 16px',
          background: '#14532d',
          borderRadius: '10px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#4ade80',
        }}>
          ✓ {submitCount} ratings submitted! Community averages updated.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
  // Buffer the slider value locally during drag to prevent mid-drag re-sorts from
  // repositioning the DOM element and breaking the native slider interaction.
  const [localValue, setLocalValue] = useState(value);
  const dragging = useRef(false);

  // Sync parent value changes (e.g. after submit reset) only when not dragging.
  useEffect(() => {
    if (!dragging.current) setLocalValue(value);
  }, [value]);

  const rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : rank === 3 ? '#d97706' : '#4a3820';
  const scoreColor = localValue >= 8 ? '#ef4444' : localValue >= 5 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{
      background: '#1a1208',
      border: '1px solid #3d2e10',
      borderRadius: '10px',
      padding: '12px 16px',
      display: 'grid',
      gridTemplateColumns: '44px 1fr auto',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#261a0c',
        border: `2px solid ${rankColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '15px',
        color: rankColor,
        flexShrink: 0,
      }}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#f5e6c8' }}>{founder.name}</span>
          <span style={{ fontSize: '11px', color: '#9d8460' }}>{founder.company}</span>
          {founder.communityScore !== null && (
            <span style={{ fontSize: '11px', color: '#5a4428' }}>
              community avg: {founder.communityScore.toFixed(1)} ({founder.communityVoteCount} votes)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            style={{ flex: 1, accentColor: scoreColor, height: '4px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#5a4428', width: '100%', position: 'absolute', pointerEvents: 'none', visibility: 'hidden' }}>
            <span>0</span><span>10</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4a3820', marginTop: '2px' }}>
          <span>0 = delightful</span>
          <span>5 = tolerable</span>
          <span>10 = send help</span>
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '52px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
          {localValue.toFixed(1)}
        </div>
        <div style={{ fontSize: '10px', color: '#5a4428' }}>🥃</div>
      </div>
    </div>
  );
}

function FounderRow({ founder, rank, viewMode }: { founder: Founder; rank: number; viewMode: ViewMode }) {
  const score = viewMode === 'community' && founder.communityScore !== null
    ? founder.communityScore
    : founder.sassyScore;

  const rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : rank === 3 ? '#d97706' : '#4a3820';

  return (
    <Link
      to={`/founders/${founder.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: '#1a1208',
        border: '1px solid #3d2e10',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: '48px 1fr auto',
        alignItems: 'center',
        gap: '12px',
        transition: 'background 0.15s, border-color 0.15s',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = '#261a0c';
          (e.currentTarget as HTMLDivElement).style.borderColor = '#d97706';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = '#1a1208';
          (e.currentTarget as HTMLDivElement).style.borderColor = '#3d2e10';
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#261a0c',
          border: `2px solid ${rankColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '16px',
          color: rankColor,
          flexShrink: 0,
        }}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '15px', color: '#f5e6c8' }}>{founder.name}</span>
            <span style={{ fontSize: '12px', color: '#9d8460' }}>{founder.company}</span>
          </div>
          <div style={{ marginTop: '6px' }}>
            <WhiskeyBar score={score} size="sm" />
          </div>
          {founder.communityVoteCount > 0 && (
            <div style={{ fontSize: '11px', color: '#5a4428', marginTop: '3px' }}>
              {founder.communityVoteCount} vote{founder.communityVoteCount !== 1 ? 's' : ''} · community avg: {founder.communityScore?.toFixed(1) ?? 'n/a'}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: score >= 8 ? '#ef4444' : score >= 5 ? '#f59e0b' : '#22c55e' }}>
            {score.toFixed(1)}
          </div>
          <div style={{ fontSize: '10px', color: '#5a4428' }}>🥃 units</div>
        </div>
      </div>
    </Link>
  );
}

function ModeButton({
  active,
  onClick,
  children,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: '8px',
        border: `1px solid ${active ? '#d97706' : highlight ? '#7c3a00' : '#3d2e10'}`,
        background: active ? '#3d2004' : highlight ? '#1f0f00' : '#1a1208',
        color: active ? '#fbbf24' : highlight ? '#c47a1e' : '#9d8460',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#9d8460' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🥃</div>
      <p>Pouring the rankings...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>💀</div>
      <p>{message}</p>
    </div>
  );
}
