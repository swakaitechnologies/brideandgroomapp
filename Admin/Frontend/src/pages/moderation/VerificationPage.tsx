import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Image as ImageIcon,
  RefreshCw,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import api from "../../lib/api";
import { cn } from "../../lib/utils";

interface PendingProfile {
  id: string;
  userId: string;
  customId: string;
  firstName: string;
  lastName: string;
  verificationStatus: string;
  createdAt: string;
}

interface PendingPhoto {
  id: string;
  userId: string;
  url: string;
  status: string;
  isMain: boolean;
  isBlurred?: boolean;
  profile?: { customId: string; firstName?: string; lastName?: string };
  user?: { firstName: string; lastName: string };
}

interface ModerationLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
  admin?: { username: string; email: string };
}

const VerificationPage = () => {
  const [activeTab, setActiveTab] = useState<"profiles" | "photos" | "history">(
    "profiles",
  );
  const [photoSubTab, setPhotoSubTab] = useState<"pending" | "history">("pending");
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [photoHistory, setPhotoHistory] = useState<PendingPhoto[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState<PendingPhoto | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "profiles") {
        const res = await api.get("/users?verified=pending");
        // The API returns users with included profile
        const users = res.data.data;
        const pending = users.map((u: { profile: { id: string; customId: string; verificationStatus: string }; id: string; firstName: string; lastName: string; createdAt: string }) => ({
          id: u.profile.id,
          userId: u.id,
          customId: u.profile.customId,
          firstName: u.firstName,
          lastName: u.lastName,
          verificationStatus: u.profile.verificationStatus,
          createdAt: u.createdAt,
        }));
        setProfiles(pending);
      } else if (activeTab === "photos") {
        if (photoSubTab === "pending") {
          const res = await api.get("/moderation/photos");
          setPhotos(res.data.data);
        } else {
          const res = await api.get("/moderation/photos/history");
          setPhotoHistory(res.data.data);
        }
      } else {
        const res = await api.get("/logs?limit=100");
        setLogs(res.data.data);
      }
    } catch {
      toast.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  }, [activeTab, photoSubTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewPhoto(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleVerifyProfile = async (
    userId: string,
    status: "approved" | "rejected",
  ) => {
    let reason = "";
    if (status === "rejected") {
      reason = window.prompt("Reason for rejection:") || "";
      if (!reason) return;
    }

    try {
      await api.post(`/users/${userId}/verify`, { status, reason });
      toast.success(`Profile ${status}`);
      fetchData();
    } catch {
      toast.error("Process failed");
    }
  };

  const groupPhotosByUser = (photoList: PendingPhoto[]) => {
    return Object.entries(
      photoList.reduce(
        (acc, photo) => {
          const userId = photo.userId;
          if (!acc[userId]) {
            acc[userId] = {
              user: photo.user,
              profile: photo.profile,
              photos: [],
            };
          }
          acc[userId].photos.push(photo);
          return acc;
        },
        {} as Record<
          string,
          {
            user: PendingPhoto["user"];
            profile: PendingPhoto["profile"];
            photos: PendingPhoto[];
          }
        >
      )
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      );
    }

    if (activeTab === "profiles") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="border border-border rounded-3xl p-6 hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-medium text-lg">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </div>
                <span className="text-[10px] font-medium px-2 py-1 bg-amber-50 text-amber-600 rounded-lg ">
                  Pending
                </span>
              </div>

              <h4 className="font-medium text-lg text-foreground mb-1">
                {profile.firstName} {profile.lastName}
              </h4>
              <p className="text-xs font-mono text-black mb-6">
                {profile.customId}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-10 text-xs font-medium"
                  onClick={() =>
                    handleVerifyProfile(profile.userId, "rejected")
                  }
                >
                  <XCircle size={14} className="mr-2 text-red-500" />
                  Reject
                </Button>
                <Button
                  className="flex-1 rounded-xl h-10 text-xs font-medium bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                  onClick={() =>
                    handleVerifyProfile(profile.userId, "approved")
                  }
                >
                  <CheckCircle2 size={14} className="mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="col-span-full text-center py-12 text-black">
              No pending profiles
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "photos") {
      const activePhotos = photoSubTab === "pending" ? photos : photoHistory;
      return (
        <div className="space-y-6">
          {/* Premium Segmented Sub-Tab Control */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-6 border border-slate-200/60 shadow-sm">
            <button
              onClick={() => setPhotoSubTab("pending")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300",
                photoSubTab === "pending"
                  ? "bg-white text-primary shadow-md transform scale-[1.02]"
                  : "text-slate-600 hover:text-primary hover:bg-white/50"
              )}
            >
              <Clock size={14} />
              Pending Queue
            </button>
            <button
              onClick={() => setPhotoSubTab("history")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300",
                photoSubTab === "history"
                  ? "bg-white text-primary shadow-md transform scale-[1.02]"
                  : "text-slate-600 hover:text-primary hover:bg-white/50"
              )}
            >
              <History size={14} />
              Moderation History
            </button>
          </div>

          <div className="space-y-8">
            {groupPhotosByUser(activePhotos).map(([userId, group]) => (
              <div
                key={userId}
                className="bg-slate-50/50 rounded-3xl p-6 border border-border/60"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {
                      (group.profile?.firstName ||
                        group.user?.firstName ||
                        "?")[0]
                    }
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {group.profile?.firstName || group.user?.firstName}{" "}
                      {group.profile?.lastName || group.user?.lastName}
                    </h4>
                    <p className="text-xs font-mono text-black">
                      {group.profile?.customId || "No ID"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {group.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group overflow-hidden rounded-3xl border border-border bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <img
                          src={photo.url}
                          alt="User photo"
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                            photo.isBlurred && "blur-sm"
                          )}
                        />
                        
                        {/* Overlay Controls */}
                        {photoSubTab === "pending" ? (
                          <div 
                            onClick={() => setPreviewPhoto(photo)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 cursor-zoom-in"
                          >
                            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() =>
                                  handleVerifyPhoto(photo.id, "rejected")
                                }
                                className="p-3 bg-white hover:bg-red-500 rounded-full text-red-500 hover:text-white transition-all shadow-xl active:scale-90"
                                title="Reject Photo"
                              >
                                <XCircle size={20} />
                              </button>
                              <button
                                onClick={() =>
                                  handleVerifyPhoto(photo.id, "approved")
                                }
                                className="p-3 bg-white hover:bg-green-500 rounded-full text-green-500 hover:text-white transition-all shadow-xl active:scale-90"
                                title="Approve Photo"
                              >
                                <CheckCircle2 size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Moderation History Hover Corrections
                          <div 
                            onClick={() => setPreviewPhoto(photo)}
                            className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 cursor-zoom-in"
                          >
                            <div onClick={(e) => e.stopPropagation()}>
                              {photo.status === "approved" ? (
                                <button
                                  onClick={() => handleVerifyPhoto(photo.id, "rejected")}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all shadow-xl active:scale-95"
                                  title="Mark as Rejected"
                                >
                                  <XCircle size={14} />
                                  Reject Photo
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyPhoto(photo.id, "approved")}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-green-600 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold transition-all shadow-xl active:scale-95"
                                  title="Mark as Approved"
                                >
                                  <CheckCircle2 size={14} />
                                  Approve Photo
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Status Badges */}
                        {photo.isMain && (
                          <span className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-1 rounded-lg tracking-wider">
                            MAIN
                          </span>
                        )}

                        {photoSubTab === "history" && (
                          <span
                            className={cn(
                              "absolute top-3 right-3 backdrop-blur-md text-[9px] font-bold px-2.5 py-1 rounded-xl tracking-wider shadow-sm flex items-center gap-1 text-white border",
                              photo.status === "approved"
                                ? "bg-green-600/90 border-green-500"
                                : "bg-red-600/90 border-red-500"
                            )}
                          >
                            {photo.status === "approved" ? (
                              <>
                                <CheckCircle2 size={10} />
                                APPROVED
                              </>
                            ) : (
                              <>
                                <XCircle size={10} />
                                REJECTED
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {activePhotos.length === 0 && (
              <div className="col-span-full text-center py-12 text-black">
                {photoSubTab === "pending" ? "No pending photos" : "No photo history found"}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 text-[10px] font-medium  tracking-[0.15em] text-black bg-muted/20">
              <th className="py-5 px-6">Timestamp</th>
              <th className="py-5 px-6">Moderator</th>
              <th className="py-5 px-6">Action</th>
              <th className="py-5 px-6">Target</th>
              <th className="py-5 px-6">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {logs.map((log) => {
              let detailsObj = {};
              try {
                detailsObj = JSON.parse(log.details);
              } catch {
                // Ignore parsing errors for details
              }

              return (
                <tr
                  key={log.id}
                  className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  <td className="py-5 px-6 font-medium text-black text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex flex-col">
                      <span className="font-medium text-black">
                        {log.admin?.username || "Admin"}
                      </span>
                      <span className="text-[10px] text-black  tracking-widest font-medium">
                        {log.admin?.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-medium  tracking-widest shadow-sm",
                        log.action.includes("approved") || log.action.includes("Resolve")
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : log.action.includes("rejected") || log.action.includes("Delete")
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      )}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs font-mono text-black">
                    <span className="bg-muted px-2 py-0.5 rounded border border-border/50">
                      {log.targetType}
                    </span>
                    <p className="mt-1 opacity-50">{log.targetId}</p>
                  </td>
                  <td className="py-5 px-6">
                    <div className="text-[10px] font-medium text-black max-w-[200px] truncate">
                      {Object.entries(detailsObj)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}
                    </div>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-black"
                >
                  No history found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const handleVerifyPhoto = async (
    photoId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      await api.post(`/moderation/photos/${photoId}/verify`, { status, reason: "" });
      toast.success(`Photo ${status}`);
      fetchData();
    } catch {
      toast.error("Moderation failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-medium font-heading text-foreground tracking-tight">
            Verification Queue
          </h1>
          <p className="text-black mt-1.5 font-medium">
            Review and moderate pending profiles and photos
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-3.5 bg-white border border-border rounded-2xl text-primary hover:bg-muted transition-all shadow-soft group disabled:opacity-50"
            title="Refresh Queue"
          >
            <RefreshCw
              size={20}
              className={cn(
                loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
              )}
            />
          </button>

          <div className="flex bg-white border border-border p-1.5 rounded-[1.25rem] shadow-soft">
            <button
              onClick={() => setActiveTab("profiles")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium  tracking-widest transition-all",
                activeTab === "profiles"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-black hover:bg-gray-50"
              )}
            >
              <User size={14} />
              Profiles
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium  tracking-widest transition-all",
                activeTab === "photos"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-black hover:bg-gray-50"
              )}
            >
              <ImageIcon size={14} />
              Photos
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium  tracking-widest transition-all",
                activeTab === "history"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-black hover:bg-gray-50"
              )}
            >
              <History size={14} />
              History
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-4xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border/50 bg-gray-50/30 flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          <h3 className="font-medium text-sm  tracking-widest text-foreground">
            {activeTab === "profiles"
              ? "Pending Profiles"
              : activeTab === "photos"
                ? (photoSubTab === "pending" ? "Pending Photos" : "Photo Moderation History")
                : "History"}
          </h3>
          <span className="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-medium ">
            {activeTab === "profiles"
              ? profiles.length
              : activeTab === "photos"
                ? (photoSubTab === "pending" ? photos.length : photoHistory.length)
                : logs.length}{" "}
            items
          </span>
        </div>

        <div className="p-6">{renderContent()}</div>
      </div>

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300 p-4 animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          {/* Close button */}
          <button 
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-95 border border-white/10"
            title="Close Preview (Esc)"
          >
            <XCircle size={24} />
          </button>

          {/* Modal Content */}
          <div 
            className="relative max-w-4xl max-h-[70vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewPhoto.url} 
              alt="Full Preview" 
              className={cn(
                "max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/10",
                previewPhoto.isBlurred && "blur-sm"
              )} 
            />

            {/* Main Badge */}
            {previewPhoto.isMain && (
              <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                MAIN PHOTO
              </span>
            )}
          </div>

          {/* User Details & Moderation Actions at the Bottom */}
          <div 
            className="mt-6 bg-slate-900/85 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center gap-6 shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 text-center md:text-left">
              <p className="text-white font-semibold text-lg">
                {previewPhoto.profile?.firstName || previewPhoto.user?.firstName || "User"}{" "}
                {previewPhoto.profile?.lastName || previewPhoto.user?.lastName || ""}
              </p>
              <p className="text-slate-400 text-xs font-mono mt-1">
                ID: {previewPhoto.profile?.customId || "No ID"}
              </p>
              <p className="text-slate-400 text-xs font-semibold mt-1.5 flex items-center justify-center md:justify-start gap-1.5">
                Current Status: 
                <span className={cn(
                  "px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold",
                  previewPhoto.status === "approved" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                  previewPhoto.status === "rejected" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                )}>
                  {previewPhoto.status}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {previewPhoto.status !== "rejected" && (
                <button
                  onClick={async () => {
                    await handleVerifyPhoto(previewPhoto.id, "rejected");
                    setPreviewPhoto(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              )}
              {previewPhoto.status !== "approved" && (
                <button
                  onClick={async () => {
                    await handleVerifyPhoto(previewPhoto.id, "approved");
                    setPreviewPhoto(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <CheckCircle2 size={14} />
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;





