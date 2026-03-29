import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import FounderDetail from './pages/FounderDetail';
import Disclaimer from './components/Disclaimer';

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
        </header>

        <Disclaimer />

        <main style={{ flex: 1, maxWidth: '960px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/founders/:id" element={<FounderDetail />} />
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
