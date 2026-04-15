import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, BookOpen, FlaskConical, GraduationCap } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { token, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setError(authError.includes("credentials") ? "Invalid email or password." : authError);
      setLoading(false);
      return;
    }

    navigate("/dashboard", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex font-['Inter']">
      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#0f0f1a] flex-col justify-between p-14 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-white opacity-5 blur-[80px]" />
        <div className="absolute bottom-1/3 right-0 w-64 h-64 rounded-full bg-zinc-500 opacity-10 blur-[80px]" />
        <div className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full bg-white opacity-5 blur-[60px]" />

        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 14 }).map((_, r) =>
            Array.from({ length: 14 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={c * 60 + 10} cy={r * 60 + 10} r="1.5" fill="white" />
            ))
          )}
        </svg>

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900">
            <img src="/logo.png" alt="BrAIN Labs" className="w-5 h-5 object-contain invert" />
          </div>
          <div>
            <p className="text-white text-xs font-bold tracking-wide leading-none">BrAIN Labs</p>
            <p className="text-zinc-500 text-[10px] tracking-widest uppercase mt-0.5">Research Portal</p>
          </div>
        </div>

        {/* Middle hero */}
        <div className="relative z-10 space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <Sparkles size={10} className="text-zinc-400" />
            <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">Brain-Inspired AI Research</span>
          </div>

          <h2 className="text-5xl font-black text-white tracking-tighter leading-[1.05]">
            The Lab's<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-white to-zinc-300">
              Command Centre
            </span>
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Manage publications, members, events and research content for BrAIN Labs at SLIIT.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-2.5 pt-2">
            {[
              { icon: BookOpen, label: "Publications & Research Blogs" },
              { icon: FlaskConical, label: "Projects & Grant Management" },
              { icon: GraduationCap, label: "Tutorials & Member Directory" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-zinc-400">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-zinc-300" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} BrAIN Labs Inc. — SLIIT
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f8fb]">
        <div className="w-full max-w-[400px] space-y-8">

          {/* Mobile brand */}
          <div className="lg:hidden text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto">
              <img src="/logo.png" alt="BrAIN Labs" className="w-6 h-6 object-contain invert" />
            </div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">BrAIN Labs Portal</p>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to access your lab dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@sliit.lk"
                className="input-monochrome"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-monochrome pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            {/* Register */}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="w-full h-11 bg-white border border-zinc-200 hover:border-zinc-400 text-sm font-medium text-zinc-700 hover:text-zinc-900 rounded-xl transition-all"
            >
              Request Lab Access
            </button>
          </form>

          <p className="text-center text-[10px] text-zinc-400 font-medium">
            Only authorised SLIIT BrAIN Labs personnel may access this system.
          </p>
        </div>
      </div>
    </div>
  );
}
