import { useState } from 'react';

export default function Disclaimer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'linear-gradient(90deg, #1a0800 0%, #200d00 50%, #1a0800 100%)',
      borderTop: '1px solid #7c3a00',
      borderBottom: '1px solid #7c3a00',
      padding: expanded ? '12px 24px' : '8px 24px',
      transition: 'padding 0.2s',
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        alignItems: expanded ? 'flex-start' : 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 700 }}>SATIRE DISCLAIMER · </span>
          <span style={{ fontSize: '12px', color: '#9d6020' }}>
            This site is entirely fictional and comedic. All scores are invented for humor.
            No real data, no real research, no real shade (well, maybe a little).{' '}
          </span>
          {expanded && (
            <span style={{ fontSize: '12px', color: '#7a4e18', display: 'block', marginTop: '6px' }}>
              The "sassy scores" are made-up numbers generated for entertainment purposes only.
              We do not endorse or defame any real person. The rankings do not reflect any factual
              assessment of anyone's character, personality, or conversational difficulty.
              This is a joke. Please laugh. If you are one of these founders: hi, we think you're
              probably fine in small doses. 🥃
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: '#5a3a10',
            fontSize: '11px',
            padding: '0',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          {expanded ? 'less ▲' : 'full disclaimer ▼'}
        </button>
      </div>
    </div>
  );
}
