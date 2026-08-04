import { useProfile } from "@/contexts/ProfileContext";
import { useKeyboard } from "@/contexts/KeyboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";

const GLOBAL_SHORTCUTS = [
  { keys: ["Ctrl", "K"], descEn: "Open command palette", descAr: "فتح لوحة الأوامر", scope: "global" },
  { keys: ["?"], descEn: "Show this shortcuts sheet", descAr: "عرض قائمة الاختصارات", scope: "global" },
  { keys: ["Ctrl", "Shift", "A"], descEn: "Toggle audio narration", descAr: "تبديل السرد الصوتي", scope: "global" },
  { keys: ["Ctrl", "Shift", "F"], descEn: "Toggle focus mode", descAr: "تبديل وضع التركيز", scope: "global" },
  { keys: ["Ctrl", "Shift", "H"], descEn: "Toggle high contrast", descAr: "تبديل التباين العالي", scope: "global" },
  { keys: ["Ctrl", "Shift", "T"], descEn: "Open AI tutor", descAr: "فتح المعلم الذكي", scope: "global" },
  { keys: ["Ctrl", "+"], descEn: "Increase text size", descAr: "تكبير النص", scope: "global" },
  { keys: ["Ctrl", "-"], descEn: "Decrease text size", descAr: "تصغير النص", scope: "global" },
];

const LESSON_SHORTCUTS = [
  { keys: ["Space"], descEn: "Play / pause narration", descAr: "تشغيل / إيقاف السرد", scope: "lesson" },
  { keys: ["→"], descEn: "Next section", descAr: "القسم التالي", scope: "lesson" },
  { keys: ["←"], descEn: "Previous section", descAr: "القسم السابق", scope: "lesson" },
  { keys: ["R"], descEn: "Read aloud current section", descAr: "قراءة القسم الحالي", scope: "lesson" },
  { keys: ["S"], descEn: "Simplify text", descAr: "تبسيط النص", scope: "lesson" },
  { keys: ["M"], descEn: "Open concept map", descAr: "فتح خريطة المفاهيم", scope: "lesson" },
  { keys: ["P"], descEn: "Park a thought", descAr: "حفظ فكرة", scope: "lesson" },
  { keys: ["Esc"], descEn: "Exit focus mode", descAr: "الخروج من وضع التركيز", scope: "lesson" },
];

export default function ShortcutsPage() {
  const { locale } = useProfile();
  const t = {
    title: locale === "ar" ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts",
    subtitle: locale === "ar" ? "كل إجراء متاح عبر لوحة المفاتيح" : "Every action is reachable by keyboard",
    global: locale === "ar" ? "عالمي" : "Global",
    lesson: locale === "ar" ? "الدرس" : "Lesson",
  };
  return (
    <div className="container py-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </div>
      {[
        { label: t.global, shortcuts: GLOBAL_SHORTCUTS },
        { label: t.lesson, shortcuts: LESSON_SHORTCUTS },
      ].map(({ label, shortcuts }) => (
        <Card key={label}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Badge variant="secondary">{label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shortcuts.map(s => (
                <div key={s.descEn} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{locale === "ar" ? s.descAr : s.descEn}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded">{k}</kbd>
                        {i < s.keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

