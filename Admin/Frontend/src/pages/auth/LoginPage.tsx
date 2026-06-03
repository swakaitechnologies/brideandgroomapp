import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

const LoginPage = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const { admin, token } = response.data;
      if (token) {
        localStorage.setItem("adminToken", token);
      }
      login(admin);
      toast.success("Welcome back, Admin!");
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed. Please check credentials."
      );
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-border overflow-hidden z-10"
      >
        <div className="bg-primary/5 p-8 pb-6 text-center border-b border-border/50">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-primary/10">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-medium font-heading text-foreground">
            Admin Portal
          </h1>
          <p className="text-black text-sm mt-1">
            Secure access for authorized personnel only
          </p>
        </div>

        <div className="p-8 pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium  tracking-wider text-black">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium  tracking-wider text-black">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl font-medium text-base mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Access Dashboard"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-black mt-6">
            Protected by{" "}
            <span className="font-medium text-primary">SecureGuard™</span>{" "}
            Technology
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;





