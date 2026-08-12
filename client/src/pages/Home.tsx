import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Brain, Keyboard, Volume2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { HikmaLogo } from "@/components/HikmaLogo";
import { useHikmaMotion } from "@/hooks/useHikmaMotion";
import { useProfile } from "@/contexts/ProfileContext";

const LANDING_PAGE_TITLE = "Hikma | Accessible AI Learning for Every Learner";

const features = (t: (english: string, arabic: string) => string) => [
  { icon: Volume2, title: t("Listen as you learn", "استمع أثناء التعلّم"), text: t("Narration and voice support stay close to every lesson.", "يبقى السرد الصوتي ودعم الأوامر قريبَين من كل درس.") },
  { icon: Keyboard, title: t("Move with confidence", "تنقّل بثقة"), text: t("Keyboard-first navigation supports an uninterrupted flow.", "يدعم التنقّل بلوحة المفاتيح مساراً دراسياً بلا انقطاع.") },
  { icon: Brain, title: t("Learn with Hikma AI", "تعلّم مع حكمة AI"), text: t("Guidance that works from your pace, not against it.", "توجيه يراعي وتيرتك ولا يفرض عليك إيقاعاً مختلفاً.") },
];

function BrandEntry() {
  const motionConfig = useHikmaMotion();

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#0c1710] px-6 text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionConfig.transition}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm text-center">
        <motion.div
          className="mx-auto mb-8 grid size-32 place-items-center rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
          initial={motionConfig.reduceMotion ? false : { opacity: 0, rotateX: -18, rotateY: 18, y: 12 }}
          animate={{ opacity: 1, rotateX: 0, rotateY: 0, y: 0 }}
          transition={motionConfig.spring}
          style={{ transformPerspective: 900 }}
        >
          <HikmaLogo surface="dark" size={84} alt="Hikma logo" />
        </motion.div>
        <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-emerald-200/80">Hikma — حكمة</p>
        <h1 id="intro-title" className="text-3xl font-semibold tracking-tight">A calmer way to learn.</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">Built around your access needs, attention, and next small step.</p>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { locale } = useProfile();
  const motionConfig = useHikmaMotion();
  const [showEntry, setShowEntry] = useState(true);
  const t = (english: string, arabic: string) => locale === "ar" ? arabic : english;

  useEffect(() => {
    document.title = LANDING_PAGE_TITLE;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowEntry(false), motionConfig.reduceMotion ? 80 : 1600);
    return () => window.clearTimeout(timer);
  }, [motionConfig.reduceMotion]);

  const destination = isAuthenticated ? "/dashboard" : "/signup";

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#152119]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <AnimatePresence mode="wait">
        {showEntry && <BrandEntry />}
      </AnimatePresence>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c5c3a]" aria-label="Hikma home">
          <HikmaLogo surface="light" size={38} alt="Hikma logo" />
          <span className="leading-tight"><strong className="block text-sm tracking-[0.18em]">HIKMA</strong><span className="text-xs text-[#627066]">حكمة</span></span>
        </Link>
        <div className="flex items-center gap-3">
          {!isAuthenticated && <button type="button" onClick={() => navigate("/signin")} className="min-h-11 rounded-full px-4 text-sm font-medium text-[#344438] hover:bg-[#e8ebe4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2c5c3a]">{t("Sign in", "تسجيل الدخول")}</button>}
          <button type="button" onClick={() => navigate(destination)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173a25] px-4 text-sm font-semibold text-white hover:bg-[#0d2919] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c5c3a]">
            {isAuthenticated ? t("Open dashboard", "فتح لوحة التحكم") : t("Start learning", "ابدأ التعلّم")}<ArrowUpRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-24 lg:pt-20">
          <motion.div className="text-start" initial={motionConfig.page.initial} animate={motionConfig.page.animate} transition={motionConfig.enterTransition}>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#4a7b5a]">{t("Adaptive learning for real people", "تعلّم تكيّفي لأشخاص حقيقيين")}</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.15] tracking-[-0.055em] text-[#122119] sm:text-6xl">{t("The learning space that makes room for you.", "مساحة تعلّم تمنحك متّسعاً لتتعلّم بطريقتك.")}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#526056]">{t("Hikma pairs accessible learning tools with guided AI support for IGCSE Edexcel and Qatar MoEHE learners.", "تجمع حكمة أدوات تعلّم ميسّرة مع دعم ذكي موجّه لدارسي إيدكسل IGCSE ووزارة التربية والتعليم القطرية.")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate(destination)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#173a25] px-5 text-sm font-semibold text-white hover:bg-[#0d2919] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c5c3a]">{t("Begin your path", "ابدأ مسارك")} <ArrowUpRight className="size-4 rtl:rotate-180" aria-hidden="true" /></button>
              <Link href="/signin" className="inline-flex min-h-12 items-center rounded-full border border-[#ccd4c9] px-5 text-sm font-semibold text-[#243129] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c5c3a]">{t("Explore with an account", "استكشف بحسابك")}</Link>
            </div>
          </motion.div>

          <motion.div className="relative text-start rounded-[2rem] border border-[#dce3d9] bg-[#e9efe8] p-6 sm:p-9" initial={motionConfig.reduceMotion ? false : { opacity: 0, y: 16, rotateX: 2 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={motionConfig.enterTransition} style={{ transformPerspective: 1000 }}>
            <div className="flex items-center justify-between border-b border-[#cdd8ce] pb-5"><span className="text-sm font-semibold">{t("Today’s learning", "تعلّم اليوم")}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#477054]">{t("In your rhythm", "وفق إيقاعك")}</span></div>
            <div className="py-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#60806a]">{t("Next lesson", "الدرس التالي")}</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">{t("Patterns of energy", "أنماط الطاقة")}</h2><p className="mt-2 text-sm leading-6 text-[#607066]">{t("Continue from the idea you paused on, with audio, focus, and text controls ready when you need them.", "تابع من الفكرة التي توقفت عندها، مع الصوت والتركيز وأدوات النص حين تحتاج إليها.")}</p></div>
            <div className="grid grid-cols-3 gap-3"><div className="rounded-2xl bg-white p-3"><BookOpen className="size-4 text-[#2e6940]" /><p className="mt-5 text-xl font-semibold">12</p><p className="text-xs text-[#68766d]">{t("minutes", "دقيقة")}</p></div><div className="rounded-2xl bg-white p-3"><Brain className="size-4 text-[#2e6940]" /><p className="mt-5 text-xl font-semibold">1</p><p className="text-xs text-[#68766d]">{t("concept", "مفهوم")}</p></div><div className="rounded-2xl bg-[#173a25] p-3 text-white"><Keyboard className="size-4 text-emerald-200" /><p className="mt-5 text-xl font-semibold">⌘</p><p className="text-xs text-white/65">{t("keyboard-ready", "جاهز للوحة المفاتيح")}</p></div></div>
          </motion.div>
        </section>

        <section className="border-y border-[#dce3d9] bg-white"><div className="mx-auto grid max-w-6xl gap-px px-5 py-5 sm:grid-cols-3 sm:px-8"><div className="py-4 text-sm text-[#607066]">{t("Designed for focus, not noise.", "مصممة للتركيز لا للتشتيت.")}</div><div className="py-4 text-sm text-[#607066]">{t("Arabic and English learning paths.", "مسارات تعلّم بالعربية والإنجليزية.")}</div><div className="py-4 text-sm text-[#607066]">{t("Tools that adapt without getting in the way.", "أدوات تتكيّف من دون أن تعيقك.")}</div></div></section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8"><div className="mb-9 flex items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4a7b5a]">{t("How Hikma helps", "كيف تساعدك حكمة")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{t("Stay close to the work.", "ابقَ قريباً من التعلّم.")}</h2></div><Link href="/signup" className="hidden text-sm font-semibold text-[#2d6540] sm:block">{t("Create a learner profile →", "أنشئ ملفاً للمتعلّم ←")}</Link></div><div className="grid gap-4 md:grid-cols-3">{features(t).map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-[#dce3d9] bg-white p-6 text-start"><Icon className="size-5 text-[#2e6940]" aria-hidden="true"/><h3 className="mt-10 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#627066]">{text}</p></article>)}</div></section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-[#dce3d9] px-5 py-8 text-xs text-[#68766d] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>Hikma — حكمة</span><span>Accessible learning for IGCSE Edexcel and Qatar MoEHE.</span></footer>
    </div>
  );
}
