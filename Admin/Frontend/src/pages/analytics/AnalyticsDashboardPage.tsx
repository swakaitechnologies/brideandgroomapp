import { useEffect, useState, FormEvent } from "react";
import { 
  ShieldCheck, 
  Activity, 
  UserCheck, 
  Smartphone, 
  Eye, 
  AlertOctagon, 
  Users,
  Search,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Ban
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";

interface ConsentArea {
  optIn: number;
  optOut: number;
  percentage: number;
}

interface AnalyticsData {
  consentStats: {
    totalUsers: number;
    matchmaking: ConsentArea;
    photoProcessing: ConsentArea;
    analytics: ConsentArea;
  };
  eventStats: {
    activeSessions: number;
    nomineeSetups: number;
    mobileVerifications: number;
    totalViewsCount: number;
    pendingReports: number;
  };
}

interface UserComplianceRecord {
  id: string;
  customId: string;
  name: string;
  isMobileVerified: boolean;
  hasNominee: boolean;
  nomineeName: string | null;
  consentMatchmaking: boolean;
  consentPhotoProcessing: boolean;
  consentAnalytics: boolean;
  activeSessions: number;
}

const AnalyticsDashboardPage = () => {
  // Global Data
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "users">("overview");

  // User compliance list states
  const [usersList, setUsersList] = useState<UserComplianceRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/dashboard/analytics/summary");
      if (response.data && response.data.success) {
        setData(response.data.data);
      }
    } catch {
      toast.error("Failed to fetch analytics statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCompliance = async (currentPage: number, searchVal: string) => {
    try {
      setUsersLoading(true);
      const response = await api.get("/dashboard/analytics/users", {
        params: {
          search: searchVal,
          page: currentPage,
          limit: 10
        }
      });
      if (response.data && response.data.success) {
        setUsersList(response.data.data || []);
        setTotalPages(response.data.pagination.pages || 1);
      }
    } catch {
      toast.error("Failed to fetch user compliance registry");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeSubTab === "users") {
      fetchUserCompliance(page, appliedSearch);
    }
  }, [activeSubTab, page, appliedSearch]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-pulse">
        <div className="text-center space-y-4">
          <Activity className="mx-auto animate-spin text-slate-500" size={32} />
          <p className="text-slate-500 text-sm font-medium">Compiling compliance statistics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-500">
        No analytics data available.
      </div>
    );
  }

  const { consentStats, eventStats } = data;
  const averageCompliance = Math.round(
    (consentStats.matchmaking.percentage + 
     consentStats.photoProcessing.percentage + 
     consentStats.analytics.percentage) / 3
  );

  return (
    <div className="space-y-8">
      {/* Title & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-heading font-medium text-foreground">
            Consent & Activity Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Monitor real-time DPDP compliance indices and consent status metrics.
          </p>
        </div>

        {/* Tab Switcher Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === "overview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("users")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === "users"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            User Registry
          </button>
        </div>
      </div>

      {activeSubTab === "overview" ? (
        <>
          {/* Overview Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-border/80 shadow-soft">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Consent Index</span>
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-heading font-semibold text-slate-900">{averageCompliance}%</h3>
                <p className="text-xs text-slate-400 mt-1">Average user opt-in rate</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-border/80 shadow-soft">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Sessions</span>
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Activity size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-heading font-semibold text-slate-900">{eventStats.activeSessions}</h3>
                <p className="text-xs text-slate-400 mt-1">Concurrent active logins</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-border/80 shadow-soft">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">OTP Verified</span>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Smartphone size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-heading font-semibold text-slate-900">{eventStats.mobileVerifications}</h3>
                <p className="text-xs text-slate-400 mt-1">Verified mobile profiles</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-border/80 shadow-soft">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Nominees Set</span>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                  <UserCheck size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-heading font-semibold text-slate-900">{eventStats.nomineeSetups}</h3>
                <p className="text-xs text-slate-400 mt-1">Right to nominate setups</p>
              </div>
            </div>
          </div>

          {/* Main Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Consent Indices Details */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-border/80 p-6 md:p-8 shadow-soft space-y-8">
              <div>
                <h2 className="text-lg font-heading font-medium text-slate-900">DPDP Granular Consent Rates</h2>
                <p className="text-sm text-slate-400 mt-1">Percentage of users who have granted explicit permissions.</p>
              </div>

              <div className="space-y-6">
                {/* Matchmaking */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">Profile Matchmaking & Recommendations</span>
                    <span className="font-semibold text-emerald-600">{consentStats.matchmaking.percentage}% Consent</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${consentStats.matchmaking.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{consentStats.matchmaking.optIn} Opted In</span>
                    <span>{consentStats.matchmaking.optOut} Opted Out</span>
                  </div>
                </div>

                {/* Photo Processing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">Photo Analysis & Identification</span>
                    <span className="font-semibold text-emerald-600">{consentStats.photoProcessing.percentage}% Consent</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${consentStats.photoProcessing.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{consentStats.photoProcessing.optIn} Opted In</span>
                    <span>{consentStats.photoProcessing.optOut} Opted Out</span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">Usage Analytics & Behavior Telemetry</span>
                    <span className="font-semibold text-emerald-600">{consentStats.analytics.percentage}% Consent</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${consentStats.analytics.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{consentStats.analytics.optIn} Opted In</span>
                    <span>{consentStats.analytics.optOut} Opted Out</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Activity Summary */}
            <div className="bg-white rounded-3xl border border-border/80 p-6 shadow-soft space-y-6">
              <div>
                <h2 className="text-lg font-heading font-medium text-slate-900">System Activity</h2>
                <p className="text-sm text-slate-400 mt-1">Aggregated platform engagement totals.</p>
              </div>

              <div className="divide-y divide-border/60">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                      <Eye size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Total Profile Views</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{eventStats.totalViewsCount}</span>
                </div>

                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                      <AlertOctagon size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Pending User Reports</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{eventStats.pendingReports}</span>
                </div>

                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                      <Users size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Total Accounts</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{consentStats.totalUsers}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* User-Wise DPDP compliance Registry Directory */
        <div className="bg-white rounded-3xl border border-border/80 p-6 md:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-heading font-medium text-slate-900">User DPDP Registry</h2>
              <p className="text-sm text-slate-400 mt-1">Audit individual consent grants, nominee records, and active device counts.</p>
            </div>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search user name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 py-2 w-full text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition"
              >
                Search
              </button>
            </form>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-3">
                <Activity className="mx-auto animate-spin text-slate-400" size={28} />
                <p className="text-slate-400 text-sm">Retrieving registry records...</p>
              </div>
            </div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl">
              <Ban className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-slate-500 text-sm font-medium">No matching compliance records found.</p>
              {appliedSearch && (
                <button
                  onClick={handleClearSearch}
                  className="mt-3 text-xs text-indigo-600 hover:underline"
                >
                  Clear search term
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Compliance Table */}
              <div className="overflow-x-auto border border-border/80 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-border text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-5">Profile ID</th>
                      <th className="py-4 px-5">Name</th>
                      <th className="py-4 px-5 text-center">Matchmaking</th>
                      <th className="py-4 px-5 text-center">Photo Scan</th>
                      <th className="py-4 px-5 text-center">Analytics</th>
                      <th className="py-4 px-5 text-center">Mobile Verified</th>
                      <th className="py-4 px-5">Nominee</th>
                      <th className="py-4 px-5 text-center">Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-slate-700 text-sm">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-slate-900">{user.customId}</td>
                        <td className="py-3.5 px-5 font-medium">{user.name}</td>
                        
                        {/* Matchmaking Consent */}
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.consentMatchmaking
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {user.consentMatchmaking ? "Opt-In" : "Opt-Out"}
                          </span>
                        </td>

                        {/* Photo Consent */}
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.consentPhotoProcessing
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {user.consentPhotoProcessing ? "Opt-In" : "Opt-Out"}
                          </span>
                        </td>

                        {/* Analytics Consent */}
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.consentAnalytics
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {user.consentAnalytics ? "Opt-In" : "Opt-Out"}
                          </span>
                        </td>

                        {/* Mobile Verification */}
                        <td className="py-3.5 px-5 text-center">
                          <div className="inline-flex justify-center">
                            {user.isMobileVerified ? (
                              <span className="p-1 bg-emerald-50 text-emerald-600 rounded-full">
                                <Check size={14} className="stroke-[3]" />
                              </span>
                            ) : (
                              <span className="p-1 bg-rose-50 text-rose-600 rounded-full">
                                <X size={14} className="stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Nominee Status */}
                        <td className="py-3.5 px-5 font-medium">
                          {user.hasNominee ? (
                            <span className="text-slate-800" title={`Nominee: ${user.nomineeName}`}>
                              {user.nomineeName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Not Set
                            </span>
                          )}
                        </td>

                        {/* Active Sessions */}
                        <td className="py-3.5 px-5 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                            {user.activeSessions}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboardPage;
