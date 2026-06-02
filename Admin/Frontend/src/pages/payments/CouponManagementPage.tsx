import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, Tag, Bookmark } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  isActive: boolean;
  isPromoBanner: boolean;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

const CouponManagementPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    expiresAt: "",
    maxUses: -1,
    isPromoBanner: false,
    isActive: true,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get("/coupons");
      setCoupons(res.data.coupons);
    } catch (err) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setForm({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      expiresAt: "",
      maxUses: -1,
      isPromoBanner: false,
      isActive: true,
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        discountType: form.discountType,
        discountValue: form.discountValue,
        expiresAt: form.expiresAt || null,
        maxUses: form.maxUses,
        isPromoBanner: form.isPromoBanner,
        isActive: form.isActive,
      };

      await api.post("/coupons", payload);
      toast.success("Coupon created successfully");
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await api.patch(`/coupons/${coupon.id}/toggle`, {});
      toast.success(`Coupon ${coupon.isActive ? "deactivated" : "activated"}`);
      fetchCoupons();
    } catch {
      toast.error("Failed to toggle coupon status");
    }
  };

  const handleSetPromoBanner = async (coupon: Coupon) => {
    try {
      await api.patch(`/coupons/${coupon.id}/promo-banner`, {});
      toast.success(`Coupon marked as active promo banner`);
      fetchCoupons();
    } catch {
      toast.error("Failed to set promo banner");
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This action is permanent.`)) return;
    try {
      await api.delete(`/coupons/${coupon.id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString();
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
            PAYMENTS & DISCOUNTS
          </div>
          <h1 className="text-4xl font-medium font-heading text-foreground tracking-tight">
            Manage Coupons
          </h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl text-xs font-medium tracking-widest transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> CREATE COUPON
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-border shadow-soft p-8 space-y-6"
        >
          <h3 className="text-lg font-medium tracking-tight">Create New Coupon</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Coupon Code</label>
              <input className="input-admin" placeholder="e.g., FIRST50" value={form.code} onChange={e => setForm({...form, code: (e.target as HTMLInputElement).value})} required />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Description (Promo Banner Text)</label>
              <input className="input-admin" placeholder="e.g., FLAT 50% OFF" value={form.description} onChange={e => setForm({...form, description: (e.target as HTMLInputElement).value})} required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Discount Type</label>
              <select className="input-admin" value={form.discountType} onChange={e => setForm({...form, discountType: (e.target as HTMLSelectElement).value})}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Flat)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Discount Value</label>
              <input className="input-admin" type="number" placeholder="e.g., 50 or 500" value={form.discountValue || ""} onChange={e => setForm({...form, discountValue: +(e.target as HTMLInputElement).value})} required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Expires At (Optional)</label>
              <input className="input-admin" type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: (e.target as HTMLInputElement).value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Max Total Uses</label>
              <input className="input-admin" type="number" placeholder="e.g., 100 (-1 = unlimited)" value={form.maxUses} onChange={e => setForm({...form, maxUses: +(e.target as HTMLInputElement).value})} />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({...form, isActive: (e.target as HTMLInputElement).checked})} className="rounded text-primary focus:ring-primary h-4 w-4" />
              <label htmlFor="isActive" className="text-xs font-semibold uppercase tracking-wider text-black/60">Is Active</label>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="isPromoBanner" checked={form.isPromoBanner} onChange={e => setForm({...form, isPromoBanner: (e.target as HTMLInputElement).checked})} className="rounded text-primary focus:ring-primary h-4 w-4" />
              <label htmlFor="isPromoBanner" className="text-xs font-semibold uppercase tracking-wider text-black/60">Show in Side Drawer Banner</label>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex gap-4 mt-4">
              <button type="submit" className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-medium tracking-widest hover:bg-primary-hover">
                CREATE COUPON
              </button>
              <button type="button" onClick={resetForm} className="px-8 py-3 bg-muted text-foreground rounded-2xl text-xs font-medium tracking-widest hover:bg-muted/80">
                CANCEL
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-[2.5rem] border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-6 text-[10px] font-medium tracking-widest text-black">COUPON</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">DISCOUNT</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">REDEMPTIONS</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">EXPIRY</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">ACTIVE</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">PROMO BANNER</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Tag size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{coupon.code}</p>
                        <p className="text-[10px] text-black/60 tracking-wider">{coupon.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-sm font-medium">
                    {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </td>
                  <td className="px-4 py-5 text-sm font-medium">
                    {coupon.usedCount} / {coupon.maxUses === -1 ? "∞" : coupon.maxUses}
                  </td>
                  <td className="px-4 py-5 text-sm font-medium">{formatDate(coupon.expiresAt)}</td>
                  
                  <td className="px-4 py-5">
                    <button onClick={() => handleToggleActive(coupon)} className="flex items-center gap-2">
                      {coupon.isActive ? (
                        <ToggleRight size={24} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-slate-400" />
                      )}
                      <span className={`text-[10px] font-medium tracking-widest ${coupon.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                        {coupon.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </button>
                  </td>

                  <td className="px-4 py-5">
                    <button 
                      onClick={() => handleSetPromoBanner(coupon)} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                        coupon.isPromoBanner 
                          ? "bg-amber-50 border-amber-200 text-amber-600 font-bold" 
                          : "border-border text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <Bookmark size={14} className={coupon.isPromoBanner ? "fill-amber-500 text-amber-500" : ""} />
                      <span className="text-[9px] tracking-wider font-semibold">
                        {coupon.isPromoBanner ? "ACTIVE BANNER" : "SET PROMO"}
                      </span>
                    </button>
                  </td>

                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(coupon)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center text-sm text-black/40">
                    No coupon codes created yet. Click "Create Coupon" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CouponManagementPage;
