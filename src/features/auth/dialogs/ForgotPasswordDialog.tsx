import React, { useState, useEffect, useRef } from "react";
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiForgotPassword, apiVerifyOtp, apiResetPassword } from "@/lib/api/authApi";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  open,
  onOpenChange,
  defaultEmail = "",
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState(defaultEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (open) {
      setStep(1);
      setEmail(defaultEmail);
      setOtpDigits(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setDevOtp(null);
    }
  }, [open, defaultEmail]);

  useEffect(() => {
    let interval: any = null;
    if (step === 2 && resendTimer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiForgotPassword(email);
      toast.success(`Verification OTP sent to ${email}`);
      if (data.otpPreview) {
        setDevOtp(data.otpPreview);
        toast.info(`[Dev Mode] Your OTP Code is: ${data.otpPreview}`, { duration: 10000 });
      }
      setStep(2);
      setResendTimer(60);
      setTimeout(() => otpInputRefs[0].current?.focus(), 100);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanValue;
    setOtpDigits(updated);

    if (cleanValue && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (cleanValue && index === 5) {
      const fullOtp = updated.join("");
      if (fullOtp.length === 6) {
        verifyOtpCode(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const digits = pasted.split("");
      const updated = ["", "", "", "", "", ""];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setOtpDigits(updated);
      if (digits.length === 6) {
        verifyOtpCode(updated.join(""));
      } else {
        const nextIndex = Math.min(digits.length, 5);
        otpInputRefs[nextIndex].current?.focus();
      }
    }
  };

  const verifyOtpCode = async (otpCode: string) => {
    setLoading(true);
    try {
      await apiVerifyOtp(email, otpCode);
      toast.success("OTP verified successfully!");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const otpCode = otpDigits.join("");
      await apiResetPassword(email, otpCode, newPassword);
      toast.success("Password reset successfully! You can now log in.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-white border border-slate-800 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              {step === 1 && <Mail className="h-5 w-5" />}
              {step === 2 && <ShieldCheck className="h-5 w-5 text-emerald-400" />}
              {step === 3 && <Lock className="h-5 w-5 text-indigo-400" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Enter Verification OTP"}
                {step === 3 && "Set New Password"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {step === 1 && "Enter your registered email address to receive a 6-digit OTP code."}
                {step === 2 && `Enter the 6-digit OTP sent to ${email}`}
                {step === 3 && "Create a new strong password for your account."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-xs font-semibold text-slate-300">
                Registered Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-800 text-white text-sm focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Send 6-Digit OTP</span>
              )}
            </Button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <div className="space-y-4 pt-2">
            {devOtp && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-center">
                <span className="text-xs text-emerald-400 font-medium">
                  [Dev Mode Test Code]: <strong>{devOtp}</strong>
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-300">Enter 6-Digit OTP Code</Label>
              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <Input
                    key={i}
                    ref={otpInputRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold bg-slate-900 border-slate-800 text-white focus:border-emerald-500 rounded-xl"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                disabled={!canResend || loading}
                onClick={() => handleSendOtp()}
                className={`font-medium ${canResend ? "text-blue-400 hover:underline cursor-pointer" : "text-slate-500 cursor-not-allowed"}`}
              >
                {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
              </button>
            </div>

            <Button
              type="button"
              disabled={loading || otpDigits.join("").length !== 6}
              onClick={() => verifyOtpCode(otpDigits.join(""))}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Verify OTP & Continue</span>
              )}
            </Button>
          </div>
        )}

        {/* STEP 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new-pass" className="text-xs font-semibold text-slate-300">
                  New Password
                </Label>
                <Input
                  id="new-pass"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-sm focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-pass" className="text-xs font-semibold text-slate-300">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-sm focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Update Password & Save</span>
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
