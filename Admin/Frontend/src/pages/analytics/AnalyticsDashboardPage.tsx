import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Activity, 
  UserCheck, 
  Smartphone, 
  Eye, 
  AlertOctagon, 
  Users
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

const AnalyticsDashboardPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
      {/* Title */}
      <div>
        <h1 className="text-2xl font-heading font-medium text-foreground">
          Consent & Activity Analytics
        </h1>
        <p className="text-sm text-slate-500">
          Monitor real-time DPDP compliance indices and consent status metrics.
        </p>
      </div>

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
    </div>
  );
};

export default AnalyticsDashboardPage;
