import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Globe,
  Building2,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiLogin } from "@/lib/api";
import { syncPermissionsFromServer } from "@/lib/permissions";
import accreditLogo from "@/assets/Logo.png";

import loginBg from "@/assets/Login image.jpeg";
import { ForgotPasswordDialog } from "@/features/auth/dialogs/ForgotPasswordDialog";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiLogin(email, password);
      await syncPermissionsFromServer();

      toast({
        title: "Login Successful",
        description: `Welcome back, ${email}`,
      });
      navigate("/");
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage =
        err instanceof Error ? err.message : "Invalid email or password.";
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0b]">
      {/* Dynamic Professional Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={loginBg}
          alt="Background"
          className="w-full h-full object-cover opacity-30 blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0b]/90 via-[#0a0a0b]/70 to-[#0a0a0b]/90" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-warning/5 rounded-full blur-[120px]" />
      </div>

      {/* Mobile Layout: stacked vertically, scrollable */}
      {/* Desktop Layout: side-by-side 12-col grid */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 px-4 py-6 lg:py-12 min-h-screen lg:min-h-0 lg:items-center">
        {/* ── Mobile-Only: Compact Brand Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex lg:hidden flex-col items-center text-center text-white mb-6 pt-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
              <img
                src={accreditLogo}
                alt="AccreditOS"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight">AccreditOS</h1>
              <p className="text-primary/70 text-[10px] font-medium uppercase tracking-widest">
                Enterprise Management
              </p>
            </div>
          </div>
          <h2 className="text-2xl font-bold leading-tight">
            Secure Access for{" "}
            <span className="text-primary italic font-serif">Excellence</span>
          </h2>
        </motion.div>

        {/* ── Desktop-Only: Full Brand Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex lg:col-span-7 flex-col justify-center p-12 text-white"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
              <img
                src={accreditLogo}
                alt="AccreditOS"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AccreditOS</h1>
              <p className="text-primary/70 text-sm font-medium uppercase tracking-widest">
                Enterprise Management System
              </p>
            </div>
          </div>

          <h2 className="text-6xl font-bold mb-6 leading-tight">
            Secure Access for{" "}
            <span className="text-primary italic font-serif">Excellence</span>
          </h2>
          <p className="text-lg text-white/60 max-w-lg mb-12">
            The industry-leading platform for safety compliance, training
            analytics, and organizational certificates. Designed for
            mission-critical operations.
          </p>

          {/* Infrastructure Chips — Desktop only */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              {
                icon: Globe,
                label: "Global Infrastructure",
                detail: "24/7 Availability",
              },
              {
                icon: Server,
                label: "On-Prem Ready",
                detail: "Self-hosted Sync",
              },
              {
                icon: Lock,
                label: "AES-256 Security",
                detail: "End-to-End Encrypted",
              },
              {
                icon: Building2,
                label: "Multi-Tenant",
                detail: "Enterprise Clusters",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-white/40">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Login Card (both mobile & desktop) ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none"
        >
          {/* Card Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-warning/20 rounded-[1.5rem] lg:rounded-[2rem] blur opacity-25" />

          <div className="relative bg-[#161617]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] lg:rounded-[2rem] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden ring-1 ring-white/5">
            <div className="mb-8 lg:mb-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5 text-center lg:text-left">
                Login
              </h3>
              <p className="text-white/50 text-sm text-center lg:text-left">
                Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 lg:space-y-6">
              <div className="space-y-2 group">
                <Label
                  htmlFor="email"
                  className="text-white/70 text-xs uppercase tracking-wider ml-1"
                >
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 sm:h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:bg-white/10 transition-all rounded-xl focus:ring-primary/40 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex items-center justify-between ml-1">
                  <Label
                    htmlFor="password"
                    title="Enter Password"
                    className="text-white/70 text-xs uppercase tracking-wider"
                  >
                    Access Secret
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 sm:h-14 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:bg-white/10 transition-all rounded-xl focus:ring-primary/40 focus:border-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span />
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-primary/80 hover:text-primary transition-colors font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 sm:h-14 text-base font-bold transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:translate-y-[-1px] active:translate-y-[1px] rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Initialize Access <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Support Footer */}
            <div className="mt-4 pt-5 lg:pt-6 border-t border-white/5 flex flex-col items-center gap-3 lg:gap-4">
              <p className="text-xs text-white/30 text-center">
                System Status:{" "}
                <span className="text-emerald-400 font-medium">
                  Test Mode ⬤
                </span>
              </p>
              <div className="flex gap-4 sm:gap-6">
                <a
                  href="#"
                  className="text-white/20 hover:text-white/60 transition-colors text-[10px] uppercase font-bold tracking-tighter"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-white/20 hover:text-white/60 transition-colors text-[10px] uppercase font-bold tracking-tighter"
                >
                  Internal Support
                </a>
                <a
                  href="#"
                  className="text-white/20 hover:text-white/60 transition-colors text-[10px] uppercase font-bold tracking-tighter"
                >
                  Legal
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Version/Legal */}
      <div className="absolute bottom-4 lg:bottom-6 w-full flex justify-between px-6 lg:px-10 text-[10px] text-white/10 uppercase tracking-[0.2em] font-medium pointer-events-none">
        <span>AccreditOS 1.0.0 Production</span>
        <span>© 2026 AccreditOS Systems Inc.</span>
      </div>

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordDialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
        defaultEmail={email}
      />
    </div>
  );
}
