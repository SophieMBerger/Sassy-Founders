interface WhiskeyBarProps {
  score: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS: Record<string, string> = {
  low: '#22c55e',
  mid: '#f59e0b',
  high: '#ef4444',
};

export default function WhiskeyBar({ score, max = 10, label, size = 'md' }: WhiskeyBarProps) {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct < 40 ? COLORS.low : pct < 70 ? COLORS.mid : COLORS.high;

  const heights: Record<string, string> = { sm: '6px', md: '10px', lg: '14px' };
  const height = heights[size];

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: '#9d8460' }}>
          <span>{label}</span>
          <span style={{ color: '#f5e6c8', fontWeight: 600 }}>{score.toFixed(1)}</span>
        </div>
      )}
      <div style={{
        background: '#261a0c',
        borderRadius: '999px',
        height,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: '999px',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}
