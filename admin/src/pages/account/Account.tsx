import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../api";
import type { Profile } from "../../types";
import { User, BookOpen, FlaskConical, Edit3, Check, Users } from "lucide-react";
import { BasicInfoTab } from "./components/BasicInfoTab";
import { QualificationsTab } from "./components/QualificationsTab";
import { OngoingResearchTab } from "./components/OngoingResearchTab";
import { AssignedResearcherTab } from "./components/AssignedResearcherTab";
import { ResearchAssistantsTab } from "./components/ResearchAssistantsTab";
import { Button } from "../../components/ui/Button";

type TabId = "basic" | "qualifications" | "research" | "assigned_researcher" | "assistants";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

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
      setError(err.response?.data?.message || err.message || "Credential Retrieval Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
           <p className="text-sm font-medium text-zinc-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full border border-zinc-200 rounded-xl p-8 text-center space-y-6">
           <div className="w-12 h-12 bg-zinc-100 text-zinc-500 rounded-full flex items-center justify-center mx-auto">
              <User size={24} />
           </div>
           <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-zinc-900">Profile Unavailable</h2>
              <p className="text-sm text-zinc-500">{error || "Could not resolve your profile data."}</p>
           </div>
           <Button onClick={() => window.location.reload()} className="w-full">
              Retry
           </Button>
        </div>
      </div>
    );
  }

  const userTabs: TabConfig[] = [
    { id: "basic", label: "Identity & Profile", icon: User },
  ];

  if (!isAdmin()) {
    userTabs.push({ id: "research", label: "Active Research", icon: FlaskConical });
    userTabs.push({ id: "qualifications", label: "Academic Records", icon: BookOpen });
    
    if (profile.role === "researcher") {
      userTabs.push({ id: "assistants", label: "Research Assistants", icon: Users });
    }
    if (profile.role === "research_assistant") {
      userTabs.push({ id: "assigned_researcher", label: "Assigned Researcher", icon: Users });
    }
  }

  const filteredTabs = userTabs;

  return (
    <div className="space-y-6">
      {/* Header section (matching publications design) */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-zinc-100 text-zinc-600 rounded-lg flex items-center justify-center text-xl font-bold border border-zinc-200 shadow-sm">
             {profile.first_name[0]}{profile.second_name[0]}
           </div>
           <div>
             <div className="flex items-center gap-2 mb-1">
               <User size={14} className="text-zinc-400" />
               <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Profile Hub</span>
             </div>
             <h1 className="text-3xl font-bold text-zinc-900 leading-tight">
               {profile.first_name} {profile.second_name}
             </h1>
             <p className="text-sm font-medium text-zinc-500 capitalize mt-1">
               {profile.role.replace('_', ' ')}
             </p>
           </div>
        </div>

        <div className="flex gap-2">
           <Button
             variant={isEditing ? "primary" : "outline"}
             onClick={() => setIsEditing(!isEditing)}
             className="h-9 px-4 text-xs font-semibold shadow-sm"
           >
             {isEditing ? <><Check size={14} className="mr-1.5" /> Save Profile</> : <><Edit3 size={14} className="mr-1.5" /> Edit Profile</>}
           </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 overflow-x-auto pb-1">
        {filteredTabs.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as TabId)}
             className={`flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
               activeTab === tab.id
                 ? "border-zinc-900 text-zinc-900"
                 : "border-transparent text-zinc-500 hover:text-zinc-800"
             }`}
           >
             <tab.icon size={15} />
             {tab.label}
           </button>
        ))}
      </div>

      {/* Tab Content Display */}
      <div className="pt-2">
        <div className="max-w-4xl">
          {activeTab === "basic" && <BasicInfoTab cv={profile} onUpdate={fetchProfile} isEditing={isEditing} />}
          {activeTab === "research" && <OngoingResearchTab cv={profile} onUpdate={fetchProfile} isEditing={isEditing} />}
          {activeTab === "qualifications" && <QualificationsTab cv={profile} onUpdate={fetchProfile} isEditing={isEditing} />}
          {activeTab === "assigned_researcher" && <AssignedResearcherTab cv={profile} />}
          {activeTab === "assistants" && <ResearchAssistantsTab cv={profile} />}
        </div>
      </div>
    </div>
  );
}
