import { useState } from "react";
import { useLocation } from "wouter";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users, BookOpen, TrendingUp, ClipboardList, Plus,
  Search, ChevronRight, Award, BarChart3,
  FileText, Bell, GraduationCap
} from "lucide-react";
import { startLogin } from "@/const";

export default function TeacherDashboard() {
  const { locale } = useProfile();
  const { isAuthenticated, user } = useAuth() as any;
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const { data: classes, isLoading: classesLoading } = trpc.classes.myClasses.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <GraduationCap className="w-12 h-12 text-primary mx-auto" />
        <h1 className="text-2xl font-bold font-display">{t("Teacher Dashboard", "لوحة المعلم")}</h1>
        <p className="text-muted-foreground">{t("Sign in to access your class management tools.", "سجّل دخولك للوصول إلى أدوات إدارة الفصل.")}</p>
        <Button onClick={() => startLogin()}>{t("Sign In", "تسجيل الدخول")}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("Teacher Dashboard", "لوحة المعلم")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(`Welcome back, ${user?.name ?? "Teacher"}`, `مرحباً، ${user?.name ?? "المعلم"}`)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled aria-disabled="true" title={t("Notifications coming soon", "الإشعارات قريباً")}>
            <Bell className="w-4 h-4 mr-2" />
            {t("Notifications", "الإشعارات")}
          </Button>
          <Button size="sm" disabled aria-disabled="true" title={t("Class creation coming soon", "إنشاء الفصول قريباً")}>
            <Plus className="w-4 h-4 mr-2" />
            {t("New Class", "فصل جديد")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("Classes", "الفصول"), value: classes?.length ?? 0, icon: <BookOpen className="w-5 h-5" />, color: "text-primary" },
          { label: t("Students", "الطلاب"), value: classes?.reduce((acc: number, c: any) => acc + (c.studentCount ?? 0), 0) ?? 0, icon: <Users className="w-5 h-5" />, color: "text-clay" },
          { label: t("Avg. Mastery", "متوسط الإتقان"), value: "72%", icon: <TrendingUp className="w-5 h-5" />, color: "text-green-600" },
          { label: t("Assignments", "الواجبات"), value: 0, icon: <ClipboardList className="w-5 h-5" />, color: "text-amber-600" },
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
          <TabsTrigger value="classes">{t("My Classes", "فصولي")}</TabsTrigger>
          <TabsTrigger value="students">{t("Students", "الطلاب")}</TabsTrigger>
          <TabsTrigger value="reports">{t("Reports", "التقارير")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("Recent Activity", "النشاط الأخير")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { text: t("3 students completed Photosynthesis lesson", "3 طلاب أكملوا درس التمثيل الضوئي"), time: "2h ago", icon: <Award className="w-4 h-4 text-green-500" /> },
                  { text: t("Quiz results available for Grade 10B", "نتائج الاختبار متاحة للصف العاشر ب"), time: "5h ago", icon: <BarChart3 className="w-4 h-4 text-primary" /> },
                  { text: t("New student joined your class", "طالب جديد انضم إلى فصلك"), time: "1d ago", icon: <Users className="w-4 h-4 text-clay" /> },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div className="flex-1">
                      <p>{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("Class Progress", "تقدم الفصل")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { subject: t("Biology", "الأحياء"), pct: 78 },
                  { subject: t("Mathematics", "الرياضيات"), pct: 65 },
                  { subject: t("English", "الإنجليزية"), pct: 82 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.subject}</span>
                      <span className="font-medium">{item.pct}%</span>
                    </div>
                    <Progress value={item.pct} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">{t("Access Arrangements Reminder", "تذكير بترتيبات الوصول")}</p>
                <p className="text-xs text-amber-700 mt-1">
                  {t("2 students in your class have active access arrangements. Ensure exam accommodations are submitted to Qatar MoEHE at least 6 weeks before the exam.", "طالبان في فصلك لديهما ترتيبات وصول نشطة. تأكد من تقديم التسهيلات الامتحانية إلى وزارة التعليم قبل 6 أسابيع على الأقل.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-4">
          {classesLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : classes && classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((cls: any) => (
                <Card key={cls.id} className="transition-colors" aria-disabled="true" role="article">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{locale === "ar" ? cls.nameAr : cls.nameEn}</p>
                        <p className="text-xs text-muted-foreground">{cls.joinCode} · {cls.studentCount ?? 0} {t("students", "طالب")}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>{t("No classes yet. Create your first class to get started.", "لا توجد فصول بعد. أنشئ فصلك الأول للبدء.")}</p>
              <Button className="mt-4" disabled aria-disabled="true" title={t("Coming soon", "قريباً")}>
                <Plus className="w-4 h-4 mr-2" />
                {t("Create Class", "إنشاء فصل")}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("Search students...", "ابحث عن طالب...")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>{t("Student list will appear here once students join your class.", "ستظهر قائمة الطلاب هنا بمجرد انضمامهم إلى فصلك.")}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: t("Normal Way of Working Report", "تقرير طريقة العمل الاعتيادية"), desc: t("MADA-compliant access arrangement documentation for Qatar MoEHE exam submissions.", "توثيق ترتيبات الوصول المتوافق مع مادا."), badge: "MADA" },
              { title: t("Class Progress Report", "تقرير تقدم الفصل"), desc: t("Mastery breakdown by subject, topic, and individual learner.", "تفصيل الإتقان حسب المادة والموضوع."), badge: "PDF" },
              { title: t("IEP Progress Summary", "ملخص تقدم خطة التعليم الفردية"), desc: t("ECC area progress for learners with visual impairments.", "تقدم مجالات المنهج الأساسي الموسّع."), badge: "ECC" },
              { title: t("Attendance & Engagement", "الحضور والمشاركة"), desc: t("Session time, lesson completion rates, and tutor interactions.", "وقت الجلسة ومعدلات إتمام الدروس."), badge: "Analytics" },
            ].map((report, i) => (
              <Card key={i} className="transition-colors" aria-disabled="true">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{report.title}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">{report.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{report.desc}</p>
                  <Button variant="outline" size="sm" className="w-full mt-2" disabled aria-disabled="true" title={t("Report generation coming soon", "إنشاء التقارير قريباً")}>
                    <FileText className="w-3 h-3 mr-2" />
                    {t("Generate Report", "إنشاء تقرير")}
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
