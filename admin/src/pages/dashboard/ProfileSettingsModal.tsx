import { useState, useEffect } from "react";
import { X, Loader2, User, Briefcase, Mail, ImageIcon, Save, CheckCircle2 } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { token, user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    second_name: "",
    occupation: "",
    contact_email: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      setError(null);
      setSuccess(false);
      api.me.get()
        .then((member) => {
          setFormData({
            first_name: member.first_name || "",
            second_name: member.second_name || "",
            occupation: member.role_detail?.occupation || "",
            contact_email: member.contact_email || "",
            image_url: member.role_detail?.image_url || "",
          });
        })
        .catch(() => setError("Failed to load profile details."))
        .finally(() => setLoading(false));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.me.update({
        first_name: formData.first_name,
        second_name: formData.second_name,
        occupation: formData.occupation,
        image_url: formData.image_url,
      });

      updateUser({
        first_name: updated.first_name,
        second_name: updated.second_name,
        email: updated.contact_email || user?.email,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white/90 border border-zinc-100 p-1 rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 backdrop-blur-2xl">
        <div className="flex items-center justify-between p-10 border-b border-zinc-50 bg-white/50">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Identity <span className="text-zinc-300">Hub</span></h2>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1.5">Manage your global research node</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-2xl transition-all active:scale-90"
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-6">
            <div className="p-5 bg-zinc-50 rounded-full border border-zinc-100 shadow-inner">
              <Loader2 className="w-10 h-10 animate-spin text-black" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Retrieving encrypted credentials...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {error && (
              <div className="p-6 text-[11px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in shake duration-500">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-200" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Profile Image Preview */}
              <div className="md:col-span-2 flex flex-col items-center justify-center p-12 bg-zinc-50/50 rounded-[2.5rem] border border-zinc-100 border-dashed relative group overflow-hidden">
                <div className="relative z-10">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      className="w-28 h-28 rounded-3xl object-cover ring-8 ring-white shadow-2xl group-hover:scale-105 transition-all duration-700"
                      alt="Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${formData.first_name}&backgroundColor=000000&textColor=ffffff`;
                      }}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-3xl bg-zinc-900 flex items-center justify-center text-white ring-8 ring-white shadow-2xl shadow-zinc-900/20">
                      <User size={40} />
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 bg-white p-3 rounded-2xl shadow-2xl border border-zinc-50">
                    <ImageIcon size={16} className="text-zinc-900" />
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mt-6 z-10 transition-colors group-hover:text-zinc-900">Digital Identity Node</p>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Primary First Name <span className="text-black/20">*</span></label>
                <div className="relative">
                  <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-zinc-400 transition-all font-bold text-zinc-900 placeholder:text-zinc-200 shadow-inner"
                    placeholder="Jane"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Archive Second Name <span className="text-black/20">*</span></label>
                <div className="relative">
                  <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                  <input
                    type="text"
                    required
                    value={formData.second_name}
                    onChange={(e) => setFormData({ ...formData, second_name: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-zinc-400 transition-all font-bold text-zinc-900 placeholder:text-zinc-200 shadow-inner"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">System Occupation</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-zinc-400 transition-all font-bold text-zinc-900 placeholder:text-zinc-200 shadow-inner"
                    placeholder="Lead Researcher"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Registry Contact</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                  <div className="w-full pl-14 pr-6 py-5 bg-zinc-100 border border-zinc-200 rounded-2xl font-bold text-zinc-400 truncate opacity-60 flex items-center">
                    {formData.contact_email}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Asset Avatar Index Node (URL)</label>
                <div className="relative">
                  <ImageIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-8 focus:ring-black/5 focus:border-zinc-400 transition-all font-bold text-zinc-900 placeholder:text-zinc-200 text-sm shadow-inner"
                    placeholder="https://cloud.brainlabs.com/archives/v1/identities/photo.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-10 flex items-center justify-between border-t border-zinc-50">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 hover:text-black transition-colors"
              >
                Abort Changes
              </button>
              <button
                type="submit"
                disabled={saving || !formData.first_name || !formData.second_name || success}
                className={cn(
                  "flex items-center gap-4 px-12 py-5 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-50",
                  success ? "bg-zinc-900 shadow-zinc-900/20 translate-y-[-2px]" : "bg-black shadow-zinc-900/20 hover:bg-zinc-800 hover:shadow-zinc-900/30"
                )}
              >
                {success ? (
                  <>
                    <CheckCircle2 size={18} />
                    Hub Synchronized
                  </>
                ) : (
                  <>
                    {saving ? <Loader2 size={18} className="animate-spin text-white/50" /> : <Save size={18} />}
                    {saving ? "Deploying..." : "Commit Profile Changes"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
