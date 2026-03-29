import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  onClose?: () => void;
  message?: string;
}

export default function LoginModal({ onClose, message }: LoginModalProps) {
  const { loginWithGoogle } = useAuth();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl bg-zinc-900 border border-white/10 p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 text-xl leading-none bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        )}

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🥃</div>
          <h2 className="text-xl font-black text-white mb-2">Sign in to vote</h2>
          <p className="text-sm text-zinc-500">
            {message ?? 'Create an account so your votes count across all sessions.'}
          </p>
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition-colors border border-white/10 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-[11px] text-zinc-700 text-center mt-5">
          Your vote replaces any previous vote for the same founder.
        </p>
      </div>
    </div>
  );
}
