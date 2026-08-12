/**
 * TutorPage — slim orchestrator.
 * All state logic lives in useTutorState (client/src/hooks/useTutorState.ts).
 */
import { PageTransition } from "@/components/PageTransition";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Streamdown } from "streamdown";
import { Send, Mic, MicOff, Volume2, Bot, User, Loader2, RefreshCw, Headphones, BookOpen, Map, HelpCircle } from "lucide-react";
import { useTutorState, type TutorModality } from "@/hooks/useTutorState";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";

export default function TutorPage() {
  const s = useTutorState();
  const { locale, profile } = s;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); s.sendMessage(); }
  };

  const handleVoiceAction = useCallback((action: any) => {
    switch (action.type) {
      case "stop_speech": s.tts.stop(); break;
      case "read_aloud": {
        const last = [...s.messages].reverse().find(m => m.role === "assistant");
        if (last) s.speakText(last.content);
        break;
      }
      case "go_home": window.location.href = "/dashboard"; break;
      case "navigate": window.location.href = action.path; break;
    }
  }, [s.messages, s.speakText, s.tts]);

  useVoiceCommands({
    lang: locale === "ar" ? "ar-QA" : "en-GB",
    locale,
    context: "tutor",
    onAction: handleVoiceAction,
  });

  const t = {
    title: locale === "ar" ? "حكمة AI" : "Hikma AI",
    placeholder: locale === "ar" ? "اسأل سؤالاً… (Enter للإرسال)" : "Ask a question… (Enter to send, Shift+Enter for new line)",
    send: locale === "ar" ? "إرسال" : "Send",
    tts: locale === "ar" ? "قراءة الردود" : "Read replies aloud",
    clear: locale === "ar" ? "محادثة جديدة" : "New conversation",
  };

  const modalityConfig: Record<TutorModality, { en: string; ar: string; icon: React.ReactNode }> = {
    read: { en: "Read", ar: "قراءة", icon: <BookOpen className="w-3.5 h-3.5" /> },
    listen: { en: "Listen", ar: "استمع", icon: <Headphones className="w-3.5 h-3.5" /> },
    map: { en: "Map", ar: "خريطة", icon: <Map className="w-3.5 h-3.5" /> },
  };

  return (
    <div id="ai-tutor" tabIndex={-1} className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10"><Bot className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="font-semibold text-sm">{t.title}</p>
            <p className="text-xs text-muted-foreground">{profile.curriculum !== "none" ? profile.curriculum.replace("_", " ").toUpperCase() : locale === "ar" ? "عام" : "General"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="tts-toggle" className="text-xs text-muted-foreground">{t.tts}</Label>
            <Switch id="tts-toggle" checked={s.ttsEnabled} onCheckedChange={s.setTtsEnabled} aria-label={t.tts} />
          </div>
          <Button variant="ghost" size="sm" onClick={s.clearConversation} aria-label={t.clear}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Modality switcher */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30" role="tablist" aria-label={locale === "ar" ? "طريقة عرض الردود" : "Response display mode"}>
        {(["read", "listen", "map"] as TutorModality[]).map(m => (
          <button key={m} role="tab" aria-selected={s.modality === m}
            onClick={() => { s.setModality(m); if (m === "listen") s.setTtsEnabled(true); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${s.modality === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            {modalityConfig[m].icon}
            {locale === "ar" ? modalityConfig[m].ar : modalityConfig[m].en}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label={locale === "ar" ? "محادثة حكمة AI" : "Hikma AI conversation"} aria-live="polite">
        {/* Starter questions — visible only when conversation is empty */}
        {s.messages.length === 0 && !s.isStreaming && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground">{locale === "ar" ? "مرحباً! كيف يمكنني مساعدتك اليوم؟" : "Hi! What would you like to explore today?"}</p>
              <p className="text-sm text-muted-foreground">{locale === "ar" ? "اختر سؤالاً أو اكتب سؤالك الخاص" : "Pick a question or type your own"}</p>
            </div>
            <div className="grid gap-2 w-full max-w-md" role="list" aria-label={locale === "ar" ? "أسئلة مقترحة" : "Suggested questions"}>
              {([
                { en: "Explain photosynthesis in simple terms", ar: "اشرح عملية التمثيل الضوئي بكلمات بسيطة" },
                { en: "Help me understand fractions", ar: "ساعدني على فهم الكسور" },
                { en: "What are Newton's three laws?", ar: "ما هي قوانين نيوتن الثلاثة؟" },
                { en: "Give me a practice question on angles", ar: "أعطني سؤالاً تدريبياً عن الزوايا" },
                { en: "How do I structure an essay introduction?", ar: "كيف أكتب مقدمة مقال؟" },
              ] as { en: string; ar: string }[]).map((q, i) => (
                <button
                  key={i}
                  role="listitem"
                  className="text-start w-full px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => {
                    const text = locale === "ar" ? q.ar : q.en;
                    s.setInput(text);
                    s.sendMessage(text);
                  }}
                  aria-label={locale === "ar" ? q.ar : q.en}
                >
                  {locale === "ar" ? q.ar : q.en}
                </button>
              ))}
            </div>
          </div>
        )}
        {s.messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-arrive ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm ${msg.role === "assistant" ? "bg-card border border-border rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"}`}>
              {msg.role === "assistant" && s.modality !== "map" ? (
                <>
                  <Streamdown>{msg.content}</Streamdown>
                  <button className="mt-2 text-xs opacity-60 hover:opacity-100 flex items-center gap-1" onClick={() => s.speakText(msg.content)} aria-label={locale === "ar" ? "استمع" : "Listen"}>
                    <Volume2 className="w-3 h-3" />{locale === "ar" ? "استمع" : "Listen"}
                  </button>
                </>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {s.sources.length > 0 && (
          <section className="rounded-2xl border border-border bg-muted/30 p-3" aria-label={locale === "ar" ? "مصادر دراسية حديثة" : "Current study sources"}>
            <p className="text-xs font-semibold text-foreground">{locale === "ar" ? "مصادر دراسية حديثة" : "Current study sources"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{locale === "ar" ? "تُعرض هذه المراجع للتحقق، ولا تحل محل معلمك أو منهجك." : "These references support checking the guidance; they do not replace your teacher or curriculum."}</p>
            <ul className="mt-2 space-y-2">{s.sources.map((source, index) => <li key={source.id} className="text-xs"><a className="font-medium text-primary underline underline-offset-2" href={source.url} target="_blank" rel="noreferrer">[{index + 1}] {source.title}</a><span className="text-muted-foreground"> — {source.authors}{source.year ? ` (${source.year})` : ""}</span></li>)}</ul>
          </section>
        )}

        {/* Socratic question */}
        {s.socraticQuestion && !s.isStreaming && (
          <div className="flex gap-3 animate-arrive">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-foreground" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">{locale === "ar" ? "سؤال للتحقق من الفهم" : "Comprehension check"}</p>
              <p className="text-sm text-amber-900 dark:text-amber-200">{s.socraticQuestion}</p>
              <button className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
                onClick={() => { s.setInput(s.socraticQuestion!); s.setSocraticQuestion(null); s.textareaRef.current?.focus(); }}>
                {locale === "ar" ? "أجب على هذا السؤال" : "Answer this question"}
              </button>
            </div>
          </div>
        )}

        {s.isSocraticLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5 text-foreground" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            </div>
          </div>
        )}

        {s.isStreaming && s.streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <Streamdown>{s.streamingContent}</Streamdown>
            </div>
          </div>
        )}

        {s.isStreaming && !s.streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5 text-muted-foreground" aria-label={locale === "ar" ? "حكمة AI يفكر" : "Hikma AI is thinking"} role="status">
                <span className="typing-dot" aria-hidden="true" />
                <span className="typing-dot" aria-hidden="true" />
                <span className="typing-dot" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}
        <div ref={s.messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 items-end">
          <Textarea ref={s.textareaRef} value={s.input} onChange={e => s.setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t.placeholder} rows={1} className="flex-1 resize-none min-h-[2.5rem] max-h-32"
            aria-label={locale === "ar" ? "رسالتك لحكمة AI" : "Your message to Hikma AI"} disabled={s.isStreaming} />
          <Button variant="ghost" size="icon" onClick={s.isRecording ? s.stopRecording : s.startRecording}
            aria-label={s.isRecording ? (locale === "ar" ? "إيقاف التسجيل" : "Stop recording") : (locale === "ar" ? "بدء التسجيل الصوتي" : "Start voice recording")}
            className={s.isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"}>
            {s.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button onClick={() => s.sendMessage()} disabled={!s.input.trim() || s.isStreaming} aria-label={t.send} size="icon">
            {s.isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {locale === "ar" ? "حكمة تتعلم معك — ليست بديلاً عن المعلم" : "Hikma learns with you — not a replacement for your teacher"}
        </p>
      </div>
    </div>
  );
}
