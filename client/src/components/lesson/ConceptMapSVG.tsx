import { useState } from "react";
import { Button } from "@/components/ui/button";
import { List, Network } from "lucide-react";

interface Props {
  lessonTitle: string;
  sections: any[];
  locale: string;
  /** If true, default to the text list view (used for dyslexia profile) */
  defaultList?: boolean;
}

export default function ConceptMapSVG({ lessonTitle, sections, locale, defaultList = false }: Props) {
  const [showList, setShowList] = useState(defaultList);
  const W = 560; const H = 280;
  const cx = W / 2; const cy = 60; const r = 110;
  const nodes = sections.slice(0, 6).map((s, i) => {
    const angle = (Math.PI / (sections.length + 1)) * (i + 1);
    const label = locale === "ar" ? (s.titleAr ?? s.titleEn ?? "") : (s.titleEn ?? "");
    const body = locale === "ar" ? (s.bodyAr ?? s.bodyEn ?? "") : (s.bodyEn ?? "");
    return { x: cx + r * Math.cos(angle - Math.PI / 2), y: cy + r * Math.sin(angle - Math.PI / 2) + 60, label, body };
  });

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div>
      {/* Toggle between diagram and list */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant={showList ? "default" : "outline"}
          size="sm"
          onClick={() => setShowList(true)}
          aria-pressed={showList}
          aria-label={t("Show as text list (accessible)", "عرض كقائمة نصية")}
        >
          <List className="w-3.5 h-3.5 mr-1.5" />
          {t("List", "قائمة")}
        </Button>
        <Button
          variant={!showList ? "default" : "outline"}
          size="sm"
          onClick={() => setShowList(false)}
          aria-pressed={!showList}
          aria-label={t("Show as diagram", "عرض كمخطط")}
        >
          <Network className="w-3.5 h-3.5 mr-1.5" />
          {t("Diagram", "مخطط")}
        </Button>
      </div>

      {showList ? (
        /* ── Text alternative: nested list with plain-language relationship labels ── */
        <div className="text-sm">
          <p className="font-bold mb-2">{lessonTitle}</p>
          <ul className="space-y-2 list-none pl-0">
            {nodes.map((n, i) => (
              <li key={i} className="border-l-2 border-primary/40 pl-3">
                <span className="text-xs text-muted-foreground mr-1">
                  {t("covers →", "يغطي ←")}
                </span>
                <span className="font-medium">{n.label}</span>
                {n.body && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {n.body.slice(0, 120)}{n.body.length > 120 ? "…" : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* ── SVG diagram ── */
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={`Concept map for ${lessonTitle}`} role="img">
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="var(--color-primary)" />
            </marker>
          </defs>
          <ellipse cx={cx} cy={cy} rx={90} ry={24} fill="var(--color-primary)" />
          <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
            {lessonTitle.slice(0, 28)}
          </text>
          {nodes.map((n, i) => (
            <g key={i}>
              <line x1={cx} y1={cy + 24} x2={n.x} y2={n.y - 18}
                stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="4 2"
                markerEnd="url(#arrow)" />
              <rect x={n.x - 70} y={n.y - 18} width={140} height={36} rx={8}
                fill="var(--color-muted)" stroke="var(--color-border)" strokeWidth="1" />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="var(--color-foreground)">
                {n.label.slice(0, 22)}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
