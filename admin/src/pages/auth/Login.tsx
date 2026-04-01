import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ArrowRight, Loader2, AlertCircle, Shield } from "lucide-react";

export default function Login() {
  const { token, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { error: authError } = await loginWithEmail(email, password);

    if (authError) {
      // If it's a specific role-related or rejection error from our backend (403), show it directly
      if (authError.includes('Contact admin') || authError.includes('rejected')) {
        setError(authError);
      } else if (authError.toLowerCase().includes('user not found') || authError.toLowerCase().includes('invalid credentials')) {
        setError("Account not found in system. Contact admin.");
      } else {
        setError(authError);
      }
      setLoading(false);
      return;
    }

    navigate("/dashboard", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans antialiased text-black">
      
      <div className="w-full max-w-sm space-y-12">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-white p-2 border border-zinc-100 shadow-sm rounded-xl">
            <img 
              src="/logo.png" 
              alt="BrAIN Labs" 
              className="w-14 h-14 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=BL&backgroundColor=000000&textColor=ffffff';
              }}
            />
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              BrAIN Labs
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
              Login Console
            </p>
          </div>
        </div>

        {/* Input Card */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle size={16} className="text-black shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@brainlabsinc.org"
              className="w-full bg-white border-2 border-zinc-100 px-4 py-3 text-sm transition-all focus:border-black focus:outline-none placeholder:text-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border-2 border-zinc-100 px-4 py-3 text-sm transition-all focus:border-black focus:outline-none placeholder:text-zinc-200"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="group w-full bg-black text-white hover:bg-zinc-800 py-4 px-6 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Enter Console
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-zinc-400 font-medium">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-black font-bold hover:underline ml-1"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-zinc-100 text-center space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-zinc-300">
              <Shield size={12} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]">
                Authorized Personnel Only
              </p>
            </div>
            <p className="text-[9px] font-medium text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
              Admins, Researchers, and Research Assistants can log in to this console.
            </p>
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
            &copy; {new Date().getFullYear()} BrAIN Labs Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
