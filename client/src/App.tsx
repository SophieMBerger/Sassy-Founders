import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import FounderDetail from './pages/FounderDetail';
import Roadmap from './pages/Roadmap';
import Disclaimer from './components/Disclaimer';
import { cn } from '@/lib/utils';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to === '/' && location.pathname.startsWith('/founders'));
  return (
    <Link
      to={to}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-all duration-200 no-underline rounded-full',
        active
          ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30'
          : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-white/5'
      )}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#080808]">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-2xl">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 no-underline group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/40 group-hover:shadow-amber-700/50 transition-shadow">
                <span className="text-lg leading-none select-none">🥃</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight leading-none">
                  Sassy Founders
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5 leading-none font-medium">
                  Ranked by whiskey units
                </div>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/">Leaderboard</NavLink>
              <NavLink to="/roadmap">Roadmap</NavLink>
            </nav>
          </div>
        </header>

        <Disclaimer />

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/founders/:id" element={<FounderDetail />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Routes>
        </main>

        <footer className="border-t border-white/[0.04] py-6 text-center">
          <p className="text-xs text-zinc-700 font-medium">
            Sassy Founders v0.1 · Purely satirical · For entertainment purposes only
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
