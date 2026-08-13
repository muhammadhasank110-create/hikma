import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { HikmaLogo } from "@/components/HikmaLogo";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";

type PublicLayoutProps = {
  children: ReactNode;
  active?: "home" | "about" | "contact";
  backdrop?: "forest" | "clay" | "sage";
};

export function PublicLayout({ children, active, backdrop = "forest" }: PublicLayoutProps) {
  const { locale } = useProfile();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const t = (english: string, arabic: string) => locale === "ar" ? arabic : english;
  const destination = isAuthenticated ? "/dashboard" : "/signup";
  const activeClass = "bg-emerald-950 text-white shadow-sm";
  const passiveClass = "text-emerald-950/70 hover:bg-emerald-950/6 hover:text-emerald-950";
  const publicHref = (path: string) => locale === "ar" ? `${path}?lang=ar` : path;

  return (
    <div className="premium-public relative min-h-screen overflow-x-clip" dir={locale === "ar" ? "rtl" : "ltr"}>
      <AmbientBackdrop variant={backdrop} />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link href={publicHref("/")} className="group flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800" aria-label={t("Hikma home", "الصفحة الرئيسية لحكمة")}>
          <span className="premium-surface grid size-10 place-items-center rounded-2xl border transition-transform duration-200 group-hover:-translate-y-0.5"><HikmaLogo surface="light" size={30} alt="Hikma logo" /></span>
          <span className="leading-tight"><strong className="premium-ink block text-sm tracking-[0.18em]">HIKMA</strong><span className="premium-muted text-xs">حكمة</span></span>
        </Link>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <nav className="flex max-w-[13rem] items-center gap-1 overflow-x-auto rounded-full border border-emerald-950/8 bg-white/60 p-1 text-xs font-semibold shadow-[0_8px_20px_rgba(25,59,37,0.06)] sm:max-w-none sm:text-sm" aria-label={t("Public navigation", "التنقّل العام")}>
            <Link href={publicHref("/")} className={`whitespace-nowrap rounded-full px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${active === "home" ? activeClass : passiveClass}`}>{t("Home", "الرئيسية")}</Link>
            <a href={`${publicHref("/")}#approach`} className="hidden whitespace-nowrap rounded-full px-3 py-2 text-emerald-950/70 transition-colors hover:bg-emerald-950/6 hover:text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 md:inline">{t("Approach", "المنهجية")}</a>
            <Link href={publicHref("/about")} className={`whitespace-nowrap rounded-full px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${active === "about" ? activeClass : passiveClass}`}>{t("About", "من نحن")}</Link>
            <Link href={publicHref("/contact")} className={`whitespace-nowrap rounded-full px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${active === "contact" ? activeClass : passiveClass}`}>{t("Contact", "تواصل")}</Link>
          </nav>
          <button type="button" onClick={() => navigate(destination)} className="hidden min-h-11 items-center gap-2 rounded-full bg-emerald-950 px-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(20,65,39,0.2)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:inline-flex">
            {isAuthenticated ? t("Open app", "فتح التطبيق") : t("Start learning", "ابدأ التعلّم")}<ArrowUpRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="relative z-[1]">{children}</main>
      <footer className="relative z-[1] mx-auto flex max-w-7xl flex-col gap-3 border-t border-emerald-950/10 px-5 py-8 text-xs text-emerald-950/60 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span>Hikma — حكمة</span><span>{t("Accessible learning, thoughtfully designed.", "تعلّم ميسّر بتصميم مدروس.")}</span>
      </footer>
    </div>
  );
}
