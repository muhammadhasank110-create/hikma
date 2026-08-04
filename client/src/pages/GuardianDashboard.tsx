import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart, TrendingUp, BookOpen, Clock, Award, Bell, FileText, Shield, ChevronRight } from "lucide-react";
import { startLogin } from "@/const";

export default function GuardianDashboard() {
  const { locale } = useProfile();
  const { isAuthenticated, user } = useAuth() as any;
  const [activeTab, setActiveTab] = useState("overview");

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Heart className="w-12 h-12 text-clay mx-auto" />
        <h1 className="text-2xl font-bold font-display">{t("Guardian Dashboard", "لوحة ولي الأمر")}</h1>
        <p className="text-muted-foreground">{t("Sign in to monitor your child's learning progress.", "سجّل دخولك لمتابعة تقدم طفلك في التعلم.")}</p>
        <Button onClick={() => startLogin()}>{t("Sign In", "تسجيل الدخول")}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("Guardian Dashboard", "لوحة ولي الأمر")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t(`Welcome, ${user?.name ?? "Guardian"}`, `مرحباً، ${user?.name ?? "ولي الأمر"}`)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info(t("Coming soon", "قريباً"))}>
          <Bell className="w-4 h-4 mr-2" />
          {t("Weekly Report", "التقرير الأسبوعي")}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("Lessons Done", "الدروس المكتملة"), value: "—", icon: <BookOpen className="w-5 h-5" />, color: "text-primary" },
          { label: t("Study Time", "وقت الدراسة"), value: "—h", icon: <Clock className="w-5 h-5" />, color: "text-clay" },
          { label: t("Avg. Mastery", "متوسط الإتقان"), value: "—%", icon: <TrendingUp className="w-5 h-5" />, color: "text-green-600" },
          { label: t("Achievements", "الإنجازات"), value: "—", icon: <Award className="w-5 h-5" />, color: "text-amber-600" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${stat.color} p-2 rounded-lg bg-muted`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("Overview", "نظرة عامة")}</TabsTrigger>
          <TabsTrigger value="progress">{t("Progress", "التقدم")}</TabsTrigger>
          <TabsTrigger value="settings">{t("Child Settings", "إعدادات الطفل")}</TabsTrigger>
          <TabsTrigger value="reports">{t("Reports", "التقارير")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("This Week's Activity", "نشاط هذا الأسبوع")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t("Activity data will appear once your child starts learning.", "ستظهر بيانات النشاط بمجرد أن يبدأ طفلك في التعلم.")}</p>
                <Button className="mt-4" variant="outline" onClick={() => toast.info(t("Link child account — coming soon", "ربط حساب الطفل — قريباً"))}>
                  {t("Link Child Account", "ربط حساب الطفل")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{t("Privacy & Safety", "الخصوصية والسلامة")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Hikma never stores conversation content beyond the current session. All AI interactions are curriculum-focused and moderated.", "لا تخزن حكمة محتوى المحادثات بعد انتهاء الجلسة. جميع تفاعلات الذكاء الاصطناعي تركز على المنهج الدراسي.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-4 space-y-4">
          <div className="space-y-3">
            {[
              { subject: t("Mathematics", "الرياضيات"), pct: 0, topics: 0 },
              { subject: t("English", "الإنجليزية"), pct: 0, topics: 0 },
              { subject: t("Science", "العلوم"), pct: 0, topics: 0 },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{item.subject}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.topics} {t("topics", "موضوعات")}</Badge>
                      <span className="text-sm font-bold">{item.pct}%</span>
                    </div>
                  </div>
                  <Progress value={item.pct} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t("Progress updates in real-time as your child completes lessons.", "يتحدث التقدم في الوقت الفعلي مع إكمال طفلك للدروس.")}
          </p>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          {[
            { label: t("Daily Study Time Limit", "حد وقت الدراسة اليومي"), desc: t("Set a maximum daily study duration.", "حدد مدة الدراسة اليومية القصوى.") },
            { label: t("Content Notifications", "إشعارات المحتوى"), desc: t("Get notified when your child completes a lesson or earns an achievement.", "احصل على إشعار عند إكمال طفلك لدرس أو حصوله على إنجاز.") },
            { label: t("Access Arrangements", "ترتيبات الوصول"), desc: t("View and manage your child's documented accommodations.", "عرض وإدارة التسهيلات الموثقة لطفلك.") },
          ].map((item, i) => (
            <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info(t("Coming soon", "قريباً"))}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: t("Weekly Progress Report", "التقرير الأسبوعي"), desc: t("Summary of lessons completed, time spent, and mastery gains.", "ملخص الدروس المكتملة والوقت المستغرق ومكاسب الإتقان."), badge: "PDF" },
              { title: t("Normal Way of Working", "طريقة العمل الاعتيادية"), desc: t("MADA-aligned documentation for exam access arrangements.", "توثيق متوافق مع مادا لترتيبات الوصول الامتحانية."), badge: "MADA" },
            ].map((report, i) => (
              <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info(t("Report generation coming soon", "إنشاء التقارير قريباً"))}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{report.title}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">{report.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{report.desc}</p>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <FileText className="w-3 h-3 mr-2" />
                    {t("Generate", "إنشاء")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
