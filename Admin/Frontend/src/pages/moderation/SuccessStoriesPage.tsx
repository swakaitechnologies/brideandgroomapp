import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  Calendar,
  Star,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import api from "../../lib/api";
import { cn } from "../../lib/utils";

interface SuccessStory {
  id: string;
  coupleName: string;
  weddingDate: string;
  story: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const SuccessStoriesPage = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/moderation/stories");
      setStories(res.data.data);
    } catch {
      toast.error("Failed to fetch success stories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    try {
      await api.patch(`/moderation/stories/${id}`, { status });
      toast.success(`Story ${status} successfully`);
      fetchStories();
    } catch {
      toast.error("Failed to update story status");
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await api.patch(`/moderation/stories/${id}`, { isFeatured: !currentFeatured });
      toast.success(`Story featured status updated`);
      fetchStories();
    } catch {
      toast.error("Failed to update featured status");
    }
  };

  const filteredStories = stories.filter(s => filter === "all" || s.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-medium font-heading text-foreground tracking-tight">
            Success Stories
          </h1>
          <p className="text-black mt-1.5 font-medium">
            Manage and approve success stories shared by users
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchStories}
            disabled={loading}
            className="p-3.5 bg-white border border-border rounded-2xl text-primary hover:bg-muted transition-all shadow-soft group disabled:opacity-50"
            title="Refresh Stories"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>

          <div className="flex bg-white border border-border p-1.5 rounded-[1.25rem] shadow-soft">
            {["pending", "approved", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as "all" | "pending" | "approved" | "rejected")}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-medium  tracking-widest transition-all capitalize",
                  filter === f
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-black hover:bg-gray-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filteredStories.length > 0 ? (
          filteredStories.map((story) => (
            <div key={story.id} className="bg-white border border-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row h-full">
              <div className="w-full md:w-48 h-64 md:h-auto relative overflow-hidden shrink-0">
                <img 
                  src={story.imageUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={story.coupleName}
                />
                <div className="absolute top-4 left-4">
                   <span className={cn(
                     "px-3 py-1.5 rounded-xl text-[10px] font-medium tracking-widest shadow-sm backdrop-blur-md uppercase",
                     story.status === "approved" ? "bg-green-500/90 text-white" : 
                     story.status === "rejected" ? "bg-red-500/90 text-white" : "bg-amber-500/90 text-white"
                   )}>
                     {story.status}
                   </span>
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                   <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-medium text-foreground">{story.coupleName}</h3>
                      <button 
                        onClick={() => handleToggleFeatured(story.id, story.isFeatured)}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          story.isFeatured ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400 hover:text-amber-500"
                        )}
                        title={story.isFeatured ? "Featured" : "Mark as Featured"}
                      >
                        <Star size={18} fill={story.isFeatured ? "currentColor" : "none"} />
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-4 text-[10px] font-medium text-black  tracking-widest mb-6">
                      <div className="flex items-center gap-1.5">
                         <Calendar size={14} className="text-primary" />
                         {new Date(story.weddingDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Clock size={14} className="text-secondary" />
                         {new Date(story.createdAt).toLocaleDateString()}
                      </div>
                   </div>

                   <p className="text-sm text-black leading-relaxed italic mb-8 line-clamp-4">
                     "{story.story}"
                   </p>

                   <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl mb-8">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                        {story.user?.firstName?.[0] || "U"}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-medium text-black truncate">{story.user?.firstName} {story.user?.lastName}</p>
                        <p className="text-[9px] text-black/50 truncate">{story.user?.email}</p>
                      </div>
                   </div>
                </div>

                {story.status === "pending" && (
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 h-12 text-xs font-semibold"
                      onClick={() => handleUpdateStatus(story.id, "rejected")}
                    >
                      <XCircle size={16} className="mr-2" /> Reject
                    </Button>
                    <Button 
                      className="flex-1 rounded-2xl bg-green-600 hover:bg-green-700 h-12 text-xs font-semibold shadow-lg shadow-green-100"
                      onClick={() => handleUpdateStatus(story.id, "approved")}
                    >
                      <CheckCircle2 size={16} className="mr-2" /> Approve
                    </Button>
                  </div>
                )}
                
                {story.status !== "pending" && (
                   <Button 
                    variant="ghost" 
                    className="w-full rounded-2xl h-12 text-xs font-medium text-black hover:bg-slate-100"
                    onClick={() => handleUpdateStatus(story.id, "pending")}
                   >
                     Reset to Pending
                   </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white border border-border border-dashed rounded-[3rem]">
             <Heart size={48} className="mx-auto text-slate-200 mb-6" />
             <p className="text-black font-medium">No success stories found matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessStoriesPage;
