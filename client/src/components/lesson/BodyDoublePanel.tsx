import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

const MESSAGES_EN = [
  "I'm here with you. Take your time.",
  "You're doing great — keep going.",
  "It's okay to pause and breathe.",
  "Every section you finish is an achievement.",
  "I'm working alongside you. You're not alone.",
];
const MESSAGES_AR = [
  "أنا هنا معك. خذ وقتك.",
  "أنت تقوم بعمل رائع — استمر.",
  "لا بأس بالتوقف والتنفس.",
  "كل قسم تنهيه هو إنجاز.",
  "أعمل بجانبك. أنت لست وحدك.",
];

export default function BodyDoublePanel({ locale, lessonTitle }: { locale: string; lessonTitle: string }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = locale === "ar" ? MESSAGES_AR : MESSAGES_EN;
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  useEffect(() => {
    const timer = setInterval(() => setMsgIndex(i => (i + 1) % messages.length), 45000);
    return () => clearInterval(timer);
  }, [messages.length]);
  return (
    <div className="fixed bottom-20 right-4 z-[100] max-w-xs">
      <Card className="border-primary/30 bg-card/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-3 flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary mb-0.5">{t("Hikma is with you", "حكمة معك")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{messages[msgIndex]}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
