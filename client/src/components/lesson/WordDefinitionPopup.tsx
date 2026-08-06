import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WordDefinitionPopup({ word, locale, onClose, sectionText = "" }: { word: string; locale: string; onClose: () => void; sectionText?: string }) {
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(true);
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  useEffect(() => {
    if (!word) return;
    setLoading(true); setDefinition("");
    const contextHint = sectionText.trim().slice(0, 300);
    const prompt = locale === "ar"
      ? `في سياق النص التالي: "${contextHint}"

عرّف الكلمة "${word}" بجملة واحدة بسيطة مناسبة لطالب في المرحلة الثانوية.`
      : `In the context of: "${contextHint}"

Define the word "${word}" in one simple sentence suitable for a secondary school student. Be concise.`;
    fetch("/api/tutor/stream", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, sessionId: `def-${word}`, profile: { mode: "reading", locale }, conversationHistory: [] }),
    }).then(async res => {
      if (!res.ok) { setDefinition(t("Definition unavailable.", "التعريف غير متاح.")); setLoading(false); return; }
      const reader = res.body?.getReader();
      if (!reader) { setLoading(false); return; }
      const decoder = new TextDecoder();
      let full = ""; let buf = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "data: [DONE]") break;
          if (trimmed.startsWith("data: ")) {
            try { const p = JSON.parse(trimmed.slice(6)); if (p.delta) { full += p.delta; setDefinition(full); } } catch { /* skip */ }
          }
        }
      }
    }).catch(() => { setDefinition(t("Definition unavailable.", "التعريف غير متاح.")); setLoading(false); });
  }, [word, locale]);
  return (
    <div className="fixed top-4 right-4 z-[200] max-w-xs w-full" role="dialog" aria-label={t(`Definition of ${word}`, `تعريف ${word}`)}>
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-primary">{word}</span>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose} aria-label={t("Close definition", "إغلاق التعريف")}><X className="w-3 h-3" /></Button>
        </div>
        {loading ? <p className="text-xs text-muted-foreground animate-pulse">{t("Looking up…", "جارٍ البحث…")}</p>
          : <p className="text-xs text-foreground leading-relaxed">{definition}</p>}
      </div>
    </div>
  );
}
