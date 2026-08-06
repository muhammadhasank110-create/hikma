/**
 * VoiceChatPanel — conversational voice command chat panel.
 *
 * Anchored to the mic button, bottom-left on desktop.
 * On mobile (< 768px) it becomes a bottom sheet, full width, max 40vh.
 * Opens automatically on the first ask_tutor reply.
 * Closable with Escape and a visible close button.
 * role="log" with aria-live="polite" so screen readers announce replies.
 * Includes a text input so the same questions can be typed.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/contexts/SpeechContext";
import { useProfile } from "@/contexts/ProfileContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface VoiceChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  messages: Message[];
  onSendText: (text: string) => void;
  isLoading?: boolean;
}

export function VoiceChatPanel({
  isOpen,
  onClose,
  isListening,
  messages,
  onSendText,
  isLoading = false,
}: VoiceChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { locale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    onSendText(text);
  }, [input, onSendText]);

  if (!isOpen) return null;

  // Show only last 6 exchanges (12 messages)
  const visibleMessages = messages.slice(-12);

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="log"
        aria-live="polite"
        aria-label={t("Voice assistant chat", "محادثة المساعد الصوتي")}
        className={[
          "fixed z-50 flex flex-col bg-background/95 backdrop-blur-sm border border-border shadow-2xl",
          // Desktop: anchored bottom-left, max 380px wide
          "md:bottom-20 md:left-4 md:w-[380px] md:max-h-[50vh] md:rounded-2xl",
          // Mobile: bottom sheet, full width, max 40vh
          "bottom-0 left-0 right-0 max-h-[40vh] rounded-t-2xl md:right-auto",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isListening ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            <span className="text-sm font-semibold">
              {isListening
                ? t("Listening…", "يستمع…")
                : t("Hikma AI", "حكمة AI")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-7 h-7"
            aria-label={t("Close voice panel", "إغلاق لوحة الصوت")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
          {visibleMessages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t("Ask me anything about your lessons…", "اسألني أي شيء عن دروسك…")}
            </p>
          )}
          {visibleMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                ].join(" ")}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Text input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-2 border-t border-border flex-shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t("Type a question…", "اكتب سؤالاً…")}
            className="flex-1 bg-muted/50 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 min-w-0"
            aria-label={t("Type your question", "اكتب سؤالك")}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 flex-shrink-0"
            aria-label={t("Send", "إرسال")}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
