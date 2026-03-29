import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Founder } from '@shared/types';
import WhiskeyBar from '../components/WhiskeyBar';

type SortMode = 'official' | 'community';

export default function Leaderboard() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('official');

  useEffect(() => {
    fetch('/api/founders')
      .then(r => r.json())
      .then(data => { setFounders(data.founders); setLoading(false); })
      .catch(() => { setError('Failed to load founders'); setLoading(false); });
  }, []);

  const sorted = [...founders].sort((a, b) => {
    if (sortMode === 'community') {
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
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
          🏆 Sassy Leaderboard
        </h2>
        <p style={{ color: '#9d8460', fontSize: '14px' }}>
          Ranked by whiskey units needed to survive a conversation. Higher = sassier.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <ModeButton active={sortMode === 'official'} onClick={() => setSortMode('official')}>
          📊 Official Ranking
        </ModeButton>
        <ModeButton active={sortMode === 'community'} onClick={() => setSortMode('community')}>
          🗳️ Community Ranking
        </ModeButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((founder, index) => (
          <FounderRow
            key={founder.id}
            founder={founder}
            rank={index + 1}
            sortMode={sortMode}
          />
        ))}
      </div>
    </div>
  );
}

function FounderRow({ founder, rank, sortMode }: { founder: Founder; rank: number; sortMode: SortMode }) {
  const score = sortMode === 'community' && founder.communityScore !== null
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

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: '8px',
        border: `1px solid ${active ? '#d97706' : '#3d2e10'}`,
        background: active ? '#3d2004' : '#1a1208',
        color: active ? '#fbbf24' : '#9d8460',
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
