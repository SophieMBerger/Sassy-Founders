import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Crown, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  '3 pairwise votes per day',
  'Official + community leaderboard',
  'Founder profiles & score breakdown',
  'Community voting (whiskey units)',
  'Ads supported',
];

const PREMIUM_FEATURES = [
  'Unlimited pairwise votes',
  'Ad-free experience',
  'Historical ranking trends (30 days)',
  'Shareable infographic cards',
  'Early access to new features',
  'Support an indie project 🥃',
];

export default function Upgrade() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('_success') === '1' || window.location.pathname === '/upgrade/success';
  const { user, loading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start checkout');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to open billing portal');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  if (isSuccess) {
    return <SuccessBanner />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
          <Crown className="w-3.5 h-3.5" />
          Sipster Club
        </div>
        <h1 className="text-4xl font-black text-white">
          Drink unlimited, vote unlimited
        </h1>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Support SassyFounders and unlock premium features — ad-free rankings,
          historical trends, and shareable whiskey cards.
        </p>
      </div>

      {/* Already premium */}
      {!loading && user?.isPremium && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-3">
          <div className="text-2xl">🥃</div>
          <p className="font-bold text-amber-300">You're a Sipster Club member!</p>
          <p className="text-sm text-zinc-500">All premium features are unlocked.</p>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border-none cursor-pointer transition-all"
          >
            {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Manage billing
          </button>
        </div>
      )}

      {/* Plan toggle */}
      {!user?.isPremium && (
        <>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all border cursor-pointer',
                selectedPlan === 'monthly'
                  ? 'bg-zinc-100 text-zinc-900 border-transparent'
                  : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20'
              )}
            >
              Monthly · $5
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all border cursor-pointer relative',
                selectedPlan === 'yearly'
                  ? 'bg-zinc-100 text-zinc-900 border-transparent'
                  : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20'
              )}
            >
              Yearly · $40
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-zinc-900 rounded-full leading-none">
                Save 33%
              </span>
            </button>
          </div>

          {/* Plans grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free tier */}
            <div className="rounded-3xl bg-zinc-900/40 border border-white/[0.05] p-6 space-y-4">
              <div>
                <h2 className="font-bold text-white text-lg">Free</h2>
                <div className="text-3xl font-black text-zinc-300 mt-1">$0</div>
                <p className="text-xs text-zinc-600 mt-1">Forever free, ad-supported</p>
              </div>
              <ul className="space-y-2">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="text-sm text-zinc-700 font-medium text-center py-2">Current plan</div>
            </div>

            {/* Premium tier */}
            <div className="rounded-3xl bg-zinc-900/60 border border-amber-500/30 p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <div className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Sipster Club
                </div>
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Premium</h2>
                <div className="text-3xl font-black text-amber-400 mt-1">
                  {selectedPlan === 'monthly' ? '$5' : '$40'}
                  <span className="text-base font-normal text-zinc-500 ml-1">
                    /{selectedPlan === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {selectedPlan === 'yearly' && (
                  <p className="text-xs text-amber-600/70 mt-1">~$3.33/month · billed annually</p>
                )}
              </div>
              <ul className="space-y-2">
                {PREMIUM_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/30 rounded-xl px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading || loading}
                className={cn(
                  'w-full py-3 rounded-2xl text-sm font-bold text-white border-none transition-all cursor-pointer',
                  checkoutLoading || loading
                    ? 'bg-zinc-700 opacity-60 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30'
                )}
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout...
                  </span>
                ) : user ? (
                  `Subscribe · ${selectedPlan === 'monthly' ? '$5/mo' : '$40/yr'}`
                ) : (
                  'Sign in to subscribe'
                )}
              </button>

              <p className="text-[10px] text-zinc-700 text-center">
                Secure checkout via Stripe · Cancel anytime
              </p>
            </div>
          </div>
        </>
      )}

      <div className="text-center">
        <Link to="/" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors no-underline">
          ← Back to leaderboard
        </Link>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function SuccessBanner() {
  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-16">
      <div className="text-6xl">🥃</div>
      <h1 className="text-3xl font-black text-white">Welcome to the Sipster Club!</h1>
      <p className="text-zinc-500">
        Your premium membership is now active. Enjoy unlimited votes, ad-free rankings,
        and all the whiskey-soaked perks.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors no-underline shadow-lg shadow-amber-900/30"
      >
        View the leaderboard →
      </Link>
    </div>
  );
}
