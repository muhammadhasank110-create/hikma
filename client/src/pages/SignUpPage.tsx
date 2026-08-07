import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const FALCON_URL = "/manus-storage/hikma-falcon-transparent_9af556dd.png";
const ICON_URL = "/manus-storage/hikma-app-icon_2d2d3fef.png";

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH = [
  { label: "Too short", color: "bg-red-500" },
  { label: "Weak", color: "bg-red-400" },
  { label: "Fair", color: "bg-amber-400" },
  { label: "Good", color: "bg-yellow-400" },
  { label: "Strong", color: "bg-emerald-400" },
  { label: "Very strong", color: "bg-emerald-500" },
];

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const score = scorePassword(password);
  const strength = STRENGTH[Math.min(score, 5)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password are required."); return; }
    if (score < 2) { toast.error("Please choose a stronger password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Sign up failed."); return; }
      toast.success("Account created! Setting up your profile…");
      window.location.href = "/onboarding";
    } catch { toast.error("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0d1f10" }}>
      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
        style={{ background: "linear-gradient(160deg, #0d1f10 0%, #162a18 50%, #0d1f10 100%)" }}>
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(45,100,55,0.25) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.img src={FALCON_URL} alt="" aria-hidden="true"
          className="absolute bottom-0 right-0 w-[70%] object-contain opacity-20 pointer-events-none select-none"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 0.2, y: 0 }} transition={{ duration: 1.2 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <a href="/" className="flex items-center gap-3">
            <img src={ICON_URL} alt="" className="w-10 h-10 rounded-xl object-contain" aria-hidden="true" />
            <div>
              <p className="font-black text-lg text-white leading-none">Hikma</p>
              <p className="text-[10px] text-white/40 tracking-widest">حكمة</p>
            </div>
          </a>
        </motion.div>
        <motion.div className="relative z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Start learning<br />
            <span style={{ color: "rgb(201,153,126)" }}>your way</span><br />
            today.
          </h2>
          <p className="text-white/40 text-base leading-relaxed max-w-xs">Free forever. No credit card required. Personalised to you in under 5 minutes.</p>
        </motion.div>
        <motion.div className="space-y-2 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {["Adaptive to your learning style", "Voice-first & keyboard navigable", "Arabic + English, RTL support", "IGCSE Edexcel & Qatar MoEHE"].map(b => (
            <p key={b} className="text-xs text-white/30 flex items-center gap-2">
              <Check className="w-3 h-3 text-emerald-500/60 flex-shrink-0" aria-hidden="true" />
              {b}
            </p>
          ))}
        </motion.div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <motion.button onClick={() => navigate("/")}
          className="absolute top-6 left-6 flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </motion.button>

        <motion.div className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] as any }}>
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={ICON_URL} alt="" className="w-8 h-8 rounded-xl object-contain" aria-hidden="true" />
            <span className="font-black text-white">Hikma</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-1">Create your account</h1>
          <p className="text-white/40 text-sm mb-8">Free forever · No credit card needed</p>

          <button onClick={() => { window.location.href = '/api/oauth/login'; }}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all text-sm font-semibold text-white mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 font-medium">or create account with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Full name <span className="text-white/25 font-normal">(optional)</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" autoComplete="name"
                className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Email address <span className="text-rose-400">*</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" required
                className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Password <span className="text-rose-400">*</span></label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters" autoComplete="new-password" required
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all text-sm" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? strength.color : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${score >= 3 ? "text-emerald-400" : score >= 2 ? "text-amber-400" : "text-red-400"}`}>
                    {strength.label}
                    {score < 2 && " — add numbers, symbols, or uppercase letters"}
                  </p>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading || score < 2}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg, rgb(45,100,55), rgb(28,70,32))", boxShadow: "0 0 30px rgba(45,100,55,0.4)" }}>
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Free Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            Already have an account?{" "}
            <button onClick={() => navigate("/signin")} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">Sign in</button>
          </p>
          <p className="text-center text-xs text-white/15 mt-3">By creating an account you agree to our terms of service.</p>
        </motion.div>
      </div>
    </div>
  );
}
