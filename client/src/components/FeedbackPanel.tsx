import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, Paperclip, X, Send, CheckCircle2 } from "lucide-react";

export function FeedbackPanel({ locale = "en" }: { locale?: "en" | "ar" }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [message, setMessage] = useState("");
  const [screenshotB64, setScreenshotB64] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setMessage("");
      setScreenshotB64(null);
      setScreenshotPreview(null);
      toast.success(t("Feedback sent — thank you!", "تم إرسال ملاحظاتك — شكراً!"));
    },
    onError: (err: { message: string }) => {
      toast.error(t("Could not send feedback: ", "تعذّر إرسال الملاحظة: ") + err.message);
    },
  });

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("Please attach an image file.", "يرجى إرفاق ملف صورة."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("Image must be under 5 MB.", "يجب أن تكون الصورة أقل من 5 ميغابايت."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setScreenshotB64(result);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (message.trim().length < 5) {
      toast.error(t("Please describe the issue (at least 5 characters).", "يرجى وصف المشكلة (5 أحرف على الأقل)."));
      return;
    }
    submit.mutate({
      message: message.trim(),
      screenshotB64: screenshotB64 ?? undefined,
      page: window.location.pathname,
      userAgent: navigator.userAgent.slice(0, 512),
    });
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
          <p className="font-semibold text-lg">{t("Feedback received!", "تم استلام ملاحظاتك!")}</p>
          <p className="text-muted-foreground text-sm">
            {t("We'll review it and get back to you.", "سنراجعها ونتواصل معك.")}
          </p>
          <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
            {t("Send another", "إرسال ملاحظة أخرى")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-4 h-4 text-primary" />
          {t("Report an Issue", "الإبلاغ عن مشكلة")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            "Describe the issue you encountered. You can attach a screenshot to help us understand it better.",
            "صِف المشكلة التي واجهتها. يمكنك إرفاق لقطة شاشة لمساعدتنا على فهمها بشكل أفضل."
          )}
        </p>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t(
            "e.g. The audio button doesn't work on the lesson page…",
            "مثال: زر الصوت لا يعمل في صفحة الدرس…"
          )}
          rows={4}
          className="resize-none"
          aria-label={t("Describe the issue", "وصف المشكلة")}
          maxLength={4000}
        />

        {/* Screenshot preview */}
        {screenshotPreview && (
          <div className="relative inline-block">
            <img
              src={screenshotPreview}
              alt={t("Screenshot preview", "معاينة لقطة الشاشة")}
              className="max-h-40 rounded-lg border border-border object-contain"
            />
            <button
              onClick={() => { setScreenshotB64(null); setScreenshotPreview(null); }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:scale-110 transition-transform"
              aria-label={t("Remove screenshot", "إزالة لقطة الشاشة")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {/* Attach screenshot */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            aria-label={t("Attach screenshot", "إرفاق لقطة شاشة")}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="gap-1.5"
            aria-label={t("Attach screenshot", "إرفاق لقطة شاشة")}
          >
            <Paperclip className="w-3.5 h-3.5" />
            {screenshotB64
              ? t("Change screenshot", "تغيير لقطة الشاشة")
              : t("Attach screenshot", "إرفاق لقطة شاشة")}
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submit.isPending || message.trim().length < 5}
            className="gap-1.5 ml-auto"
            aria-label={t("Send feedback", "إرسال الملاحظة")}
          >
            <Send className="w-3.5 h-3.5" />
            {submit.isPending
              ? t("Sending…", "جارٍ الإرسال…")
              : t("Send Feedback", "إرسال الملاحظة")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t(
            "Your report is sent directly to the Hikma team.",
            "يُرسَل تقريرك مباشرةً إلى فريق حكمة."
          )}
        </p>
      </CardContent>
    </Card>
  );
}

