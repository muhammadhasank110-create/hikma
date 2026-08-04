import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, FileText, Lightbulb } from "lucide-react";

const EXAM_SKILLS = [
  {
    id: "command-words",
    titleEn: "Command Words",
    titleAr: "كلمات الأوامر",
    descEn: "Understand what each command word requires: Describe, Explain, Evaluate, Calculate, State, Suggest.",
    descAr: "افهم ما تتطلبه كل كلمة أمر: صف، اشرح، قيّم، احسب، اذكر، اقترح.",
    icon: FileText,
    tags: ["IGCSE", "Qatar MoEHE"],
  },
  {
    id: "time-management",
    titleEn: "Time Management",
    titleAr: "إدارة الوقت",
    descEn: "Allocate time by marks. 1 mark ≈ 1 minute. Leave 5 minutes to review.",
    descAr: "خصص الوقت حسب الدرجات. درجة واحدة ≈ دقيقة واحدة. اترك 5 دقائق للمراجعة.",
    icon: Clock,
    tags: ["All boards"],
  },
  {
    id: "mark-scheme",
    titleEn: "Reading the Mark Scheme",
    titleAr: "قراءة مخطط التصحيح",
    descEn: "Mark schemes show acceptable answers. Learn the key phrases examiners accept.",
    descAr: "تُظهر مخططات التصحيح الإجابات المقبولة. تعلم العبارات الرئيسية التي يقبلها الممتحنون.",
    icon: CheckCircle2,
    tags: ["IGCSE Edexcel"],
  },
  {
    id: "access-arrangements",
    titleEn: "Access Arrangements",
    titleAr: "ترتيبات الوصول",
    descEn: "Extra time, reader, scribe, word processor. Know your entitlements and how to apply.",
    descAr: "وقت إضافي، قارئ، كاتب، معالج كلمات. اعرف حقوقك وكيفية التقديم.",
    icon: Lightbulb,
    tags: ["MADA", "Qatar MoEHE"],
  },
];

export default function ExamSkillsPage() {
  const { locale } = useProfile();
  const t = {
    title: locale === "ar" ? "مهارات الامتحان" : "Exam Skills",
    subtitle: locale === "ar" ? "استعد للامتحان بثقة" : "Prepare for exams with confidence",
  };
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EXAM_SKILLS.map(skill => {
          const Icon = skill.icon;
          return (
            <Card key={skill.id} className="hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">
                  {locale === "ar" ? skill.titleAr : skill.titleEn}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {locale === "ar" ? skill.descAr : skill.descEn}
                </p>
                <div className="flex flex-wrap gap-1">
                  {skill.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
