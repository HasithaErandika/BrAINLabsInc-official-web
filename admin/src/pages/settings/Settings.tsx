import axios from "axios";
import { useState } from "react";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

export default function Settings() {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (formData.new_password !== formData.confirm_password) {
      setError("New passwords do not match");
      return;
    }

    if (formData.new_password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await api.me.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      setSuccess(true);

      setFormData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || "Failed to update password. Check your current password.");
      } else {
        setError("An unexpected error occurred while updating password.");
      }
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account security and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Account Security</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            We recommend using a strong password that you don't use elsewhere. 
            BrAIN Labs requires at least 6 characters for your password.
          </p>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Email Display (Read-only as requested) */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-100 rounded-lg">
                <Mail size={18} className="text-zinc-600" />
              </div>
              <h3 className="font-bold text-zinc-900">Email Address</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-800">{user?.email}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Primary contact email</p>
              </div>
              <span className="px-2 py-1 text-[10px] font-bold bg-green-50 text-green-700 rounded-full border border-green-100 uppercase">Verified</span>
            </div>
          </div>

          {/* Password Change Form */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-zinc-100 rounded-lg">
                <ShieldCheck size={18} className="text-zinc-600" />
              </div>
              <h3 className="font-bold text-zinc-900">Change Password</h3>
            </div>

            {error && (
              <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-100 font-medium text-center">
                Password updated successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 uppercase tracking-tight">Current Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 text-sm" 
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-tight">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 text-sm" 
                    placeholder="Min. 6 chars"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-tight">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 text-sm" 
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={saving || !formData.current_password || !formData.new_password}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-sm"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
