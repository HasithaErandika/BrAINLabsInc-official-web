import { useState, useEffect } from "react";
import { CalendarDays, MapPin, Clock, Users, Info, ArrowRight } from "lucide-react";
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
      subtitle={`${items.length} event${items.length !== 1 ? "s" : ""} in the registry.`}
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
        <article key={item.id} onClick={onClick} className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-900 text-white rounded-lg">
                <CalendarDays size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.event_date}</span>
            </div>
            <Badge status={item.approval_status} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-zinc-900 leading-snug line-clamp-2 mb-1.5">{item.title}</h3>
            <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
              <MapPin size={11} /> {item.premises}
            </p>
          </div>
          <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{item.event_time}</span>
            <ArrowRight size={14} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </article>
      )}
      renderDetail={(item) => (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <MapPin size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Venue</span>
              </div>
              <p className="text-base font-black text-black">{item.premises}</p>
            </div>
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
              </div>
              <p className="text-base font-black text-black">{item.event_time}</p>
            </div>
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <Users size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Host</span>
              </div>
              <p className="text-base font-black text-black">{item.host}</p>
            </div>
          </div>

          {item.description && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Info size={14} /> Description
              </h4>
              <p className="text-base text-zinc-600 font-medium leading-relaxed">
                {item.description}
              </p>
            </div>
          )}
        </div>
      )}
      renderEdit={(item, setItem) => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Title" full>
              <FormInput placeholder="Event title..." value={item.title ?? ""} onChange={e => setItem({...item, title: e.target.value})} />
            </FormField>
            <FormField label="Venue / Premises">
              <FormInput placeholder="Location or platform..." value={item.premises ?? ""} onChange={e => setItem({...item, premises: e.target.value})} />
            </FormField>
            <FormField label="Host">
              <FormInput placeholder="Organiser name..." value={item.host ?? ""} onChange={e => setItem({...item, host: e.target.value})} />
            </FormField>
            <FormField label="Date">
              <FormInput type="date" value={item.event_date ?? ""} onChange={e => setItem({...item, event_date: e.target.value})} />
            </FormField>
            <FormField label="Time">
              <FormInput type="time" value={item.event_time ?? ""} onChange={e => setItem({...item, event_time: e.target.value})} />
            </FormField>
            <FormField label="Status" full={isUserAdmin}>
              <FormSelect
                value={item.approval_status || "PENDING"}
                onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                options={[
                  { label: "Pending", value: "PENDING" },
                  ...(isUserAdmin ? [{ label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" }] : [])
                ]}
              />
            </FormField>
            <FormField label="Description" full>
              <FormTextArea className="min-h-[180px]" placeholder="Event description..." value={item.description ?? ""} onChange={e => setItem({...item, description: e.target.value})} />
            </FormField>
          </div>
        </div>
      )}
    />
  );
}
