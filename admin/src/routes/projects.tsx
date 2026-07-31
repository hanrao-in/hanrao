import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Project } from "@/lib/adminDb";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Upload,
  ImageIcon,
  FileText,
  Building2,
  MapPin,
  Star,
  Eye,
  Layers,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/projects")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Projects · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Projects">
      <Projects />
    </AdminShell>
  ),
});

type ProjectForm = Omit<Project, "id" | "created_at">;

const EMPTY: ProjectForm = {
  slug: "",
  name: "",
  description: "",
  district: "",
  village: "",
  city: "",
  state: "Telangana",
  status: "active",
  featured: false,
  thumbnail_url: "",
  approval_types: [],
  amenities: [],
  gallery_urls: [],
  brochure_url: "",
  location_link: "",
  rera_number: "",
};

function Projects() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<null | "create" | Project>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [approvalsInput, setApprovalsInput] = useState("");
  const [amenitiesInput, setAmenitiesInput] = useState("");
  const [galleryInput, setGalleryInput] = useState("");

  // Sync galleryInput from uploaded/deleted photos array in form
  useEffect(() => {
    setGalleryInput((form.gallery_urls || []).join(", "));
  }, [form.gallery_urls]);

  const fetchItems = async () => {
    try {
      const data = await adminDb.projects.list();
      setItems(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((p) => p.status === "active").length;
    const upcoming = items.filter((p) => p.status === "upcoming").length;
    const soldOut = items.filter((p) => p.status === "sold_out").length;
    const featured = items.filter((p) => p.featured).length;
    return { total, active, upcoming, soldOut, featured };
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.city.toLowerCase().includes(search.toLowerCase()) ||
          p.district.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [items, search, statusFilter],
  );

  const openCreate = () => {
    setForm(EMPTY);
    setApprovalsInput("");
    setAmenitiesInput("");
    setGalleryInput("");
    setModal("create");
  };

  const openEdit = (p: Project) => {
    const approval_types = p.approval_types || [];
    const amenities = p.amenities || [];
    const gallery_urls = p.gallery_urls || [];

    setForm({
      slug: p.slug || "",
      name: p.name || "",
      description: p.description || "",
      district: p.district || "",
      village: p.village || "",
      city: p.city || "",
      state: p.state || "Telangana",
      status: p.status || "active",
      featured: !!p.featured,
      thumbnail_url: p.thumbnail_url || "",
      approval_types,
      amenities,
      gallery_urls,
      brochure_url: p.brochure_url || "",
      location_link: p.location_link || "",
      rera_number: p.rera_number || "",
    });
    setApprovalsInput(approval_types.join(", "));
    setAmenitiesInput(amenities.join(", "));
    setGalleryInput(gallery_urls.join(", "));
    setModal(p);
  };

  const closeModal = () => setModal(null);

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const finalForm = {
        ...form,
        approval_types: approvalsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        amenities: amenitiesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        gallery_urls: galleryInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (modal === "create") {
        const n = await adminDb.projects.create(finalForm);
        toast.success(`"${n.name}" created`);
      } else if (modal) {
        await adminDb.projects.update((modal as Project).id, finalForm);
        toast.success("Project updated");
      }
      await fetchItems();
      closeModal();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await adminDb.projects.delete(p.id);
      await fetchItems();
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "upcoming"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-gray-100 text-gray-600 border-gray-200";

  const statusLabel = (s: string) =>
    s === "active" ? "🟢 Active" : s === "upcoming" ? "🔵 Upcoming" : "⬜ Sold Out";

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Projects</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight">{stats.total}</span>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🟢 Active</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-emerald-600">{stats.active}</span>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🔵 Upcoming</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-blue-600">{stats.upcoming}</span>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Eye className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">⭐ Featured</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-amber-600">{stats.featured}</span>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600">
              <Star className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="sold_out">Sold Out</option>
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} projects</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {/* Cards Grid – max 3 per row */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No projects found.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border border-border bg-card shadow-soft overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openEdit(p)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[16/9] bg-secondary/30 overflow-hidden">
                {p.thumbnail_url ? (
                  <img
                    src={p.thumbnail_url}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}

                {/* Status badge */}
                <span className={`absolute top-3 left-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-sm bg-white/80 ${statusColor(p.status)}`}>
                  {statusLabel(p.status)}
                </span>

                {/* Featured star */}
                {p.featured && (
                  <span className="absolute top-3 right-3 rounded-full bg-amber-400 text-white p-1 shadow-sm">
                    <Star className="h-3 w-3" fill="currentColor" />
                  </span>
                )}

                {/* Action overlay */}
                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(p);
                    }}
                    className="rounded-lg bg-white/90 p-1.5 shadow hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5 text-foreground" />
                  </button>
                  <button
                    onClick={(e) => remove(e, p)}
                    className="rounded-lg bg-white/90 p-1.5 shadow hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-serif text-base font-semibold leading-tight truncate">{p.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {p.village ? `${p.village}, ` : ""}
                    {p.city}, {p.district}
                  </span>
                </div>
                {(p.approval_types || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(p.approval_types || []).map((a, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {p.rera_number && (
                  <p className="text-[11px] text-muted-foreground">
                    RERA: <span className="font-mono">{p.rera_number}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal (unchanged logic, refreshed design) ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold">
                {modal === "create" ? "Add Project" : "Edit Project"}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => {
                        const autoSlug = val
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "");
                        // If slug was empty or auto-generated, keep updating it
                        const shouldUpdateSlug =
                          !f.slug ||
                          f.slug ===
                            f.name
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "");
                        return {
                          ...f,
                          name: val,
                          slug: shouldUpdateSlug ? autoSlug : f.slug,
                        };
                      });
                    }}
                    placeholder="e.g. Sri City Township"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Slug (URL)
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setForm((f) => ({ ...f, slug: val }));
                    }}
                    placeholder="e.g. sri-city-township"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Village
                  </label>
                  <input
                    value={form.village || ""}
                    onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    City
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    District
                  </label>
                  <input
                    value={form.district}
                    onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    State
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    RERA Number
                  </label>
                  <input
                    value={form.rera_number || ""}
                    onChange={(e) => setForm((f) => ({ ...f, rera_number: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Cover Thumbnail Image */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Cover Thumbnail Image</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    Pick from Gallery or System
                  </span>
                </label>
                <div className="mt-1 flex items-center gap-3">
                  {form.thumbnail_url ? (
                    <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-border group bg-muted">
                      <img
                        src={form.thumbnail_url}
                        alt="Thumbnail preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, thumbnail_url: "" }))}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-24 shrink-0 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-secondary/30">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-secondary cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {form.thumbnail_url
                          ? "Change Photo from Gallery"
                          : "Upload from Gallery / Files"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 8 * 1024 * 1024) {
                            toast.error("Image must be under 8 MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            setForm((f) => ({ ...f, thumbnail_url: ev.target?.result as string }));
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={form.thumbnail_url}
                      onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Images (Multi-file select) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Gallery Photos
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:underline">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Upload Gallery Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        files.forEach((file) => {
                          if (file.size > 8 * 1024 * 1024) {
                            toast.error(`"${file.name}" is over 8 MB`);
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const res = ev.target?.result as string;
                            if (res) {
                              setForm((f) => ({
                                ...f,
                                gallery_urls: [...(f.gallery_urls || []), res],
                              }));
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {/* Gallery photo thumbnails */}
                {(form.gallery_urls || []).length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {(form.gallery_urls || []).map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-muted"
                      >
                        <img
                          src={url}
                          alt={`Gallery photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              gallery_urls: (f.gallery_urls || []).filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  value={galleryInput}
                  onChange={(e) => setGalleryInput(e.target.value)}
                  rows={2}
                  placeholder="Or paste comma-separated image URLs (https://...)"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Brochure URL & Direct File upload */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Brochure (PDF / Image)</span>
                  <label className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 15 * 1024 * 1024) {
                          toast.error("Brochure file must be under 15 MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) =>
                          setForm((f) => ({ ...f, brochure_url: ev.target?.result as string }));
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </label>
                <input
                  type="text"
                  value={form.brochure_url || ""}
                  onChange={(e) => setForm((f) => ({ ...f, brochure_url: e.target.value }))}
                  placeholder="Paste Brochure URL (https://...) or upload file above"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Google Map Location Link
                </label>
                <input
                  value={form.location_link || ""}
                  onChange={(e) => setForm((f) => ({ ...f, location_link: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Approvals (comma-separated)
                  </label>
                  <input
                    value={approvalsInput}
                    onChange={(e) => setApprovalsInput(e.target.value)}
                    placeholder="HMDA, RERA, DTCP"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amenities (comma-separated)
                  </label>
                  <input
                    value={amenitiesInput}
                    onChange={(e) => setAmenitiesInput(e.target.value)}
                    placeholder="Water Supply, Security, Park"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Featured project
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closeModal}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {modal === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
