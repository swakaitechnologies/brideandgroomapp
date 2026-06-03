import { useState, ReactNode, useEffect } from "react";
import api from "../lib/api";
import { AuthContext, AdminUser } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Warm up the CSRF session cookie/header on application mount
    const initCsrf = async () => {
      try {
        await api.get("/health");
      } catch (err) {
        console.warn("⚠️ Failed to initialize CSRF token on startup:", err);
      }
    };
    initCsrf();
  }, []);

  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const storedAdmin = localStorage.getItem("adminUser");
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  });

  const login = (newAdmin: AdminUser) => {
    localStorage.setItem("adminUser", JSON.stringify(newAdmin));
    setAdmin(newAdmin);
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Ignore logout errors as we clear local state anyway
    }
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    setAdmin(null);
  };

  const updateAdmin = (newAdmin: AdminUser) => {
    localStorage.setItem("adminUser", JSON.stringify(newAdmin));
    setAdmin(newAdmin);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        login,
        logout,
        updateAdmin,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
