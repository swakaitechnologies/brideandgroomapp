import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCcw, ArrowDownRight, DollarSign, TrendingUp, Users } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
  plan: { name: string; slug: string } | null;
}

interface Revenue {
  total: number;
  period: number;
  activeSubscriptions: number;
  statusCounts: Array<{ status: string; count: string }>;
  byPlan: Array<{ planId: string; total: string; count: string; "plan.name": string }>;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", gateway: "" });

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter.status) params.set("status", filter.status);
      if (filter.gateway) params.set("gateway", filter.gateway);

      const [txRes, revRes] = await Promise.all([
        api.get(`/payments/transactions?${params}`),
        api.get("/payments/revenue?period=30"),
      ]);

      setTransactions(txRes.data.transactions);
      setPagination(txRes.data.pagination);
      setRevenue(revRes.data.revenue);
    } catch {
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleRefund = async (paymentId: string) => {
    if (!confirm("Issue a full refund for this payment?")) return;
    try {
      await api.post(`/payments/refund/${paymentId}`);
      toast.success("Refund processed");
      fetchData(pagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Refund failed");
    }
  };

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    created: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    refunded: "bg-slate-100 text-slate-600 border-slate-200",
  };

  if (loading && !transactions.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-medium tracking-[0.2em] text-[10px] mb-3">
          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          PAYMENT ANALYTICS
        </div>
        <h1 className="text-4xl font-medium font-heading text-foreground tracking-tight">
          Revenue & Transactions
        </h1>
      </div>

      {/* Revenue Stats */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-medium tracking-widest text-black">TOTAL REVENUE (30D)</p>
                <h3 className="text-3xl font-medium mt-2 tracking-tight">₹{(revenue.total || 0).toLocaleString()}</h3>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-medium tracking-widest text-black">ACTIVE SUBSCRIPTIONS</p>
                <h3 className="text-3xl font-medium mt-2 tracking-tight">{revenue.activeSubscriptions}</h3>
              </div>
              <div className="p-4 rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-medium tracking-widest text-black">PAID TRANSACTIONS</p>
                <h3 className="text-3xl font-medium mt-2 tracking-tight">
                  {revenue.statusCounts?.find(s => s.status === "paid")?.count || 0}
                </h3>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-medium tracking-widest text-black">FAILED PAYMENTS</p>
                <h3 className="text-3xl font-medium mt-2 tracking-tight text-red-500">
                  {revenue.statusCounts?.find(s => s.status === "failed")?.count || 0}
                </h3>
              </div>
              <div className="p-4 rounded-2xl bg-red-500 shadow-lg shadow-red-500/20">
                <ArrowDownRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select className="input-admin" value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select className="input-admin" value={filter.gateway} onChange={e => setFilter({...filter, gateway: e.target.value})}>
          <option value="">All Gateways</option>
          <option value="razorpay">Razorpay</option>
          <option value="stripe">Stripe</option>
        </select>
        <button onClick={() => fetchData()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-2xl text-xs font-medium tracking-widest hover:bg-muted transition-all">
          <RefreshCcw size={14} /> REFRESH
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-6 text-[10px] font-medium tracking-widest text-black">USER</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">PLAN</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">AMOUNT</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">GATEWAY</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">STATUS</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">DATE</th>
                <th className="px-4 py-6 text-[10px] font-medium tracking-widest text-black">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-8 py-4">
                    <p className="text-sm font-medium">{tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : "—"}</p>
                    <p className="text-[10px] text-black tracking-wider">{tx.user?.email || "—"}</p>
                  </td>
                  <td className="px-4 py-4 text-sm">{tx.plan?.name || "—"}</td>
                  <td className="px-4 py-4 text-sm font-medium">
                    {tx.currency === "INR" ? "₹" : "$"}{Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-xs font-medium tracking-wider uppercase">{tx.gateway}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 text-[10px] font-medium rounded-lg border ${statusColors[tx.status] || ""}`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    {tx.status === "paid" && (
                      <button onClick={() => handleRefund(tx.id)} className="text-[10px] font-medium tracking-widest text-red-500 hover:text-red-600 border-b border-red-500/20 pb-0.5">
                        REFUND
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-border">
            <p className="text-xs text-black">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <button onClick={() => fetchData(pagination.page - 1)} className="px-4 py-2 bg-muted rounded-xl text-xs font-medium hover:bg-muted/80">
                  Previous
                </button>
              )}
              {pagination.page < pagination.totalPages && (
                <button onClick={() => fetchData(pagination.page + 1)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-medium hover:bg-primary-hover">
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
