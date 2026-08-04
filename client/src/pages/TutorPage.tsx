import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Loader2, RefreshCw } from "lucide-react";
import { nanoid } from "nanoid";
import { useProfile } from "@/contexts/ProfileContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function TutorPage() {
  const { user, isAuthenticated, startLogin } = useAuth() as any;
  const profileCtx = useProfile();
  const profile = profileCtx.profile;
  const locale = profileCtx.locale;
  const [, params] = useRoute("/tutor/:lessonId");
  const lessonId = params?.lessonId ? parseInt(params.lessonId) : undefined;

  const [sessionId] = useState(() => nanoid());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(profile.autoNarrate);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const ttsMutation = trpc.tts.synthesize.useMutation({
    onSuccess: (data) => {
      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.play().catch(() => {
        setIsSpeaking(false);
        // Fallback to browser TTS
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance();
          utterance.text = messages[messages.length - 1]?.content ?? "";
          utterance.lang = locale === "ar" ? "ar-QA" : "en-GB";
          utterance.rate = profile.speechRate;
          window.speechSynthesis.speak(utterance);
        }
      });
    },
  });

  const speakText = useCallback((text: string) => {
    const plain = text.replace(/[#*_`~\[\]]/g, "").slice(0, 1000);
    ttsMutation.mutate({
      text: plain,
      voice: profile.voice as any,
      speed: profile.speechRate,
      locale: locale as "ar" | "en",
    });
  }, [profile.voice, profile.speechRate, locale]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Greeting on mount
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: Message = {
        role: "assistant",
        content: locale === "ar"
          ? "مرحباً! أنا حكمة، معلمك الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك أن تسألني أي سؤال عن دروسك."
          : "Hello! I'm Hikma, your AI tutor. How can I help you today? Ask me anything about your lessons.",
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  }, []);

  const sendMessage = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    if (!isAuthenticated) { startLogin?.(); return; }

    const userMsg: Message = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentMessages = messages;

    (async () => {
      try {
        const res = await fetch("/api/tutor/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: currentInput,
            sessionId,
            profile: {
              mode: profile.mode,
              chunkSize: profile.chunkSize,
              readingLevel: profile.readingLevel,
              locale,
              curriculum: profile.curriculum,
              tier: profile.tier,
              tashkeel: profile.tashkeel,
              numerals: profile.numerals,
            },
            conversationHistory: currentMessages.map(m => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream body");

        const decoder = new TextDecoder();
        let fullContent = "";
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]") break;
            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.delta) {
                  fullContent += parsed.delta;
                  setStreamingContent(fullContent);
                }
                if (parsed.error) {
                  toast.error(locale === "ar" ? "خطأ في المعلم الذكي" : "Tutor error: " + parsed.error);
                }
              } catch { /* skip */ }
            }
          }
        }

        if (fullContent) {
          const assistantMsg: Message = { role: "assistant", content: fullContent, timestamp: Date.now() };
          setMessages(prev => [...prev, assistantMsg]);
          if (ttsEnabled) speakText(fullContent);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error(locale === "ar" ? "خطأ في المعلم الذكي" : "Tutor error: " + (err?.message ?? "Unknown error"));
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortControllerRef.current = null;
      }
    })();
  }, [input, isStreaming, isAuthenticated, messages, sessionId, profile, locale, ttsEnabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Use browser speech recognition as primary (Whisper as fallback via server)
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = locale === "ar" ? "ar-QA" : "en-GB";
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
          };
          recognition.onerror = () => toast.error(locale === "ar" ? "فشل التعرف على الصوت" : "Speech recognition failed");
          recognition.start();
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error(locale === "ar" ? "تعذر الوصول إلى الميكروفون" : "Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const t = {
    title: locale === "ar" ? "المعلم الذكي" : "AI Tutor",
    placeholder: locale === "ar" ? "اسأل سؤالاً… (Enter للإرسال، Shift+Enter لسطر جديد)" : "Ask a question… (Enter to send, Shift+Enter for new line)",
    send: locale === "ar" ? "إرسال" : "Send",
    tts: locale === "ar" ? "قراءة الردود" : "Read replies aloud",
    clear: locale === "ar" ? "محادثة جديدة" : "New conversation",
  };

  return (
    <div id="ai-tutor" className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">{t.title}</h1>
            <p className="text-xs text-muted-foreground">
              {profile.curriculum !== "none" ? profile.curriculum.replace("_", " ").toUpperCase() : locale === "ar" ? "عام" : "General"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="tts-toggle" className="text-xs text-muted-foreground">{t.tts}</Label>
            <Switch
              id="tts-toggle"
              checked={ttsEnabled}
              onCheckedChange={setTtsEnabled}
              aria-label={t.tts}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            aria-label={t.clear}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label={locale === "ar" ? "محادثة المعلم الذكي" : "AI tutor conversation"} aria-live="polite">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-arrive ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              msg.role === "assistant"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "assistant"
                ? "bg-card border border-border text-card-foreground rounded-tl-sm"
                : "bg-primary text-primary-foreground rounded-tr-sm"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose-hikma prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.role === "assistant" && ttsEnabled && (
                <button
                  onClick={() => speakText(msg.content)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  aria-label={locale === "ar" ? "قراءة هذا الرد" : "Read this reply"}
                >
                  <Volume2 className="w-3 h-3" />
                  {locale === "ar" ? "استمع" : "Listen"}
                </button>
              )}
            </div>
          </div>
        ))}
        {isStreaming && streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <Streamdown>{streamingContent}</Streamdown>
            </div>
          </div>
        )}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            className="flex-1 resize-none min-h-[2.5rem] max-h-32"
            aria-label={locale === "ar" ? "رسالتك للمعلم الذكي" : "Your message to the AI tutor"}
            disabled={isStreaming}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? (locale === "ar" ? "إيقاف التسجيل" : "Stop recording") : (locale === "ar" ? "بدء التسجيل الصوتي" : "Start voice recording")}
            className={isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            aria-label={t.send}
            size="icon"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {locale === "ar" ? "حكمة تتعلم معك — ليست بديلاً عن المعلم" : "Hikma learns with you — not a replacement for your teacher"}
        </p>
      </div>
    </div>
  );
}
