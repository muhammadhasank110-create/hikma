import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { startLogin } from "@/const";
import {
  Bot, BookOpen, Brain, Volume2, Keyboard, Eye, ArrowRight,
  GraduationCap, Layers, Globe, Accessibility
} from "lucide-react";

const FEATURES = [
  { icon: Volume2, titleEn: "Audio-First Mode", titleAr: "وضع الصوت أولاً", descEn: "Full narration with earcons, described diagrams, and braille output. Optimised for screen readers.", descAr: "سرد كامل مع أيقونات صوتية ووصف الصور وإخراج برايل.", color: "bg-clay/10 text-clay" },
  { icon: BookOpen, titleEn: "Reading Mode", titleAr: "وضع القراءة", descEn: "Dyslexia-friendly typography, colour overlays, reading ruler, syllable splitting, and TTS.", descAr: "خط مناسب لعسر القراءة، طبقات لونية، مسطرة القراءة، وقراءة صوتية.", color: "bg-primary/10 text-primary" },
  { icon: Brain, titleEn: "Focus Mode", titleAr: "وضع التركيز", descEn: "One chunk at a time. Arrival rail, park-a-thought, body double, and Pomodoro timers for ADHD.", descAr: "مقطع واحد في كل مرة. قضبان الوصول، حفظ الأفكار، ومؤقتات بومودورو.", color: "bg-accent/10 text-accent" },
  { icon: Bot, titleEn: "Live AI Tutor", titleAr: "معلم ذكي مباشر", descEn: "Streaming GPT-4o tutor that knows your curriculum, adapts to your reading level, and speaks Arabic.", descAr: "معلم GPT-4o يعرف منهجك ويتكيف مع مستواك ويتحدث العربية.", color: "bg-green-100 text-green-700" },
  { icon: Keyboard, titleEn: "Keyboard-First", titleAr: "لوحة المفاتيح أولاً", descEn: "Every action reachable by keyboard. Command palette, shortcut sheet, arrow-key quizzes.", descAr: "كل إجراء متاح عبر لوحة المفاتيح. لوحة الأوامر وقائمة الاختصارات.", color: "bg-blue-100 text-blue-700" },
  { icon: Layers, titleEn: "ECC Track", titleAr: "المنهج الأساسي الموسّع", descEn: "9 foundational skill areas for blind and low-vision learners, aligned with MADA Qatar standards.", descAr: "9 مجالات مهارية أساسية متوافقة مع معايير مدى قطر.", color: "bg-purple-100 text-purple-700" },
];

const MOOD_WORDS = [
  { en: "Arrival, not a wall", ar: "وصول، لا جدار", active: true },
  { en: "Steady pace", ar: "وتيرة ثابتة", active: false },
  { en: "Room to re-explain", ar: "مساحة لإعادة الشرح", active: false },
  { en: "Belonging", ar: "الانتماء", active: true },
  { en: "Quiet confidence", ar: "ثقة هادئة", active: false },
  { en: "Heard", ar: "مسموع", active: true },
  { en: "Un-rushed", ar: "غير مستعجل", active: false },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Accessibility bar */}
      <div className="w-full bg-[rgb(var(--nav-bg))] text-white text-xs flex items-center justify-between px-4 py-1.5">
        <span className="opacity-60">{t("Accessible-first · Calm & unhurried · Growth-toned", "إمكانية الوصول أولاً · هادئ وغير مستعجل · نمو متدرج")}</span>
        <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="flex items-center gap-1 hover:text-yellow-300 transition-colors" aria-label={t("Switch to Arabic", "Switch to English")}>
          <Globe className="w-3 h-3" />{locale === "ar" ? "EN" : "عربي"}
        </button>
      </div>

      {/* Hero */}
      <section className="bg-[rgb(var(--forest-deep))] text-white relative overflow-hidden">
        <div className="container py-16 md:py-24 flex flex-col md:flex-row items-start gap-12">
          <div className="flex-1 space-y-6 max-w-2xl animate-arrive">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-white/60">
              <span>HIKMA · حكمة</span><span>—</span><span>{t("ADAPTIVE LEARNING PLATFORM", "منصة التعلم التكيفي")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {t("A quiet place to ", "مكان هادئ لـ ")}
              <em className="not-italic text-[rgb(var(--clay-light))]">{t("arrive", "الوصول")}</em>
              {t(" at understanding.", " إلى الفهم.")}
            </h1>
            <p className="text-white/70 text-lg max-w-lg leading-relaxed">
              {t("The adaptive AI learning companion for blind, dyslexic, and ADHD learners. Accessibility is the architecture, not an add-on.", "الرفيق التعليمي الذكي للمتعلمين المكفوفين وذوي عسر القراءة واضطراب التركيز. إمكانية الوصول هي البنية الأساسية.")}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {["Accessible-first", "Calm & unhurried", "Growth-toned", "Audio · text · visual"].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full border border-white/30 text-xs text-white/80">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap pt-2">
              {isAuthenticated ? (
                <Link href="/dashboard"><Button size="lg" className="bg-white text-[rgb(var(--forest-deep))] hover:bg-white/90 font-bold">{t("Go to Dashboard", "الذهاب إلى لوحة التحكم")} <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              ) : (
                <>
                  <Button size="lg" className="bg-white text-[rgb(var(--forest-deep))] hover:bg-white/90 font-bold" onClick={() => startLogin()}>{t("Start Learning", "ابدأ التعلم")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  <Link href="/onboarding"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">{t("Try without account", "جرّب بدون حساب")}</Button></Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-3 animate-arrive animate-arrive-delay-2">
            <div className="relative w-48 h-48">
              {[0, 8, 16, 24, 32, 40].map((inset, i) => (
                <div key={i} className="absolute rounded-full border border-white/20" style={{ inset: `${inset}px` }} />
              ))}
              <div className="absolute inset-20 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-widest uppercase text-white/50">{t("SIGNATURE", "الشعار")}</p>
              <p className="text-lg font-bold">{t("The growth ring", "حلقة النمو")}</p>
              <p className="text-xs text-white/60 max-w-32 text-right">{t("Arrival as a widening loop — the motif every mode shares.", "الوصول كحلقة متسعة — الشعار الذي تشترك فيه كل الأوضاع.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 bg-background">
        <div className="container space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">{t("Built for every learner", "مبني لكل متعلم")}</h2>
            <p className="text-muted-foreground">{t("Three adaptive modes, a live AI tutor, full keyboard access, and MADA-aligned accessibility.", "ثلاثة أوضاع تكيفية، معلم ذكي مباشر، وصول كامل بلوحة المفاتيح، وإمكانية وصول متوافقة مع مدى.")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={f.titleEn} className="hover:border-primary hover:shadow-md transition-all animate-arrive" style={{ animationDelay: `${i * 60}ms` }}>
                  <CardContent className="p-6 space-y-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}><Icon className="w-5 h-5" /></div>
                    <h3 className="font-bold">{t(f.titleEn, f.titleAr)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descEn, f.descAr)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mood words */}
      <section className="py-12 bg-[rgb(var(--sage))]">
        <div className="container space-y-6">
          <h2 className="text-xl font-bold text-center">{t("Mood words", "كلمات المزاج")}</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {MOOD_WORDS.map(w => (
              <span key={w.en} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${w.active ? "bg-[rgb(var(--clay))] text-white" : "bg-white border border-border text-foreground"}`}>
                {t(w.en, w.ar)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[rgb(var(--forest-deep))] text-white">
        <div className="container text-center space-y-6 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold">{t("Your calm, supportive space to learn and grow.", "مساحتك الهادئة والداعمة للتعلم والنمو.")}</h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-white text-[rgb(var(--forest-deep))] hover:bg-white/90 font-bold" onClick={() => startLogin()}>{t("Get started free", "ابدأ مجاناً")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
            <Link href="/onboarding"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">{t("See how it works", "كيف يعمل")}</Button></Link>
          </div>
          <p className="text-xs text-white/50">{t("Built to MADA Qatar & WCAG 2.2 AA accessibility standards · Arabic & English · IGCSE Edexcel + Qatar MoEHE", "مبني وفق معايير مدى قطر و WCAG 2.2 AA · عربي وإنجليزي · IGCSE إيدكسيل + وزارة التعليم القطرية")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container flex items-center justify-between flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-primary/40 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></div>
            <span className="font-semibold">Hikma — حكمة</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/onboarding" className="hover:text-foreground transition-colors">{t("Onboarding", "التأهيل")}</Link>
            <Link href="/shortcuts" className="hover:text-foreground transition-colors">{t("Shortcuts", "الاختصارات")}</Link>
            <Link href="/exam-skills" className="hover:text-foreground transition-colors">{t("Exam Skills", "مهارات الامتحان")}</Link>
          </div>
          <div className="flex items-center gap-1"><Accessibility className="w-3 h-3" /><span>{t("MADA & WCAG AA compliant", "متوافق مع مدى و WCAG AA")}</span></div>
        </div>
      </footer>
    </div>
  );
}
