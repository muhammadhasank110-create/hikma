import React, { useState, useEffect, useRef } from "react";
import { useGridNavigation } from "@/hooks/useGridNavigation";
import { useAriaLive } from "@/contexts/AriaLiveContext";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { useKeyboard } from "@/contexts/KeyboardContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import {
  Home, BookOpen, Bot, TrendingUp, Settings, Keyboard, GraduationCap,
  Users, Shield, Menu, X, Globe, Sun, Moon, Contrast, Volume2, VolumeX,
  ChevronRight, LogOut, LogIn, Layers, Star, FileText, MoreHorizontal,
  Sparkles, BarChart3, Library, Brain
} from "lucide-react";
// startLogin removed
import { playTestSound, playSound } from "@/lib/sound";
import { useSpokenLabels } from "@/hooks/useSpokenLabels";
import { HikmaLogo } from "@/components/HikmaLogo";

interface NavItem {
  href: string;
  labelEn: string;
  labelAr: string;
  icon: any;
  roles?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelEn: "Home", labelAr: "الرئيسية", icon: Home },
  { href: "/subjects/1", labelEn: "Subjects", labelAr: "المواد", icon: Library },
  { href: "/tutor", labelEn: "Hikma AI", labelAr: "حكمة AI", icon: Sparkles },
  { href: "/progress", labelEn: "Progress", labelAr: "تقدمي", icon: BarChart3 },
  { href: "/ecc", labelEn: "ECC", labelAr: "المنهج الموسّع", icon: Brain },
  { href: "/exam-skills", labelEn: "Exam Skills", labelAr: "مهارات الامتحان", icon: FileText },
  { href: "/teacher", labelEn: "Teacher", labelAr: "المعلم", icon: GraduationCap, roles: ["teacher", "admin"] },
  { href: "/guardian", labelEn: "Guardian", labelAr: "ولي الأمر", icon: Users, roles: ["guardian", "admin"] },
  { href: "/admin", labelEn: "Admin", labelAr: "الإدارة", icon: Shield, roles: ["admin"] },
];

function AccessibilityBar() {
  const { profile, updateProfile, locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const { enabled: spokenLabels, toggle: toggleSpokenLabels } = useSpokenLabels();
  // Each inner group is its own independent lane — Right never crosses to another row
  const accLeftRef = React.useRef<HTMLDivElement>(null);
  const accRightRef = React.useRef<HTMLDivElement>(null);
  useGridNavigation(accLeftRef, { disableWASD: false });
  useGridNavigation(accRightRef, { disableWASD: false });
  const [soundOn, setSoundOn] = React.useState(() => {
    try { return localStorage.getItem("hikma:sound") === "on"; } catch { return false; }
  });
  const [volume, setVolume] = React.useState(() => {
    try { return Number(localStorage.getItem("hikma:volume") ?? 0.7); } catch { return 0.7; }
  });
  const [showVolume, setShowVolume] = React.useState(false);

  const toggleSound = () => {
    const next = !soundOn;
    try { localStorage.setItem("hikma:sound", next ? "on" : "off"); } catch {}
    setSoundOn(next);
    if (next) {
      // Unlock AudioContext on user gesture (Chrome autoplay policy) and play test tone
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) { const c = new AudioCtx(); c.resume().then(() => playTestSound()); }
      } catch {}
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    try { localStorage.setItem("hikma:volume", String(v)); } catch {}
    setVolume(v);
  };

  return (
    <div
      id="accessibility-bar"
      className="w-full text-white text-xs flex items-center justify-between px-4 py-0 gap-4 flex-wrap min-h-[44px]" style={{ background: "rgb(var(--nav-bg))" }}
      role="toolbar"
      aria-label={t("Accessibility controls", "أدوات إمكانية الوصول")}
    >
      <div ref={accLeftRef} className="flex items-center gap-3 flex-wrap" role="group" aria-label={t("Accessibility tools", "أدوات إمكانية الوصول")}>
        {/* High contrast toggle */}
        <button
          onClick={() => updateProfile({ theme: profile.theme === "high_contrast" ? "light" : "high_contrast" })}
          className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-label={t("Toggle high contrast", "تبديل التباين العالي")}
          aria-pressed={profile.theme === "high_contrast"}
        >
          <Contrast className="w-3 h-3" />
          <span className="hidden lg:inline">{t("Contrast", "تباين")}</span>
        </button>
        {/* Text size */}
        <button
          onClick={() => updateProfile({ fontScale: Math.min(2.5, profile.fontScale + 0.1) })}
          className="hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px] flex items-center"
          aria-label={t("Increase text size", "تكبير النص")}
        >
          <span className="font-bold text-xs">A+</span>
        </button>
        <button
          onClick={() => updateProfile({ fontScale: Math.max(1.0, profile.fontScale - 0.1) })}
          className="hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px] flex items-center"
          aria-label={t("Decrease text size", "تصغير النص")}
        >
          <span className="font-bold text-xs">A−</span>
        </button>
        {/* Audio toggle */}
        <button
          onClick={() => updateProfile({ autoNarrate: !profile.autoNarrate })}
          className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-label={t("Toggle audio narration", "تبديل السرد الصوتي")}
          aria-pressed={profile.autoNarrate}
        >
          {profile.autoNarrate ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden lg:inline">{t("Audio", "صوت")}</span>
        </button>
        {/* Focus mode */}
        <button
          onClick={() => updateProfile({ mode: profile.mode === "focus" ? "reading" : "focus" })}
          className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-label={t("Toggle focus mode", "تبديل وضع التركيز")}
          aria-pressed={profile.mode === "focus"}
        >
          <Star className="w-3 h-3" />
          <span className="hidden lg:inline">{t("Focus", "تركيز")}</span>
        </button>
        {/* Sound effects toggle */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={toggleSound}
            className="flex items-center gap-1 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
            aria-label={soundOn ? t("Sound effects on — click to turn off", "مؤثرات صوتية مفعّلة — انقر للإيقاف") : t("Sound effects off — click to turn on", "مؤثرات صوتية معطّلة — انقر للتفعيل")}
            aria-pressed={soundOn}
          >
            <span className="text-xs">{soundOn ? "🔊" : "🔇"}</span>
            <span className="hidden sm:inline">{t("Sounds", "أصوات")}</span>
          </button>
          {soundOn && (
            <button
              type="button"
              onClick={() => setShowVolume(v => !v)}
              className="text-xs hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-1 min-h-[44px] flex items-center"
              aria-label={t("Adjust volume", "ضبط الصوت")}
            >
              ▾
            </button>
          )}
          {soundOn && showVolume && (
            <div className="absolute top-full left-0 mt-1 bg-[rgb(var(--nav-bg))] border border-border/60 rounded-lg p-3 z-50 min-w-[140px] shadow-xl">
              <p className="text-xs mb-2 text-white/70">{t("Volume", "الصوت")}</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolume}
                className="w-full accent-yellow-300"
                aria-label={t("Sound volume", "مستوى الصوت")}
              />
              <p className="text-xs text-white/50 mt-1 text-right">{Math.round(volume * 100)}%</p>
            </div>
          )}
        </div>
        {/* Spoken labels toggle */}
        <button
          type="button"
          onClick={toggleSpokenLabels}
          className="flex items-center gap-1 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-pressed={spokenLabels}
          aria-label={spokenLabels ? t("Spoken labels on — click to turn off", "التسميات الصوتية مفعّلة — انقر للإيقاف") : t("Spoken labels off — click to turn on", "التسميات الصوتية معطّلة — انقر للتفعيل")}
          title={spokenLabels ? t("Spoken labels on", "التسميات الصوتية مفعّلة") : t("Spoken labels off", "التسميات الصوتية معطّلة")}
        >
          <span className="text-xs">{spokenLabels ? "🗣️" : "🔕"}</span>
          <span className="hidden sm:inline text-xs">{t("Labels", "تسميات")}</span>
        </button>
      </div>
      <div ref={accRightRef} className="flex items-center gap-3" role="group" aria-label={t("Navigation tools", "أدوات التنقل")}>
        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="flex items-center gap-1 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-label={t("Switch to Arabic", "التبديل إلى الإنجليزية")}
        >
          <Globe className="w-3 h-3" />
          <span>{locale === "ar" ? "EN" : "عربي"}</span>
        </button>
        {/* Shortcuts hint */}
        <Link href="/shortcuts" className="hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px] flex items-center">
          <Keyboard className="w-3 h-3 inline mr-1" />
          {t("Shortcuts", "الاختصارات")}
        </Link>
      </div>
    </div>
  );
}

function TopNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { profile, locale } = useProfile();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  // Lane-constrained keyboard navigation for the nav bar
  const navLinksRef = useRef<HTMLDivElement>(null);
  useGridNavigation(navLinksRef, { disableWASD: false });
  const navRightRef = useRef<HTMLDivElement>(null);
  useGridNavigation(navRightRef, { disableWASD: false });

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes((user as any).role ?? "learner");
  });

  return (
    <nav
      className="w-full bg-[rgb(var(--nav-bg))] text-white"
      aria-label={t("Main navigation", "التنقل الرئيسي")}
    >
      <div className="container flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link href="/dashboard" aria-label="Go to dashboard" className="flex items-center gap-3 flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-1 group">
          {/* Logo: dark icon (green rounded square + white falcon) — visible on dark nav */}
          <img
            src="/img/hikma-icon-dark.png"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 object-contain rounded-xl transition-transform group-hover:scale-105 flex-shrink-0"
          />
          {/* Text wordmark */}
          <span className="flex flex-col leading-none select-none">
            <span className="text-white font-bold tracking-widest text-sm" style={{ letterSpacing: "0.2em" }}>HIKMA</span>
            <span className="text-white/70 font-light text-xs" style={{ letterSpacing: "0.08em" }}>حكمة</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div ref={navLinksRef} className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto" role="toolbar" aria-label="Navigation links">
          {/* Core 4 nav items always visible */}
          {visibleItems.slice(0, 4).map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 ${
                  isActive
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/80 hover:text-white hover:bg-muted/50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                {locale === "ar" ? item.labelAr : item.labelEn}
              </Link>
            );
          })}
          {/* More dropdown for ECC + Exam Skills — click-toggled, works on touch */}
          {visibleItems.length > 4 && (
            <div className="relative">
              <button
                onClick={() => setMoreOpen(v => !v)}
                onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) setMoreOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"
                aria-label={locale === "ar" ? "المزيد" : "More"}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal className="w-4 h-4" />
                {locale === "ar" ? "المزيد" : "More"}
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute top-full start-0 mt-1 w-52 bg-[rgb(var(--nav-bg))] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  {visibleItems.slice(4).map(item => {
                    const Icon = item.icon;
                    const isActive = location === item.href || location.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-3 text-sm transition-colors ${
                          isActive ? "bg-white/15 text-white font-semibold" : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {locale === "ar" ? item.labelAr : item.labelEn}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div ref={navRightRef} className="flex items-center gap-2 flex-shrink-0" role="toolbar" aria-label="Navigation controls">
          {/* Command palette */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 text-white/70 text-xs hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"
            aria-label={t("Open command palette (Ctrl+K)", "فتح لوحة الأوامر (Ctrl+K)")}
          >
            <span>{t("Search…", "بحث…")}</span>
            <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">⌘K</kbd>
          </button>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:block text-xs text-white/70 max-w-24 truncate">{user?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white/80 hover:text-white hover:bg-muted/50 text-xs"
                aria-label={t("Sign out", "تسجيل الخروج")}
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { window.location.href = '/signin'; }}
              className="text-white hover:bg-muted/50 text-xs"
              aria-label={t("Sign in", "تسجيل الدخول")}
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              {t("Sign in", "دخول")}
            </Button>
          )}

          {/* Settings */}
          <Link href="/settings" aria-label={t("Settings", "الإعدادات")}>
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-muted/50 w-8 h-8">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-muted/50 w-8 h-8"
            onClick={onMenuOpen}
            aria-label={t("Open menu", "فتح القائمة")}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}

function CommandPalette() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const { locale } = useProfile();
  const [, navigate] = useLocation();

  const commands = [
    { label: locale === "ar" ? "الرئيسية" : "Home", href: "/dashboard", icon: Home },
    { label: locale === "ar" ? "المواد" : "Subjects", href: "/subjects/1", icon: BookOpen },
    { label: locale === "ar" ? "حكمة AI" : "Hikma AI", href: "/tutor", icon: Bot },
    { label: locale === "ar" ? "تقدمي" : "My Progress", href: "/progress", icon: TrendingUp },
    { label: locale === "ar" ? "الإعدادات" : "Settings", href: "/settings", icon: Settings },
    { label: locale === "ar" ? "الاختصارات" : "Keyboard Shortcuts", href: "/shortcuts", icon: Keyboard },
    { label: locale === "ar" ? "المنهج الموسّع" : "ECC", href: "/ecc", icon: Layers },
    { label: locale === "ar" ? "مهارات الامتحان" : "Exam Skills", href: "/exam-skills", icon: FileText },
  ];

  return (
    <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
      <CommandInput placeholder={locale === "ar" ? "ابحث عن أي شيء…" : "Search anything…"} />
      <CommandList>
        <CommandEmpty>{locale === "ar" ? "لا توجد نتائج." : "No results found."}</CommandEmpty>
        <CommandGroup heading={locale === "ar" ? "التنقل" : "Navigation"}>
          {commands.map(cmd => {
            const Icon = cmd.icon;
            return (
              <CommandItem
                key={cmd.href}
                onSelect={() => { navigate(cmd.href); setCmdOpen(false); }}
              >
                <Icon className="w-4 h-4 mr-2" />
                {cmd.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Notify VoiceCommandOverlay to hide itself when mobile menu opens/closes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(mobileMenuOpen ? "hikma:mobile-menu-open" : "hikma:mobile-menu-close"));
  }, [mobileMenuOpen]);
  const { locale } = useProfile();
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Hide shell on landing page
  const isLanding = location === "/";

  // Play navigate sound on route change
  const prevLocationRef = React.useRef(location);
  const { announce } = useAriaLive();
  useEffect(() => {
    if (prevLocationRef.current !== location) {
      prevLocationRef.current = location;
      playSound("navigate");
      // Move focus to the page's h1 after route change so screen reader users
      // are not left on document.body after navigation.
      requestAnimationFrame(() => {
        const h1 = document.querySelector<HTMLElement>("main h1, #main-content h1, [role='main'] h1");
        if (h1) {
          if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: false });
          // Announce the page title via aria-live for screen readers
          announce(h1.textContent?.trim() ?? "Page loaded", "polite");
        } else {
          // Fallback: focus the main element
          const main = document.getElementById("main-content");
          if (main) main.focus({ preventScroll: false });
        }
      });
    }
  }, [location, announce]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Skip to main content — visible on focus for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold focus:outline-none"
      >
        {locale === "ar" ? "انتقل إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>
      {/* Colour overlay for dyslexia tint */}
      {profile.overlayTint !== "none" && (
        <div
          className="colour-overlay"
          data-overlay={profile.overlayTint}
          style={{ "--overlay-opacity": profile.overlayOpacity } as any}
          aria-hidden="true"
        />
      )}

      {!isLanding && (
        <div className="sticky top-0 z-40 shadow-lg">
          <AccessibilityBar />
          <TopNav onMenuOpen={() => setMobileMenuOpen(true)} />
        </div>
      )}

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side={locale === "ar" ? "right" : "left"} className="w-72 bg-[rgb(var(--nav-bg))] text-white border-0 p-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HikmaLogo surface="dark" size={44} alt="Hikma" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-white hover:bg-muted/50 w-8 h-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <nav className="p-3 space-y-1" aria-label={locale === "ar" ? "قائمة التنقل" : "Mobile navigation"}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-muted/50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {locale === "ar" ? item.labelAr : item.labelEn}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Command palette */}
      <CommandPalette />

      {/* Sound announcer — required by sound.ts visualFlash() for screen reader announcements */}
      <div id="sound-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />
      {/* Main content */}
      <main id="main-content" className="flex-1 page-enter" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      {!isLanding && (
        <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
          <p>
            Hikma — حكمة &nbsp;·&nbsp;
            {locale === "ar" ? "مبني وفق معايير MADA وإمكانية الوصول" : "Built to MADA & WCAG AA accessibility standards"}
            &nbsp;·&nbsp;
            <Link href="/shortcuts" className="hover:text-foreground transition-colors">{locale === "ar" ? "الاختصارات" : "Shortcuts"}</Link>
          </p>
        </footer>
      )}
    </div>
  );
}
