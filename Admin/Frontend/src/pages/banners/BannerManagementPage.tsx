import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, Image as ImageIcon, Link2, Edit3, X } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

interface Banner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const BannerManagementPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    link: "",
    order: 0,
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/banners");
      setBanners(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      subtitle: "",
      link: "",
      order: 0,
      isActive: true,
    });
    setSelectedFile(null);
    setImagePreview(null);
    setShowForm(false);
    setEditingBanner(null);
  };

  const handleEditClick = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      link: banner.link || "",
      order: banner.order,
      isActive: banner.isActive,
    });
    setImagePreview(banner.imageUrl);
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile && !editingBanner) {
      toast.error("Please select a banner image file");
      return;
    }

    try {
      const formDataToSend = new FormData();
      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      }
      formDataToSend.append("title", form.title.trim());
      formDataToSend.append("subtitle", form.subtitle.trim());
      formDataToSend.append("link", form.link.trim());
      formDataToSend.append("order", form.order.toString());
      formDataToSend.append("isActive", form.isActive.toString());

      if (editingBanner) {
        await api.put(`/banners/${editingBanner.id}`, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Banner updated successfully");
      } else {
        await api.post("/banners", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Banner created successfully");
      }

      resetForm();
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save banner");
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.patch(`/banners/${banner.id}/toggle`, {});
      toast.success(`Banner status updated`);
      fetchBanners();
    } catch {
      toast.error("Failed to toggle banner status");
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm(`Are you sure you want to delete this banner? This action cannot be undone.`)) return;
    try {
      await api.delete(`/banners/${banner.id}`);
      toast.success("Banner deleted successfully");
      fetchBanners();
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium tracking-[0.2em] text-[10px] mb-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            PROMOTIONS & CAROUSELS
          </div>
          <h1 className="text-4xl font-medium font-heading text-foreground tracking-tight">
            Manage Banners
          </h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl text-xs font-medium tracking-widest transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> ADD NEW BANNER
        </button>
      </div>

      {/* Form Area (Add / Edit) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-[2.5rem] border border-border shadow-soft p-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium tracking-tight">
                {editingBanner ? "Edit Banner Details" : "Create New Banner"}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-muted rounded-full">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Picker & Preview */}
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Banner Image</label>
                <div className="relative group aspect-[16/9] w-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden bg-slate-50 hover:bg-slate-100/50 transition-all">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <label className="px-4 py-2 bg-white text-black text-xs font-medium rounded-xl cursor-pointer shadow-md hover:bg-slate-50 transition-all">
                          Change Image
                          <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer p-6 text-center">
                      <ImageIcon size={32} className="text-slate-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-slate-500 font-medium">Click to upload image file</span>
                      <span className="text-[9px] text-slate-400">WebP, PNG, JPG (16:9 ratio recommended)</span>
                      <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" required={!editingBanner} />
                    </label>
                  )}
                </div>
              </div>

              {/* Text Fields */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Banner Title (Optional)</label>
                  <input className="input-admin" placeholder="e.g., Divine Union Special" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Banner Subtitle (Optional)</label>
                  <input className="input-admin" placeholder="e.g., Discover your perfect match today" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Action URL / Link (Optional)</label>
                  <input className="input-admin" placeholder="e.g., https://... or internal route name" value={form.link} onChange={e => setForm({...form, link: e.target.value})} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Display Order</label>
                  <input className="input-admin" type="number" min="0" placeholder="0" value={form.order} onChange={e => setForm({...form, order: +e.target.value})} />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="formIsActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <label htmlFor="formIsActive" className="text-xs font-semibold uppercase tracking-wider text-black/60">Is Active (Visible to App Users)</label>
                </div>

                <div className="md:col-span-2 flex gap-4 mt-6">
                  <button type="submit" className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-medium tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20">
                    {editingBanner ? "SAVE CHANGES" : "CREATE BANNER"}
                  </button>
                  <button type="button" onClick={resetForm} className="px-8 py-3 bg-muted text-foreground rounded-2xl text-xs font-medium tracking-widest hover:bg-muted/80">
                    CANCEL
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <motion.div
            layout
            key={banner.id}
            className="bg-white rounded-[2rem] border border-border shadow-soft overflow-hidden flex flex-col group hover:border-primary/30 transition-all duration-300"
          >
            {/* Banner Preview (16:9 aspect) */}
            <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
              <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {/* Optional overlay mock */}
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                  <h4 className="text-base font-bold leading-tight">{banner.title}</h4>
                  <p className="text-xs text-white/80 mt-1 leading-normal">{banner.subtitle}</p>
                </div>
              )}
              {/* Floating badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-primary rounded-full shadow-sm border border-border">
                  ORDER: {banner.order}
                </span>
              </div>
            </div>

            {/* Info and action panel */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                {banner.link ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Link2 size={14} className="text-slate-400" />
                    <span className="truncate" title={banner.link}>{banner.link}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 tracking-wider">NO ACTION LINK SET</span>
                )}
              </div>

              {/* Footer row: status and edit/delete */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <button onClick={() => handleToggleActive(banner)} className="flex items-center gap-1.5">
                  {banner.isActive ? (
                    <ToggleRight size={22} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={22} className="text-slate-400" />
                  )}
                  <span className={`text-[9px] font-bold tracking-wider ${banner.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                    {banner.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditClick(banner)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-border/40 text-slate-600 hover:text-slate-900" title="Edit Banner">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(banner)} className="p-2 hover:bg-red-50 rounded-xl transition-colors border border-border/40 text-red-400 hover:text-red-600" title="Delete Banner">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full bg-white rounded-[2.5rem] border border-border shadow-soft p-12 text-center text-slate-400">
            <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
            <h4 className="font-heading font-medium text-lg text-foreground mb-1">No banners configured</h4>
            <p className="text-sm max-w-sm mx-auto mb-6">Create promotional or news banners to show in the mobile application carousel.</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold tracking-widest rounded-xl transition-all"
            >
              CREATE FIRST BANNER
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManagementPage;
