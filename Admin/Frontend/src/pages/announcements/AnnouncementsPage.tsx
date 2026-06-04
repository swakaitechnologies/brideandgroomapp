import { useEffect, useState } from "react";
import { Megaphone, Send, Trash2, Users, Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import api from "@/lib/api";

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetType: string;
  targetCustomId?: string;
  isActive: boolean;
  createdAt: string;
}

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    targetType: "all",
    targetCustomId: "",
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/system/announcements");
      setAnnouncements(res.data.data);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/system/announcements", newAnnouncement);
      toast.success("Announcement sent successfully");
      setShowForm(false);
      setNewAnnouncement({ title: "", content: "", targetType: "all", targetCustomId: "" });
      fetchAnnouncements();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to create announcement"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/system/announcements/${id}`);
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete announcement"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-medium">System Announcements</h1>
          <p className="text-sm text-black">
            Send mass notifications to users
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus size={18} />
          New Announcement
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-border/50 flex justify-between items-center bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-2xl text-white">
                  <Megaphone size={20} />
                </div>
                <h3 className="font-heading font-medium text-xl">
                  Create Announcement
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-medium  text-black tracking-widest mb-2">
                  Announcement Title
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Scheduled Maintenance"
                  className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium  text-black tracking-widest mb-2">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell users what's happening..."
                  className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  value={newAnnouncement.content}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      content: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium  text-black tracking-widest mb-2">
                  Target Audience
                </label>
                <select
                  className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={newAnnouncement.targetType}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      targetType: e.target.value,
                    })
                  }
                >
                  <option value="all">All Users</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                  <option value="premium">Premium Users</option>
                  <option value="custom">Particular User (Custom ID)</option>
                </select>
              </div>

              {newAnnouncement.targetType === "custom" && (
                <div>
                  <label className="block text-xs font-medium text-black tracking-widest mb-2">
                    Target User Custom ID
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., BG-99231"
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newAnnouncement.targetCustomId}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        targetCustomId: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
              >
                <Send size={18} />
                Send Now
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-100 rounded-4xl animate-pulse"
              ></div>
            ))
        ) : announcements.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white border border-border rounded-[3rem]">
            <Megaphone className="mx-auto text-slate-200 mb-4" size={64} />
            <h3 className="font-medium text-lg text-black">
              No active announcements
            </h3>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white border border-border rounded-4xl p-8 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-medium  tracking-wider ${ann.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {ann.isActive ? "Active" : "Expired"}
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-1 rounded-full font-medium text-black tracking-widest">
                  <Users size={10} />
                  Target: {ann.targetType === "custom" ? `User (${ann.targetCustomId})` : ann.targetType}
                </span>
              </div>

              <h3 className="text-xl font-medium text-foreground mb-3">
                {ann.title}
              </h3>
              <p className="text-sm text-black mb-6 leading-relaxed line-clamp-3 italic">
                "{ann.content}"
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-black">
                  <Clock size={14} />
                  {format(new Date(ann.createdAt), "MMM dd, yyyy")}
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;





