import { PageTransition } from "@/components/PageTransition";
import { useProfile } from "@/contexts/ProfileContext";
import { useSpokenLabels } from "@/hooks/useSpokenLabels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Volume2, Eye, Type, Keyboard, Globe, Accessibility, Zap } from "lucide-react";
import { FeedbackPanel } from "@/components/FeedbackPanel";

export default function SettingsPage() {
  const { profile, updateProfile, locale, setLocale } = useProfile();
  const { enabled: spokenLabels, toggle: toggleSpokenLabels } = useSpokenLabels();

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium flex-1">{label}</Label>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <PageTransition>
    <div className="settings-page container py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("Settings", "الإعدادات")}</h1>
        <p className="text-muted-foreground mt-1">{t("Personalise your learning experience", "خصّص تجربتك التعليمية")}</p>
      </div>

      {/* Language */}
      <Section icon={Globe} title={t("Language & Direction", "اللغة والاتجاه")}>
        <Row label={t("Interface language", "لغة الواجهة")}>
          <Select value={locale} onValueChange={(v: "ar" | "en") => setLocale(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label={t("Arabic numerals", "الأرقام العربية")}>
          <Switch
            checked={profile.numerals === "arabic_indic"}
            onCheckedChange={v => updateProfile({ numerals: v ? "arabic_indic" : "western" })}
            aria-label={t("Arabic numerals", "الأرقام العربية")}
          />
        </Row>
        <Row label={t("Tashkeel (vowel marks)", "التشكيل")}>
          <Switch
            checked={profile.tashkeel}
            onCheckedChange={v => updateProfile({ tashkeel: v })}
            aria-label={t("Tashkeel", "التشكيل")}
          />
        </Row>
      </Section>

      {/* Visual */}
      <Section icon={Eye} title={t("Visual", "المظهر البصري")}>
        <Row label={t("Theme", "السمة")}>
          <Select value={profile.theme} onValueChange={(v: any) => updateProfile({ theme: v })}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("Light", "فاتح")}</SelectItem>
              <SelectItem value="dark">{t("Dark", "داكن")}</SelectItem>
              <SelectItem value="cream">{t("Cream — Dyslexia", "كريمي — عسر القراءة")}</SelectItem>
              <SelectItem value="calm">{t("Calm (focus mode)", "هادئ (وضع التركيز)")}</SelectItem>
              <SelectItem value="high_contrast">{t("High Contrast", "تباين عالٍ")}</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label={t("Colour overlay", "طبقة اللون")}>
          <Select value={profile.overlayTint} onValueChange={(v: any) => updateProfile({ overlayTint: v })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("None", "لا شيء")}</SelectItem>
              <SelectItem value="blue">{t("Blue", "أزرق")}</SelectItem>
              <SelectItem value="yellow">{t("Yellow", "أصفر")}</SelectItem>
              <SelectItem value="peach">{t("Peach", "خوخي")}</SelectItem>
              <SelectItem value="green">{t("Green", "أخضر")}</SelectItem>
              <SelectItem value="grey">{t("Grey", "رمادي")}</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label={t("Reading ruler", "مسطرة القراءة")}>
          <Switch
            checked={profile.rulerOverlay}
            onCheckedChange={v => updateProfile({ rulerOverlay: v })}
            aria-label={t("Reading ruler", "مسطرة القراءة")}
          />
        </Row>
        <Row label={t("Reduce motion", "تقليل الحركة")}>
          <Switch
            checked={profile.reduceMotion}
            onCheckedChange={v => updateProfile({ reduceMotion: v })}
            aria-label={t("Reduce motion", "تقليل الحركة")}
          />
        </Row>
      </Section>

      {/* Typography */}
      <Section icon={Type} title={t("Typography", "الخط والنص")}>
        <Row label={t("Font family", "نوع الخط")}>
          <Select value={profile.fontFamily} onValueChange={(v: any) => updateProfile({ fontFamily: v })}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="atkinson">Atkinson Hyperlegible</SelectItem>
              <SelectItem value="plex">IBM Plex Sans</SelectItem>
              <SelectItem value="opendyslexic">OpenDyslexic</SelectItem>
              <SelectItem value="naskh">Noto Naskh Arabic</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("Text size", "حجم النص")} ({Math.round(profile.fontScale * 100)}%)</Label>
          <Slider
            min={80} max={250} step={10}
            value={[profile.fontScale * 100]}
            onValueChange={([v]) => updateProfile({ fontScale: v / 100 })}
            aria-label={t("Text size", "حجم النص")}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("Line height", "تباعد الأسطر")} ({profile.lineHeight})</Label>
          <Slider
            min={150} max={220} step={5}
            value={[profile.lineHeight * 100]}
            onValueChange={([v]) => updateProfile({ lineHeight: v / 100 })}
            aria-label={t("Line height", "تباعد الأسطر")}
          />
        </div>
        <Row label={t("Syllable splitting", "تقسيم المقاطع")}>
          <Switch
            checked={profile.syllableSplit}
            onCheckedChange={v => updateProfile({ syllableSplit: v })}
            aria-label={t("Syllable splitting", "تقسيم المقاطع")}
          />
        </Row>
      </Section>

      {/* Audio */}
      <Section icon={Volume2} title={t("Audio", "الصوت")}>
        <Row label={t("Auto-narrate lessons", "السرد التلقائي للدروس")}>
          <Switch
            checked={profile.autoNarrate}
            onCheckedChange={v => updateProfile({ autoNarrate: v })}
            aria-label={t("Auto-narrate", "السرد التلقائي")}
          />
        </Row>
        <Row label={t("Earcons (audio cues)", "الأيقونات الصوتية")}>
          <Switch
            checked={profile.earcons}
            onCheckedChange={v => updateProfile({ earcons: v })}
            aria-label={t("Earcons", "الأيقونات الصوتية")}
          />
        </Row>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("Speech rate", "سرعة الكلام")} ({profile.speechRate}×)</Label>
          <Slider
            min={50} max={300} step={25}
            value={[profile.speechRate * 100]}
            onValueChange={([v]) => updateProfile({ speechRate: v / 100 })}
            aria-label={t("Speech rate", "سرعة الكلام")}
          />
        </div>
        <Row label={t("Voice", "الصوت")}>
          <Select value={profile.voice} onValueChange={v => updateProfile({ voice: v })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alloy">Alloy</SelectItem>
              <SelectItem value="echo">Echo</SelectItem>
              <SelectItem value="fable">Fable</SelectItem>
              <SelectItem value="onyx">Onyx</SelectItem>
              <SelectItem value="nova">Nova</SelectItem>
              <SelectItem value="shimmer">Shimmer</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </Section>

      {/* Daily Goal */}
      {/* Spoken labels */}
      <Section icon={Volume2} title={t("Spoken labels", "التسميات الصوتية")}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex-1">{t("Announce button and link names on hover/focus. Keep OFF if using a screen reader.", "نطق أسماء الأزرار والروابط عند التمرير أو التركيز. أبقِه معطّلاً إذا كنت تستخدم قارئ شاشة.")}</p>
          <button
            type="button"
            role="switch"
            aria-checked={spokenLabels}
            onClick={toggleSpokenLabels}
            className={["relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", spokenLabels ? "bg-primary" : "bg-muted"].join(" ")}
            aria-label={t("Toggle spoken labels", "تبديل التسميات الصوتية")}
          >
            <span className={["inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", spokenLabels ? "translate-x-6" : "translate-x-1"].join(" ")} />
          </button>
        </div>
      </Section>

      <Section icon={Zap} title={t("Daily Study Goal", "الهدف اليومي للدراسة")}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("How many minutes do you want to study each day?", "كم دقيقة تريد أن تدرس كل يوم؟")}</p>
          <div className="grid grid-cols-3 gap-2">
            {[10, 20, 30, 45, 60, 90].map(mins => (
              <button
                key={mins}
                onClick={() => updateProfile({ dailyGoalMinutes: mins })}
                className={[
                  "py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                  profile.dailyGoalMinutes === mins
                    ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted text-foreground",
                ].join(" ")}
                aria-pressed={profile.dailyGoalMinutes === mins}
                aria-label={`${mins} ${t("minutes per day", "دقيقة يومياً")}`}
              >
                {mins}{t("m", "د")}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              `Current goal: ${profile.dailyGoalMinutes} min/day · ${Math.round(profile.dailyGoalMinutes * 7 / 60 * 10) / 10} hrs/week`,
              `الهدف الحالي: ${profile.dailyGoalMinutes} دقيقة/يوم · ${Math.round(profile.dailyGoalMinutes * 7 / 60 * 10) / 10} ساعات/أسبوع`
            )}
          </p>
        </div>
      </Section>

            {/* Cognition */}
      <Section icon={Accessibility} title={t("Focus & Attention", "التركيز والانتباه")}>
        <Row label={t("Chunk size", "حجم المقطع")}>
          <Select value={profile.chunkSize} onValueChange={(v: any) => updateProfile({ chunkSize: v })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="micro">{t("Micro (ADHD)", "مصغّر (ADHD)")}</SelectItem>
              <SelectItem value="standard">{t("Standard", "قياسي")}</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label={t("Focus timers", "مؤقتات التركيز")}>
          <Switch
            checked={profile.timers}
            onCheckedChange={v => updateProfile({ timers: v })}
            aria-label={t("Focus timers", "مؤقتات التركيز")}
          />
        </Row>
        <Row label={t("Body double mode", "وضع الرفيق")}>
          <Switch
            checked={profile.bodyDouble}
            onCheckedChange={v => updateProfile({ bodyDouble: v })}
            aria-label={t("Body double", "وضع الرفيق")}
          />
        </Row>
        <Row label={t("Hide decorative elements", "إخفاء العناصر الزخرفية")}>
          <Switch
            checked={profile.hideDecorative}
            onCheckedChange={v => updateProfile({ hideDecorative: v })}
            aria-label={t("Hide decorative", "إخفاء الزخارف")}
          />
        </Row>
        <Row label={t("Rewards", "المكافآت")}>
          <Select value={profile.rewards} onValueChange={(v: any) => updateProfile({ rewards: v })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{t("Off", "إيقاف")}</SelectItem>
              <SelectItem value="gentle">{t("Gentle", "لطيف")}</SelectItem>
              <SelectItem value="full">{t("Full", "كامل")}</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </Section>

      {/* Keyboard */}
      <Section icon={Keyboard} title={t("Keyboard & Input", "لوحة المفاتيح والإدخال")}>
        <Row label={t("Single-key shortcuts", "اختصارات المفتاح الواحد")}>
          <Switch
            checked={profile.singleKeyShortcuts}
            onCheckedChange={v => updateProfile({ singleKeyShortcuts: v })}
            aria-label={t("Single-key shortcuts", "اختصارات المفتاح الواحد")}
          />
        </Row>
        <Row label={t("Input method", "طريقة الإدخال")}>
          <Select value={profile.inputMethod} onValueChange={(v: any) => updateProfile({ inputMethod: v })}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="keyboard">{t("Keyboard", "لوحة المفاتيح")}</SelectItem>
              <SelectItem value="pointer">{t("Pointer / Touch", "المؤشر / اللمس")}</SelectItem>
              <SelectItem value="switch">{t("Switch access", "مفتاح الوصول")}</SelectItem>
              <SelectItem value="voice">{t("Voice", "الصوت")}</SelectItem>
              <SelectItem value="braille_display">{t("Braille display", "شاشة برايل")}</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </Section>

      <Button
        className="w-full"
        onClick={() => {
          // Settings are saved in real-time via updateProfile on each change
          // This button provides explicit confirmation
          toast.success(t("All settings saved — changes apply immediately", "تم حفظ جميع الإعدادات — التغييرات تُطبَّق فوراً"));
        }}
      >
        {t("Save Settings", "حفظ الإعدادات")}
      </Button>
      {/* Feedback */}
      <FeedbackPanel locale={locale} />
    </div>
    </PageTransition>
  );
}
