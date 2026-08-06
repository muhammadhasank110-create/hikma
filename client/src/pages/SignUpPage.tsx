import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { startSignUp } from "@/const";

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const pwStrong = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pwStrong) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sign up failed. Please try again."); return; }
      navigate("/onboarding");
    } catch {
      setError("Unable to connect. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setGoogleLoading(true);
    startSignUp();
  };

  const features = [
    "Adaptive to your learning style",
    "Voice-first & keyboard navigable",
    "Arabic + English, RTL support",
    "IGCSE Edexcel & Qatar MoEHE",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] bg-[rgb(var(--nav-bg))] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgb(255 255 255) 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img
              src="/manus-storage/hikma-app-icon_2d2d3fef.png"
              alt="Hikma"
              className="w-10 h-10 rounded-xl object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-white font-bold text-xl tracking-tight">حكمة · Hikma</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Start learning<br />
              <span className="text-[rgb(var(--arrival-rail,180_60_80))]">your way</span><br />
              today.
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Free forever. No credit card required. Personalised to you in under 5 minutes.
            </p>
          </div>
          <div className="mt-12 space-y-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {["Built to WCAG 2.2 AA", "MADA Qatar certified", "Free to use"].map(tag => (
            <div key={tag} className="flex items-center gap-2 text-white/40 text-sm">
              <div className="w-1 h-1 rounded-full bg-white/30" />
              {tag}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <img
              src="/manus-storage/hikma-app-icon_2d2d3fef.png"
              alt="Hikma"
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="font-bold text-lg">حكمة · Hikma</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
            <p className="text-muted-foreground mt-1">Free forever · No credit card needed</p>
          </div>

          {/* Google button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-3 font-medium border-border hover:bg-muted/60"
            onClick={handleGoogle}
            disabled={googleLoading}
            aria-label="Sign up with Google"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign up with Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground px-1">or create account with email</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Full name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-11"
                aria-required="true"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  aria-required="true"
                  aria-describedby="pw-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <p id="pw-hint" className={["text-xs flex items-center gap-1.5", pwStrong ? "text-green-600 dark:text-green-400" : "text-muted-foreground"].join(" ")}>
                  {pwStrong ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current inline-block" />}
                  {pwStrong ? "Strong password" : "At least 8 characters required"}
                </p>
              )}
            </div>

            {error && (
              <div role="alert" className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 font-semibold"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account…</>
              ) : (
                <>Create Free Account <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/60">
            By creating an account you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
