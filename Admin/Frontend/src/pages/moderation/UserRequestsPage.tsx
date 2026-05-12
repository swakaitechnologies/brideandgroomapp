import { useState, useEffect } from "react";
import {
    PhoneCall,
    Clock,
    CheckCircle,
    XCircle,
    MessageSquare,
    Search,
    Filter,
    RefreshCw,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import api from "../../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "../../lib/utils";

interface UserRequest {
    id: string;
    status: string;
    user: {
        email: string;
        profile: {
            firstName: string;
            lastName: string;
            customId: string;
        };
    };
    oldValue: string;
    newValue: string;
    reason: string;
    createdAt: string;
    adminComment?: string;
}

const UserRequestsPage = () => {
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get("/moderation/requests");
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch {
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleResolve = async (id: string, status: "approved" | "rejected") => {
        const adminComment = window.prompt(`Reason for ${status === "approved" ? "approval" : "rejection"} (optional):`) || "";
        try {
            const response = await api.post(`/moderation/requests/${id}/resolve`, {
                status,
                adminComment,
            });
            if (response.data.success) {
                toast.success(`Request ${status}`);
                fetchRequests();
            }
        } catch {
            toast.error("Failed to update request");
        }
    };

    const filteredRequests = requests.filter((req) => {
        const matchesStatus = filterStatus === "all" || req.status === filterStatus;
        const matchesSearch =
            req.user?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.user?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.user?.profile?.customId?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-medium text-black tracking-tight">
                        Change <span className="text-primary italic">Requests</span>
                    </h1>
                    <p className="text-black font-medium">
                        Review and approve mobile number change requests.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                        <Filter size={16} className="text-black" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent text-sm font-medium outline-none"
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <Button
                        variant="outline"
                        onClick={fetchRequests}
                        disabled={loading}
                        className="rounded-xl h-10 px-4 text-xs font-medium  tracking-widest border-slate-200 hover:bg-slate-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin mr-2" : "mr-2"}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-black font-medium  tracking-widest text-xs">
                        Loading Requests...
                    </p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-black">
                        <PhoneCall size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-black">No requests found</h3>
                        <p className="text-black max-w-xs mx-auto">
                            There are no pending mobile change requests at this time.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence>
                        {filteredRequests.map((req) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-4xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-blue-100 rounded text-[10px] font-medium  tracking-widest text-blue-600 flex items-center gap-1.5">
                                                        <PhoneCall size={12} />
                                                        Mobile Change
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-medium  tracking-widest flex items-center gap-1.5",
                                                        req.status === "pending" ? "bg-amber-100 text-amber-600" :
                                                            req.status === "approved" ? "bg-green-100 text-green-600" :
                                                                "bg-red-100 text-red-600"
                                                    )}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-medium text-black">
                                                    Request from {req.user?.profile?.firstName} {req.user?.profile?.lastName}
                                                </h3>
                                                <p className="text-xs font-mono text-black">{req.user?.profile?.customId}</p>
                                            </div>
                                            <p className="text-[10px] font-medium text-black  tracking-widest flex items-center gap-1.5 whitespace-nowrap pt-1">
                                                <Clock size={12} />
                                                {format(new Date(req.createdAt), "MMM d, yyyy • hh:mm a")}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-medium text-black  tracking-widest mb-1">Current Mobile</p>
                                                <p className="text-sm font-medium text-black">{req.oldValue || "Not Set"}</p>
                                            </div>
                                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                                <p className="text-[10px] font-medium text-primary/60  tracking-widest mb-1">New Mobile</p>
                                                <p className="text-sm font-medium text-primary">{req.newValue}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-medium text-black  tracking-widest mb-1 flex items-center gap-1.5">
                                                <MessageSquare size={12} />
                                                Reason
                                            </p>
                                            <p className="text-sm font-medium text-black leading-relaxed italic">
                                                "{req.reason}"
                                            </p>
                                        </div>

                                        {req.status === "pending" ? (
                                            <div className="flex items-center justify-end gap-3 pt-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleResolve(req.id, "rejected")}
                                                    className="rounded-xl h-10 px-6 text-xs font-medium border-slate-200 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <XCircle size={16} className="mr-2" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    onClick={() => handleResolve(req.id, "approved")}
                                                    className="rounded-xl h-10 px-6 text-xs font-medium bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
                                                >
                                                    <CheckCircle size={16} className="mr-2" />
                                                    Approve
                                                </Button>
                                            </div>
                                        ) : (
                                            req.adminComment && (
                                                <div className="pt-2">
                                                    <p className="text-[10px] font-medium text-black  tracking-widest">Note: <span className="text-black">{req.adminComment}</span></p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default UserRequestsPage;





