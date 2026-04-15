import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Microscope, Users, Check, X } from "lucide-react";
import { apiClient } from "../../api";

// ── Password strength helpers ─────────────────────────────────────────────────

const CRITERIA = [
  { id: "length",    label: "At least 8 characters",       test: (p: string) => p.length >= 8 },
  { id: "upper",     label: "One uppercase letter",         test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower",     label: "One lowercase letter",         test: (p: string) => /[a-z]/.test(p) },
  { id: "number",    label: "One number",                   test: (p: string) => /\d/.test(p) },
  { id: "special",   label: "One special character",        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string) {
  const passed = CRITERIA.filter(c => c.test(password)).length;
  if (passed <= 1) return { level: 0, label: "Weak",   color: "bg-red-500" };
  if (passed === 2) return { level: 1, label: "Fair",   color: "bg-orange-400" };
  if (passed === 3) return { level: 2, label: "Good",   color: "bg-yellow-400" };
  if (passed === 4) return { level: 3, label: "Strong", color: "bg-emerald-500" };
  return               { level: 4, label: "Very Strong", color: "bg-emerald-600" };
}

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    second_name: "",
    contact_email: "",
    password: "",
    role: "researcher",
    assigned_by_researcher_id: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [researchers, setResearchers] = useState<{id: number, first_name: string, second_name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(formData.password);
  const passwordsMatch = confirmPassword === "" ? null : formData.password === confirmPassword;

  useEffect(() => {
    apiClient.get("/public/researchers").then(r => setResearchers(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (strength.level < 2) {
      setError("Please choose a stronger password (at least Good strength).");
      setLoading(false);
      return;
    }

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }


    try {
      await apiClient.post("/auth/register", {
        ...formData,
        assigned_by_researcher_id:
          formData.role === "research_assistant" ? Number(formData.assigned_by_researcher_id) : null,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex font-['Inter']">
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] bg-black flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-violet-600 opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 rounded-full bg-blue-500 opacity-15 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white flex items-center justify-center">
            <img src="/logo.png" alt="BrAIN Labs" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="text-white text-[11px] font-black uppercase tracking-[0.3em] leading-none">BrAIN Labs</p>
            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.2em]">SLIIT</p>
          </div>
        </div>

        {/* Middle */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-5">
            {[
              { icon: Microscope, title: "Researcher", desc: "Create publications, events, grants and manage RA submissions." },
              { icon: Users, title: "Research Assistant", desc: "Draft content and submit for researcher review before publishing." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className={`flex gap-4 p-5 border rounded-xl transition-all ${formData.role === title.toLowerCase().replace(" ", "_") ? "border-violet-500/50 bg-violet-500/10" : "border-zinc-800"}`}>
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-zinc-300" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold uppercase tracking-wide">{title}</p>
                  <p className="text-zinc-500 text-[11px] mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} BrAIN Labs Inc.
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50">
        <div className="w-full max-w-[440px] space-y-8">

          {/* Back */}
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Back to Sign In
          </button>

          {success ? (
            <div className="space-y-8 text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-black tracking-tight">Application Submitted</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Your access request is pending administrative approval. You'll receive an email once reviewed.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-black text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
              >
                Return to Sign In <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-black tracking-tight">Request Access</h1>
                <p className="text-sm text-zinc-500">Submit your application to join BrAIN Labs.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First Name", name: "first_name", placeholder: "Jane" },
                    { label: "Last Name", name: "second_name", placeholder: "Smith" },
                  ].map(f => (
                    <div key={f.name} className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide">{f.label}</label>
                      <input
                        name={f.name}
                        required
                        value={(formData as any)[f.name]}
                        onChange={handleChange}
                        placeholder={f.placeholder}
                        className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-900 transition-all"
                      />
                    </div>
                  ))}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    name="contact_email"
                    required
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="jane.smith@sliit.lk"
                    className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-900 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={e => { handleChange(e); setPasswordTouched(true); }}
                      placeholder="Minimum 8 characters"
                      className="w-full h-11 px-4 pr-12 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {passwordTouched && formData.password.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-1">
                          {[0, 1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength.level ? strength.color : "bg-zinc-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`ml-3 text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                          strength.level <= 1 ? "text-red-500" :
                          strength.level === 2 ? "text-yellow-500" :
                          "text-emerald-600"
                        }`}>
                          {strength.label}
                        </span>
                      </div>

                      {/* Criteria checklist */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {CRITERIA.map(c => {
                          const ok = c.test(formData.password);
                          return (
                            <div key={c.id} className="flex items-center gap-1.5">
                              {ok
                                ? <Check size={11} className="text-emerald-500 shrink-0" />
                                : <X size={11} className="text-zinc-300 shrink-0" />}
                              <span className={`text-[10px] ${ok ? "text-emerald-600" : "text-zinc-400"}`}>
                                {c.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`w-full h-11 px-4 pr-12 bg-white border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all ${
                        passwordsMatch === null
                          ? "border-zinc-200 focus:border-zinc-900"
                          : passwordsMatch
                          ? "border-emerald-400 focus:border-emerald-500"
                          : "border-red-300 focus:border-red-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {passwordsMatch === false && (
                    <p className="text-[11px] text-red-500 font-medium">Passwords do not match.</p>
                  )}
                  {passwordsMatch === true && (
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check size={11} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wide">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "researcher", label: "Researcher" },
                      { value: "research_assistant", label: "Research Assistant" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: opt.value }))}
                        className={`h-11 rounded-xl border text-xs font-bold transition-all ${
                          formData.role === opt.value
                            ? "bg-black text-white border-black"
                            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>


                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-semibold text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-black text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Submit Application <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
