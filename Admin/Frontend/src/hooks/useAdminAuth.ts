import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AuthProvider");
  }
  return context;
};
