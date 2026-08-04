import { useState } from "react";
import { useLocation } from "wouter";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, KeyRound, CheckCircle } from "lucide-react";
import { startLogin } from "@/const";

export default function ClassJoinPage() {
  const { locale } = useProfile();
  const { isAuthenticated } = useAuth() as any;
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState(false);

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const joinMutation = trpc.classes.join.useMutation({
    onSuccess: () => {
      setJoined(true);
      toast.success(t("Successfully joined the class!", "تم الانضمام إلى الفصل بنجاح!"));
    },
    onError: (err) => {
      toast.error(err.message || t("Invalid class code. Please try again.", "رمز الفصل غير صحيح. حاول مرة أخرى."));
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <Users className="w-12 h-12 text-primary mx-auto" />
        <h1 className="text-2xl font-bold font-display">{t("Join a Class", "انضم إلى فصل")}</h1>
        <p className="text-muted-foreground">{t("Sign in to join a class with your school code.", "سجّل دخولك للانضمام إلى فصل برمز مدرستك.")}</p>
        <Button onClick={() => startLogin()}>{t("Sign In", "تسجيل الدخول")}</Button>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold font-display">{t("You're in!", "لقد انضممت!")}</h1>
        <p className="text-muted-foreground">{t("You have successfully joined the class. Your teacher can now see your progress.", "لقد انضممت إلى الفصل بنجاح. يمكن لمعلمك الآن رؤية تقدمك.")}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/dashboard")}>{t("Go to Dashboard", "الذهاب إلى لوحة التحكم")}</Button>
          <Button variant="outline" onClick={() => { setCode(""); setJoined(false); }}>{t("Join Another", "انضم لفصل آخر")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-display">{t("Join a Class", "انضم إلى فصل")}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {t("Enter the class code provided by your teacher.", "أدخل رمز الفصل الذي أعطاك إياه معلمك.")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            {t("Class Code", "رمز الفصل")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class-code">{t("Enter your class code", "أدخل رمز الفصل")}</Label>
            <Input
              id="class-code"
              placeholder="e.g. HIKMA-2025"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter" && code.trim()) joinMutation.mutate({ joinCode: code.trim() }); }}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={20}
              autoFocus
            />
          </div>
          <Button
            className="w-full"
            disabled={!code.trim() || joinMutation.isPending}
            onClick={() => joinMutation.mutate({ joinCode: code.trim() })}
          >
            {joinMutation.isPending ? t("Joining...", "جارٍ الانضمام...") : t("Join Class", "انضم إلى الفصل")}
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {t("Your teacher will share the class code with you. It looks like: HIKMA-XXXX", "سيشارك معلمك رمز الفصل معك. يبدو هكذا: HIKMA-XXXX")}
      </p>
    </div>
  );
}
