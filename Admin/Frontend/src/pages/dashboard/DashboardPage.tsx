import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserPlus,
  Eye,
  Activity,
  Loader2,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fetchDashboardStats } from "../../store/slices/dashboardSlice";
import { RootState, AppDispatch } from "../../store";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft hover:shadow-elevated transition-all duration-500 group"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-medium font-heading  tracking-widest text-black">
          {title}
        </p>
        <h3 className="text-4xl font-medium font-heading mt-2 text-foreground tracking-tight">
          {value}
        </h3>
      </div>
      <div
        className={`p-4 rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 ${color}`}
      >
        <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
      </div>
    </div>
    <div className="mt-8 flex items-center gap-3 text-[10px] font-medium  tracking-widest">
      <span className="text-success bg-success/10 px-3 py-1 rounded-full border border-success/20">
        +{change}%
      </span>
      <span className="text-black italic">Overview</span>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, loading, error } = useSelector(
    (state: RootState) => state.dashboard,
  );

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const statItems = [
    {
      title: "Total Users",
      value: stats?.totalUsers?.value?.toLocaleString() || "0",
      change: stats?.totalUsers?.change || 0,
      icon: Users,
      color: "bg-primary shadow-primary/20",
    },
    {
      title: "New Registrations",
      value: stats?.newRegistrations?.value?.toLocaleString() || "0",
      change: stats?.newRegistrations?.change || 0,
      icon: UserPlus,
      color: "bg-primary-hover shadow-primary/20",
    },
    {
      title: "Active Now",
      value: stats?.activeNow?.value?.toLocaleString() || "0",
      change: stats?.activeNow?.change || 0,
      icon: Activity,
      color: "bg-success shadow-success/20",
    },
    {
      title: "Profile Views",
      value:
        stats?.profileViews?.value !== undefined &&
          stats.profileViews.value >= 1000
          ? `${(stats.profileViews.value / 1000).toFixed(1)}k`
          : stats?.profileViews?.value?.toString() || "0",
      change: stats?.profileViews?.change || 0,
      icon: Eye,
      color: "bg-secondary shadow-secondary/20",
    },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium  tracking-[0.2em] text-[10px] mb-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Live Monitoring Active
          </div>
          <h1 className="text-4xl md:text-5xl font-medium font-heading text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-black text-base md:text-lg mt-2 font-medium">
            Manage your platform and monitor user activity.
          </p>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={() => dispatch(fetchDashboardStats())}
            disabled={loading}
            className="group flex flex-row items-center gap-3 px-5 py-2.5 bg-white border border-border rounded-2xl shadow-soft hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium  tracking-widest text-black group-hover:text-primary transition-colors">
                Sync Stats
              </span>
              <span className="text-[11px] font-medium text-foreground">
                REFRESH
              </span>
            </div>
            <RefreshCw
              size={18}
              className={cn(
                "text-primary",
                loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
              )}
            />
          </button>

          <div className="hidden sm:block text-right bg-white px-5 py-2.5 border border-border rounded-2xl shadow-soft">
            <p className="text-[10px] font-medium  tracking-widest text-black mb-0.5">
              Local Time
            </p>
            <p className="text-xs font-medium text-foreground">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border-2 border-red-500/20 text-red-600 rounded-4xl text-sm font-medium flex items-center gap-4">
          <ShieldAlert size={24} />
          <div>
            <p className=" tracking-widest text-[10px] font-medium mb-1">
              Database Connection Error
            </p>
            {error} (Check Database and Server status)
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statItems.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] border-2 border-border shadow-soft p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-medium font-heading tracking-tight">
                  Moderation Requests
                </h3>
                <p className="text-xs font-medium text-black  tracking-widest">
                  Review pending items
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/verification"
              className="text-[10px] font-medium  tracking-widest text-primary hover:text-primary-hover border-b-2 border-primary/20 pb-1"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/dashboard/verification"
              className="flex flex-col justify-between p-8 bg-muted/20 rounded-[2.5rem] border border-border/50 hover:border-primary/50 transition-all hover:bg-white hover:shadow-elevated group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black group-hover:bg-primary/10 group-hover:text-primary transition-all mb-8">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-3xl font-medium text-foreground mb-1">
                  {stats?.moderation?.pendingProfiles || 0}
                </h4>
                <p className="text-[9px] font-medium  tracking-widest text-black">
                  Profiles Pending
                </p>
              </div>
            </Link>

            <Link
              to="/dashboard/verification"
              className="flex flex-col justify-between p-8 bg-muted/20 rounded-[2.5rem] border border-border/50 hover:border-primary/50 transition-all hover:bg-white hover:shadow-elevated group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black group-hover:bg-primary/10 group-hover:text-primary transition-all mb-8">
                <Eye size={20} />
              </div>
              <div>
                <h4 className="text-3xl font-medium text-foreground mb-1">
                  {stats?.moderation?.pendingPhotos || 0}
                </h4>
                <p className="text-[9px] font-medium  tracking-widest text-black">
                  Pending Photos
                </p>
              </div>
            </Link>

            <Link
              to="/dashboard/reports"
              className="flex flex-col justify-between p-8 bg-muted/20 rounded-[2.5rem] border border-border/50 hover:border-red-500/50 transition-all hover:bg-white hover:shadow-elevated group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black group-hover:bg-red-500/10 group-hover:text-red-500 transition-all mb-8">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="text-3xl font-medium text-foreground mb-1">
                  {stats?.moderation?.pendingReports || 0}
                </h4>
                <p className="text-[9px] font-medium  tracking-widest text-red-500/60">
                  Unresolved Issues
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-primary rounded-[3.5rem] p-10 flex flex-col justify-between shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
          <div className="relative z-10">
            <h3 className="text-lg font-medium font-heading text-white tracking-widest  mb-10">
              System Status
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <span className="text-[10px] font-medium  tracking-widest text-accent/50">
                  App Server
                </span>
                <span className="text-xs font-medium text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <span className="text-[10px] font-medium  tracking-widest text-accent/50">
                  Data Server
                </span>
                <span className="text-xs font-medium text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-[10px] font-medium  tracking-widest text-accent/50">
                  SLA Performance
                </span>
                <span className="text-xs font-medium text-secondary">
                  99.98%
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-10">
            <p className="text-[10px] font-medium text-accent/30  tracking-[0.3em] text-center mb-4">
              Security Policy: Active
            </p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full bg-secondary shadow-lg shadow-black/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;





