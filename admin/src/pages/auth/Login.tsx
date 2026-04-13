import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const { token, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (authError.toLowerCase().includes("user not found") || authError.toLowerCase().includes("invalid credentials")) {
        setError("No account found with these credentials.");
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
    <div className="min-h-screen grid lg:grid-cols-[440px_1fr] font-sans antialiased">

      {/* ── Left: Brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 text-white p-12 relative overflow-hidden">
        {/* Dot-grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <img
                src="/logo.png"
                alt="BrAIN Labs"
                className="w-6 h-6 object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          </div>

          {/* Main display text */}
          <div className="mb-auto py-16">
            <h1 className="text-[72px] font-black tracking-tighter leading-[0.9] text-white mb-6">
              BrAIN<br />Labs
            </h1>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[260px]">
              Brain-Inspired AI & Neuroinformatics Lab — SLIIT
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-900 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        {/* Mobile brand */}
        <div className="lg:hidden text-center mb-10">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img
              src="/logo.png"
              alt="BrAIN Labs"
              className="w-7 h-7 object-contain invert"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <h1 className="text-xl font-black text-black tracking-tight">BrAIN Labs</h1>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-black tracking-tight mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-500 font-medium">
              Sign in to your workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl flex items-start gap-3">
                <AlertCircle size={15} className="text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-zinc-700 leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@brainlabsinc.org"
                className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm rounded-xl transition-all focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-black/5 focus:outline-none font-medium placeholder:text-zinc-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm rounded-xl transition-all focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-black/5 focus:outline-none font-medium placeholder:text-zinc-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-zinc-900 text-white hover:bg-black py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-400 font-medium">
              No account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-zinc-900 font-bold hover:underline"
              >
                Request access
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-zinc-100 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-300">
              © {new Date().getFullYear()} BrAIN Labs Inc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
