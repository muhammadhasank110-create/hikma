import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useProfile } from "@/contexts/ProfileContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Home, BookOpen, Bot, TrendingUp, Layers, FileText,
  Settings, Keyboard, Volume2, VolumeX, Sun, Moon,
  ZoomIn, ZoomOut, AlignLeft, Focus, Globe, Search,
  ChevronRight
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  labelAr: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  badge?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [, navigate] = useLocation();
  const { profile, locale, setLocale, updateProfile } = useProfile();
  const highContrast = profile.theme === "high_contrast";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    { id: "home", label: "Go to Home", labelAr: "الصفحة الرئيسية", category: "Navigate", icon: <Home className="w-4 h-4" />, action: () => { navigate("/dashboard"); onClose(); }, keywords: ["home", "dashboard", "start"] },
    { id: "subjects", label: "Browse Subjects", labelAr: "تصفح المواد", category: "Navigate", icon: <BookOpen className="w-4 h-4" />, action: () => { navigate("/subjects"); onClose(); }, keywords: ["subjects", "curriculum", "math", "science", "english"] },
    { id: "tutor", label: "Open AI Tutor", labelAr: "فتح المعلم الذكي", category: "Navigate", icon: <Bot className="w-4 h-4" />, action: () => { navigate("/tutor"); onClose(); }, keywords: ["tutor", "ai", "chat", "ask", "help"] },
    { id: "progress", label: "My Progress", labelAr: "تقدمي", category: "Navigate", icon: <TrendingUp className="w-4 h-4" />, action: () => { navigate("/progress"); onClose(); }, keywords: ["progress", "mastery", "stats"] },
    { id: "ecc", label: "ECC Track", labelAr: "مسار المهارات الأساسية", category: "Navigate", icon: <Layers className="w-4 h-4" />, action: () => { navigate("/ecc"); onClose(); }, keywords: ["ecc", "expanded core", "blind", "low vision"] },
    { id: "exam-skills", label: "Exam Skills", labelAr: "مهارات الامتحان", category: "Navigate", icon: <FileText className="w-4 h-4" />, action: () => { navigate("/exam-skills"); onClose(); }, keywords: ["exam", "skills", "command words", "access arrangements"] },
    { id: "settings", label: "Settings", labelAr: "الإعدادات", category: "Navigate", icon: <Settings className="w-4 h-4" />, action: () => { navigate("/settings"); onClose(); }, keywords: ["settings", "preferences", "accessibility"] },
    { id: "shortcuts", label: "Keyboard Shortcuts", labelAr: "اختصارات لوحة المفاتيح", category: "Navigate", icon: <Keyboard className="w-4 h-4" />, action: () => { navigate("/shortcuts"); onClose(); }, keywords: ["shortcuts", "keyboard", "keys"] },
    // Accessibility
    { id: "high-contrast", label: highContrast ? "Disable High Contrast" : "Enable High Contrast", labelAr: highContrast ? "تعطيل التباين العالي" : "تفعيل التباين العالي", category: "Accessibility", icon: <Sun className="w-4 h-4" />, action: () => { updateProfile({ theme: highContrast ? "light" : "high_contrast" }); onClose(); }, keywords: ["contrast", "high contrast", "visibility"] },
    { id: "lang-ar", label: "Switch to Arabic", labelAr: "التبديل إلى العربية", category: "Accessibility", icon: <Globe className="w-4 h-4" />, action: () => { setLocale("ar"); onClose(); }, keywords: ["arabic", "عربي", "language", "rtl"] },
    { id: "lang-en", label: "Switch to English", labelAr: "التبديل إلى الإنجليزية", category: "Accessibility", icon: <Globe className="w-4 h-4" />, action: () => { setLocale("en"); onClose(); }, keywords: ["english", "language", "ltr"] },
    { id: "text-up", label: "Increase Text Size", labelAr: "تكبير النص", category: "Accessibility", icon: <ZoomIn className="w-4 h-4" />, action: () => { document.documentElement.style.fontSize = `${Math.min(200, parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.1)}px`; onClose(); }, keywords: ["text", "size", "larger", "zoom in", "a+"] },
    { id: "text-down", label: "Decrease Text Size", labelAr: "تصغير النص", category: "Accessibility", icon: <ZoomOut className="w-4 h-4" />, action: () => { document.documentElement.style.fontSize = `${Math.max(12, parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.9)}px`; onClose(); }, keywords: ["text", "size", "smaller", "zoom out", "a-"] },
  ];

  const filtered = query.trim()
    ? commands.filter(c => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.labelAr.includes(q) ||
          c.keywords.some(k => k.includes(q)) ||
          c.category.toLowerCase().includes(q)
        );
      })
    : commands;

  // Group by category
  const grouped: Record<string, CommandItem[]> = {};
  for (const cmd of filtered) {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  }

  const flatFiltered = filtered;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatFiltered[selectedIndex]?.action();
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [flatFiltered, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        className="p-0 gap-0 max-w-lg overflow-hidden"
        aria-label={locale === "ar" ? "لوحة الأوامر" : "Command palette"}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={locale === "ar" ? "ابحث عن أمر أو صفحة..." : "Search commands and pages..."}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label={locale === "ar" ? "بحث في الأوامر" : "Search commands"}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">Esc</kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto py-2"
          role="listbox"
          aria-label={locale === "ar" ? "نتائج الأوامر" : "Command results"}
        >
          {flatFiltered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {locale === "ar" ? "لا توجد نتائج" : "No results found"}
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </div>
                {items.map((item) => {
                  const globalIndex = flatFiltered.indexOf(item);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={globalIndex}
                      role="option"
                      aria-selected={isSelected}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className={`shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">
                        {locale === "ar" ? item.labelAr : item.label}
                      </span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                      )}
                      <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground/50"}`} />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
          <span><kbd className="bg-muted px-1 rounded border border-border">↑↓</kbd> navigate</span>
          <span><kbd className="bg-muted px-1 rounded border border-border">↵</kbd> select</span>
          <span><kbd className="bg-muted px-1 rounded border border-border">Esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
