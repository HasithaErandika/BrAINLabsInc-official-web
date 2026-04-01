import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, AlertCircle, Shield, Mail, Lock, Briefcase } from "lucide-react";
import { apiClient } from "../../lib/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    second_name: "",
    contact_email: "",
    password: "",
    role: "researcher"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/auth/register", formData);
      setSuccessMsg(res.data.message || "Registration successful. Please wait for an admin to approve your account.");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (successMsg) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans antialiased text-black">
        <div className="w-full max-w-sm space-y-8 text-center bg-zinc-50 border border-zinc-200 p-10 rounded-xl animate-in zoom-in-95 duration-500">
          <Shield size={48} className="mx-auto text-black" />
          <h2 className="text-xl font-bold tracking-tight">Application Complete</h2>
          <p className="text-zinc-500 text-xs leading-relaxed">{successMsg}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-black text-white hover:bg-zinc-800 py-3 px-6 font-bold text-sm rounded transition-all flex items-center justify-center gap-2 group"
          >
            Go to Login
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans antialiased text-black">
      
      <div className="w-full max-w-md space-y-12">
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-white p-2 border border-zinc-100 shadow-sm rounded-xl">
            <img 
              src="/logo.png" 
              alt="BrAIN Labs" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=BL&backgroundColor=000000&textColor=ffffff';
              }}
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Request Access</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Login Console</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={16} className="text-black shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">First Name</label>
                <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Hasitha"
                    className="w-full bg-white border-2 border-zinc-100 px-4 py-3 text-sm transition-all focus:border-black focus:outline-none placeholder:text-zinc-200 font-medium"
                />
            </div>
            <div className="space-y-1.5 flex-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Last Name</label>
                <input
                    type="text"
                    name="second_name"
                    required
                    value={formData.second_name}
                    onChange={handleChange}
                    placeholder="Erandika"
                    className="w-full bg-white border-2 border-zinc-100 px-4 py-3 text-sm transition-all focus:border-black focus:outline-none placeholder:text-zinc-200 font-medium"
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                <input
                  type="email"
                  name="contact_email"
                  required
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-white border-2 border-zinc-100 px-4 pl-11 py-3 text-sm transition-all focus:border-black focus:outline-none placeholder:text-zinc-200 font-medium"
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Password</label>
            <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full bg-white border-2 border-zinc-100 px-4 pl-11 py-3 text-sm transition-all focus:border-black focus:outline-none placeholder:text-zinc-200 font-medium"
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Application Role</label>
            <div className="relative">
                <Briefcase size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-white border-2 border-zinc-100 px-4 pl-11 py-3 text-sm transition-all focus:border-black focus:outline-none appearance-none cursor-pointer font-medium"
                >
                  <option value="researcher">Researcher</option>
                  <option value="research_assistant">Research Assistant</option>
                </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-black text-white hover:bg-zinc-800 py-4 px-6 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Submit Application <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>}
          </button>
        </form>

        <div className="text-center">
            <p className="text-xs text-zinc-400 font-medium">
                Already have an account?{' '}
                <button
                    onClick={() => navigate('/login')}
                    className="text-black font-bold hover:underline ml-1"
                >
                    Log in
                </button>
            </p>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-zinc-100 text-center space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-zinc-300">
              <Shield size={12} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</p>
            </div>
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
            &copy; {new Date().getFullYear()} BrAIN Labs Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
