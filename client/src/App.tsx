import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import FounderDetail from './pages/FounderDetail';
import Roadmap from './pages/Roadmap';
import Disclaimer from './components/Disclaimer';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        color: active ? '#fbbf24' : '#9d8460',
        background: active ? '#2d1a05' : 'transparent',
        border: `1px solid ${active ? '#d97706' : 'transparent'}`,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          background: 'linear-gradient(135deg, #1a0f00 0%, #2d1a05 100%)',
          borderBottom: '2px solid #d97706',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '32px' }}>🥃</span>
            <div>
              <h1 style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700, letterSpacing: '-0.5px' }}>
                Sassy Founders
              </h1>
              <p style={{ fontSize: '11px', color: '#9d8460', marginTop: '1px' }}>
                Ranked by whiskey units required
              </p>
            </div>
          </Link>
          <nav style={{ display: 'flex', gap: '4px' }}>
            <NavLink to="/">Leaderboard</NavLink>
            <NavLink to="/roadmap">Roadmap</NavLink>
          </nav>
        </header>

        <Disclaimer />

        <main style={{ flex: 1, maxWidth: '960px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/founders/:id" element={<FounderDetail />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Routes>
        </main>

        <footer style={{
          textAlign: 'center',
          padding: '16px',
          color: '#4a3820',
          fontSize: '12px',
          borderTop: '1px solid #1a1208',
        }}>
          Sassy Founders v0.1 · Purely satirical · For entertainment purposes only
        </footer>
      </div>
    </BrowserRouter>
  );
}
