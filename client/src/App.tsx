import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import FounderDetail from './pages/FounderDetail';
import Roadmap from './pages/Roadmap';
import Disclaimer from './components/Disclaimer';
import { cn } from '@/lib/utils';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 no-underline',
        active
          ? 'bg-amber-950 text-amber-400 border border-amber-700/60'
          : 'text-zinc-500 hover:text-amber-400/80 hover:bg-zinc-800/50 border border-transparent'
      )}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-zinc-950">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-amber-900/30 bg-zinc-950/90 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <span className="text-2xl select-none">🥃</span>
              <div>
                <h1 className="text-base font-bold text-amber-400 tracking-tight leading-none">
                  Sassy Founders
                </h1>
                <p className="text-[10px] text-zinc-600 mt-0.5 leading-none">
                  Ranked by whiskey units required
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/">Leaderboard</NavLink>
              <NavLink to="/roadmap">Roadmap</NavLink>
            </nav>
          </div>
        </header>

        <Disclaimer />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/founders/:id" element={<FounderDetail />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Routes>
        </main>

        <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-700">
          Sassy Founders v0.1 · Purely satirical · For entertainment purposes only
        </footer>
      </div>
    </BrowserRouter>
  );
}
