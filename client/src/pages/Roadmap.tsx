export default function Roadmap() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
          🗺️ Product Roadmap
        </h2>
        <p style={{ color: '#9d8460', fontSize: '14px' }}>
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

      <div style={{
        background: '#1a1208',
        border: '1px solid #3d2e10',
        borderRadius: '12px',
        padding: '20px 24px',
        marginTop: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#9d8460' }}>Backlog / Nice-to-Haves</span>
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            'Mobile app (iOS/Android)',
            'Podcast episode integrations (auto-score founder appearances)',
            'Debate mode: two founders go head-to-head on a hot take; community votes on who was sassier',
            'Investor sassiness index: rate the VCs, not just the founders',
            'Dark mode / theming options',
          ].map(item => (
            <li key={item} style={{ color: '#5a4428', fontSize: '13px', lineHeight: 1.5 }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
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
    <div style={{
      background: '#1a1208',
      border: '1px solid #3d2e10',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{
          background: '#2d1a05',
          border: '1px solid #d97706',
          borderRadius: '6px',
          padding: '3px 10px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#d97706',
          letterSpacing: '0.5px',
        }}>
          {version}
        </span>
        <span style={{ fontSize: '20px' }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: '16px', color: '#fbbf24' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => (
          <div key={item.title} style={{
            background: '#130e06',
            borderRadius: '8px',
            padding: '12px 14px',
            borderLeft: '3px solid #3d2e10',
          }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#f5e6c8', marginBottom: '4px' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '13px', color: '#9d8460', lineHeight: 1.5 }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
