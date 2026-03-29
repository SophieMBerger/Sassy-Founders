import { Map } from 'lucide-react';

const SECTIONS = [
  {
    version: 'v0.2', emoji: '📊', title: 'Data & Scoring Enhancements',
    items: [
      { title: 'Automated sassiness scraping', desc: 'Pull tweets, interviews, podcast clips, LinkedIn posts. Score algorithmically (profanity density, hot take ratio, dunking frequency).' },
      { title: 'Whiskey unit calibration', desc: 'Tune the scoring model using actual user ratings to keep the whiskey-unit metric well-calibrated.' },
      { title: 'Historical trend tracking', desc: 'Track sassiness scores over time; surface founders who are getting sassier or mellowing out.' },
      { title: 'Multi-source signal aggregation', desc: 'Combine Twitter/X, YouTube, podcasts, and news for a more robust sassiness index.' },
    ],
  },
  {
    version: 'v0.3', emoji: '🎮', title: 'Social & Gamification',
    items: [
      { title: 'Pairwise Elo leaderboard', desc: "Stabilise the Elo ratings with enough vote volume; add confidence intervals. (Partially live via Who's Sassier? mode.)" },
      { title: 'User accounts & profiles', desc: "Let rankers track their own voting history and see how their taste compares to the crowd." },
      { title: 'Badges & achievements', desc: '"Whiskey Sommelier" for 100+ ratings, "Contrarian" for consistently rating against consensus, etc.' },
      { title: 'Share cards', desc: "Generate shareable image cards showing a founder's sassiness score and whiskey units for social media." },
    ],
  },
  {
    version: 'v0.4', emoji: '🔍', title: 'Discovery & Context',
    items: [
      { title: 'Founder bios + sassy quote highlights', desc: 'Surface the most memorable quotes alongside each profile.' },
      { title: 'Category filters', desc: 'Filter by VC-backed vs. bootstrapped, sector (AI, crypto, SaaS), geography.' },
      { title: 'Sassy of the Week', desc: 'Automated weekly digest picking the most dramatic mover in sassiness rank.' },
      { title: 'Search & autocomplete', desc: 'Find any founder by name, company, or handle.' },
    ],
  },
  {
    version: 'v0.5', emoji: '💰', title: 'Monetisation & Growth',
    items: [
      { title: 'API access', desc: 'Charge for programmatic access to sassiness scores (for recruiters, VCs, journalists).' },
      { title: 'Sponsored rankings / branded insights', desc: 'Tasteful sponsored placement for companies wanting exposure.' },
      { title: 'Premium analytics', desc: 'Detailed sassiness breakdown by platform, topic, time period for power users.' },
    ],
  },
];

const BACKLOG = [
  'Mobile app (iOS/Android)',
  'Podcast episode integrations (auto-score founder appearances)',
  'Debate mode: two founders go head-to-head on a hot take; community votes on who was sassier',
  'Investor sassiness index: rate the VCs, not just the founders',
];

export default function Roadmap() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mesh-bg border border-white/[0.06] px-8 py-10">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-700/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-amber text-xs font-semibold text-amber-400 mb-4">
            <Map className="w-3 h-3" />
            <span>Product Roadmap</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-2">What's Coming</h1>
          <p className="text-zinc-500 text-sm max-w-lg">
            Future improvements to Sassy Founders, ranked by whiskey ambition.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map(section => (
          <div key={section.version} className="rounded-3xl bg-zinc-900/40 border border-white/[0.05] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04]">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold text-amber-500">
                {section.version}
              </span>
              <span className="text-base">{section.emoji}</span>
              <span className="font-bold text-sm text-zinc-200">{section.title}</span>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-3">
              {section.items.map(item => (
                <div
                  key={item.title}
                  className="px-4 py-3 rounded-2xl bg-zinc-950/50 border-l-2 border-amber-900/40"
                >
                  <div className="font-semibold text-sm text-zinc-200 mb-1">{item.title}</div>
                  <div className="text-xs text-zinc-600 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Backlog */}
      <div className="rounded-3xl bg-zinc-900/30 border border-white/[0.04] p-6">
        <div className="text-sm font-bold text-zinc-600 mb-4">📋 Backlog / Nice-to-Haves</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {BACKLOG.map(item => (
            <div key={item} className="flex items-start gap-2.5 text-xs text-zinc-700 leading-relaxed">
              <span className="text-zinc-800 mt-0.5 flex-shrink-0">›</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
