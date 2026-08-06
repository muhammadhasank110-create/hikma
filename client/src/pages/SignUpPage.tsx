import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sign up failed. Please try again."); return; }
      // Success — reload to pick up the session cookie
      window.location.href = "/onboarding";
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--nav-bg))] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/manus-storage/hikma-app-icon-clean_e261c2b4.png" alt="Hikma" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover" />
          <h1 className="text-2xl font-bold text-white font-display">Create your account</h1>
          <p className="text-white/60 text-sm mt-1">Free. Accessible. Built for every learner.</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-white/80 text-sm">Your name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Sara Al-Rashid"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                aria-label="Your name (optional)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80 text-sm">Email address <span className="text-red-400">*</span></Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
                aria-required="true"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80 text-sm">Password <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary pr-10"
                  aria-required="true"
                  aria-describedby="pw-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p id="pw-hint" className="text-xs text-white/40">Minimum 8 characters</p>
            </div>

            {error && (
              <div role="alert" className="bg-red-500/15 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-12 rounded-xl font-semibold text-base"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account…</>
              ) : (
                <>Create Free Account <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Built to MADA Qatar & WCAG 2.2 AA · Free to use
        </p>
      </div>
    </div>
  );
}
