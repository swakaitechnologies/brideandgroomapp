import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Loader2, ToggleLeft, ToggleRight, Crown } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  durationDays: number;
  price: Record<string, number>;
  features: string[];
  maxContacts: number;
  maxMessages: number;
  priority: number;
  isActive: boolean;
  badge: string | null;
  countryAvailability: string[];
  freeTrialDays: number;
}

const PlanManagementPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", slug: "", durationDays: 30,
    priceINR: 0, priceUSD: 0,
    features: "",
    maxContacts: -1, maxMessages: -1,
    priority: 0, badge: "",
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments/plans");
      setPlans(res.data.plans);
    } catch (err) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => {
    setForm({ name: "", slug: "", durationDays: 30, priceINR: 0, priceUSD: 0, features: "", maxContacts: -1, maxMessages: -1, priority: 0, badge: "" });
    setEditingPlan(null);
    setShowForm(false);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name, slug: plan.slug, durationDays: plan.durationDays,
      priceINR: plan.price.INR || 0, priceUSD: plan.price.USD || 0,
      features: plan.features.join("\n"),
      maxContacts: plan.maxContacts, maxMessages: plan.maxMessages,
      priority: plan.priority, badge: plan.badge || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name, slug: form.slug, durationDays: form.durationDays,
        price: { INR: form.priceINR, USD: form.priceUSD },
        features: form.features.split("\n").filter(Boolean),
        maxContacts: form.maxContacts, maxMessages: form.maxMessages,
        priority: form.priority, badge: form.badge || null,
        countryAvailability: ["ALL"],
        freeTrialDays: 0,
      };

      if (editingPlan) {
        await api.put(`/payments/plans/${editingPlan.id}`, payload);
        toast.success("Plan updated");
      } else {
        await api.post("/payments/plans", payload);
        toast.success("Plan created");
      }
      resetForm();
      fetchPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save plan");
    }
  };

  const handleToggle = async (plan: Plan) => {
    try {
      await api.put(`/payments/plans/${plan.id}`, { isActive: !plan.isActive });
      toast.success(`Plan ${plan.isActive ? "deactivated" : "activated"}`);
      fetchPlans();
    } catch {
      toast.error("Failed to update plan status");
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Deactivate "${plan.name}"?`)) return;
    try {
      await api.delete(`/payments/plans/${plan.id}`);
      toast.success("Plan deactivated");
      fetchPlans();
    } catch {
      toast.error("Failed to delete plan");
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
            SUBSCRIPTION MANAGEMENT
          </div>
          <h1 className="text-4xl font-medium font-heading text-foreground tracking-tight">
            Manage Plans
          </h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl text-xs font-medium tracking-widest transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> CREATE PLAN
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-border shadow-soft p-8 space-y-6"
        >
          <h3 className="text-lg font-medium tracking-tight">
            {editingPlan ? "Edit Plan" : "Create New Plan"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Plan Name</label>
              <input className="input-admin" placeholder="Enter Plan Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">URL Slug</label>
              <input className="input-admin" placeholder="e.g., gold-30" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Duration (Days)</label>
              <input className="input-admin" type="number" placeholder="e.g., 30" value={form.durationDays} onChange={e => setForm({...form, durationDays: +e.target.value})} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Price (INR)</label>
              <input className="input-admin" type="number" placeholder="e.g., 2499" value={form.priceINR} onChange={e => setForm({...form, priceINR: +e.target.value})} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Price (USD)</label>
              <input className="input-admin" type="number" placeholder="e.g., 29" value={form.priceUSD} onChange={e => setForm({...form, priceUSD: +e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Max Contacts</label>
              <input className="input-admin" type="number" placeholder="e.g., 15 (-1 = unlimited)" value={form.maxContacts} onChange={e => setForm({...form, maxContacts: +e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Max Messages</label>
              <input className="input-admin" type="number" placeholder="e.g., 100 (-1 = unlimited)" value={form.maxMessages} onChange={e => setForm({...form, maxMessages: +e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Priority (Display Order)</label>
              <input className="input-admin" type="number" placeholder="e.g., 10" value={form.priority} onChange={e => setForm({...form, priority: +e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Badge Label</label>
              <input className="input-admin" placeholder="e.g., Most Popular" value={form.badge} onChange={e => setForm({...form, badge: e.target.value})} />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-black/60">Features (one per line)</label>
              <textarea className="input-admin w-full h-32" placeholder="Describe plan features..." value={form.features} onChange={e => setForm({...form, features: e.target.value})} />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex gap-4">
              <button type="submit" className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-medium tracking-widest hover:bg-primary-hover">
                {editingPlan ? "UPDATE" : "CREATE"}
              </button>
              <button type="button" onClick={resetForm} className="px-8 py-3 bg-muted text-foreground rounded-2xl text-xs font-medium tracking-widest hover:bg-muted/80">
                CANCEL
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Plans Table */}
      <div className="bg-white rounded-[2.5rem] border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-6 text-[10px] font-medium tracking-widest text-black">PLAN</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">DURATION</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">PRICE (INR)</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">CONTACTS</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">STATUS</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Crown size={18} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{plan.name}</p>
                        <p className="text-[10px] text-black tracking-wider">{plan.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-sm font-medium">{plan.durationDays}d</td>
                  <td className="px-4 py-5 text-sm font-medium">₹{plan.price.INR?.toLocaleString() || "—"}</td>
                  <td className="px-4 py-5 text-sm font-medium">{plan.maxContacts === -1 ? "∞" : plan.maxContacts}</td>
                  <td className="px-4 py-5">
                    <button onClick={() => handleToggle(plan)} className="flex items-center gap-2">
                      {plan.isActive ? (
                        <ToggleRight size={24} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-slate-400" />
                      )}
                      <span className={`text-[10px] font-medium tracking-widest ${plan.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                        {plan.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(plan)} className="p-2 hover:bg-primary/10 rounded-xl transition-colors">
                        <Edit size={16} className="text-primary" />
                      </button>
                      <button onClick={() => handleDelete(plan)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanManagementPage;
