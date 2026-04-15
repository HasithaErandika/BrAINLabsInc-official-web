import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { UserPlus, ArrowRight, Loader2, Info, GraduationCap, MapPin, Briefcase } from "lucide-react";
import { FormField, FormInput, FormTextArea } from "../../components/shared/FormElements";

export default function CompleteProfile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    second_name: user?.second_name || "",
    workplace: "",
    occupation: "",
    country: "",
    bio: ""
  });

  useEffect(() => {
    if (user?.approval_status === "APPROVED") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.me.update(formData);
      await refreshUser();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-200/50 via-zinc-50 to-zinc-50">
      <div className="w-full max-w-2xl bg-white border border-zinc-200/60 rounded-[3rem] shadow-2xl shadow-zinc-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-10 border-b border-zinc-100 bg-zinc-50/30 flex items-center gap-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl rotate-3">
            <UserPlus size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">System Onboarding</h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 text-zinc-600">Step 02: Researcher Identity Certification</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {error && (
            <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-600 animate-in fade-in slide-in-from-top-2">
               <Info size={20} className="shrink-0 mt-0.5" />
               <p className="text-sm font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <FormField label="First Name">
               <FormInput 
                 placeholder="Hasitha" 
                 value={formData.first_name} 
                 onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                 required
               />
            </FormField>

            <FormField label="Second Name">
               <FormInput 
                 placeholder="Erandika" 
                 value={formData.second_name} 
                 onChange={e => setFormData(p => ({ ...p, second_name: e.target.value }))}
                 required
               />
            </FormField>

            <FormField label="Academic Node / Workplace" full>
               <div className="relative">
                 <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                 <FormInput 
                   className="pl-12"
                   placeholder="e.g., SLIIT, Sri Lanka" 
                   value={formData.workplace} 
                   onChange={e => setFormData(p => ({ ...p, workplace: e.target.value }))}
                   required
                 />
               </div>
            </FormField>

            <FormField label="Primary Research Role">
               <div className="relative">
                 <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                 <FormInput 
                   className="pl-12"
                   placeholder="e.g., Neural Architect" 
                   value={formData.occupation} 
                   onChange={e => setFormData(p => ({ ...p, occupation: e.target.value }))}
                   required
                 />
               </div>
            </FormField>

            <FormField label="Geographic Region">
               <div className="relative">
                 <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                 <FormInput 
                   className="pl-12"
                   placeholder="e.g., Sri Lanka" 
                   value={formData.country} 
                   onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                   required
                 />
               </div>
            </FormField>

            <FormField label="Professional Bio / Mission" full>
               <FormTextArea 
                 className="min-h-[120px]"
                 placeholder="Describe your research focus and academic mission..." 
                 value={formData.bio} 
                 onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
               />
            </FormField>
          </div>

          <div className="mt-12 pt-10 border-t border-zinc-100 flex items-center justify-between">
            <button type="button" onClick={logout} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Abort Session</button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all flex items-center gap-3 group disabled:opacity-50 shadow-xl shadow-zinc-900/10 active:scale-95"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  Submit Identity for Review <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
