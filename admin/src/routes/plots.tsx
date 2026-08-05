import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Plot, type Project } from "@/lib/adminDb";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Grid,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  IndianRupee,
  Layers,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/plots")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Plots · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Plot Management">
      <Plots />
    </AdminShell>
  ),
});

type PlotForm = Omit<Plot, "id" | "created_at">;
const EMPTY_FORM: PlotForm = {
  project_id: "",
  project_name: "",
  plot_number: "",
  area_sqyd: 200,
  price_per_sqyd: 18000,
  facing: "East",
  plot_type: "open",
  availability: "available",
  images: [],
};

function Plots() {
  const [items, setItems] = useState<Plot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [avFilter, setAvFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [modal, setModal] = useState<null | "create" | Plot>(null);
  const [form, setForm] = useState<PlotForm>(EMPTY_FORM);

  const fetchItems = async () => {
    try {
      const [plotData, projData] = await Promise.all([
        adminDb.plots.list(),
        adminDb.projects.list(),
      ]);
      setItems(plotData);
      setProjects(projData);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Stats computation
  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((p) => p.availability === "available").length;
    const reserved = items.filter((p) => p.availability === "reserved").length;
    const sold = items.filter((p) => p.availability === "sold").length;
    return { total, available, reserved, sold };
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const matchSearch =
          p.plot_number.toLowerCase().includes(search.toLowerCase()) ||
          (p.project_name || "").toLowerCase().includes(search.toLowerCase());
        const matchAv = avFilter === "all" || p.availability === avFilter;
        const matchProject = projectFilter === "all" || p.project_id === projectFilter;
        return matchSearch && matchAv && matchProject;
      }),
    [items, search, avFilter, projectFilter],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal("create");
  };
  const openEdit = (p: Plot) => {
    setForm({
      project_id: p.project_id,
      project_name: p.project_name || "",
      plot_number: p.plot_number,
      area_sqyd: p.area_sqyd,
      price_per_sqyd: p.price_per_sqyd,
      facing: p.facing,
      plot_type: p.plot_type,
      availability: p.availability,
      images: p.images || [],
    });
    setModal(p);
  };
  const closeModal = () => setModal(null);

  // Check if current project_name matches a real project
  const matchedProject = projects.find(
    (p) => p.name.toLowerCase() === form.project_name.trim().toLowerCase(),
  );

  const save = async () => {
    if (saving) return;
    if (!form.project_name.trim()) {
      toast.error("Project name required");
      return;
    }
    if (!form.plot_number.trim()) {
      toast.error("Plot number required");
      return;
    }
    // Ensure project_id is linked to a real project
    if (!matchedProject) {
      toast.error("Project not found. Please select an existing project from the list.");
      return;
    }
    // Always ensure project_id is the real UUID before saving
    const payload = { ...form, project_id: matchedProject.id, project_name: matchedProject.name };
    setSaving(true);
    try {
      if (modal === "create") {
        const created = await adminDb.plots.create(payload);
        setItems((prev) => [created, ...prev]);
        toast.success("Plot created");
      } else if (modal && typeof modal === "object") {
        const targetId = (modal as Plot).id;
        const updated = await adminDb.plots.update(targetId, payload);
        setItems((prev) => prev.map((x) => (x.id === targetId ? { ...x, ...payload, ...updated } : x)));
        toast.success("Plot updated");
      }
      closeModal();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: React.MouseEvent, p: Plot) => {
    e.stopPropagation();
    if (!confirm(`Delete plot ${p.plot_number}?`)) return;
    try {
      await adminDb.plots.delete(p.id);
      setItems((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const avColor = (a: string) =>
    a === "available"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : a === "reserved"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="space-y-6">
      {/* Stat Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Plots</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight">{stats.total}</span>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Grid className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🟢 Available</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-emerald-600">{stats.available}</span>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🟡 Reserved</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-amber-600">{stats.reserved}</span>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">⚫ Sold</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-gray-600">{stats.sold}</span>
            <div className="rounded-full bg-gray-200 p-2 text-gray-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plots…"
              className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary w-52"
            />
          </div>
          <select
            value={avFilter}
            onChange={(e) => setAvFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} of {stats.total} plots</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Plot
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="table-responsive-container rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5 text-left">Plot No.</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Project</th>
                <th className="px-4 py-3.5 text-left">Area (SqYd)</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Price/SqYd</th>
                <th className="px-4 py-3.5 text-left hidden lg:table-cell">Facing</th>
                <th className="px-4 py-3.5 text-left hidden lg:table-cell">Type</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No plots found.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => openEdit(p)}
                >
                  <td className="px-4 py-3.5 font-semibold text-foreground">{p.plot_number}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {p.project_name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium">{p.area_sqyd} SqYd</td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-foreground/80">
                    <span className="inline-flex items-center">
                      ₹{p.price_per_sqyd.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground">{p.facing}</td>
                  <td className="px-4 py-3.5 capitalize hidden lg:table-cell text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground/50" />
                      {p.plot_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${avColor(
                        p.availability,
                      )}`}
                    >
                      {p.availability}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded p-1.5 hover:bg-secondary transition-colors"
                        title="Edit plot"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => remove(e, p)}
                        className="rounded p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                        title="Delete plot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Plot Dialog Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-foreground">
                {modal === "create" ? "Add Plot" : "Edit Plot"}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Project
                </label>
                <div className="relative">
                  <input
                    list="projects-list"
                    value={form.project_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const proj = projects.find(
                        (p) => p.name.toLowerCase() === name.toLowerCase(),
                      );
                      setForm((f) => ({
                        ...f,
                        project_name: name,
                        project_id: proj ? proj.id : "",
                      }));
                    }}
                    placeholder="Type project name..."
                    className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm outline-none focus:border-primary ${
                      form.project_name.trim()
                        ? matchedProject
                          ? "border-emerald-400 focus:border-emerald-500"
                          : "border-red-300 focus:border-red-500"
                        : "border-border"
                    }`}
                  />
                  {form.project_name.trim() && (
                    <span
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 mt-0.5 text-xs font-semibold ${
                        matchedProject ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {matchedProject ? "✓" : "✗"}
                    </span>
                  )}
                </div>
                <datalist id="projects-list">
                  {projects.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                {form.project_name.trim() && !matchedProject && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    No matching project found. Create the project first in Projects page.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Plot Number
                </label>
                <input
                  value={form.plot_number}
                  onChange={(e) => setForm((f) => ({ ...f, plot_number: e.target.value }))}
                  placeholder="e.g. 42"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Area (Sq.Yd)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.area_sqyd === 0 ? "" : String(form.area_sqyd)}
                    placeholder="e.g. 200"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val))
                        setForm((f) => ({ ...f, area_sqyd: val === "" ? 0 : +val }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Price/SqYd (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.price_per_sqyd === 0 ? "" : String(form.price_per_sqyd)}
                    placeholder="e.g. 18000"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val))
                        setForm((f) => ({ ...f, price_per_sqyd: val === "" ? 0 : +val }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Facing
                  </label>
                  <select
                    value={form.facing}
                    onChange={(e) => setForm((f) => ({ ...f, facing: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {[
                      "East",
                      "West",
                      "North",
                      "South",
                      "North-East",
                      "North-West",
                      "South-East",
                      "South-West",
                    ].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Type
                  </label>
                  <select
                    value={form.plot_type}
                    onChange={(e) => setForm((f) => ({ ...f, plot_type: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="open">Open</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="farm">Farm</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Availability
                </label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value as any }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Plot Images <span className="normal-case font-normal text-muted-foreground">(up to 4)</span>
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const img = (form.images || [])[idx];
                    return img ? (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                      >
                        <img
                          src={img}
                          alt={`Plot image ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              images: (f.images || []).filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <label
                        key={idx}
                        htmlFor={`plot-img-${idx}`}
                        className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          (form.images || []).length >= 4
                            ? "border-border opacity-40 cursor-not-allowed"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        }`}
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
                          Photo {idx + 1}
                        </span>
                        <input
                          id={`plot-img-${idx}`}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={(form.images || []).length >= 4}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Image must be under 5 MB");
                              return;
                            }
                            const toastId = toast.loading(`Uploading photo ${idx + 1}...`);
                            try {
                              const ext = file.name.split(".").pop() || "webp";
                              const filePath = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
                              const { error: uploadErr } = await supabase.storage
                                .from("plots")
                                .upload(filePath, file, { contentType: file.type, upsert: true });

                              if (uploadErr) throw uploadErr;

                              const { data: { publicUrl } } = supabase.storage
                                .from("plots")
                                .getPublicUrl(filePath);

                              setForm((f) => ({
                                ...f,
                                images: [...(f.images || []), publicUrl],
                              }));
                              toast.success(`Photo ${idx + 1} uploaded successfully`, { id: toastId });
                            } catch (err: any) {
                              toast.error(`Upload failed: ${err.message || "Unknown error"}`, { id: toastId });
                            } finally {
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
                {(form.images || []).length > 0 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground font-medium">
                    {form.images!.length}/4 added · Hover a photo to remove it
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50 text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {modal === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
