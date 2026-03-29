import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PremiumGateProps {
  children: React.ReactNode;
  /** Text shown in the upgrade prompt */
  featureLabel?: string;
}

export default function PremiumGate({ children, featureLabel = 'this feature' }: PremiumGateProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-950/80 backdrop-blur-sm border border-amber-500/20">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Crown className="w-6 h-6 text-amber-400" />
        </div>
        <div className="text-center px-6">
          <p className="font-bold text-white text-sm mb-1">Sipster Club exclusive</p>
          <p className="text-xs text-zinc-500">
            Upgrade to access {featureLabel} and more premium perks.
          </p>
        </div>
        <Link
          to="/upgrade"
          className="px-5 py-2 rounded-full text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors no-underline shadow-lg shadow-amber-900/30"
        >
          Unlock for $5/mo
        </Link>
      </div>
    </div>
  );
}
