import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import {
  BookOpen, Bot, TrendingUp, Layers, ChevronRight,
  GraduationCap, Star, Clock, Target, Zap
} from "lucide-react";

const SUBJECT_ICONS: Record<string, any> = {
  Mathematics: "📐", Science: "🔬", English: "📖",
  Biology: "🌿", Physics: "⚡", Chemistry: "🧪",
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { profile, locale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const { data: curricula, isLoading: loadingCurricula } = trpc.curriculum.list.useQuery();
  const { data: mastery } = trpc.progress.getMastery.useQuery(undefined, { enabled: isAuthenticated });
  const { data: eccAreas } = trpc.ecc.areas.useQuery();

  const masteredCount = mastery?.filter(m => m.level >= 4).length ?? 0;
  const totalConcepts = mastery?.length ?? 0;
  const progressPct = totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good morning", "صباح الخير");
    if (hour < 17) return t("Good afternoon", "مساء الخير");
    return t("Good evening", "مساء النور");
  };

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      {/* Hero greeting */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1 animate-arrive">
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="text-2xl font-bold">
            {isAuthenticated ? user?.name : t("Welcome to Hikma", "أهلاً بك في حكمة")}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
          {profile.curriculum !== "none" && (
             <Badge variant="secondary" className="text-xs">
                {profile.curriculum === "qatar_moehe" ? "Qatar MoEHE" :
                 profile.curriculum === "igcse_edexcel" ? "IGCSE Edexcel" :
                 profile.curriculum.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
             </Badge>
           )}
           <Badge variant="outline" className="text-xs capitalize">
              {t(
                profile.mode === "audio_first" ? "Audio-First Mode" :
                profile.mode === "focus" ? "Focus Mode" :
                profile.mode === "reading" ? "Reading Mode" : "Custom Mode",
                profile.mode === "audio_first" ? "وضع الصوت أولاً" :
                profile.mode === "focus" ? "وضع التركيز" :
                profile.mode === "reading" ? "وضع القراءة" : "وضع مخصص"
              )}
           </Badge>
          </div>
        </div>
        {!isAuthenticated && (
          <Button onClick={() => startLogin()} className="animate-arrive animate-arrive-delay-1">
            {t("Sign in to save progress", "سجّل الدخول لحفظ تقدمك")}
          </Button>
        )}
      </div>

      {/* Quick stats */}
      {isAuthenticated && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-arrive animate-arrive-delay-1">
          {[
            { icon: Star, label: t("Mastered", "مُتقَن"), value: masteredCount, color: "text-yellow-600" },
            { icon: TrendingUp, label: t("Progress", "التقدم"), value: `${progressPct}%`, color: "text-green-600" },
            { icon: Target, label: t("Concepts", "المفاهيم"), value: totalConcepts, color: "text-blue-600" },
            { icon: Zap, label: t("Streak", "السلسلة"), value: "—", color: "text-orange-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                <div>
                 <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold tabular-nums [font-variant-numeric:normal]">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-arrive animate-arrive-delay-2">
        <Link href="/tutor">
          <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all group h-full">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t("Hikma AI", "حكمة AI")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("A calm space to ask anything", "مساحة هادئة لطرح أي سؤال")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/progress">
          <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all group h-full">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t("My Progress", "تقدمي")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("See how far you've arrived", "شاهد مدى تقدمك في رحلتك")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/ecc">
          <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all group h-full">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <Layers className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t("ECC", "المنهج الموسّع")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("9 foundational skill areas", "9 مجالات مهارية أساسية")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Curricula / Subjects */}
      <div className="space-y-4 animate-arrive animate-arrive-delay-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("Your Curricula", "مناهجك الدراسية")}</h2>
        </div>
        {loadingCurricula ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curricula?.map(curr => (
              <Link key={curr.id} href={`/subjects/${curr.id}`}>
                <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">
                          {locale === "ar" ? curr.titleAr : curr.titleEn}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{curr.board}</Badge>
                      <Badge variant="outline" className="text-xs">{curr.region ?? curr.family}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {curricula?.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-full">
                {t("No curricula loaded yet.", "لم يتم تحميل أي مناهج بعد.")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
