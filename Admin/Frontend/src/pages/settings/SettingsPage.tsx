import { useState } from "react";
import { useAdminAuth } from "../../context/AuthContext";
import { User, Mail, Lock, Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";
import { Button } from "../../components/ui/button";

const SettingsPage = () => {
  const { admin, updateAdmin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: admin?.username || "",
    email: admin?.email || "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);
      const res = await api.patch("/profile", {
        username: formData.username,
        email: formData.email,
        password: formData.password || undefined
      });

      if (res.data.success) {
        updateAdmin(res.data.admin);
        toast.success("Profile updated successfully");
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (error instanceof Error ? error.message : "Failed to update profile");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-heading font-medium tracking-tight text-foreground">Account Settings</h1>
        <p className="text-black mt-1">Manage your login details and account security</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1 border-2 border-border bg-white rounded-4xl p-8 h-fit shadow-soft">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={48} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground capitalize">{admin?.role}</h3>
              <p className="text-xs font-medium text-black  tracking-widest mt-1">Role: {admin?.role}</p>
            </div>
            <div className="pt-4 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-success/10 text-success text-[10px] font-medium  rounded-full border border-success/20">Verified</span>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-medium  rounded-full border border-primary/20">Active</span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="border-2 border-border bg-white rounded-4xl overflow-hidden shadow-soft">
            <div className="p-8 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="text-primary" size={20} />
                <h4 className="font-medium text-xs  tracking-[0.2em] text-foreground">Login Details</h4>
              </div>
              {loading && <Loader2 className="animate-spin text-primary" size={18} />}
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium  text-black tracking-widest flex items-center gap-2">
                    <User size={12} /> Display Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-black"
                    placeholder="Username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium  text-secondary tracking-widest flex items-center gap-2">
                    <Mail size={12} /> Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-black"
                    placeholder="email@eternalmatch.com"
                    required
                  />
                </div>
              </div>

              <hr className="border-border" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium  text-black tracking-widest flex items-center gap-2">
                    <Lock size={12} /> New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-black"
                    placeholder="••••••••"
                  />
                  <p className="text-[10px] text-black font-medium italic">Leave blank to keep current</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium  text-black tracking-widest flex items-center gap-2">
                    <Lock size={12} /> Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-black"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-muted/30 border-t border-border flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="h-14 rounded-2xl px-8 bg-secondary text-secondary-foreground font-medium  tracking-widest text-[10px] shadow-xl shadow-secondary/20 hover:bg-secondary-hover gap-3"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Update Profile
              </Button>
            </div>
          </form>

          <footer className="text-center">
            <p className="text-[10px] font-medium  tracking-tighter text-black">
              Your account security is important.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;





