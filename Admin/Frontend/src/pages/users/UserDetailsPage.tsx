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
    Loader2,
    Crown,
    CreditCard,
    MessageSquare,
    PhoneCall,
    UserCheck,
    Sparkles
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
                                {user.isOnline ? (
                                    <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-medium tracking-wider">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Online
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium tracking-wider">
                                        Offline
                                    </span>
                                )}
                            </div>
                            <div className="text-black text-sm space-y-1 mb-6">
                                <p className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </p>
                                {user.lastSeen && (
                                    <p className="text-xs text-black/60 pl-6">
                                        Last active: {new Date(user.lastSeen).toLocaleString()}
                                    </p>
                                )}
                            </div>

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
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">Email Verified</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {user.isEmailVerified ? "Verified" : "Pending"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">Mobile Verified</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isMobileVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {user.isMobileVerified ? "Verified" : "Pending"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">KYC Status</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${profile?.isKycVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {profile?.isKycVerified ? "Verified" : "Unverified"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">Identity Verified</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isIdentityVerified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                    {user.isIdentityVerified ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">Social Verified</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isSocialVerified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                    {user.isSocialVerified ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                                <span className="text-black">System Role</span>
                                <span className="font-semibold text-xs capitalize">{user.role || "User"}</span>
                            </div>
                            {user.autoSuspended && (
                                <div className="flex items-center justify-between text-sm py-2 border-b border-border/50 text-red-600 font-semibold">
                                    <span>Auto Suspended</span>
                                    <span>Suspended</span>
                                </div>
                            )}
                            {user.isDeleted && (
                                <div className="flex items-center justify-between text-sm py-2 border-b border-border/50 text-red-600 font-semibold">
                                    <span>Account Status</span>
                                    <span>Deleted</span>
                                </div>
                            )}
                            {profile?.rejectionReason && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl mt-3">
                                    <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</p>
                                    <p className="text-xs text-red-800 font-medium">{profile.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Subscription Details Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm p-8"
                    >
                        <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            Subscription Details
                        </h3>

                        {user.subscriptions && user.subscriptions.length > 0 ? (
                            (() => {
                                const activeSub = user.subscriptions.find(s => s.status === 'active');
                                const latestSub = user.subscriptions[0];
                                const displaySub = activeSub || latestSub;
                                const plan = displaySub.plan;

                                return (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-black">Current Plan</p>
                                                <h4 className="text-xl font-semibold text-foreground flex items-center gap-2 mt-0.5">
                                                    {plan?.name || "Premium Plan"}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase ${displaySub.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : displaySub.status === 'expired'
                                                                ? 'bg-gray-100 text-gray-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {displaySub.status}
                                                    </span>
                                                </h4>
                                            </div>
                                            <div className="p-3 bg-amber-50 rounded-2xl">
                                                <Crown className="w-6 h-6 text-amber-500" />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-black flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-black" />
                                                    Start Date
                                                </span>
                                                <span className="font-medium">{new Date(displaySub.startDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-black flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-black" />
                                                    End Date
                                                </span>
                                                <span className="font-medium">{new Date(displaySub.endDate).toLocaleDateString()}</span>
                                            </div>
                                            {plan?.price && (
                                                <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                                                    <span className="text-black flex items-center gap-1.5">
                                                        <CreditCard className="w-4 h-4 text-black" />
                                                        Price
                                                    </span>
                                                    <span className="font-medium text-primary">
                                                        {plan.price.INR ? `₹${plan.price.INR}` : plan.price.USD ? `$${plan.price.USD}` : JSON.stringify(plan.price)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Usage limits */}
                                        <div className="space-y-4">
                                            <h5 className="text-xs font-semibold text-black uppercase tracking-wider">Usage & Limits</h5>

                                            {/* Contacts limit */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-black flex items-center gap-1.5">
                                                        <UserCheck className="w-4 h-4 text-black" />
                                                        Contacts Viewed
                                                    </span>
                                                    <span className="font-medium">
                                                        {displaySub.contactsUsed} / {plan?.maxContacts === -1 ? "Unlimited" : plan?.maxContacts ?? "N/A"}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: plan?.maxContacts && plan.maxContacts > 0
                                                                ? `${Math.min(100, (displaySub.contactsUsed / plan.maxContacts) * 100)}%`
                                                                : '100%'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Messages limit */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-black flex items-center gap-1.5">
                                                        <MessageSquare className="w-4 h-4 text-black" />
                                                        Messages Sent
                                                    </span>
                                                    <span className="font-medium">
                                                        {displaySub.messagesUsed} / {plan?.maxMessages === -1 ? "Unlimited" : plan?.maxMessages ?? "N/A"}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{
                                                            width: plan?.maxMessages && plan.maxMessages > 0
                                                                ? `${Math.min(100, (displaySub.messagesUsed / plan.maxMessages) * 100)}%`
                                                                : '100%'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Calls limit */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-black flex items-center gap-1.5">
                                                        <PhoneCall className="w-4 h-4 text-black" />
                                                        Calls Initiated
                                                    </span>
                                                    <span className="font-medium">
                                                        {displaySub.callsUsed} / {plan?.maxCalls === -1 ? "Unlimited" : plan?.maxCalls ?? "N/A"}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500"
                                                        style={{
                                                            width: plan?.maxCalls && plan.maxCalls > 0
                                                                ? `${Math.min(100, (displaySub.callsUsed / plan.maxCalls) * 100)}%`
                                                                : '100%'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        {plan?.features && plan.features.length > 0 && (
                                            <div className="space-y-2.5 pt-4 border-t border-border/50">
                                                <h5 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1">
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                    Included Features
                                                </h5>
                                                <ul className="text-xs text-black space-y-1.5 list-disc pl-4">
                                                    {plan.features.map((feat, idx) => (
                                                        <li key={idx}>{feat}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="text-center py-6">
                                <div className="p-3 bg-muted/40 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-dashed border-border">
                                    <Crown className="w-6 h-6 text-black opacity-30" />
                                </div>
                                <h4 className="text-sm font-semibold text-foreground">Free Plan</h4>
                                <p className="text-xs text-black mt-1">This user has not purchased any subscription plan yet.</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Subscription History Card */}
                    <div className="bg-white rounded-3xl border border-border/60 shadow-sm p-8">
                        <h3 className="text-base font-semibold text-foreground mb-6">
                            Subscription History
                        </h3>
                        {user.subscriptions && user.subscriptions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border/50 text-black/50 font-semibold">
                                            <th className="pb-3 pr-2">Plan</th>
                                            <th className="pb-3 px-2">Duration</th>
                                            <th className="pb-3 px-2 text-right">Price</th>
                                            <th className="pb-3 pl-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {user.subscriptions.map((sub) => (
                                            <tr key={sub.id} className="text-foreground">
                                                <td className="py-3 pr-2 font-medium">{sub.plan?.name || "Premium Plan"}</td>
                                                <td className="py-3 px-2 text-black/60">
                                                    {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium">
                                                    {sub.plan?.price?.INR ? `₹${sub.plan.price.INR}` : sub.plan?.price?.USD ? `$${sub.plan.price.USD}` : "-"}
                                                </td>
                                                <td className="py-3 pl-2 text-right">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                        sub.status === 'active' 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-xs text-black/60 text-center py-4">No subscription history found.</p>
                        )}
                    </div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {/* Basic Details */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Basic Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-black mb-1">Gender</p>
                                            <p className="text-sm font-medium flex items-center gap-1.5">
                                                {profile?.gender || "Not specified"}
                                                {profile?.isGenderLocked && (
                                                    <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                        Locked
                                                    </span>
                                                )}
                                            </p>
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
                                        <div>
                                            <p className="text-xs text-black mb-1">Height</p>
                                            <p className="text-sm font-medium">{profile?.height || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Weight</p>
                                            <p className="text-sm font-medium">{profile?.weight || "N/A"}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-black mb-1">Profile Created By</p>
                                            <p className="text-sm font-medium">{profile?.createdBy || "Self"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Religious/Cultural */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Religion & Culture</h4>
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
                                        <div className="col-span-2">
                                            <p className="text-xs text-black mb-1">Culture / Sect</p>
                                            <p className="text-sm font-medium">{profile?.culture || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Location Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs text-black mb-1 flex items-center gap-1">
                                                <MapPin size={12} /> Current Location
                                            </p>
                                            <p className="text-sm font-medium">
                                                {profile?.city ? `${profile.city}, ` : ''}
                                                {profile?.state ? `${profile.state}, ` : ''}
                                                {profile?.country || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Area / Locality</p>
                                            <p className="text-sm font-medium">{profile?.area || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Willing to Relocate</p>
                                            <p className="text-sm font-medium">{profile?.relocate || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Professional Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-black mb-1">Highest Degree</p>
                                            <p className="text-sm font-medium">{profile?.highestDegree || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">College / University</p>
                                            <p className="text-sm font-medium">{profile?.college || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Occupation</p>
                                            <p className="text-sm font-medium">{profile?.profession || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Industry</p>
                                            <p className="text-sm font-medium">{profile?.industry || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Company Name</p>
                                            <p className="text-sm font-medium">{profile?.company || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Annual Income</p>
                                            <p className="text-sm font-medium">{profile?.income || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lifestyle */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Lifestyle Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-black mb-1">Diet / Eating Habits</p>
                                            <p className="text-sm font-medium">{profile?.diet || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Activity / Exercise</p>
                                            <p className="text-sm font-medium">{profile?.activity || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Smoking Habits</p>
                                            <p className="text-sm font-medium">{profile?.smoking || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Drinking Habits</p>
                                            <p className="text-sm font-medium">{profile?.drinking || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Horoscope */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Horoscope Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-black mb-1">Zodiac Sign / Rashi</p>
                                            <p className="text-sm font-medium">{profile?.zodiacSign || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Birth Place</p>
                                            <p className="text-sm font-medium">{profile?.horoscopePlace || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Birth Date (Horoscope)</p>
                                            <p className="text-sm font-medium">{profile?.horoscopeDob ? new Date(profile.horoscopeDob).toLocaleDateString() : "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Birth Time</p>
                                            <p className="text-sm font-medium">{profile?.horoscopeTime || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Family Details */}
                                <div className="space-y-6 md:col-span-2">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Family Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs text-black mb-1">Family Type / Values</p>
                                            <p className="text-sm font-medium">{profile?.familyType || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Family Location</p>
                                            <p className="text-sm font-medium">{profile?.familyLocation || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Father's Status</p>
                                            <p className="text-sm font-medium">{profile?.fatherStatus || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Mother's Status</p>
                                            <p className="text-sm font-medium">{profile?.motherStatus || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Brothers</p>
                                            <p className="text-sm font-medium">{profile?.brothers || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Sisters</p>
                                            <p className="text-sm font-medium">{profile?.sisters || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-black mb-1">Siblings (Total)</p>
                                            <p className="text-sm font-medium">{profile?.siblings || "N/A"}</p>
                                        </div>
                                        <div className="md:col-span-3">
                                            <p className="text-xs text-black mb-1">About Family</p>
                                            <p className="text-sm font-medium italic text-black/70 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                {profile?.familyAbout || "No family description provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Preferences & Settings */}
                                <div className="space-y-6 md:col-span-2">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Contact & Match Preferences</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-black mb-1">Preferred Contact Time</p>
                                                <p className="text-sm font-medium">{profile?.contactTime || "Anytime"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-black mb-1">Preferred Age Range</p>
                                                <p className="text-sm font-medium">{profile?.preferredAge || "N/A"}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-xs text-black mb-1">Preferred Location</p>
                                                <p className="text-sm font-medium">{profile?.preferredLocation || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-black mb-1">Contact Email (Profile)</p>
                                                <p className="text-sm font-medium">{profile?.email || "Same as account"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-black mb-1">Contact Mobile (Profile)</p>
                                                <p className="text-sm font-medium">{profile?.mobile || "Same as account"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-black mb-1 font-semibold text-rose-600">Deal Breakers</p>
                                                <p className="text-sm font-medium text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                                                    {profile?.dealBreakers || "None specified"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-black mb-1">Profile Share Token</p>
                                                <p className="text-sm font-mono text-xs truncate bg-slate-50 border border-slate-100 p-2 rounded-xl">{profile?.shareToken || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links & JSON Meta */}
                                <div className="space-y-6 md:col-span-2">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Platform Consent & Verification Metadata</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3.5 flex flex-col justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-black uppercase tracking-wider mb-3">User Consent Log</p>
                                                <div className="space-y-3.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-black/60">Agreed to Terms:</span>
                                                        <span className="font-semibold text-emerald-600">{user.agreedToTerms ? "YES" : "NO"}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-black/60">18+ Verified:</span>
                                                        <span className="font-semibold text-emerald-600">{user.is18Plus ? "YES" : "NO"}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-black/60">Account DOB:</span>
                                                        <span>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "N/A"}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-black/60">Consent IP:</span>
                                                        <span className="font-mono">{user.consentIp || "N/A"}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-black/60">Consent Timestamp:</span>
                                                        <span>{user.consentAt ? new Date(user.consentAt).toLocaleString() : "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs pt-3 border-t border-slate-200 mt-3">
                                                <span className="text-black/60">Registration IP:</span>
                                                <span className="font-mono font-medium">{user.registrationIp || "N/A"}</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3.5 flex flex-col">
                                            <p className="text-xs font-semibold text-black uppercase tracking-wider mb-3">External Social Links</p>
                                            {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 ? (
                                                <div className="space-y-2.5">
                                                    {Object.entries(profile.socialLinks).map(([platform, link]) => (
                                                        <div key={platform} className="flex justify-between text-xs">
                                                            <span className="text-black/60 capitalize font-medium">{platform}:</span>
                                                            <a href={String(link)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px]">
                                                                {String(link)}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-black/50 italic py-2">No external social profiles linked.</p>
                                            )}
                                        </div>

                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3.5 flex flex-col justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-black uppercase tracking-wider mb-3">Security & Verification Tokens</p>
                                                <div className="space-y-3.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-black/60">Mobile OTP:</span>
                                                        <span className="font-mono font-semibold">{user.mobileOTP || "None Active"}</span>
                                                    </div>
                                                    {user.otpExpiry && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-black/60 font-medium">OTP Expiry:</span>
                                                            <span>{new Date(user.otpExpiry).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200">
                                                        <span className="text-black/60">Email Token:</span>
                                                        <span className="font-mono font-medium truncate max-w-[120px]" title={user.emailVerificationToken || ""}>
                                                            {user.emailVerificationToken ? "Active Token" : "None Active"}
                                                        </span>
                                                    </div>
                                                    {user.emailTokenExpiry && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-black/60">Token Expiry:</span>
                                                            <span>{new Date(user.emailTokenExpiry).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-slate-200 mt-3 space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-black/60">PWD Reset Token:</span>
                                                    <span className="font-mono font-medium truncate max-w-[120px]" title={user.passwordResetToken || ""}>
                                                        {user.passwordResetToken ? "Active Token" : "None Active"}
                                                    </span>
                                                </div>
                                                {user.passwordResetExpiry && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-black/60">Reset Expiry:</span>
                                                        <span>{new Date(user.passwordResetExpiry).toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* About / Descriptions Stack */}
                            <div className="mt-12 space-y-6">
                                {/* Bio */}
                                <div className="p-6 bg-muted/30 rounded-3xl border border-dashed border-border/60">
                                    <h4 className="text-xs font-semibold tracking-[0.2em] text-black mb-3 uppercase">About the User</h4>
                                    <p className="text-sm leading-relaxed text-foreground/80 italic">
                                        "{profile?.bio || "No bio description provided by the user yet."}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Hobbies */}
                                    <div className="p-6 bg-muted/30 rounded-3xl border border-dashed border-border/60">
                                        <h4 className="text-xs font-semibold tracking-[0.2em] text-black mb-3 uppercase">Hobbies & Interests</h4>
                                        <p className="text-sm leading-relaxed text-foreground/80">
                                            {profile?.hobbies || profile?.hobby || "No hobbies specified."}
                                        </p>
                                    </div>

                                    {/* Expectations */}
                                    <div className="p-6 bg-muted/30 rounded-3xl border border-dashed border-border/60">
                                        <h4 className="text-xs font-semibold tracking-[0.2em] text-black mb-3 uppercase">Partner Expectations</h4>
                                        <p className="text-sm leading-relaxed text-foreground/80">
                                            {profile?.expectations || profile?.lookingFor || "No partner expectations specified."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* User Photos Gallery */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden"
                    >
                        <div className="px-8 py-6 border-b border-border/60 flex items-center justify-between bg-muted/10">
                            <h3 className="text-xl font-medium font-heading flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary" />
                                User Photos Gallery ({user.photos?.length || 0})
                            </h3>
                        </div>
                        <div className="p-8">
                            {user.photos && user.photos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {user.photos.map((photo) => (
                                        <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-border bg-slate-50 shadow-xs hover:shadow-md transition-shadow">
                                            <img
                                                src={photo.url}
                                                alt="User upload"
                                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${photo.isBlurred ? 'blur-md' : ''}`}
                                            />
                                            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                                {photo.isMain && (
                                                    <span className="text-[10px] bg-amber-500 text-white font-semibold px-2 py-0.5 rounded-lg shadow-sm">
                                                        Primary
                                                    </span>
                                                )}
                                                {photo.isBlurred && (
                                                    <span className="text-[10px] bg-purple-600 text-white font-semibold px-2 py-0.5 rounded-lg shadow-sm">
                                                        Blurred
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-2 right-2">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shadow-sm uppercase tracking-wider ${
                                                    photo.status === 'approved' 
                                                        ? 'bg-emerald-500 text-white' 
                                                        : photo.status === 'rejected' 
                                                            ? 'bg-rose-500 text-white' 
                                                            : 'bg-amber-500 text-white'
                                                }`}>
                                                    {photo.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-black/40">
                                    <p>No photos uploaded by this user yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Identity & KYC Verification */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.23 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden"
                    >
                        <div className="px-8 py-6 border-b border-border/60 flex items-center justify-between bg-muted/10">
                            <h3 className="text-xl font-medium font-heading flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                Identity & KYC Verification
                            </h3>
                        </div>
                        <div className="p-8">
                            {user.kyc ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Document Info */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Document Information</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs text-black/50 mb-1">Document Type</p>
                                                    <p className="font-semibold text-foreground capitalize">{user.kyc.documentType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-black/50 mb-1">Document Number</p>
                                                    <p className="font-mono font-semibold text-foreground">{user.kyc.documentNumber}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-xs text-black/50 mb-1">Name on Document</p>
                                                    <p className="font-medium text-foreground">{user.kyc.fullName || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-black/50 mb-1">DOB on Document</p>
                                                    <p className="font-medium text-foreground">{user.kyc.dob ? new Date(user.kyc.dob).toLocaleDateString() : "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-black/50 mb-1">Document Verification</p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                        user.kyc.status === 'approved' 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                            : user.kyc.status === 'rejected' 
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}>
                                                        {user.kyc.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-black/50 mb-1">Selfie Verification</p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                        user.kyc.selfieStatus === 'approved' 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                            : user.kyc.selfieStatus === 'rejected' 
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}>
                                                        {user.kyc.selfieStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            {user.kyc.rejectionReason && (
                                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs">
                                                    <p className="font-semibold text-rose-800 uppercase tracking-wider mb-1">Rejection Reason</p>
                                                    <p className="text-rose-700">{user.kyc.rejectionReason}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Uploaded Files */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2 uppercase">Uploaded Verification Assets</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-black/60 mb-2 font-medium">Document Photo</p>
                                                    <div className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-slate-50 shadow-xs hover:shadow-md transition-shadow">
                                                        <a href={user.kyc.documentUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                            <img
                                                                src={user.kyc.documentUrl}
                                                                alt="KYC Document"
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">
                                                                View Original
                                                            </div>
                                                        </a>
                                                    </div>
                                                </div>
                                                {user.kyc.selfieUrl && (
                                                    <div>
                                                        <p className="text-xs text-black/60 mb-2 font-medium">Selfie Verification</p>
                                                        <div className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-slate-50 shadow-xs hover:shadow-md transition-shadow">
                                                            <a href={user.kyc.selfieUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                                <img
                                                                    src={user.kyc.selfieUrl}
                                                                    alt="Selfie"
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">
                                                                    View Original
                                                                </div>
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-black/40">
                                    <p>No identity or KYC verification document submitted yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Interaction & Insights */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden"
                    >
                        <div className="px-8 py-6 border-b border-border/60 flex items-center justify-between bg-muted/10">
                            <h3 className="text-xl font-medium font-heading flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Match & Interaction Insights
                            </h3>
                        </div>
                        <div className="p-8 space-y-8">
                            {/* Connection Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl text-center">
                                    <span className="text-2xl font-bold text-primary block">
                                        {user.connectionStats?.sentAcceptedCount || 0}
                                    </span>
                                    <span className="text-xs font-semibold text-black uppercase tracking-wider mt-1 block">
                                        Sent Interests Accepted
                                    </span>
                                </div>
                                <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                                    <span className="text-2xl font-bold text-blue-600 block">
                                        {user.connectionStats?.receivedAcceptedCount || 0}
                                    </span>
                                    <span className="text-xs font-semibold text-black uppercase tracking-wider mt-1 block">
                                        Received Interests Accepted
                                    </span>
                                </div>
                                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                                    <span className="text-2xl font-bold text-emerald-600 block">
                                        {user.connectionStats?.totalAcceptedCount || 0}
                                    </span>
                                    <span className="text-xs font-semibold text-black uppercase tracking-wider mt-1 block">
                                        Total Connected Users
                                    </span>
                                </div>
                            </div>

                            {/* Messaging & Calling Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-border/60">
                                {/* Active Messaging Partners */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                                        <MessageSquare className="w-4 h-4 text-blue-500" />
                                        Top Active Messaging Partners
                                    </h4>
                                    {user.messagingPartners && user.messagingPartners.length > 0 ? (
                                        <div className="space-y-3">
                                            {user.messagingPartners.map((peer) => (
                                                <div key={peer.peerId} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shadow-xs">
                                                            {peer.photoUrl ? (
                                                                <img src={peer.photoUrl} alt="Peer" className="w-full h-full object-cover" />
                                                            ) : (
                                                                `${peer.firstName?.[0] || 'U'}${peer.lastName?.[0] || ''}`
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {peer.firstName} {peer.lastName}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-black/50">
                                                                {peer.customId || "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100/70 text-blue-700 rounded-full">
                                                            {peer.messageCount} msg
                                                        </span>
                                                        <p className="text-[10px] text-black/60 mt-1 flex items-center gap-1 justify-end">
                                                            <Clock size={10} />
                                                            {new Date(peer.lastMessageAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-black/50 italic py-4 text-center">No messages exchanged yet.</p>
                                    )}
                                </div>

                                {/* Active Calling Partners */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                                        <PhoneCall className="w-4 h-4 text-green-500" />
                                        Top Active Calling Partners
                                    </h4>
                                    {user.callingPartners && user.callingPartners.length > 0 ? (
                                        <div className="space-y-3">
                                            {user.callingPartners.map((peer) => (
                                                <div key={peer.peerId} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shadow-xs">
                                                            {peer.photoUrl ? (
                                                                <img src={peer.photoUrl} alt="Peer" className="w-full h-full object-cover" />
                                                            ) : (
                                                                `${peer.firstName?.[0] || 'U'}${peer.lastName?.[0] || ''}`
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {peer.firstName} {peer.lastName}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-black/50">
                                                                {peer.customId || "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-semibold px-2.5 py-1 bg-green-100/70 text-green-700 rounded-full">
                                                            {peer.callCount} calls ({Math.round(peer.totalDuration / 60)} min)
                                                        </span>
                                                        <p className="text-[10px] text-black/60 mt-1 flex items-center gap-1 justify-end">
                                                            <Clock size={10} />
                                                            {new Date(peer.lastCallAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-black/50 italic py-4 text-center">No calls logged yet.</p>
                                    )}
                                </div>
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





