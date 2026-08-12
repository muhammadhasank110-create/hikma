import { Link } from "wouter";
import { motion } from "framer-motion";
import { Accessibility, Brain, HeartHandshake, Languages } from "lucide-react";
import { HikmaLogo } from "@/components/HikmaLogo";
import { useHikmaMotion } from "@/hooks/useHikmaMotion";
import { useProfile } from "@/contexts/ProfileContext";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const pillars = [
  { icon: Accessibility, en: "Built for access", ar: "مصمّمة للإتاحة", bodyEn: "Text, motion, sound, focus, and contrast work together as choices—not obstacles.", bodyAr: "النص والحركة والصوت والتركيز والتباين تعمل معاً كخيارات، لا كعقبات." },
  { icon: Brain, en: "Guidance, not shortcuts", ar: "توجيه لا اختصارات", bodyEn: "Hikma AI helps learners reason through a concept at a pace that makes sense to them.", bodyAr: "تساعد حكمة AI المتعلّمين على التفكير في المفهوم وفق وتيرة تناسبهم." },
  { icon: Languages, en: "Arabic and English", ar: "العربية والإنجليزية", bodyEn: "Bilingual learning is treated as a core experience, including direction, typography, and voice.", bodyAr: "يُعامل التعلّم ثنائي اللغة كتجربة أساسية، تشمل الاتجاه والطباعة والصوت." },
  { icon: HeartHandshake, en: "Human by design", ar: "إنسانية بطبيعتها", bodyEn: "The platform is calm, direct, and designed to leave space for learners and teachers.", bodyAr: "المنصة هادئة ومباشرة ومصممة لتترك مساحة للمتعلمين والمعلمين." },
];

export default function AboutPage() {
  const { locale } = useProfile();
  const motionConfig = useHikmaMotion();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  usePageMetadata({ title: "About HIKMA | Accessible Adaptive Learning", description: "Learn how HIKMA combines accessible learning tools, bilingual support, and guided AI for calmer study.", path: "/about" });
  return <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#f7f8f4] text-[#152119]" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c5c3a]" aria-label={t("Hikma home", "الصفحة الرئيسية لحكمة")}><HikmaLogo surface="light" size={38} alt="Hikma logo" /><span className="leading-tight"><strong className="block text-sm tracking-[0.18em]">HIKMA</strong><span className="text-xs text-[#627066]">حكمة</span></span></Link>
      <nav className="flex items-center gap-2 text-sm font-medium" aria-label={t("Public navigation", "التنقّل العام")}><Link href="/about" className="rounded-full bg-[#e8ebe4] px-4 py-2">{t("About", "من نحن")}</Link><Link href="/contact" className="rounded-full px-4 py-2 hover:bg-[#e8ebe4]">{t("Contact", "تواصل")}</Link></nav>
    </header>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
      <motion.div className="text-start" initial={motionConfig.page.initial} animate={motionConfig.page.animate} transition={motionConfig.enterTransition}><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a7b5a]">{t("About Hikma", "عن حكمة")}</p><h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.1] tracking-[-0.045em] sm:text-6xl">{t("Learning support that feels considered.", "دعم تعليمي يشعر بالاهتمام.")}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#526056]">{t("Hikma is an adaptive learning space for learners who need a clearer, calmer way to build understanding.", "حكمة مساحة تعلّم تكيّفية للمتعلمين الذين يحتاجون إلى طريقة أوضح وأكثر هدوءاً لبناء الفهم.")}</p></motion.div>
      <motion.div className="relative rounded-[2rem] border border-[#dce3d9] bg-[#e9efe8] p-8" initial={motionConfig.reduceMotion ? false : { opacity: 0, y: 18, rotateX: 4, rotateY: -3 }} animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }} transition={motionConfig.spring} style={{ transformPerspective: 1100 }}><div className="rounded-2xl border border-white/80 bg-white p-6 shadow-[0_24px_55px_rgba(31,67,43,0.1)]"><p className="text-sm font-semibold text-[#315e3e]">{t("Our promise", "وعدنا")}</p><p className="mt-4 text-2xl font-semibold leading-snug">{t("The tools should adapt to the learner—not the other way around.", "ينبغي أن تتكيّف الأدوات مع المتعلم، لا العكس.")}</p></div></motion.div>
    </section>
    <section className="border-t border-[#dce3d9] bg-white"><div className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">{pillars.map(({ icon: Icon, en, ar, bodyEn, bodyAr }) => <article key={en} className="rounded-3xl border border-[#dce3d9] bg-[#f9faf7] p-6 text-start"><Icon className="size-5 text-[#2e6940]" aria-hidden="true" /><h2 className="mt-10 text-lg font-semibold">{t(en, ar)}</h2><p className="mt-2 text-sm leading-6 text-[#627066]">{t(bodyEn, bodyAr)}</p></article>)}</div></section>
  </main>;
}
