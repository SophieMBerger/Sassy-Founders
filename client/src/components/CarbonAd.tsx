import { useEffect, useRef } from 'react';

const SERVE_ID = import.meta.env.VITE_CARBON_ADS_SERVE;
const PLACEMENT = import.meta.env.VITE_CARBON_ADS_PLACEMENT;

/**
 * Carbon Ads unit. Set VITE_CARBON_ADS_SERVE and VITE_CARBON_ADS_PLACEMENT
 * in your .env to activate live ads. Falls back to a placeholder banner.
 */
export default function CarbonAd({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SERVE_ID || !PLACEMENT) return;
    const container = containerRef.current;
    if (!container) return;

    // Remove any previous Carbon Ads script/element to allow re-mount
    const existing = container.querySelector('#_carbonads_js');
    if (existing) existing.remove();
    const existingAd = container.querySelector('#carbonads');
    if (existingAd) existingAd.remove();

    const script = document.createElement('script');
    script.id = '_carbonads_js';
    script.async = true;
    script.src = `//cdn.carbonads.com/carbon.js?serve=${SERVE_ID}&placement=${PLACEMENT}`;
    script.type = 'text/javascript';
    container.appendChild(script);

    return () => {
      script.remove();
      container.querySelector('#carbonads')?.remove();
    };
  }, []);

  if (!SERVE_ID || !PLACEMENT) {
    return <AdPlaceholder className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`carbon-ad-wrap ${className}`}
    />
  );
}

function AdPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/[0.07] bg-zinc-900/30 text-zinc-700 text-xs ${className}`}
      title="Ad placeholder — set VITE_CARBON_ADS_SERVE and VITE_CARBON_ADS_PLACEMENT to activate"
    >
      <span className="text-base leading-none select-none">🥃</span>
      <span className="font-medium">Sponsored · Your whiskey brand here</span>
    </div>
  );
}
