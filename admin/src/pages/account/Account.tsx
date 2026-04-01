import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Profile } from "../../lib/api";
import { Loader2, User, BookOpen, FlaskConical, Edit3, Check } from "lucide-react";
import { BasicInfoTab } from "./components/BasicInfoTab";
import { QualificationsTab } from "./components/QualificationsTab";
import { OngoingResearchTab } from "./components/OngoingResearchTab";

type TabId = "basic" | "qualifications" | "research";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { id: "basic", label: "Identity & Core", icon: User },
  { id: "research", label: "Ongoing Research", icon: FlaskConical },
  { id: "qualifications", label: "Education", icon: BookOpen },
];

export default function Account() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.me.get();
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const filteredTabs = TABS.filter(tab => {
    if (isAdmin()) return tab.id === "basic";
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-zinc-50/30">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-10 h-10 animate-spin text-zinc-900" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Syncing Identity...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-screen bg-zinc-50">
        <div className="max-w-md w-full bg-white border border-red-100 p-8 rounded-[2.5rem] shadow-xl shadow-red-900/5 text-center">
           <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <User size={32} />
           </div>
           <h2 className="text-xl font-black text-zinc-900 mb-2">Profile Collision</h2>
           <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-8">{error || "The system could not retrieve your digital identity."}</p>
           <button onClick={() => window.location.reload()} className="px-8 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all">Retry Handshake</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Sidebar for Settings */}
      <div className="w-full md:w-80 flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-200/60 bg-zinc-50/20 backdrop-blur-3xl overflow-y-auto">
        <div className="p-8">
           <div className="mb-10 text-center md:text-left">
              <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl mx-auto md:mx-0 mb-6">
                 {profile.first_name[0]}{profile.second_name[0]}
              </div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tighter leading-none">{profile.first_name} {profile.second_name}</h1>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2 italic">{profile.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</p>
           </div>
          
          <nav className="space-y-2">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-[0.15em] rounded-2xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 scale-[1.02]"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <tab.icon size={16} strokeWidth={activeTab === tab.id ? 3 : 2} />
                {tab.label}
              </button>
            ))}
            
            <div className="pt-8 border-t border-zinc-100 mt-8">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border-2 transition-all active:scale-95 ${
                  isEditing
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-white border-zinc-200 text-zinc-900 hover:border-zinc-900 shadow-sm"
                }`}
              >
                {isEditing ? <><Check size={14} /> Finish Customization</> : <><Edit3 size={14} /> Personalize Identity</>}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-zinc-50/30">
        <div className="max-w-4xl mx-auto p-8 lg:p-16 animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === "basic" && <BasicInfoTab cv={profile} onUpdate={fetchProfile} isEditing={isEditing} />}
          {activeTab === "qualifications" && <QualificationsTab cv={profile} onUpdate={fetchProfile} isEditing={isEditing} />}
          {activeTab === "research" && <OngoingResearchTab cv={profile} onUpdate={fetchProfile} isEditing={isEditing} />}
        </div>
      </div>
    </div>
  );
}
