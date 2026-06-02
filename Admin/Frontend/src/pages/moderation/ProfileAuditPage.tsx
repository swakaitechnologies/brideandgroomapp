import { useEffect, useState, useCallback } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  ShieldAlert,
  Eye,
  Flag
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import api from "../../lib/api";
import { Link } from "react-router-dom";

interface AuditProfile {
  id: string;
  customId: string;
  firstName: string;
  lastName: string;
  trustScore: number;
  flags: string[];
  createdAt: string;
}

const ProfileAuditPage = () => {
  const [profiles, setProfiles] = useState<AuditProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [qualityFilter, setQualityFilter] = useState("low");

  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/moderation/audit-profiles?quality=${qualityFilter}`);
      if (res.data.success) {
        setProfiles(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit profiles", err);
      toast.error("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, [qualityFilter]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const getTrustColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Profile Quality Audit</h1>
          <p className="text-black text-sm">Monitor and manage low-trust profiles in the community.</p>
        </div>

        <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                <Button 
                    variant={qualityFilter === "low" ? "white" : "ghost"} 
                    size="sm" 
                    className={`rounded-lg text-xs font-medium ${qualityFilter === "low" ? "shadow-sm border border-slate-200" : ""}`}
                    onClick={() => setQualityFilter("low")}
                >
                    Low Quality
                </Button>
                <Button 
                    variant={qualityFilter === "all" ? "white" : "ghost"} 
                    size="sm" 
                    className={`rounded-lg text-xs font-medium ${qualityFilter === "all" ? "shadow-sm" : ""}`}
                    onClick={() => setQualityFilter("all")}
                >
                    All Profiles
                </Button>
            </div>
            <Button className="rounded-xl h-10 font-medium" onClick={fetchAuditData}> Refresh </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
             <ShieldAlert size={24} />
           </div>
           <div>
             <p className="text-xs font-medium text-black  tracking-widest leading-none mb-1">Low Trust Profiles</p>
             <h3 className="text-2xl font-medium">{profiles.length}</h3>
           </div>
        </div>
        
        {/* Mock other stats */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 opacity-70">
           <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
             <AlertTriangle size={24} />
           </div>
           <div>
             <p className="text-xs font-medium text-black  tracking-widest leading-none mb-1">Flagged Reports</p>
             <h3 className="text-2xl font-medium">12</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 opacity-70">
           <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
             <CheckCircle2 size={24} />
           </div>
           <div>
             <p className="text-xs font-medium text-black  tracking-widest leading-none mb-1">Recently Cleaned</p>
             <h3 className="text-2xl font-medium">45</h3>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between">
           <div className="relative w-full max-w-md">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
             <Input 
                placeholder="Search by name or ID..." 
                className="pl-10 rounded-xl bg-slate-50 border-slate-200" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           <Button variant="outline" className="rounded-xl border-slate-200 flex gap-2 font-medium text-xs  tracking-widest">
             <Filter size={16} /> Filter Options
           </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-[10px] font-medium  tracking-widest">Profile ID</TableHead>
                <TableHead className="text-[10px] font-medium  tracking-widest">Name</TableHead>
                <TableHead className="text-[10px] font-medium  tracking-widest">Trust Score</TableHead>
                <TableHead className="text-[10px] font-medium  tracking-widest">System Flags</TableHead>
                <TableHead className="text-[10px] font-medium  tracking-widest">Created At</TableHead>
                <TableHead className="text-right text-[10px] font-medium  tracking-widest pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                   <TableCell colSpan={6} className="h-48 text-center text-black font-medium">Loading analysis data...</TableCell>
                </TableRow>
              ) : profiles.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="h-48 text-center text-black font-medium">No flagged profiles found.</TableCell>
                </TableRow>
              ) : (
                profiles.filter(p => p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || p.customId.includes(searchTerm.toUpperCase())).map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-medium text-black">{profile.customId}</TableCell>
                    <TableCell className="font-medium text-black">{profile.firstName} {profile.lastName}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <div className="flex-1 w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full ${getTrustColor(profile.trustScore)}`} style={{ width: `${profile.trustScore}%` }} />
                          </div>
                          <span className="text-xs font-medium">{profile.trustScore}%</span>
                       </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                           {profile.flags.map((flag, i) => (
                             <Badge key={i} variant="outline" className="text-[9px] font-medium  tracking-tight bg-red-50 text-red-600 border-red-100 rounded-lg">
                                {flag}
                             </Badge>
                           ))}
                           {profile.flags.length === 0 && <span className="text-xs text-black font-medium italic">Clear</span>}
                        </div>
                    </TableCell>
                    <TableCell className="text-xs text-black font-medium">
                       {new Date(profile.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                               <Link to={`/users/${profile.id}`}>
                                  <Eye size={16} className="text-black" />
                               </Link>
                            </Button>
                           <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 text-red-500">
                             <Flag size={16} />
                           </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ProfileAuditPage;





