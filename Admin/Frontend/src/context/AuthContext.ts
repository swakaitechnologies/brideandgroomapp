import { createContext, useContext } from "react";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  username: string;
}

export interface AuthContextType {
  admin: AdminUser | null;
  login: (admin: AdminUser) => void;
  logout: () => void;
  updateAdmin: (admin: AdminUser) => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AuthProvider");
  }
  return context;
};
