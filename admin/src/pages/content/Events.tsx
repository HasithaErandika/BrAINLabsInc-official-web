import { useState, useEffect } from "react";
import { CalendarDays, MapPin, Clock, Users, Info } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Event, type ApprovalStatus } from "../../lib/api";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { FormField, FormInput, FormTextArea, FormSelect } from "../../components/shared/FormElements";
import { Badge } from "../../components/shared/UIPrimitives";

export default function EventsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserAdmin = isAdmin();

  const fetchItems = async () => {
    try {
      const data = await api.events.list();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Event> = {
    title: "",
    description: "",
    event_date: new Date().toISOString().split('T')[0],
    event_time: "10:00",
    premises: "BrAIN Labs HQ",
    host: "Global Research Team",
    approval_status: "PENDING" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Event>) => {
    if (item.id) await api.events.update(item.id as number, item);
    else await api.events.create(item);
    await fetchItems();
  };

  const handleToggleStatus = async (item: Event) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    if (newStatus === "APPROVED") await api.admin.approveContent("event", item.id);
    else await api.admin.rejectContent("event", item.id);
    await fetchItems();
  };

  return (
    <ContentPageTemplate<Event>
      title="Events"
      subtitle={`${items.length} summits and research sessions indexed in the professional registry.`}
      icon={CalendarDays}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.description, item.premises]}
      filterOptions={[
        { label: "ALL EVENTS", value: "ALL" },
        { label: "PUBLISHED", value: "APPROVED" },
        { label: "PENDING", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article key={item.id} onClick={onClick} className="group relative bg-white border border-zinc-100 p-10 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 cursor-pointer flex flex-col gap-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg opacity-90">
                    <CalendarDays size={18} />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-900 border-b-2 border-zinc-900 pb-0.5">
                    {item.event_date}
                 </span>
              </div>
              <Badge status={item.approval_status} className="rounded-full" />
           </div>
           <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-zinc-900 leading-tight group-hover:text-black transition-all line-clamp-2 uppercase tracking-tighter">{item.title}</h3>
              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-6 flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-full w-fit border border-zinc-100 italic">
                <MapPin size={13} /> {item.premises} <span className="mx-1 opacity-20">/</span> NODE-0X{item.id?.toString().slice(-4).toUpperCase()}
              </p>
           </div>
        </article>
      )}
      renderDetail={(item) => (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30">
                  <div className="flex items-center gap-4 mb-6 text-zinc-300">
                     <MapPin size={20} />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em]">Operational Premises</span>
                  </div>
                  <p className="text-xl font-black text-black uppercase tracking-tighter">{item.premises}</p>
               </div>
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30">
                  <div className="flex items-center gap-4 mb-6 text-zinc-300">
                     <Clock size={20} />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em]">Scheduled Window</span>
                  </div>
                  <p className="text-xl font-black text-black uppercase tracking-tighter">{item.event_time}</p>
               </div>
               <div className="p-10 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-zinc-200/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-6 text-zinc-300">
                       <Users size={20} />
                       <span className="text-[11px] font-black uppercase tracking-[0.3em]">Moderation Status</span>
                    </div>
                    <Badge status={item.approval_status} className="rounded-full" />
                  </div>
               </div>
            </div>

            <div className="space-y-10">
               <h4 className="text-[14px] font-black text-black uppercase tracking-[0.5em] flex items-center gap-4 border-b border-zinc-100 pb-4 w-fit">
                 <Info size={20} className="text-zinc-900" /> Operational Briefing
               </h4>
               <div className="p-14 bg-zinc-50/50 border border-zinc-100 text-zinc-600 leading-relaxed font-medium italic text-lg rounded-[2.5rem] shadow-inner">
                 {item.description || "No technical briefing associated with this event node Archive data cluster."}
               </div>
            </div>
            
            <div className="flex items-center justify-center pt-8">
               <div className="p-12 border border-dashed border-zinc-200 rounded-[3rem] w-full max-w-2xl text-center flex flex-col items-center gap-6 group hover:border-zinc-400 transition-all">
                  <div className="p-6 bg-zinc-50 text-zinc-200 rounded-full group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-inner">
                    <CalendarDays size={48} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-300 mb-2">Network Synchronization</h5>
                    <p className="text-xl font-black text-zinc-900 uppercase">Synchronize with Global Event Cluster</p>
                  </div>
               </div>
            </div>
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <FormField label="Event Identification" full><FormInput placeholder="Registry Title identification..." value={item.title} onChange={e => setItem({...item, title: e.target.value})} className="rounded-2xl" /></FormField>
               <FormField label="System Premises Matrix"><FormInput placeholder="Operational Hub location..." value={item.premises} onChange={e => setItem({...item, premises: e.target.value})} className="rounded-2xl" /></FormField>
               <FormField label="Node Primary Host"><FormInput placeholder="Registry Host node..." value={item.host} onChange={e => setItem({...item, host: e.target.value})} className="rounded-2xl" /></FormField>
               <FormField label="Archival Window Date"><FormInput type="date" value={item.event_date} onChange={e => setItem({...item, event_date: e.target.value})} className="rounded-2xl" /></FormField>
               <FormField label="Archival Window Time"><FormInput type="time" value={item.event_time} onChange={e => setItem({...item, event_time: e.target.value})} className="rounded-2xl" /></FormField>
               
               <FormField label="Registry Status Node" full={isUserAdmin}>
                  <FormSelect 
                    value={item.approval_status || "PENDING"} 
                    onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                    className="rounded-2xl"
                    options={[
                      { label: "PENDING MODERATION Hub", value: "PENDING" },
                      ...(isUserAdmin ? [{ label: "AUTHORIZE EVENT Node", value: "APPROVED" }, { label: "INVALIDATE EVENT Node", value: "REJECTED" }] : [])
                    ]}
                  />
               </FormField>

               <FormField label="Detailed Resource Briefing" full><FormTextArea className="min-h-[220px] rounded-3xl" placeholder="Full operational context node..." value={item.description} onChange={e => setItem({...item, description: e.target.value})} /></FormField>
            </div>
        </div>
      )}
    />
  );
}
