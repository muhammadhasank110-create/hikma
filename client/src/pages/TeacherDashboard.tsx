import { useAuth } from "@/_core/hooks/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { locale } = useProfile();
  const { data: classes, isLoading } = trpc.classes.myClasses.useQuery();

  const t = {
    title: locale === "ar" ? "لوحة المعلم" : "Teacher Dashboard",
    myClasses: locale === "ar" ? "صفوفي" : "My Classes",
    createClass: locale === "ar" ? "إنشاء صف" : "Create Class",
    students: locale === "ar" ? "طلاب" : "Students",
    noClasses: locale === "ar" ? "لا توجد صفوف بعد" : "No classes yet",
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{user?.name}</p>
        </div>
        <Button onClick={() => toast.info("Class creation coming soon")}>
          <Plus className="w-4 h-4 mr-2" />
          {t.createClass}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: locale === "ar" ? "إجمالي الطلاب" : "Total Students", value: "—" },
          { icon: BookOpen, label: locale === "ar" ? "الصفوف النشطة" : "Active Classes", value: classes?.length ?? 0 },
          { icon: BarChart3, label: locale === "ar" ? "متوسط التقدم" : "Avg Progress", value: "—%" },
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
        <CardHeader><CardTitle>{t.myClasses}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : classes?.length === 0 ? (
            <p className="text-muted-foreground">{t.noClasses}</p>
          ) : (
            <div className="space-y-2">
              {classes?.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-semibold">{locale === "ar" ? cls.nameAr : cls.nameEn}</p>
                    <p className="text-sm text-muted-foreground">Code: {cls.joinCode}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Class details coming soon")}>
                    {locale === "ar" ? "عرض" : "View"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
