import { useState, useEffect } from "react";
import {
  MessageSquare,
  Clock,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  Filter,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "../../components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  type: string;
  status: string;
  subject: string;
  message: string;
  createdAt: string;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

const FeedbackManagementPage = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get("/moderation/feedback");
      setFeedbacks(response.data);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.post(`/moderation/feedback/${id}/status`, { status });
      toast.success("Status updated");
      fetchFeedback();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback?"))
      return;
    try {
      await api.delete(`/moderation/feedback/${id}`);
      toast.success("Feedback deleted");
      fetchFeedback();
    } catch {
      toast.error("Failed to delete feedback");
    }
  };

  const deleteAllFeedback = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL feedback? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete("/moderation/feedback/all");
      toast.success("All feedback deleted");
      fetchFeedback();
    } catch {
      toast.error("Failed to delete all feedback");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "issue":
        return <AlertCircle className="text-red-500" size={16} />;
      case "suggestion":
        return <Lightbulb className="text-amber-500" size={16} />;
      default:
        return <HelpCircle className="text-blue-500" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            Resolved
          </Badge>
        );
      case "reviewed":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Reviewed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Pending
          </Badge>
        );
    }
  };

  const filteredFeedback = feedbacks.filter((f) => {
    const matchesType = filterType === "all" || f.type === filterType;
    const matchesStatus = filterStatus === "all" || f.status === filterStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-medium text-black tracking-tight">
            User <span className="text-amber-500 italic">Feedback</span>
          </h1>
          <p className="text-black font-medium">
            Manage issues and suggestions submitted by users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <Filter size={16} className="text-black" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none"
            >
              <option value="all">All Types</option>
              <option value="issue">Issues</option>
              <option value="suggestion">Suggestions</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <Button
            variant="outline"
            onClick={fetchFeedback}
            disabled={loading}
            className="rounded-xl h-10 px-4 text-xs font-medium  tracking-widest border-slate-200 hover:bg-slate-50 transition-all group"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin mr-2"
                  : "mr-2 group-hover:rotate-180 transition-transform duration-500"
              }
            />
            Refresh
          </Button>

          {feedbacks.length > 0 && (
            <Button
              variant="destructive"
              onClick={deleteAllFeedback}
              className="rounded-xl h-10 px-4 text-xs font-medium  tracking-widest shadow-lg shadow-red-500/20"
            >
              <Trash2 size={16} className="mr-2" />
              Delete All
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-black font-medium  tracking-widest text-xs">
            Loading Feedback...
          </p>
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-black">
            <MessageSquare size={32} />
          </div>
          <div>
            <h3 className="text-xl font-medium text-black">
              No feedback found
            </h3>
            <p className="text-black max-w-xs mx-auto">
              Try adjusting your filters or wait for users to submit feedback.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {filteredFeedback.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-4xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium  tracking-widest text-black flex items-center gap-1.5">
                            {getTypeIcon(item.type)}
                            {item.type}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <h3 className="text-lg font-medium text-black">
                          {item.subject}
                        </h3>
                      </div>
                      <div className="flex items-start gap-4">
                        <p className="text-[10px] font-medium text-black  tracking-widest flex items-center gap-1.5 whitespace-nowrap pt-1">
                          <Clock size={12} />
                          {format(
                            new Date(item.createdAt),
                            "MMM d, yyyy • hh:mm a",
                          )}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFeedback(item.id)}
                          className="h-8 w-8 rounded-lg text-black hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-black leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-black font-medium text-xs border border-slate-200">
                          {item.user?.profile?.firstName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black leading-none">
                            {item.user?.profile?.firstName}{" "}
                            {item.user?.profile?.lastName}
                          </p>
                          <p className="text-[10px] font-medium text-black leading-none mt-1">
                            {item.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status !== "reviewed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(item.id, "reviewed")}
                            className="rounded-lg h-9 px-4 text-xs font-medium border-slate-200 hover:bg-blue-50 hover:text-blue-500"
                          >
                            Mark Reviewed
                          </Button>
                        )}
                        {item.status !== "resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(item.id, "resolved")}
                            className="rounded-lg h-9 px-4 text-xs font-medium border-slate-200 hover:bg-green-50 hover:text-green-500"
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
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

export default FeedbackManagementPage;





