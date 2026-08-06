import React, { useState, useEffect } from "react";
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
  ChevronRight, LogOut, LogIn, Layers, Star, FileText
} from "lucide-react";
import { startLogin } from "@/const";

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
  { href: "/subjects/1", labelEn: "Subjects", labelAr: "المواد", icon: BookOpen },
  { href: "/tutor", labelEn: "Hikma AI", labelAr: "حكمة AI", icon: Bot },
  { href: "/progress", labelEn: "Progress", labelAr: "تقدمي", icon: TrendingUp },
  { href: "/ecc", labelEn: "ECC", labelAr: "المنهج الموسّع", icon: Layers },
  { href: "/exam-skills", labelEn: "Exam Skills", labelAr: "مهارات الامتحان", icon: FileText },
  { href: "/teacher", labelEn: "Teacher", labelAr: "المعلم", icon: GraduationCap, roles: ["teacher", "admin"] },
  { href: "/guardian", labelEn: "Guardian", labelAr: "ولي الأمر", icon: Users, roles: ["guardian", "admin"] },
  { href: "/admin", labelEn: "Admin", labelAr: "الإدارة", icon: Shield, roles: ["admin"] },
];

function AccessibilityBar() {
  const { profile, updateProfile, locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div
      id="accessibility-bar"
      className="w-full bg-[rgb(var(--nav-bg))] text-white text-xs flex items-center justify-between px-4 py-0 gap-4 flex-wrap min-h-[44px]"
      role="toolbar"
      aria-label={t("Accessibility controls", "أدوات إمكانية الوصول")}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* High contrast toggle */}
        <button
          onClick={() => updateProfile({ theme: profile.theme === "high_contrast" ? "light" : "high_contrast" })}
          className="flex items-center gap-1 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-label={t("Toggle high contrast", "تبديل التباين العالي")}
          aria-pressed={profile.theme === "high_contrast"}
        >
          <Contrast className="w-3 h-3" />
          <span>{t("High contrast", "تباين عالٍ")}</span>
        </button>
        {/* Text size */}
        <button
          onClick={() => updateProfile({ fontScale: Math.min(2.5, profile.fontScale + 0.1) })}
          className="hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px] flex items-center"
          aria-label={t("Increase text size", "تكبير النص")}
        >
          A+
        </button>
        <button
          onClick={() => updateProfile({ fontScale: Math.max(1.0, profile.fontScale - 0.1) })}
          className="hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px] flex items-center"
          aria-label={t("Decrease text size", "تصغير النص")}
        >
          A−
        </button>
        {/* Audio toggle */}
        <button
          onClick={() => updateProfile({ autoNarrate: !profile.autoNarrate })}
          className="flex items-center gap-1 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-label={t("Toggle audio narration", "تبديل السرد الصوتي")}
          aria-pressed={profile.autoNarrate}
        >
          {profile.autoNarrate ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span>{t("Audio", "صوت")}</span>
        </button>
        {/* Focus mode */}
        <button
          onClick={() => updateProfile({ mode: profile.mode === "focus" ? "reading" : "focus" })}
          className="flex items-center gap-1 hover:text-yellow-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-2 min-h-[44px]"
          aria-label={t("Toggle focus mode", "تبديل وضع التركيز")}
          aria-pressed={profile.mode === "focus"}
        >
          <Star className="w-3 h-3" />
          <span>{t("Focus", "تركيز")}</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
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
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes((user as any).role ?? "learner");
  });

  return (
    <nav
      className="sticky top-0 z-40 w-full bg-[rgb(var(--nav-bg))] text-white shadow-lg"
      aria-label={t("Main navigation", "التنقل الرئيسي")}
    >
      <div className="container flex items-center justify-between h-14 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 rounded px-1">
          <img
            src="/manus-storage/hikma-app-icon-clean_e261c2b4.png"
            alt="Hikma حكمة"
            className="h-9 w-9 object-contain rounded-xl"
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto">
          {visibleItems.slice(0, 6).map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 ${
                  isActive
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {locale === "ar" ? item.labelAr : item.labelEn}
              </Link>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Command palette */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"
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
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
                aria-label={t("Sign out", "تسجيل الخروج")}
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startLogin()}
              className="text-white hover:bg-white/10 text-xs"
              aria-label={t("Sign in", "تسجيل الدخول")}
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              {t("Sign in", "دخول")}
            </Button>
          )}

          {/* Settings */}
          <Link href="/settings" aria-label={t("Settings", "الإعدادات")}>
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 w-8 h-8">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10 w-8 h-8"
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
  const { locale } = useProfile();
  const [location] = useLocation();

  // Hide shell on landing page
  const isLanding = location === "/";

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
        <>
          <AccessibilityBar />
          <TopNav onMenuOpen={() => setMobileMenuOpen(true)} />
        </>
      )}

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side={locale === "ar" ? "right" : "left"} className="w-72 bg-[rgb(var(--nav-bg))] text-white border-0 p-0">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/manus-storage/hikma-app-icon-clean_e261c2b4.png"
                  alt="Hikma حكمة"
                  className="h-8 w-8 object-contain rounded-xl"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-white hover:bg-white/10 w-8 h-8">
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
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

      {/* Main content */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
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
