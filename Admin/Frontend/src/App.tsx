import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UserManagementPage from "./pages/users/UserManagementPage";
import UserDetailsPage from "./pages/users/UserDetailsPage";
import VerificationPage from "./pages/moderation/VerificationPage";
import KYCVerificationPage from "./pages/moderation/KYCVerificationPage";
import FeedbackManagementPage from "./pages/moderation/FeedbackManagementPage";
import ReportsPage from "./pages/reports/ReportsPage";
import AnnouncementsPage from "./pages/announcements/AnnouncementsPage";
import BannerManagementPage from "./pages/banners/BannerManagementPage";
import AuditLogsPage from "./pages/logs/AuditLogsPage";
import ProfileAuditPage from "./pages/moderation/ProfileAuditPage";
import AnalyticsDashboardPage from "./pages/analytics/AnalyticsDashboardPage";
import SettingsPage from "./pages/settings/SettingsPage";
import AdminsPage from "./pages/admins/AdminsPage";
import UserRequestsPage from "./pages/moderation/UserRequestsPage";
import SuccessStoriesPage from "./pages/moderation/SuccessStoriesPage";
import PlanManagementPage from "./pages/payments/PlanManagementPage";
import TransactionsPage from "./pages/payments/TransactionsPage";
import CouponManagementPage from "./pages/payments/CouponManagementPage";
import AdminLayout from "./layouts/AdminLayout";
import NetworkStatus from "./components/NetworkStatus";

import { useAdminAuth } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthProvider";
import { Provider } from "react-redux";
import { store } from "./store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, admin } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if current admin has permission
  if (allowedRoles && !allowedRoles.includes(admin?.role || "")) {
    return <Navigate to="/dashboard" replace />;
  }

  // Wrap protected pages in Admin Layout
  return <AdminLayout>{children}</AdminLayout>;
};

const AppContent = () => {
  const { isAuthenticated } = useAdminAuth();

  return (
    <>
      <Toaster position="top-right" richColors />
      <NetworkStatus />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/users/:id"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/verification"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <VerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/kyc-verification"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <KYCVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/audit"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <ProfileAuditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/feedback"
          element={
            <ProtectedRoute
              allowedRoles={["superadmin", "moderator", "support"]}
            >
              <FeedbackManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/requests"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <UserRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/success-stories"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <SuccessStoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/reports"

          element={
            <ProtectedRoute
              allowedRoles={["superadmin", "moderator", "support"]}
            >
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/announcements"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/banners"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <BannerManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/logs"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <AnalyticsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admins"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <AdminsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute
              allowedRoles={["superadmin", "moderator", "support"]}
            >
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        {/* Payment Management */}
        <Route
          path="/dashboard/payments/plans"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <PlanManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/payments/coupons"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <CouponManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/payments/transactions"
          element={
            <ProtectedRoute allowedRoles={["superadmin", "moderator"]}>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />

        {/* Placeholder for other routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;





