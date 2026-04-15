import { useState, useEffect } from "react";
import { CalendarDays, MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../api";
import type { Event, ApprovalStatus } from "../../types";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

export default function EventsPage() {
  const { isAdmin, isResearcher } = useAuth();
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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
    event_datetime: new Date().toISOString(),
    premises: "",
    host: "",
    approval_status: "DRAFT" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Event>) => {
    if (item.id) await api.events.update(item.id as number, item);
    else await api.events.create(item);
    await fetchItems();
  };

  const handleSubmitForReview = async (item: Event) => {
    await api.content.submit("event", item.id);
    await fetchItems();
  };

  const handleReview = async (item: Event, status: 'PENDING_ADMIN' | 'REJECTED') => {
    await api.content.review("event", item.id, status);
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
      subtitle={`${items.length} event${items.length !== 1 ? "s" : ""} recorded.`}
      icon={CalendarDays}
      items={items}
      loading={loading}
      isAdmin={isAdmin()}
      isResearcher={isResearcher()}
      emptyItem={emptyItem}
      onSave={handleSave}
      onSubmitForReview={handleSubmitForReview}
      onReview={handleReview}
      onToggleStatus={isAdmin() ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.description || "", item.premises]}
      filterOptions={[
        { label: "All", value: "ALL" },
        { label: "Published", value: "APPROVED" },
        { label: "Pending", value: "PENDING_ADMIN" },
        { label: "Draft", value: "DRAFT" },
      ]}
      renderListItem={(item, onClick) => {
        const date = new Date(item.event_datetime);
        return (
          <div
            key={item.id}
            onClick={onClick}
            className="group bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                  <CalendarDays size={14} className="text-zinc-600" />
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <Badge status={item.approval_status} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">{item.title}</h3>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <MapPin size={10} className="text-zinc-500 shrink-0" /> {item.premises}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock size={11} />
                {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
              <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        );
      }}
      renderDetail={(item) => {
        const date = new Date(item.event_datetime);
        return (
          <div className="space-y-8 pb-20 animate-enter">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-zinc-600 mb-1.5">
                  <MapPin size={12} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Location</span>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{item.premises}</p>
              </div>
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1.5">
                  <Clock size={12} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Time</span>
                </div>
                <p className="text-sm font-semibold text-zinc-900">
                  {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1.5">
                  <Users size={12} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Host</span>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{item.host}</p>
              </div>
            </div>

            {item.description && (
              <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm text-zinc-900 italic font-medium leading-relaxed">
                "{item.description}"
              </div>
            )}
          </div>
        );
      }}
      renderEdit={(item, setItem) => (
        <div className="space-y-6">
          <Input
            label="Event Title"
            placeholder="Enter event title..."
            value={item.title ?? ""}
            onChange={e => setItem({ ...item, title: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Location / Venue"
              placeholder="Campus / Platform / Online..."
              value={item.premises ?? ""}
              onChange={e => setItem({ ...item, premises: e.target.value })}
            />
            <Input
              label="Host / Organiser"
              placeholder="Organiser name..."
              value={item.host ?? ""}
              onChange={e => setItem({ ...item, host: e.target.value })}
            />
          </div>

          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={item.event_datetime ? new Date(item.event_datetime).toISOString().slice(0, 16) : ""}
            onChange={e => setItem({ ...item, event_datetime: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</label>
            <textarea
              className="input-monochrome min-h-[120px] py-3"
              placeholder="Describe the event goals, agenda, or notes..."
              value={item.description ?? ""}
              onChange={e => setItem({ ...item, description: e.target.value })}
            />
          </div>
        </div>
      )}
    />
  );
}
