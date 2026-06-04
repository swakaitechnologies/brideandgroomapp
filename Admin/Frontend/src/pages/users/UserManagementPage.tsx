import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  deleteUser,
  toggleUserStatus,
} from "../../store/slices/userSlice";
import { RootState, AppDispatch } from "../../store";
import {
  Search,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { fetchRecentRegistrations } from "../../store/slices/dashboardSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { Skeleton } from "../../components/ui/skeleton";

const UserManagementPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { users, pagination, loading, error } = useSelector(
    (state: RootState) => state.users,
  );
  const { recentRegistrations } = useSelector(
    (state: RootState) => state.dashboard,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchRecentRegistrations());
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchUsers({ page, search: searchTerm }));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, page, searchTerm]);

  const handleToggleStatus = async (id: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? "unban" : "ban";
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await dispatch(toggleUserStatus(id)).unwrap();
        toast.success(`User ${action}ned successfully`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : (typeof err === "string" ? err : `Failed to ${action} user`);
        toast.error(message);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action is irreversible. All profile data, photos, and messages will be permanently removed.",
      )
    ) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        toast.success("User and all related data deleted successfully");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : (typeof err === "string" ? err : "Failed to delete user");
        toast.error(message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium font-heading text-foreground tracking-tight">
            User Management
          </h1>
          <p className="text-black mt-1.5 font-medium">
            Manage and monitor platform users.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              className="pl-11 pr-4 py-3 bg-white border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none w-full md:w-80 shadow-soft transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              dispatch(fetchRecentRegistrations());
              dispatch(fetchUsers({ page, search: searchTerm }));
            }}
            disabled={loading}
            className="p-3.5 bg-white border border-border rounded-2xl text-primary hover:bg-muted transition-all shadow-soft group disabled:opacity-50"
            title="Refresh User Data"
          >
            <RefreshCw
              size={20}
              className={cn(
                loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
              )}
            />
          </button>
        </div>
      </div>

      {/* Recent Registrations Summary */}
      <div className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium font-heading">
              Recent Registrations
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentRegistrations.length > 0 ? (
            recentRegistrations.map((user) => (
              <div
                key={user.id}
                onClick={() => navigate(`/dashboard/users/${user.id}`)}
                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary/30 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-medium text-black group-hover:text-primary transition-colors">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[10px] text-black truncate">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${user.isOnline ? "bg-green-100 text-green-700" : "bg-slate-200 text-black"}`}
                  >
                    {user.isOnline ? "Online" : "Offline"}
                  </span>
                  <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-sm text-black">
              No recent registrations found
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/60">
                <th className="px-8 py-5 text-[10px] font-medium  tracking-[0.15em] text-black/70">
                  User Account
                </th>
                <th className="px-6 py-5 text-[10px] font-medium  tracking-[0.15em] text-black/70">
                  ID
                </th>
                <th className="px-6 py-5 text-[10px] font-medium  tracking-[0.15em] text-black/70">
                  Gender
                </th>
                <th className="px-6 py-5 text-[10px] font-medium  tracking-[0.15em] text-black/70">
                  Joined Date
                </th>
                <th className="px-6 py-5 text-[10px] font-medium  tracking-[0.15em] text-black/70">
                  Presence
                </th>
                <th className="px-6 py-5 text-[10px] font-medium  tracking-[0.15em] text-black/70">
                  Verification
                </th>
                <th className="px-8 py-5 text-[10px] font-medium  tracking-[0.15em] text-black/70 text-right">
                  Control
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && users.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-3.5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-3.5 w-14" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-3.5 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-8 h-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-black"
                  >
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/dashboard/users/${user.id}`)}
                    className={`hover:bg-muted/20 transition-colors group cursor-pointer ${
                      user.isBlocked ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-medium shadow-inner border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.isBlocked && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded shadow-sm">
                                <ShieldAlert size={10} />
                                BANNED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-black">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-black">
                      {user.profile?.customId || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.profile?.gender || "Not specified"}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium  tracking-wider ${
                          user.isOnline
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.isOnline ? "Active" : "Offline"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium  tracking-wider ${
                          user.profile?.verificationStatus === "approved"
                            ? "bg-green-100 text-green-700"
                            : user.profile?.verificationStatus === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {user.profile?.verificationStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(user.id, user.isBlocked);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isBlocked
                              ? "hover:bg-green-50 text-green-600"
                              : "hover:bg-amber-50 text-amber-600"
                          }`}
                          title={user.isBlocked ? "Unban User" : "Ban User"}
                        >
                          {user.isBlocked ? (
                            <ShieldCheck size={16} />
                          ) : (
                            <ShieldAlert size={16} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          title="Delete User Permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between">
          <p className="text-sm text-black">
            Showing <span className="font-medium">{(page - 1) * 10 + 1}</span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(page * 10, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                    page === p ? "bg-primary text-white" : "hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              disabled={page === pagination.pages || loading}
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;





