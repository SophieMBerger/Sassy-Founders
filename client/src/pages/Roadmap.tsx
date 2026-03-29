import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function Roadmap() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Map className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold text-amber-100">Product Roadmap</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Future improvements to Sassy Founders, ranked by whiskey ambition.
        </p>
      </div>

      <RoadmapSection
        version="v0.2"
        title="Data & Scoring Enhancements"
        emoji="📊"
        items={[
          { title: 'Automated sassiness scraping', desc: 'Pull tweets, interviews, podcast clips, LinkedIn posts. Score algorithmically (profanity density, hot take ratio, dunking frequency).' },
          { title: 'Whiskey unit calibration', desc: 'Tune the scoring model using actual user ratings to keep the whiskey-unit metric well-calibrated.' },
          { title: 'Historical trend tracking', desc: 'Track sassiness scores over time; surface founders who are getting sassier or mellowing out.' },
          { title: 'Multi-source signal aggregation', desc: 'Combine Twitter/X, YouTube, podcasts, and news for a more robust sassiness index.' },
        ]}
      />

      <RoadmapSection
        version="v0.3"
        title="Social & Gamification"
        emoji="🎮"
        items={[
          { title: 'Pairwise Elo leaderboard', desc: 'Stabilise the Elo ratings with enough vote volume; add confidence intervals. (Partially live via Who\'s Sassier? mode.)' },
          { title: 'User accounts & profiles', desc: 'Let rankers track their own voting history and see how their taste compares to the crowd.' },
          { title: 'Badges & achievements', desc: '"Whiskey Sommelier" for 100+ ratings, "Contrarian" for consistently rating against consensus, etc.' },
          { title: 'Share cards', desc: 'Generate shareable image cards showing a founder\'s sassiness score and whiskey units for social media.' },
        ]}
      />

      <RoadmapSection
        version="v0.4"
        title="Discovery & Context"
        emoji="🔍"
        items={[
          { title: 'Founder bios + sassy quote highlights', desc: 'Surface the most memorable quotes alongside each profile.' },
          { title: 'Category filters', desc: 'Filter by VC-backed vs. bootstrapped, sector (AI, crypto, SaaS), geography.' },
          { title: 'Sassy of the Week', desc: 'Automated weekly digest picking the most dramatic mover in sassiness rank.' },
          { title: 'Search & autocomplete', desc: 'Find any founder by name, company, or handle.' },
        ]}
      />

      <RoadmapSection
        version="v0.5"
        title="Monetisation & Growth"
        emoji="💰"
        items={[
          { title: 'API access', desc: 'Charge for programmatic access to sassiness scores (for recruiters, VCs, journalists).' },
          { title: 'Sponsored rankings / branded insights', desc: 'Tasteful sponsored placement for companies wanting exposure.' },
          { title: 'Premium analytics', desc: 'Detailed sassiness breakdown by platform, topic, time period for power users.' },
        ]}
      />

      {/* Backlog */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-400">
            <span>📋</span>
            Backlog / Nice-to-Haves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 pl-4 list-disc marker:text-zinc-700">
            {[
              'Mobile app (iOS/Android)',
              'Podcast episode integrations (auto-score founder appearances)',
              'Debate mode: two founders go head-to-head on a hot take; community votes on who was sassier',
              'Investor sassiness index: rate the VCs, not just the founders',
              'Dark mode / theming options',
            ].map(item => (
              <li key={item} className="text-sm text-zinc-600 leading-relaxed">{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function RoadmapSection({
  version,
  title,
  emoji,
  items,
}: {
  version: string;
  title: string;
  emoji: string;
  items: { title: string; desc: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-xs font-mono">{version}</Badge>
          <span>{emoji}</span>
          <span className="text-base">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map(item => (
          <div
            key={item.title}
            className="bg-zinc-950/60 rounded-lg px-3.5 py-2.5 border-l-2 border-amber-900/50"
          >
            <div className="font-semibold text-sm text-zinc-200 mb-0.5">{item.title}</div>
            <div className="text-xs text-zinc-500 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
