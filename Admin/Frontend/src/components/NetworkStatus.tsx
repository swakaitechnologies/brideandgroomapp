import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredToast(true);
      setTimeout(() => setShowRestoredToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredToast(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    
    // Simulate connection checking delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Update online status from navigator
    const online = navigator.onLine;
    setIsOnline(online);
    setIsChecking(false);

    if (online) {
      setShowRestoredToast(true);
      setTimeout(() => setShowRestoredToast(false), 4000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-slate-950/60"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md overflow-hidden bg-white/95 border border-rose-100 rounded-[2.5rem] p-8 md:p-10 shadow-elevated text-center"
            >
              {/* Top premium design accent */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-rose-500 via-amber-500 to-rose-500" />
              
              {/* Glowing Offline Icon */}
              <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-rose-500/10 rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-0 border-2 border-rose-500/20 rounded-full"
                />
                <div className="relative w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                  <WifiOff size={28} />
                </div>
              </div>

              {/* Typography */}
              <h3 className="font-heading font-semibold text-2xl text-slate-900 tracking-tight mb-2">
                Connection Interrupted
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Your computer is offline. Please check your internet connection or Wi-Fi router. We will automatically reconnect you when network is restored.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  disabled={isChecking}
                  className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-sm disabled:opacity-80 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
                  {isChecking ? "Checking Network..." : "Check Connection"}
                </Button>
                
                <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 pt-1">
                  <ShieldAlert size={12} className="text-amber-500 animate-pulse" />
                  Offline Mode Active
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Restored Floating Toast */}
      <AnimatePresence>
        {showRestoredToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="bg-emerald-50 border border-emerald-100 px-5 py-4 rounded-[20px] shadow-lg flex items-center gap-3.5 max-w-xs md:max-w-md">
              <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={20} className="animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950 tracking-tight">
                  Connection Restored
                </p>
                <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  You are back online. Pages will sync automatically.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NetworkStatus;
