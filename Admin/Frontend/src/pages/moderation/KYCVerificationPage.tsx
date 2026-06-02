import { useEffect, useState } from "react";
import api from "../../lib/api";
import {
  Shield,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  History,
  Camera,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

interface KYCRequest {
  id: string;
  userId: string;
  customId: string;
  documentType: string;
  documentNumber?: string;
  fullName?: string;
  dob?: string;
  documentUrl: string;
  status: string;
  selfieUrl?: string;
  selfieStatus?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profile?: {
      customId: string;
    };
  };
}

const KYCVerificationPage = () => {
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(
    null,
  );
  
  // Resolution states
  const [docResolveStatus, setDocResolveStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [selfieResolveStatus, setSelfieResolveStatus] = useState<"pending" | "approved" | "rejected">("pending");
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const fetchRequests = async (tab: "pending" | "history") => {
    setLoading(true);
    try {
      const endpoint =
        tab === "pending" ? "/moderation/kyc" : "/moderation/kyc/all";
      const res = await api.get(endpoint);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch KYC requests", error);
      toast.error(`Failed to fetch ${tab} KYC requests`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(activeTab);
    setSelectedRequest(null);
  }, [activeTab]);

  useEffect(() => {
    if (selectedRequest) {
      setDocResolveStatus((selectedRequest.status as any) || "pending");
      setSelfieResolveStatus((selectedRequest.selfieStatus as any) || "pending");
      setRejectionReason(selectedRequest.rejectionReason || "");
    }
  }, [selectedRequest]);

  const handleResolve = async () => {
    if (!selectedRequest) return;

    if ((docResolveStatus === "rejected" || selfieResolveStatus === "rejected") && !rejectionReason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/moderation/kyc/${selectedRequest.id}/resolve`, {
        documentStatus: docResolveStatus,
        selfieStatus: selfieResolveStatus,
        rejectionReason: (docResolveStatus === "rejected" || selfieResolveStatus === "rejected") ? rejectionReason : undefined,
      });

      if (res.data.success) {
        toast.success("KYC resolved successfully");
        setSelectedRequest(null);
        setRejectionReason("");
        fetchRequests(activeTab);
      }
    } catch (error) {
      console.error("Failed to resolve KYC", error);
      toast.error("Failed to update KYC status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 transition-transform hover:scale-105">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-medium font-heading text-foreground tracking-tight ">
              KYC Verification
            </h1>
            <p className="text-black mt-1 text-[10px] font-medium  tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} className="text-secondary" />
              {activeTab === "pending" ? "Action Required" : "History"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white border border-border p-1.5 rounded-[1.25rem] shadow-soft">
            <button
              onClick={() => setActiveTab("pending")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-medium  tracking-widest transition-all",
                activeTab === "pending"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-black hover:bg-gray-50"
              )}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-medium  tracking-widest transition-all",
                activeTab === "history"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-black hover:bg-gray-50"
              )}
            >
              History
            </button>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
              size={16}
            />
            <input
              type="text"
              placeholder="Search ID or Name..."
              className="pl-11 pr-4 py-3 bg-white border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none shadow-soft transition-all w-full sm:w-64 text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl border border-border p-12 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
              <p className="text-black font-medium text-sm tracking-widest ">
                Loading...
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-border p-12 text-center space-y-4 shadow-soft">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-black border border-border">
                {activeTab === "pending" ? (
                  <CheckCircle size={32} />
                ) : (
                  <History size={32} />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  {activeTab === "pending" ? "All Clear!" : "History Empty"}
                </p>
                <p className="text-black text-sm  tracking-widest font-medium mt-1">
                  {activeTab === "pending"
                    ? "No pending KYC requests."
                    : "No verification history found."}
                </p>
              </div>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <motion.div
                key={req.id}
                layoutId={req.id}
                className={cn(
                  "bg-white rounded-2xl border transition-all cursor-pointer group shadow-sm hover:shadow-md",
                  selectedRequest?.id === req.id
                    ? "border-secondary ring-1 ring-secondary/20"
                    : "border-border hover:border-secondary/40",
                )}
                onClick={() => setSelectedRequest(req)}
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl border flex items-center justify-center font-medium text-xl shadow-inner transition-colors",
                        req.status === "approved"
                          ? "bg-green-50 text-green-600 border-green-100"
                          : req.status === "rejected"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-muted border-border text-black group-hover:bg-secondary/10 group-hover:text-secondary group-hover:border-secondary/20",
                      )}
                    >
                      {req.user.firstName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground text-lg tracking-tight">
                          {req.user.firstName} {req.user.lastName}
                        </h3>
                        <div className="flex gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-[8px] px-2 py-0.5 rounded-full font-medium tracking-tighter",
                              req.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : req.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700",
                            )}
                          >
                            Doc: {req.status}
                          </span>
                          <span
                            className={cn(
                              "text-[8px] px-2 py-0.5 rounded-full font-medium tracking-tighter",
                              req.selfieStatus === "approved"
                                ? "bg-green-100 text-green-700"
                                : req.selfieStatus === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700",
                            )}
                          >
                            Selfie: {req.selfieStatus || "pending"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-medium text-secondary  tracking-widest">
                          ID: {req.customId}
                        </span>
                        <span className="w-1 h-1 bg-border rounded-full" />
                        <span className="text-[10px] font-medium text-black  tracking-widest">
                          {req.documentType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block mr-2">
                      <p className="text-[9px] font-medium text-black  tracking-tighter">
                        {activeTab === "pending"
                          ? "Submitted On"
                          : "Resolved On"}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {new Date(
                          activeTab === "pending"
                            ? req.createdAt
                            : req.updatedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl group-hover:bg-secondary group-hover:text-white transition-all"
                    >
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Selected Request Detail */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedRequest ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden sticky top-24"
              >
                <div className="p-8 space-y-8">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-medium text-white tracking-widest">
                        Request Details
                      </h2>
                      <button
                        onClick={() => setSelectedRequest(null)}
                        className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-1">
                      <span
                        className={cn(
                          "text-[10px] px-2.5 py-1 rounded-lg font-medium tracking-widest border",
                          selectedRequest.status === "approved"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : selectedRequest.status === "rejected"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}
                      >
                        Doc: {selectedRequest.status.toUpperCase()}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-2.5 py-1 rounded-lg font-medium tracking-widest border",
                          selectedRequest.selfieStatus === "approved"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : selectedRequest.selfieStatus === "rejected"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}
                      >
                        Selfie: {(selectedRequest.selfieStatus || "pending").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-medium text-xl shadow-lg shadow-black/20",
                          selectedRequest.status === "approved" && selectedRequest.selfieStatus === "approved"
                            ? "bg-green-600 text-white"
                            : selectedRequest.status === "rejected" || selectedRequest.selfieStatus === "rejected"
                              ? "bg-red-600 text-white"
                              : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {selectedRequest.user.firstName[0]}
                      </div>
                      <div>
                        <p className="text-white font-medium text-lg leading-none">
                          {selectedRequest.user.firstName}{" "}
                          {selectedRequest.user.lastName}
                        </p>
                        <p className="text-white/80 text-[10px] font-medium  tracking-widest mt-1.5">
                          {selectedRequest.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-medium text-white/80  tracking-widest mb-1.5">
                          User ID
                        </p>
                        <p className="text-sm font-medium text-white tracking-widest">
                          {selectedRequest.customId}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-medium text-white/80  tracking-widest mb-1.5">
                          Document Type
                        </p>
                        <p className="text-sm font-medium text-white truncate">
                          {selectedRequest.documentType.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-medium text-white/80  tracking-widest mb-1.5">
                          Name on Document
                        </p>
                        <p className="text-sm font-medium text-white truncate" title={selectedRequest.fullName}>
                          {selectedRequest.fullName || "—"}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-medium text-white/80  tracking-widest mb-1.5">
                          Doc Number
                        </p>
                        <p className="text-sm font-medium text-white truncate" title={selectedRequest.documentNumber}>
                          {selectedRequest.documentNumber || "—"}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-medium text-white/80  tracking-widest mb-1.5">
                          DOB on Document
                        </p>
                        <p className="text-sm font-medium text-white truncate">
                          {selectedRequest.dob || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Document Viewer */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-medium text-white/80 tracking-widest">
                            ID Document ({selectedRequest.documentType.toUpperCase()})
                          </p>
                          <a
                            href={selectedRequest.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-medium text-secondary hover:text-secondary/80 flex items-center gap-1 tracking-widest transition-colors"
                          >
                            <ExternalLink size={12} /> Open Full
                          </a>
                        </div>
                        <div className="aspect-[4/3] bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative group">
                          {selectedRequest.documentUrl
                            ?.toLowerCase()
                            .endsWith(".pdf") ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
                              <FileText
                                size={64}
                                className="mb-4 text-white/80"
                              />
                              <p className="text-xs font-medium tracking-widest">
                                PDF Document
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 rounded-xl border-white/10 bg-white/5 text-white font-medium text-[10px] tracking-widest h-9"
                                onClick={() =>
                                  window.open(
                                    selectedRequest.documentUrl,
                                    "_blank",
                                  )
                                }
                              >
                                View PDF
                              </Button>
                            </div>
                          ) : (
                            <img
                              src={selectedRequest.documentUrl}
                              alt="KYC Document"
                              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                            />
                          )}
                        </div>
                      </div>

                      {/* Live Selfie Viewer */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-medium text-white/80 tracking-widest">
                            Live Selfie
                          </p>
                          {selectedRequest.selfieUrl ? (
                            <a
                              href={selectedRequest.selfieUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-medium text-secondary hover:text-secondary/80 flex items-center gap-1 tracking-widest transition-colors"
                            >
                              <ExternalLink size={12} /> Open Full
                            </a>
                          ) : (
                            <span className="text-[9px] text-white/40 tracking-widest">No image</span>
                          )}
                        </div>
                        <div className="aspect-[4/3] bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative group">
                          {selectedRequest.selfieUrl ? (
                            <img
                              src={selectedRequest.selfieUrl}
                              alt="Live Selfie"
                              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                              <Camera size={48} className="mb-2 text-white/30" />
                              <p className="text-[10px] font-medium tracking-widest">
                                Selfie Not Captured
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resolution Info or Action Area */}
                    {activeTab === "history" ? (
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/80 font-medium tracking-widest">Document Status</span>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-widest",
                                selectedRequest.status === "approved"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              )}
                            >
                              {selectedRequest.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/80 font-medium tracking-widest">Selfie Status</span>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-widest",
                                selectedRequest.selfieStatus === "approved"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              )}
                            >
                              {(selectedRequest.selfieStatus || "pending").toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="pt-2 border-t border-white/5">
                            <p className="text-[10px] text-white/60 font-medium">
                              Resolved On: {new Date(selectedRequest.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          
                          {selectedRequest.rejectionReason && (
                            <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5">
                              <p className="text-[8px] font-medium text-white/80 tracking-tighter mb-1">
                                Reason for Rejection
                              </p>
                              <p className="text-[11px] text-white/90 italic font-medium">
                                {selectedRequest.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        {/* ID Document Status Selector */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-medium text-white/80 tracking-widest">ID Document Status</span>
                            <span className="text-[8px] px-2 py-0.5 bg-white/10 rounded text-white/90 font-medium tracking-widest uppercase">
                              Current: {selectedRequest.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(["pending", "approved", "rejected"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setDocResolveStatus(s)}
                                className={cn(
                                  "py-2 rounded-xl text-[10px] font-semibold tracking-widest transition-all border",
                                  docResolveStatus === s
                                    ? s === "approved"
                                      ? "bg-green-600 text-white border-green-500 shadow-md shadow-green-900/30"
                                      : s === "rejected"
                                        ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30"
                                        : "bg-yellow-600 text-white border-yellow-500 shadow-md shadow-yellow-900/30"
                                    : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {s.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Live Selfie Status Selector */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-medium text-white/80 tracking-widest">Live Selfie Status</span>
                            <span className="text-[8px] px-2 py-0.5 bg-white/10 rounded text-white/90 font-medium tracking-widest uppercase">
                              Current: {selectedRequest.selfieStatus || "pending"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(["pending", "approved", "rejected"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSelfieResolveStatus(s)}
                                className={cn(
                                  "py-2 rounded-xl text-[10px] font-semibold tracking-widest transition-all border",
                                  selfieResolveStatus === s
                                    ? s === "approved"
                                      ? "bg-green-600 text-white border-green-500 shadow-md shadow-green-900/30"
                                      : s === "rejected"
                                        ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30"
                                        : "bg-yellow-600 text-white border-yellow-500 shadow-md shadow-yellow-900/30"
                                    : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {s.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rejection Reason textarea (visible if either status is "rejected") */}
                        {(docResolveStatus === "rejected" || selfieResolveStatus === "rejected") && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[9px] font-medium text-white/80 tracking-widest">
                              Reason for Rejection
                            </p>
                            <textarea
                              placeholder="Explain why the document or selfie was rejected..."
                              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-1 focus:ring-secondary/50 outline-none transition-all min-h-[80px] font-medium"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="pt-2">
                          <Button
                            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-2xl h-14 font-medium tracking-widest text-[10px] shadow-lg shadow-secondary/20"
                            onClick={handleResolve}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <CheckCircle size={18} className="mr-2" />
                                Save Resolution
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 rounded-3xl border border-white/10 p-12 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-white/80 border border-white/5 shadow-inner">
                  <User size={40} />
                </div>
                <div>
                  <p className="text-white text-lg font-medium tracking-tight ">
                    Please select a request
                  </p>
                  <p className="text-white/80 text-[10px]  font-medium tracking-widest mt-2 leading-relaxed px-6">
                    Select{" "}
                    {activeTab === "pending"
                      ? "a pending request"
                      : "a record from history"}{" "}
                    to view details.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default KYCVerificationPage;





