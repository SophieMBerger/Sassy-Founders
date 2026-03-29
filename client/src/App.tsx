import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import FounderDetail from './pages/FounderDetail';
import Roadmap from './pages/Roadmap';
import Disclaimer from './components/Disclaimer';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginModal from './components/LoginModal';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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

function AuthButton() {
  const { user, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowLogin(true)}
          className="px-4 py-2 rounded-full text-sm font-medium text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
        >
          Sign in
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(m => !m)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name ?? ''} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white">
            {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-medium text-zinc-300 max-w-[100px] truncate">
          {user.name ?? user.email ?? 'You'}
        </span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-2xl bg-zinc-900 border border-white/10 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-zinc-200 truncate">{user.name ?? 'Voter'}</div>
              {user.email && <div className="text-[11px] text-zinc-600 truncate mt-0.5">{user.email}</div>}
            </div>
            <button
              onClick={() => { logout(); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors bg-transparent border-none cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AppInner() {
  return (
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
            <AuthButton />
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
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
