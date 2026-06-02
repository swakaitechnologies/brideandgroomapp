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
  Image as ImageIcon,
  Cpu,
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
    path: "/dashboard/banners",
    label: "Manage Banners",
    icon: ImageIcon,
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
    path: "/dashboard/ota",
    label: "OTA Updates",
    icon: Cpu,
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
    path: "/dashboard/payments/coupons",
    label: "Manage Coupons",
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
          "bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-50 w-64 transition-all duration-300 flex flex-col",
          !isSidebarOpen && "w-0 md:w-20 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-white">
          <div className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-lg">
              A
            </span>
          </div>
          <span
            className={cn(
              "ml-3 font-heading font-semibold text-base text-slate-900 tracking-wider transition-opacity duration-300",
              !isSidebarOpen && "md:hidden lg:block",
            )}
          >
            Matrimony
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-xs tracking-wider group relative",
                    "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon
                    size={16}
                    className="shrink-0 text-slate-400 group-hover:text-slate-600"
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-xs tracking-wider group relative",
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0",
                    isActive
                      ? "text-slate-900"
                      : "text-slate-400 group-hover:text-slate-600",
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
                  <div className="md:block lg:hidden absolute left-14 bg-slate-900 text-white text-[10px] font-medium tracking-wider px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shadow-sm">
              {admin?.role?.slice(0, 2) || "AD"}
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                !isSidebarOpen && "md:hidden lg:block",
              )}
            >
              <p className="text-xs font-semibold text-slate-800 truncate tracking-tight">
                {admin?.username || admin?.email}
              </p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {admin?.role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium tracking-wider text-xs"
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





