import { useEffect, useState } from "react";
import { UserPlus, Shield, Mail, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import api from "../../lib/api";
import { Button } from "../../components/ui/button";

interface Admin {
    id: string;
    username: string;
    email: string;
    role: "superadmin" | "moderator" | "support";
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
}

const AdminsPage = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState<{
        username: string;
        email: string;
        password: string;
        role: Admin["role"];
    }>({
        username: "",
        email: "",
        password: "",
        role: "moderator",
    });

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admins");
            setAdmins(res.data.data);
        } catch {
            toast.error("Failed to load admins");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/admins", newAdmin);
            toast.success("Admin created successfully");
            setShowAddModal(false);
            setNewAdmin({ username: "", email: "", password: "", role: "moderator" });
            fetchAdmins();
        } catch (error: unknown) {
            toast.error(
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create admin"
            );
        }
    };

    const handleUpdateStatus = async (id: string, isActive: boolean) => {
        try {
            await api.patch(`/admins/${id}`, { isActive });
            toast.success(`Admin account ${isActive ? 'activated' : 'deactivated'}`);
            fetchAdmins();
        } catch {
            toast.error("Status update failed");
        }
    };

    const handleUpdateRole = async (id: string, role: Admin["role"]) => {
        try {
            await api.patch(`/admins/${id}`, { role });
            toast.success(`Role updated to ${role}`);
            fetchAdmins();
        } catch (error: unknown) {
            toast.error(
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Role update failed"
            );
        }
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this admin? This action cannot be undone.")) return;
        try {
            await api.delete(`/admins/${id}`);
            toast.success("Admin deleted");
            fetchAdmins();
        } catch (error: unknown) {
            toast.error(
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Deletion failed"
            );
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "superadmin": return "bg-purple-100 text-purple-700";
            case "moderator": return "bg-blue-100 text-blue-700";
            case "support": return "bg-green-100 text-green-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-medium font-heading text-foreground tracking-tight">
                        Admins
                    </h1>
                    <p className="text-black mt-1.5 font-medium">
                        Manage staff access and roles
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="rounded-2xl h-14 px-8 font-medium  tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 bg-primary group"
                >
                    <UserPlus size={18} className="transition-transform group-hover:scale-110" />
                    Add Admin
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse"></div>
                    ))
                ) : (
                    admins.map((admin) => (
                        <div
                            key={admin.id}
                            className="bg-white border border-border rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl ${getRoleColor(admin.role)} shadow-sm`}>
                                    <Shield size={24} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${admin.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    <span className="text-[10px] font-medium  tracking-widest text-black">
                                        {admin.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1 mb-8">
                                <h3 className="text-xl font-medium text-foreground truncate">{admin.username}</h3>
                                <div className="flex items-center gap-2 text-black text-sm">
                                    <Mail size={14} />
                                    <span className="truncate">{admin.email}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-medium  tracking-wider ${getRoleColor(admin.role)}`}>
                                    {admin.role}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-black text-[10px] font-medium  tracking-wider">
                                    Joined {format(new Date(admin.createdAt), "MMM yyyy")}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-6 border-t border-border/50">
                                <select
                                    className="bg-slate-50 border border-border text-[10px] font-medium  tracking-widest px-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    value={admin.role}
                                    onChange={(e) => handleUpdateRole(admin.id, e.target.value as Admin["role"])}
                                >
                                    <option value="superadmin">Superadmin</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="support">Support</option>
                                </select>

                                <div className="ml-auto flex gap-1">
                                    <button
                                        onClick={() => handleUpdateStatus(admin.id, !admin.isActive)}
                                        className={`p-2 rounded-xl transition-all ${admin.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                                        title={admin.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {admin.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAdmin(admin.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Account"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-10 border-b border-border/50 bg-primary/5">
                            <h3 className="font-heading font-medium text-2xl mb-1">Add Admin</h3>
                            <p className="text-sm text-black">Create a new admin account</p>
                        </div>

                        <form onSubmit={handleCreateAdmin} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-medium  text-black tracking-widest mb-2">Username</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-slate-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        placeholder="e.g. rahul_admin"
                                        value={newAdmin.username}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium  text-black tracking-widest mb-2">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full bg-slate-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        placeholder="name@company.com"
                                        value={newAdmin.email}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium  text-black tracking-widest mb-2">Initial Password</label>
                                    <input
                                        required
                                        type="password"
                                        className="w-full bg-slate-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        placeholder="••••••••"
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium  text-black tracking-widest mb-2">Role</label>
                                    <select
                                        className="w-full bg-slate-50 border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium  tracking-widest text-[10px]"
                                        value={newAdmin.role}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as Admin["role"] })}
                                    >
                                        <option value="superadmin">Superadmin (Full Access)</option>
                                        <option value="moderator">Moderator (Content Only)</option>
                                        <option value="support">Support (User Help Only)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 rounded-2xl h-14 font-medium  tracking-widest text-xs"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 rounded-2xl h-14 font-medium  tracking-widest text-xs bg-primary shadow-xl shadow-primary/20"
                                >
                                    Create Admin
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminsPage;





