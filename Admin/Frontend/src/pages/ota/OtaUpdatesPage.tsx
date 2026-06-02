import { useEffect, useState } from "react";
import {
  UploadCloud,
  Cpu,
  RefreshCw,
  Plus,
  X,
  FileCode,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

interface OtaUpdate {
  id: string;
  version: string;
  targetNativeVersion: string;
  bundlePath: string;
  releaseNotes: string;
  isActive: boolean;
  createdAt: string;
}

export default function OtaUpdatesPage() {
  const [updates, setUpdates] = useState<OtaUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [newUpdate, setNewUpdate] = useState({
    version: "",
    targetNativeVersion: "",
    releaseNotes: "",
  });
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [nativeFilter, setNativeFilter] = useState("all");

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ota/list");
      if (res.data && res.data.success) {
        setUpdates(res.data.data);
      } else {
        toast.error("Failed to load OTA updates");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching OTA updates from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "bundle" || ext === "js" || file.type === "application/octet-stream" || file.name.endsWith(".android.bundle")) {
      setBundleFile(file);
    } else {
      toast.error("Only .bundle or .js files are allowed!");
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Bundle URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const targetStatus = !currentStatus;
      const res = await api.put(
        `/ota/${id}/toggle`,
        { isActive: targetStatus }
      );
      if (res.data && res.data.success) {
        toast.success(`Update marked as ${targetStatus ? "active" : "inactive"}`);
        setUpdates(
          updates.map((up) => (up.id === id ? { ...up, isActive: targetStatus } : up))
        );
      } else {
        toast.error("Failed to toggle update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status on server");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleFile) {
      toast.error("Please upload a bundle file");
      return;
    }

    // Semver checks
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(newUpdate.version)) {
      toast.error("Bundle Version must be in semver format (e.g. 1.0.0)");
      return;
    }
    if (!semverRegex.test(newUpdate.targetNativeVersion)) {
      toast.error("Target Native Version must be in semver format (e.g. 0.0.1)");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("bundle", bundleFile);
      formData.append("version", newUpdate.version);
      formData.append("targetNativeVersion", newUpdate.targetNativeVersion);
      formData.append("releaseNotes", newUpdate.releaseNotes);

      const res = await api.post("/ota/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.success) {
        toast.success("OTA update published successfully");
        setShowForm(false);
        setNewUpdate({ version: "", targetNativeVersion: "", releaseNotes: "" });
        setBundleFile(null);
        fetchUpdates();
      } else {
        toast.error(res.data.message || "Failed to upload update");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error uploading file to server");
    } finally {
      setUploading(false);
    }
  };

  // Compute Metrics
  const totalReleases = updates.length;
  const activeReleases = updates.filter((u) => u.isActive).length;
  const targetNativeVersions = Array.from(new Set(updates.map((u) => u.targetNativeVersion)));
  const latestRelease = updates[0]?.version || "N/A";

  // Filter Updates
  const filteredUpdates = updates.filter((up) => {
    const matchesSearch =
      up.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
      up.releaseNotes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNative =
      nativeFilter === "all" || up.targetNativeVersion === nativeFilter;
    return matchesSearch && matchesNative;
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium tracking-[0.2em] text-[10px] mb-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Over-the-Air Update System
          </div>
          <h1 className="text-4xl md:text-5xl font-medium font-heading text-foreground tracking-tight">
            OTA Updates
          </h1>
          <p className="text-black text-base md:text-lg mt-2 font-medium">
            Publish, disable, or roll back React Native JS bundles instantly.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchUpdates}
            disabled={loading}
            className="group flex flex-row items-center gap-3 px-5 py-2.5 bg-white border border-border rounded-2xl shadow-soft hover:shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin text-primary" : "text-primary group-hover:rotate-180 transition-transform duration-500"}
            />
            <span className="text-xs font-semibold text-slate-800">Sync releases</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium shadow-lg shadow-primary/20 transition-all active:scale-95 animate-fade-in"
          >
            <Plus size={18} />
            Publish Update
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft hover:shadow-elevated transition-all duration-500 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-medium font-heading tracking-widest text-black">
                TOTAL BUNDLES
              </p>
              <h3 className="text-4xl font-medium font-heading mt-2 text-foreground tracking-tight">
                {totalReleases}
              </h3>
            </div>
            <div className="p-4 rounded-2xl shadow-lg bg-primary shadow-primary/20 group-hover:scale-110 transition-transform">
              <FileCode className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft hover:shadow-elevated transition-all duration-500 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-medium font-heading tracking-widest text-black">
                ACTIVE RELEASES
              </p>
              <h3 className="text-4xl font-medium font-heading mt-2 text-foreground tracking-tight">
                {activeReleases}
              </h3>
            </div>
            <div className="p-4 rounded-2xl shadow-lg bg-success shadow-success/20 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft hover:shadow-elevated transition-all duration-500 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-medium font-heading tracking-widest text-black">
                LATEST VERSION
              </p>
              <h3 className="text-4xl font-medium font-heading mt-2 text-foreground tracking-tight">
                {latestRelease}
              </h3>
            </div>
            <div className="p-4 rounded-2xl shadow-lg bg-secondary shadow-secondary/20 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft hover:shadow-elevated transition-all duration-500 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-medium font-heading tracking-widest text-black">
                TARGET NATIVES
              </p>
              <h3 className="text-4xl font-medium font-heading mt-2 text-foreground tracking-tight">
                {targetNativeVersions.length}
              </h3>
            </div>
            <div className="p-4 rounded-2xl shadow-lg bg-primary-hover shadow-primary/20 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-border/50 flex justify-between items-center bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-2xl text-white">
                  <UploadCloud size={20} />
                </div>
                <h3 className="font-heading font-medium text-xl">Publish New OTA Release</h3>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setBundleFile(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Drag and Drop File Area */}
              <div
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : bundleFile
                    ? "border-success bg-success/5"
                    : "border-border hover:border-primary/50 bg-slate-50"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="bundle-upload"
                  accept=".bundle,.js"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="bundle-upload" className="cursor-pointer block">
                  <FileCode
                    className={`mx-auto mb-3 h-10 w-10 ${
                      bundleFile ? "text-success animate-bounce" : "text-slate-400"
                    }`}
                  />
                  {bundleFile ? (
                    <div>
                      <p className="text-sm font-semibold text-success truncate max-w-xs mx-auto">
                        {bundleFile.name}
                      </p>
                      <p className="text-xs text-black mt-1">
                        {(bundleFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Drag and drop your bundle file here, or{" "}
                        <span className="text-primary hover:underline">browse</span>
                      </p>
                      <p className="text-xs text-black mt-1">
                        Supports index.android.bundle or custom JS bundle files
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black tracking-widest mb-2">
                    BUNDLE VERSION
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 1.0.1"
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    value={newUpdate.version}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, version: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black tracking-widest mb-2">
                    COMPATIBLE NATIVE VERSION
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 0.0.1"
                    className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    value={newUpdate.targetNativeVersion}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, targetNativeVersion: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black tracking-widest mb-2">
                  RELEASE NOTES
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe bug fixes, changes or feature upgrades..."
                  className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  value={newUpdate.releaseNotes}
                  onChange={(e) =>
                    setNewUpdate({ ...newUpdate, releaseNotes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl text-xs">
                <AlertCircle className="shrink-0 w-4 h-4 text-amber-600" />
                <p>
                  Deploying this bundle immediately changes client runtime experience. Make sure to target the correct native application version.
                </p>
              </div>

              <Button
                type="submit"
                disabled={uploading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="animate-spin w-4 h-4" />
                    Uploading Bundle...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    Publish Release
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Filters and List Section */}
      <div className="bg-white rounded-[3.5rem] border border-border shadow-soft p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-medium font-heading tracking-tight">
              Release History
            </h3>
            <p className="text-xs text-black font-medium tracking-widest mt-1">
              Rollbacks are instantly applied by disabling the active bundle.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search release notes or version..."
              className="bg-slate-50 border border-border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-xs w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="bg-slate-50 border border-border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-xs text-foreground"
              value={nativeFilter}
              onChange={(e) => setNativeFilter(e.target.value)}
            >
              <option value="all">All Native Versions</option>
              {targetNativeVersions.map((v) => (
                <option key={v} value={v}>
                  Native {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-primary opacity-20 w-12 h-12" />
            </div>
          ) : filteredUpdates.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-3xl">
              <FileCode className="mx-auto text-slate-200 mb-4 w-16 h-16" />
              <h3 className="font-medium text-lg text-black">No OTA releases found</h3>
              <p className="text-xs text-black mt-1">
                Click "Publish Update" above to upload your first React Native bundle.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-bold text-black uppercase tracking-wider">
                  <th className="py-4 px-4">Release Date</th>
                  <th className="py-4 px-4">Bundle Version</th>
                  <th className="py-4 px-4">Target Native</th>
                  <th className="py-4 px-4">Release Notes</th>
                  <th className="py-4 px-4">Bundle Path</th>
                  <th className="py-4 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUpdates.map((release) => (
                  <tr
                    key={release.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-700">
                      {format(new Date(release.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-primary">
                        v{release.version}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Native: {release.targetNativeVersion}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 max-w-xs truncate italic">
                      {release.releaseNotes || "—"}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[120px] truncate text-slate-400 block font-mono">
                          {release.bundlePath}
                        </span>
                        <button
                          onClick={() => handleCopyUrl(release.bundlePath, release.id)}
                          className="text-slate-400 hover:text-primary transition-all p-1.5 hover:bg-slate-100 rounded-lg"
                          title="Copy file URL"
                        >
                          {copiedId === release.id ? (
                            <Check size={14} className="text-success" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Badge
                          className={`text-[9px] px-2 py-0.5 tracking-wider ${
                            release.isActive
                              ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/30"
                              : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/30"
                          }`}
                        >
                          {release.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <button
                          onClick={() => handleToggleStatus(release.id, release.isActive)}
                          className={`focus:outline-none transition-colors p-1 rounded-xl ${
                            release.isActive
                              ? "text-primary hover:text-primary-hover"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title={release.isActive ? "Deactivate (triggers rollback)" : "Activate"}
                        >
                          {release.isActive ? (
                            <ToggleRight size={28} />
                          ) : (
                            <ToggleLeft size={28} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
