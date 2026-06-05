import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, ShieldAlert, Image as ImageIcon, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import api from "../../lib/api";

interface Report {
  id: string;
  reason: string;
  description: string;
  reportedType: "user" | "message" | "photo";
  status: string;
  actionTaken: string;
  reportImage: string;
  proofUrls?: string[];
  createdAt: string;
  reporter: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reportedUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDetails, setReportDetails] = useState<{
    [key: string]: { actionDescription: string; violationReason: string }
  }>({});

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/moderation/reports");
      setReports(res.data.data);
    } catch {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (id: string, actionType: string) => {
    const status = actionType === "dismiss" ? "dismissed" : "resolved";
    const details = reportDetails[id] || { actionDescription: "", violationReason: "" };

    // Default values if empty
    const finalActionTaken = details.actionDescription || (actionType === "dismiss" ? "Report dismissed" : actionType);
    const finalViolationReason = details.violationReason || (actionType === "dismiss" ? "No policy violation found" : "Community guidelines violation");

    try {
      await api.post(`/moderation/reports/${id}/resolve`, {
        status,
        actionTaken: finalActionTaken,
        violationReason: finalViolationReason
      });
      toast.success("Report handled");
      setReportDetails(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchReports();
    } catch {
      toast.error("Operation failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-medium">User Reports</h1>
          <p className="text-sm text-black">
            Manage and resolve user-submitted complaints
          </p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-medium ">
          <ShieldAlert size={16} />
          {reports.filter((r) => r.status === "pending").length} Pending Reports
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 rounded-4xl animate-pulse"
              ></div>
            ))
        ) : reports.length === 0 ? (
          <div className="text-center py-24 bg-white border border-border rounded-4xl">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h3 className="font-medium text-lg text-foreground">Clean Record</h3>
            <p className="text-black">
              There are no reports to review right now.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-border rounded-4xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-medium  tracking-wider ${report.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : report.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-xs text-black">
                      Reported on{" "}
                      {format(new Date(report.createdAt), "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    {report.reason}
                  </h3>
                  <p className="text-[10px] font-medium text-black  tracking-widest mb-2">
                    Reporter's Message
                  </p>
                  <p className="text-sm text-black mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic leading-relaxed">
                    "{report.description || "No detailed description provided."}"
                  </p>

                  {report.proofUrls && report.proofUrls.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] font-medium text-black tracking-widest mb-3 flex items-center gap-1">
                        <ImageIcon size={12} /> Submitted Proofs ({report.proofUrls.length})
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {report.proofUrls.map((url, index) => {
                          const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
                          return (
                            <div key={index} className="relative group/img">
                              {isPdf ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                                >
                                  <FileText size={18} className="text-red-500" />
                                  <span className="text-xs font-semibold">View PDF Proof {index + 1}</span>
                                  <ExternalLink size={12} className="text-red-400" />
                                </a>
                              ) : (
                                <div className="relative cursor-zoom-in max-w-[200px]">
                                  <img
                                    src={url}
                                    alt={`Proof ${index + 1}`}
                                    className="rounded-2xl border border-border shadow-sm max-h-32 object-cover hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(url, '_blank')}
                                  />
                                  <div 
                                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/25 rounded-2xl transition-opacity"
                                    onClick={() => window.open(url, '_blank')}
                                  >
                                    <span className="bg-black/60 text-white text-[9px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                                      <ExternalLink size={10} /> Expand
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-medium text-black  tracking-widest mb-2">
                        Reported By
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium text-xs">
                          {report.reporter?.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {report.reporter?.firstName}{" "}
                            {report.reporter?.lastName}
                          </p>
                          <p className="text-xs text-black">
                            {report.reporter?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-black  tracking-widest mb-2">
                        Reported User
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-medium text-xs">
                          {report.reportedUser?.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {report.reportedUser?.firstName}{" "}
                            {report.reportedUser?.lastName}
                          </p>
                          <p className="text-xs text-black">
                            {report.reportedUser?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-72 border-l border-border/50 pl-0 md:pl-6 flex flex-col gap-4">
                  {report.status === "pending" ? (
                    <>
                      <div className="space-y-3 mt-2">
                        <div>
                          <p className="text-[10px] font-medium text-black  tracking-widest mb-1.5 flex justify-between">
                            Action Taken <span>(Reporter sees)</span>
                          </p>
                          <textarea
                            placeholder="e.g. User warned & content removed"
                            className="w-full h-20 p-3 text-xs bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            value={reportDetails[report.id]?.actionDescription || ""}
                            onChange={(e) => setReportDetails(prev => ({
                              ...prev,
                              [report.id]: { ...prev[report.id], actionDescription: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-black  tracking-widest mb-1.5 flex justify-between">
                            Reason <span>(User sees)</span>
                          </p>
                          <textarea
                            placeholder="e.g. Inappropriate profile photo"
                            className="w-full h-20 p-3 text-xs bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            value={reportDetails[report.id]?.violationReason || ""}
                            onChange={(e) => setReportDetails(prev => ({
                              ...prev,
                              [report.id]: { ...prev[report.id], violationReason: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <button
                          onClick={() => handleResolve(report.id, "Warning Issued")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-medium shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                        >
                          Warn User
                        </button>
                        <button
                          onClick={() => handleResolve(report.id, "Account Suspension")}
                          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-xs font-medium shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
                        >
                          Block User
                        </button>
                        <button
                          onClick={() => handleResolve(report.id, "dismiss")}
                          className="w-full bg-white border border-border hover:bg-gray-50 text-foreground rounded-xl py-2.5 text-xs font-medium transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 flex flex-col gap-4 h-full">
                      <div>
                        <p className="text-[10px] font-medium text-black  mb-1 italic">
                          Action Result
                        </p>
                        <p className="text-xs font-medium text-black">
                          {report.actionTaken || "N/A"}
                        </p>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-200">
                        <p className="text-[10px] font-medium text-black  mb-1">
                          Status
                        </p>
                        <p className="text-[10px] font-medium  tracking-wider text-primary">
                          {report.status}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsPage;





