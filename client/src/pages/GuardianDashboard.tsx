import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, TrendingUp, Clock } from "lucide-react";

export default function GuardianDashboard() {
  const { locale } = useProfile();
  const t = {
    title: locale === "ar" ? "لوحة ولي الأمر" : "Guardian Dashboard",
    subtitle: locale === "ar" ? "تابع تقدم طفلك" : "Follow your child's learning journey",
    wellbeing: locale === "ar" ? "الرفاهية" : "Wellbeing",
    progress: locale === "ar" ? "التقدم" : "Progress",
    time: locale === "ar" ? "وقت التعلم" : "Learning Time",
  };
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Heart, label: t.wellbeing, value: "Good" },
          { icon: TrendingUp, label: t.progress, value: "—%" },
          { icon: Clock, label: t.time, value: "—h" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{locale === "ar" ? "ملاحظات المعلم" : "Teacher Notes"}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{locale === "ar" ? "لا توجد ملاحظات بعد." : "No notes yet."}</p>
        </CardContent>
      </Card>
    </div>
  );
}
