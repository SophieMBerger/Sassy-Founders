import { cn } from '@/lib/utils';

interface WhiskeyBarProps {
  score: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function WhiskeyBar({ score, max = 10, label, size = 'md', showValue }: WhiskeyBarProps) {
  const pct = Math.min(100, (score / max) * 100);

  const gradientClass =
    pct < 40
      ? 'from-emerald-600 to-emerald-400'
      : pct < 70
      ? 'from-amber-600 to-amber-400'
      : 'from-red-600 to-rose-400';

  const glowClass =
    pct < 40
      ? 'shadow-emerald-500/30'
      : pct < 70
      ? 'shadow-amber-500/30'
      : 'shadow-red-500/30';

  const heightClass = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' }[size];

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-zinc-500 font-medium">{label}</span>}
          {showValue && (
            <span className="text-xs font-bold text-zinc-300 tabular-nums">{score.toFixed(1)}</span>
          )}
        </div>
      )}
      <div className={cn('relative w-full rounded-full bg-zinc-800/80 overflow-hidden', heightClass)}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700',
            gradientClass,
            pct > 0 && `shadow-sm ${glowClass}`
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
