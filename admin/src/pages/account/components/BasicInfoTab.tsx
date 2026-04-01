import { useState } from "react";
import { Loader2, User, Mail, Globe, Linkedin, MapPin, Briefcase } from "lucide-react";
import { api, type Profile } from "../../../lib/api";
import { useAuth } from "../../../hooks/useAuth";
import { FormField, FormInput, FormTextArea } from "../../../components/shared/FormElements";

interface Props {
  cv: Profile;
  onUpdate: () => void;
  isEditing?: boolean;
}

export function BasicInfoTab({ cv, onUpdate, isEditing }: Props) {
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: cv.first_name,
    second_name: cv.second_name,
    contact_email: cv.contact_email,
    workplace: cv.role_detail?.workplace || "",
    occupation: cv.role_detail?.occupation || "",
    country: cv.role_detail?.country || "",
    linkedin_url: cv.role_detail?.linkedin_url || "",
    bio: cv.role_detail?.bio || "",
    image_url: cv.role_detail?.image_url || ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.me.update(formData);
      await refreshUser();
      setSuccess(true);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (!isEditing) {
    return (
      <div className="bg-white border border-zinc-200/60 rounded-[2.5rem] p-10 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white"><User size={20} /></div>
           <h2 className="text-lg font-black text-zinc-900 tracking-tight">Identity Foundation</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <div className="group">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-2 group-hover:text-zinc-600 transition-colors">Digital Identity</label>
            <p className="text-zinc-900 font-bold flex items-center gap-2"><User size={14} className="text-zinc-300" /> {cv.first_name} {cv.second_name}</p>
          </div>
          <div className="group">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-2 group-hover:text-zinc-600 transition-colors">Academic Nexus</label>
            <p className="text-zinc-900 font-bold flex items-center gap-2"><Briefcase size={14} className="text-zinc-300" /> {cv.role_detail?.workplace || "Global Researcher"}</p>
          </div>
          <div className="group">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-2 group-hover:text-zinc-600 transition-colors">Contact Node</label>
            <p className="text-zinc-900 font-bold flex items-center gap-2 underline decoration-zinc-100 underline-offset-4"><Mail size={14} className="text-zinc-300" /> {cv.contact_email}</p>
          </div>
          <div className="group">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-2 group-hover:text-zinc-600 transition-colors">Geographic Region</label>
            <p className="text-zinc-900 font-bold flex items-center gap-2"><Globe size={14} className="text-zinc-300" /> {cv.role_detail?.country || "Earth Terminal"}</p>
          </div>
          <div className="group md:col-span-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-2 group-hover:text-zinc-600 transition-colors">Professional Biography</label>
            <p className="text-zinc-600 font-medium leading-relaxed italic border-l-2 border-zinc-100 pl-6">{cv.role_detail?.bio || "No professional statement has been recorded for this identity node."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200/60 rounded-[2.5rem] p-10 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 mb-8">
         <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600"><User size={20} /></div>
         <h2 className="text-lg font-black text-zinc-900 tracking-tight">Modify Identity Core</h2>
      </div>
      
      {error && <div className="mb-8 p-4 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl animate-in shake duration-300">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField label="First Name"><FormInput value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} required /></FormField>
          <FormField label="Second Name"><FormInput value={formData.second_name} onChange={e => setFormData({ ...formData, second_name: e.target.value })} required /></FormField>
          <FormField label="Role / Occupation"><FormInput value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} placeholder="e.g., Lead Neural Architect" /></FormField>
          <FormField label="Academic Node / Workplace"><FormInput value={formData.workplace} onChange={e => setFormData({ ...formData, workplace: e.target.value })} placeholder="e.g., MIT Media Lab" /></FormField>
          <FormField label="Geographic Region">
            <div className="relative">
               <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
               <FormInput className="pl-12" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} placeholder="e.g., Sri Lanka" />
            </div>
          </FormField>
          <FormField label="LinkedIn Identity">
             <div className="relative">
               <Linkedin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
               <FormInput className="pl-12" value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/..." />
            </div>
          </FormField>
          <FormField label="Avatar Digital Stream" full><FormInput value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." /></FormField>
          <FormField label="Identity Mission / Bio" full><FormTextArea className="min-h-[150px]" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="State your research philosophy..." /></FormField>
        </div>
        
        <div className="pt-8 flex items-center justify-end gap-6 border-t border-zinc-100">
          {success && <span className="text-xs font-black text-emerald-600 uppercase tracking-widest animate-in fade-in slide-in-from-right-2">Identity Sync Successful</span>}
          <button type="submit" disabled={saving} className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95 disabled:opacity-50 flex items-center gap-3">
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Commit Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
