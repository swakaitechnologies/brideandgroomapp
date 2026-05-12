import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Settings,
  LogOut,
  FileText,
  Menu,
  Bell,
  CheckCircle,
  AlertTriangle,
  Megaphone,
  RefreshCw,
  Heart,
  Activity,
  CreditCard,
} from "lucide-react";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_ITEMS = [
  {
    path: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["superadmin", "moderator", "support"],
  },
  {
    path: import.meta.env.VITE_UMAMI_URL || "https://analytics.brideandgroom.co.in",
    label: "Traffic Analytics",
    icon: Activity,
    roles: ["superadmin"],
    external: true,
  },
  {
    path: "/dashboard/users",
    label: "User Management",
    icon: Users,
    roles: ["superadmin", "moderator"],
  },
  {
    path: "/dashboard/verification",
    label: "Moderation",
    icon: CheckCircle,
    roles: ["superadmin", "moderator"],
  },
  {
    path: "/dashboard/kyc-verification",
    label: "KYC Verification",
    icon: CheckCircle,
    roles: ["superadmin", "moderator"],
  },
  {
    path: "/dashboard/audit",
    label: "Profile Audit",
    icon: AlertTriangle,
    roles: ["superadmin", "moderator"],
  },
  {
    path: "/dashboard/reports",
    label: "User Reports",
    icon: AlertTriangle,
    roles: ["superadmin", "moderator", "support"],
  },
  {
    path: "/dashboard/feedback",
    label: "User Feedback",
    icon: FileText,
    roles: ["superadmin", "moderator", "support"],
  },
  {
    path: "/dashboard/requests",
    label: "Change Requests",
    icon: RefreshCw,
    roles: ["superadmin", "moderator"],
  },
  {
    path: "/dashboard/announcements",
    label: "Announcements",
    icon: Megaphone,
    roles: ["superadmin", "moderator"],
  },
  {
    path: "/dashboard/success-stories",
    label: "Success Stories",
    icon: Heart,
    roles: ["superadmin", "moderator"],
  },
  {
    path: "/dashboard/admins",

    label: "Admin Roles",
    icon: UserCog,
    roles: ["superadmin"],
  },
  {
    path: "/dashboard/logs",
    label: "Audit Logs",
    icon: FileText,
    roles: ["superadmin"],
  },
  {
    path: "/dashboard/settings",
    label: "Account Settings",
    icon: Settings,
    roles: ["superadmin", "moderator", "support"],
  },
  {
    path: "/dashboard/payments/plans",
    label: "Manage Plans",
    icon: CreditCard,
    roles: ["superadmin"],
  },
  {
    path: "/dashboard/payments/transactions",
    label: "Transactions",
    icon: CreditCard,
    roles: ["superadmin", "moderator"],
  },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Filter sidebar items based on current admin role
  const filteredItems = SIDEBAR_ITEMS.filter((item) =>
    item.roles.includes(admin?.role || ""),
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "bg-primary border-r border-primary/20 fixed inset-y-0 left-0 z-50 w-64 transition-all duration-300 shadow-xl flex flex-col",
          !isSidebarOpen && "w-0 md:w-20 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
            <span className="text-secondary-foreground font-medium text-xl">
              A
            </span>
          </div>
          <span
            className={cn(
              "ml-3 font-heading font-medium text-lg text-white tracking-widest  transition-opacity duration-300",
              !isSidebarOpen && "md:hidden lg:block",
            )}
          >
            Matrimony
          </span>
        </div>

        <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.external) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all font-medium text-xs tracking-widest group relative",
                    "text-accent/60 hover:bg-white/5 hover:text-accent",
                  )}
                >
                  <Icon
                    size={18}
                    className="shrink-0 text-accent/40 group-hover:text-accent"
                  />
                  <span
                    className={cn(
                      "transition-opacity duration-300 whitespace-nowrap",
                      !isSidebarOpen && "md:hidden lg:block",
                    )}
                  >
                    {item.label}
                  </span>
                </a>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all font-medium text-xs  tracking-widest group relative",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-lg shadow-black/20"
                    : "text-accent/60 hover:bg-white/5 hover:text-accent",
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0",
                    isActive
                      ? "text-secondary-foreground"
                      : "text-accent/40 group-hover:text-accent",
                  )}
                />
                <span
                  className={cn(
                    "transition-opacity duration-300 whitespace-nowrap",
                    !isSidebarOpen && "md:hidden lg:block",
                  )}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="md:block lg:hidden absolute left-14 bg-primary-hover text-white text-[10px] font-medium  tracking-widest px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary font-medium text-xs  shadow-inner">
              {admin?.role?.slice(0, 2) || "AD"}
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                !isSidebarOpen && "md:hidden lg:block",
              )}
            >
              <p className="text-xs font-medium text-white truncate tracking-tight">
                {admin?.username || admin?.email}
              </p>
              <p className="text-[9px] text-accent/50 font-medium  tracking-widest">
                {admin?.role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-medium  tracking-widest text-[9px]"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-3" />
            <span
              className={cn(
                "transition-opacity duration-300",
                !isSidebarOpen && "md:hidden lg:block",
              )}
            >
              Log Out
            </span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 min-h-screen",
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        )}
      >
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-border sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-3 rounded-2xl hover:bg-muted text-black md:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-heading font-medium text-xl text-foreground tracking-tight">
              {SIDEBAR_ITEMS.find((i) => i.path === location.pathname)?.label ||
                "Admin Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-medium  tracking-widest text-black">
                System Status
              </span>
              <span className="text-[11px] font-medium text-success flex items-center gap-1.5 ">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                Operational
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-3 rounded-2xl bg-muted/50 hover:bg-muted text-black transition-all border border-border group"
              title="Refresh Data"
            >
              <RefreshCw
                size={20}
                className="group-hover:rotate-180 transition-transform duration-500"
              />
            </button>
            <button className="relative p-3 rounded-2xl bg-muted/50 hover:bg-muted text-black transition-all border border-border">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white animate-bounce" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;





