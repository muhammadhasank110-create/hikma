import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { locale } = useProfile();
  const t = {
    title: locale === "ar" ? "لوحة الإدارة" : "Admin Dashboard",
    users: locale === "ar" ? "المستخدمون" : "Users",
    curricula: locale === "ar" ? "المناهج" : "Curricula",
    activity: locale === "ar" ? "النشاط" : "Activity",
    settings: locale === "ar" ? "الإعدادات" : "Settings",
  };
  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: t.users, action: () => toast.info("User management coming soon") },
          { icon: BookOpen, label: t.curricula, action: () => toast.info("Curriculum editor coming soon") },
          { icon: Activity, label: t.activity, action: () => toast.info("Activity logs coming soon") },
          { icon: Settings, label: t.settings, action: () => toast.info("System settings coming soon") },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} type="button" onClick={action} className="block w-full rounded-xl bg-transparent p-0 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold">{label}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
