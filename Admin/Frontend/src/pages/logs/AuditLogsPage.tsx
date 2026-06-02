import { useEffect, useState } from "react";
import {
  Activity,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";

interface AdminLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  admin: {
    username: string;
    email: string;
  };
}

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/logs?page=${page}&search=${searchTerm}`);
      setLogs(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch {
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-medium text-foreground">
            Activity Logs
          </h1>
          <p className="text-sm text-black">Monitor all admin activity</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black"
            size={18}
          />
          <input
            type="text"
            placeholder="Search activity..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-border rounded-4xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-border/50">
                <th className="px-6 py-4 text-xs font-medium tracking-wider text-black">
                  Admin
                </th>
                <th className="px-6 py-4 text-xs font-medium tracking-wider text-black">
                  Action
                </th>
                <th className="px-6 py-4 text-xs font-medium tracking-wider text-black">
                  Target
                </th>
                <th className="px-6 py-4 text-xs font-medium tracking-wider text-black">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-xs font-medium tracking-wider text-black">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-black">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                          {log.admin.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {log.admin.username}
                          </p>
                          <p className="text-[10px] text-black">
                            {log.admin.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.action.includes("Delete") ? (
                          <ShieldAlert size={14} className="text-red-500" />
                        ) : (
                          <Activity size={14} className="text-blue-500" />
                        )}
                        <span className="text-sm font-medium">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-md font-mono">
                        {log.targetType}: {log.targetId?.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-black">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-black font-mono">
                        <Monitor size={12} />
                        {log.ipAddress || "Internal"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-black">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;