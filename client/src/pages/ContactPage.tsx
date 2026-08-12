import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Mail, Send } from "lucide-react";
import { HikmaLogo } from "@/components/HikmaLogo";
import { useHikmaMotion } from "@/hooks/useHikmaMotion";
import { useProfile } from "@/contexts/ProfileContext";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const CONTACT_EMAIL = "muhammadhasank110@gmail.com";

export default function ContactPage() {
  const { locale } = useProfile();
  const motionConfig = useHikmaMotion();
  const [submitted, setSubmitted] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  usePageMetadata({ title: "Contact HIKMA | Learning Support and Feedback", description: "Contact HIKMA with a question, partnership idea, or feedback about accessible adaptive learning.", path: "/contact" });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = `[HIKMA] ${data.get("subject") || "Contact request"}`;
    const body = `${t("Name", "الاسم")}: ${data.get("name")}\n${t("Email", "البريد الإلكتروني")}: ${data.get("email")}\n\n${data.get("message")}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };
  useEffect(() => { if (submitted) statusRef.current?.focus(); }, [submitted]);
  return <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#f7f8f4] text-[#152119]" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c5c3a]" aria-label={t("Hikma home", "الصفحة الرئيسية لحكمة")}><HikmaLogo surface="light" size={38} alt="Hikma logo" /><span className="leading-tight"><strong className="block text-sm tracking-[0.18em]">HIKMA</strong><span className="text-xs text-[#627066]">حكمة</span></span></Link><nav className="flex items-center gap-2 text-sm font-medium" aria-label={t("Public navigation", "التنقّل العام")}><Link href="/about" className="rounded-full px-4 py-2 hover:bg-[#e8ebe4]">{t("About", "من نحن")}</Link><Link href="/contact" className="rounded-full bg-[#e8ebe4] px-4 py-2">{t("Contact", "تواصل")}</Link></nav></header>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:py-20"><motion.div className="text-start" initial={motionConfig.page.initial} animate={motionConfig.page.animate} transition={motionConfig.enterTransition}><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a7b5a]">{t("Contact", "تواصل")}</p><h1 className="mt-5 text-5xl font-semibold leading-[1.1] tracking-[-0.045em] sm:text-6xl">{t("Tell us what would help.", "أخبرنا بما قد يساعدك.")}</h1><p className="mt-6 max-w-md text-lg leading-8 text-[#526056]">{t("Send a question, a partnership idea, or feedback about your learning experience.", "أرسل سؤالاً أو فكرة شراكة أو ملاحظة عن تجربة تعلّمك.")}</p><a href={`mailto:${CONTACT_EMAIL}`} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#2d6540] underline underline-offset-4"><Mail className="size-4" />{CONTACT_EMAIL}</a></motion.div>
      <motion.form onSubmit={submit} className="rounded-[2rem] border border-[#dce3d9] bg-white p-6 shadow-[0_24px_55px_rgba(31,67,43,0.08)] sm:p-8" initial={motionConfig.reduceMotion ? false : { opacity: 0, y: 18, rotateX: 3 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={motionConfig.spring} style={{ transformPerspective: 1100 }}><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">{t("Name", "الاسم")}<input required name="name" autoComplete="name" className="min-h-12 rounded-xl border border-[#ccd4c9] bg-[#fbfcf9] px-4 font-normal outline-none focus:border-[#2c5c3a] focus:ring-2 focus:ring-[#2c5c3a]/20" /></label><label className="grid gap-2 text-sm font-semibold">{t("Email", "البريد الإلكتروني")}<input required name="email" type="email" autoComplete="email" className="min-h-12 rounded-xl border border-[#ccd4c9] bg-[#fbfcf9] px-4 font-normal outline-none focus:border-[#2c5c3a] focus:ring-2 focus:ring-[#2c5c3a]/20" /></label></div><label className="mt-5 grid gap-2 text-sm font-semibold">{t("Subject", "الموضوع")}<input required name="subject" className="min-h-12 rounded-xl border border-[#ccd4c9] bg-[#fbfcf9] px-4 font-normal outline-none focus:border-[#2c5c3a] focus:ring-2 focus:ring-[#2c5c3a]/20" /></label><label className="mt-5 grid gap-2 text-sm font-semibold">{t("Message", "الرسالة")}<textarea required name="message" rows={6} className="rounded-xl border border-[#ccd4c9] bg-[#fbfcf9] p-4 font-normal outline-none focus:border-[#2c5c3a] focus:ring-2 focus:ring-[#2c5c3a]/20" /></label><button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#173a25] px-5 text-sm font-semibold text-white hover:bg-[#0d2919] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c5c3a]"><Send className="size-4" />{t("Email your message", "أرسل رسالتك بالبريد")}</button>{submitted && <p ref={statusRef} tabIndex={-1} className="mt-4 rounded-xl bg-[#edf5ee] p-3 text-sm text-[#285235] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2c5c3a]" role="status">{t("Your email application should now be open with your message addressed to us. If it did not open, use the email address shown on this page.", "ينبغي أن يكون تطبيق البريد الإلكتروني قد فُتح الآن مع توجيه رسالتك إلينا. إن لم يُفتح، فاستخدم عنوان البريد الظاهر في هذه الصفحة.")}</p>}</motion.form></section>
  </main>;
}
