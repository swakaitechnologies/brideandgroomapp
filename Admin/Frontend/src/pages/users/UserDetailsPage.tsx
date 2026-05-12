import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchUserDetails, toggleUserStatus, clearSelectedUser } from "../../store/slices/userSlice";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    User as UserIcon,
    ShieldAlert,
    ShieldCheck,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

const UserDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { selectedUser: user, loading, error } = useSelector((state: RootState) => state.users);

    useEffect(() => {
        if (id) {
            dispatch(fetchUserDetails(id));
        }
        return () => {
            dispatch(clearSelectedUser());
        };
    }, [id, dispatch]);

    const handleToggleStatus = async () => {
        if (!user) return;
        const action = user.isBlocked ? "unblock" : "block";
        if (window.confirm(`Are you sure you want to ${action} this user?`)) {
            try {
                await dispatch(toggleUserStatus(user.id)).unwrap();
                toast.success(`User ${action}ed successfully`);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : (typeof err === "string" ? err : `Failed to ${action} user`);
                toast.error(message);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-black font-medium">Loading user details...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="p-4 bg-red-50 rounded-full mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-medium text-foreground mb-2">User Not Found</h2>
                <p className="text-black mb-6">{error || "The user you are looking for does not exist or has been deleted."}</p>
                <Button onClick={() => navigate("/dashboard/users")} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to User Management
                </Button>
            </div>
        );
    }

    const profile = user.profile;

    // Calculate age from dob
    const calculateAge = (dobString?: string) => {
        if (!dobString) return "N/A";
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white border border-border rounded-xl hover:bg-muted transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-medium font-heading text-foreground">
                            User Details
                        </h1>
                        <p className="text-black mt-1">
                            Viewing complete profile information for {user.firstName} {user.lastName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={user.isBlocked ? "outline" : "destructive"}
                        onClick={handleToggleStatus}
                        className="rounded-xl h-11 px-6 font-medium"
                    >
                        {user.isBlocked ? (
                            <><ShieldCheck className="w-4 h-4 mr-2" /> Unblock User</>
                        ) : (
                            <><ShieldAlert className="w-4 h-4 mr-2" /> Block User</>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - User Overview */}
                <div className="lg:col-span-1 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden"
                    >
                        <div className="h-32 bg-linear-to-r from-primary/10 to-secondary/10 relative">
                            <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-lg border border-border">
                                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-medium">
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                            </div>
                        </div>
                        <div className="pt-16 p-8">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-medium text-foreground">
                                    {user.firstName} {user.lastName}
                                </h2>
                                {user.isOnline && (
                                    <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-medium  tracking-wider">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Online
                                    </span>
                                )}
                            </div>
                            <p className="text-black text-sm flex items-center gap-2 mb-6">
                                <Clock className="w-4 h-4" />
                                Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl">
                                    <Mail className="w-5 h-5 text-black" />
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-black  tracking-tight">Email Address</p>
                                        <p className="text-sm font-medium truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl">
                                    <Phone className="w-5 h-5 text-black" />
                                    <div>
                                        <p className="text-xs font-medium text-black  tracking-tight">Mobile Number</p>
                                        <p className="text-sm font-medium">{user.mobile || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Verification Status Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm p-8"
                    >
                        <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Verification Status
                        </h3>
                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${profile?.verificationStatus === 'approved'
                            ? 'bg-green-50 border-green-100 text-green-700'
                            : profile?.verificationStatus === 'rejected'
                                ? 'bg-red-50 border-red-100 text-red-700'
                                : 'bg-amber-50 border-amber-100 text-amber-700'
                            }`}>
                            <div className="flex items-center gap-3">
                                {profile?.verificationStatus === 'approved' ? <CheckCircle2 className="w-5 h-5" /> :
                                    profile?.verificationStatus === 'rejected' ? <XCircle className="w-5 h-5" /> :
                                        <Clock className="w-5 h-5" />}
                                <div>
                                    <p className="text-sm font-medium  tracking-wider">
                                        {profile?.verificationStatus || 'Pending'}
                                    </p>
                                    <p className="text-[10px] opacity-80">Profile Verification</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">Account ID</span>
                                <span className="font-mono font-medium text-xs">{profile?.customId || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">System ID</span>
                                <span className="font-mono font-medium text-[10px] opacity-50">{user.id}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Detailed Profile */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden"
                    >
                        <div className="px-8 py-6 border-b border-border/60 flex items-center justify-between bg-muted/10">
                            <h3 className="text-xl font-medium font-heading flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary" />
                                Profile Information
                            </h3>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {/* Basic Details */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-medium  tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2">Basic Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-black mb-1">Gender</p>
                                            <p className="text-sm font-medium">{profile?.gender || "Not specified"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Date of Birth</p>
                                            <p className="text-sm font-medium">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Age</p>
                                            <p className="text-sm font-medium">{calculateAge(profile?.dob)} Years</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Marital Status</p>
                                            <p className="text-sm font-medium">{profile?.maritalStatus || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Religious/Cultural */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-medium  tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2">Religion & Culture</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-black mb-1">Religion</p>
                                            <p className="text-sm font-medium">{profile?.religion || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Mother Tongue</p>
                                            <p className="text-sm font-medium">{profile?.motherTongue || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Caste</p>
                                            <p className="text-sm font-medium">{profile?.caste || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Sub-Caste</p>
                                            <p className="text-sm font-medium">{profile?.subCaste || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-medium  tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2">Location Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs text-black mb-1 flex items-center gap-1">
                                                <MapPin size={12} /> Current Location
                                            </p>
                                            <p className="text-sm font-medium">{profile?.city}, {profile?.state}, {profile?.country}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-medium  tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2">Professional Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs text-black mb-1">Education</p>
                                            <p className="text-sm font-medium">{profile?.highestDegree || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Occupation</p>
                                            <p className="text-sm font-medium">{profile?.profession || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Annual Income</p>
                                            <p className="text-sm font-medium">{profile?.income || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bio/About */}
                            <div className="mt-12 p-6 bg-muted/30 rounded-3xl border border-dashed border-border/60">
                                <h4 className="text-xs font-medium  tracking-[0.2em] text-black mb-4">About the User</h4>
                                <p className="text-sm leading-relaxed text-foreground/80 italic">
                                    "{profile?.bio || "No bio description provided by the user yet."}"
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Activity Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm p-8"
                    >
                        <h3 className="text-xl font-medium font-heading mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Calendar size={14} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Account Created</p>
                                        <p className="text-xs text-black">{new Date(user.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-black  bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">System</span>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 size={14} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Email Verified</p>
                                        <p className="text-xs text-black">{user.isEmailVerified ? "Completed" : "Pending"}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-black  bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">Security</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsPage;





