import { cn } from '@/lib/utils';

interface WhiskeyBarProps {
  score: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WhiskeyBar({ score, max = 10, label, size = 'md' }: WhiskeyBarProps) {
  const pct = Math.min(100, (score / max) * 100);
  const indicatorClass =
    pct < 40
      ? 'from-emerald-600 to-emerald-400'
      : pct < 70
      ? 'from-amber-600 to-amber-400'
      : 'from-red-600 to-red-400';

  const heightClass = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }[size];

  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1 text-xs text-zinc-500">
          <span>{label}</span>
          <span className="text-zinc-200 font-semibold">{score.toFixed(1)}</span>
        </div>
      )}
      <div className={cn('relative w-full rounded-full bg-zinc-800 overflow-hidden', heightClass)}>
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', indicatorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
