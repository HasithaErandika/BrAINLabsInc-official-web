import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../lib/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    second_name: "",
    contact_email: "",
    password: "",
    role: "researcher",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/auth/register", formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[440px_1fr] font-sans antialiased">

      {/* ── Left: Brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 text-white p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex flex-col h-full">
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

          <div className="mb-auto py-16">
            <h1 className="text-[72px] font-black tracking-tighter leading-[0.9] text-white mb-6">
              BrAIN<br />Labs
            </h1>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[260px]">
              Join the Brain-Inspired AI & Neuroinformatics Lab at SLIIT.
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              Applications reviewed by admin
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

        <div className="w-full max-w-[400px]">
          {success ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black tracking-tight mb-2">Application submitted</h2>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  Your application is under review. An admin will approve your account before you can sign in.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="group w-full bg-zinc-900 text-white hover:bg-black py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                Back to sign in
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-2xl font-black text-black tracking-tight mb-1">
                  Request access
                </h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Create your researcher account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl flex items-start gap-3">
                    <AlertCircle size={15} className="text-zinc-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {typeof error === "string" ? error : JSON.stringify(error)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">
                      First name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Jane"
                      className="w-full bg-zinc-50 border border-zinc-200 px-3.5 py-3 text-sm rounded-xl transition-all focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-black/5 focus:outline-none font-medium placeholder:text-zinc-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="second_name"
                      required
                      value={formData.second_name}
                      onChange={handleChange}
                      placeholder="Smith"
                      className="w-full bg-zinc-50 border border-zinc-200 px-3.5 py-3 text-sm rounded-xl transition-all focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-black/5 focus:outline-none font-medium placeholder:text-zinc-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    required
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm rounded-xl transition-all focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-black/5 focus:outline-none font-medium placeholder:text-zinc-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm rounded-xl transition-all focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-black/5 focus:outline-none font-medium placeholder:text-zinc-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-0.5">
                    Role
                  </label>
                  <select
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm rounded-xl transition-all focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-black/5 focus:outline-none font-medium appearance-none cursor-pointer"
                  >
                    <option value="researcher">Researcher</option>
                    <option value="research_assistant">Research Assistant</option>
                  </select>
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
                      Submit application
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign-in link */}
              <div className="mt-6 text-center">
                <p className="text-xs text-zinc-400 font-medium">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-zinc-900 font-bold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>

              <div className="mt-10 pt-6 border-t border-zinc-100 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-300">
                  © {new Date().getFullYear()} BrAIN Labs Inc.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
