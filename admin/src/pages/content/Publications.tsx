import { useState, useEffect } from "react";
import { BookOpen, Calendar, Globe, Users, Bookmark, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api, type Publication, type ApprovalStatus, type PublicationType } from "../../lib/api";
import { ContentPageTemplate } from "../../components/shared/ContentPageTemplate";
import { FormField, FormInput, FormTextArea, FormSelect } from "../../components/shared/FormElements";
import { Badge } from "../../components/shared/UIPrimitives";

/** Maps frontend PublicationType to the ISA subtype key on the Publication object */
const subtypeKey = (type: PublicationType): keyof Publication => {
  if (type === 'CONFERENCE') return 'conference_paper';
  return type.toLowerCase() as keyof Publication;
};

/** Maps frontend PublicationType to the API endpoint segment */
const subtypeEndpoint = (type: PublicationType): string => {
  if (type === 'CONFERENCE') return 'conference-paper';
  return type.toLowerCase();
};

const TYPE_LABELS: Record<PublicationType, string> = {
  ARTICLE: 'Article',
  CONFERENCE: 'Conference Paper',
  BOOK: 'Book',
  JOURNAL: 'Journal',
};

export default function PublicationsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserAdmin = isAdmin();

  const fetchItems = async () => {
    try {
      const data = await api.publications.list();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch publications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const emptyItem: Partial<Publication> = {
    title: "",
    authors: "",
    publication_year: new Date().getFullYear(),
    type: "ARTICLE",
    approval_status: "PENDING" as ApprovalStatus,
  };

  const handleSave = async (item: Partial<Publication>) => {
    let publicationId = item.id;

    if (publicationId) {
      await api.publications.update(publicationId, item);
    } else {
      const saved = await api.publications.create(item);
      publicationId = saved.id;
    }

    // Link ISA subtype if type is selected
    if (publicationId && item.type) {
      const key = subtypeKey(item.type);
      const subtypeData = (item as any)[key];
      if (subtypeData) {
        await api.publications.linkSubtype(publicationId, subtypeEndpoint(item.type), subtypeData);
      }
    }

    await fetchItems();
  };

  const handleToggleStatus = async (item: Publication) => {
    const newStatus = item.approval_status === "APPROVED" ? "REJECTED" : "APPROVED";
    if (newStatus === "APPROVED") await api.admin.approveContent("publication", item.id);
    else await api.admin.rejectContent("publication", item.id);
    await fetchItems();
  };

  return (
    <ContentPageTemplate<Publication>
      title="Publications"
      subtitle={`${items.length} publication${items.length !== 1 ? "s" : ""} in the registry.`}
      icon={BookOpen}
      items={items}
      loading={loading}
      isAdmin={isUserAdmin}
      emptyItem={emptyItem}
      onSave={handleSave}
      onToggleStatus={isUserAdmin ? handleToggleStatus : undefined}
      searchFields={(item) => [item.title, item.authors ?? "", item.type ?? ""]}
      filterOptions={[
        { label: "All", value: "ALL" },
        { label: "Approved", value: "APPROVED" },
        { label: "Pending", value: "PENDING" },
      ]}
      renderListItem={(item, onClick) => (
        <article
          key={item.id}
          onClick={onClick}
          className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-900 text-white rounded-lg">
                <BookOpen size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {item.type ? TYPE_LABELS[item.type] : "Publication"}
              </span>
            </div>
            <Badge status={item.approval_status} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-zinc-900 leading-snug line-clamp-2 mb-1.5">{item.title}</h3>
            {item.authors && (
              <p className="text-sm text-zinc-500 font-medium line-clamp-1">{item.authors}</p>
            )}
          </div>
          <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              {item.publication_year ?? new Date(item.created_at).getFullYear()}
            </span>
            <ArrowRight size={14} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </article>
      )}
      renderDetail={(item) => {
        const type = item.type;
        const details = type ? (item as any)[subtypeKey(type)] : null;

        return (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
                </div>
                <Badge status={item.approval_status} />
              </div>
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                  <Bookmark size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Type</span>
                </div>
                <p className="text-sm font-bold text-black">{type ? TYPE_LABELS[type] : "—"}</p>
              </div>
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Year</span>
                </div>
                <p className="text-sm font-bold text-black">
                  {item.publication_year ?? new Date(item.created_at).getFullYear()}
                </p>
              </div>
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                  <Users size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Authors</span>
                </div>
                <p className="text-sm font-bold text-black line-clamp-2">{item.authors || "—"}</p>
              </div>
            </div>

            {/* Subtype identifier */}
            {details && (
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-1">
                {type === "ARTICLE" && details.doi && (
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">DOI</p>
                )}
                {type === "BOOK" && details.isbn && (
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">ISBN</p>
                )}
                {type === "JOURNAL" && details.issn && (
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">ISSN</p>
                )}
                {type === "CONFERENCE" && details.paper_id && (
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">Paper ID</p>
                )}
                <p className="text-sm font-bold text-black">
                  {type === "ARTICLE" ? details.doi :
                   type === "BOOK" ? details.isbn :
                   type === "JOURNAL" ? details.issn :
                   details.paper_id}
                </p>
              </div>
            )}

            {details?.description && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Info size={14} /> Abstract
                </h4>
                <p className="text-base text-zinc-600 font-medium leading-relaxed">{details.description}</p>
              </div>
            )}

            {details?.link && (
              <div className="pt-2">
                <a
                  href={details.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
                >
                  <Globe size={14} /> View publication
                </a>
              </div>
            )}
          </div>
        );
      }}
      renderEdit={(item, setItem) => {
        const type = item.type;
        const key = type ? subtypeKey(type) : null;
        const subtypeData = key ? (item as any)[key] ?? {} : {};

        const setSubtype = (patch: Record<string, string>) =>
          setItem({ ...item, [key!]: { ...subtypeData, ...patch } });

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Title" full>
                <FormInput
                  placeholder="Publication title..."
                  value={item.title ?? ""}
                  onChange={e => setItem({ ...item, title: e.target.value })}
                />
              </FormField>

              <FormField label="Authors" full>
                <FormInput
                  placeholder="Author names, comma-separated..."
                  value={item.authors ?? ""}
                  onChange={e => setItem({ ...item, authors: e.target.value })}
                />
              </FormField>

              <FormField label="Publication year">
                <FormInput
                  type="number"
                  placeholder={String(new Date().getFullYear())}
                  value={item.publication_year ?? ""}
                  onChange={e => setItem({ ...item, publication_year: Number(e.target.value) })}
                />
              </FormField>

              <FormField label="Type">
                <FormSelect
                  value={item.type ?? ""}
                  onChange={e => setItem({ ...item, type: e.target.value as PublicationType })}
                  options={[
                    { label: "Select type...", value: "" },
                    { label: "Article", value: "ARTICLE" },
                    { label: "Conference Paper", value: "CONFERENCE" },
                    { label: "Book", value: "BOOK" },
                    { label: "Journal", value: "JOURNAL" },
                  ]}
                />
              </FormField>

              <FormField label="Status" full={isUserAdmin}>
                <FormSelect
                  value={item.approval_status || "PENDING"}
                  onChange={e => setItem({ ...item, approval_status: e.target.value as ApprovalStatus })}
                  options={[
                    { label: "Pending", value: "PENDING" },
                    ...(isUserAdmin
                      ? [{ label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" }]
                      : []),
                  ]}
                />
              </FormField>
            </div>

            {/* Subtype fields — shown only once a type is selected */}
            {type && key && (
              <div className="pt-6 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                {type === "ARTICLE" && (
                  <FormField label="DOI" full>
                    <FormInput
                      placeholder="10.xxxx/xxxx"
                      value={subtypeData.doi ?? ""}
                      onChange={e => setSubtype({ doi: e.target.value })}
                    />
                  </FormField>
                )}
                {type === "BOOK" && (
                  <FormField label="ISBN" full>
                    <FormInput
                      placeholder="978-x-xxx-xxxxx-x"
                      value={subtypeData.isbn ?? ""}
                      onChange={e => setSubtype({ isbn: e.target.value })}
                    />
                  </FormField>
                )}
                {type === "JOURNAL" && (
                  <FormField label="ISSN" full>
                    <FormInput
                      placeholder="xxxx-xxxx"
                      value={subtypeData.issn ?? ""}
                      onChange={e => setSubtype({ issn: e.target.value })}
                    />
                  </FormField>
                )}
                {type === "CONFERENCE" && (
                  <FormField label="Paper ID" full>
                    <FormInput
                      placeholder="e.g. NeurIPS-2026-001"
                      value={subtypeData.paper_id ?? ""}
                      onChange={e => setSubtype({ paper_id: e.target.value })}
                    />
                  </FormField>
                )}

                <FormField label="Link" full>
                  <FormInput
                    placeholder="https://..."
                    value={subtypeData.link ?? ""}
                    onChange={e => setSubtype({ link: e.target.value })}
                  />
                </FormField>

                <FormField label="Abstract" full>
                  <FormTextArea
                    className="min-h-[160px]"
                    placeholder="Publication abstract..."
                    value={subtypeData.description ?? ""}
                    onChange={e => setSubtype({ description: e.target.value })}
                  />
                </FormField>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
