import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { List, Network } from "lucide-react";

interface Props {
  lessonTitle: string;
  sections: any[];
  locale: string;
  defaultList?: boolean;
}

type MapNode = { label: string; body: string; x: number; y: number };

const shorten = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

export default function ConceptMapSVG({ lessonTitle, sections, locale, defaultList = false }: Props) {
  const [showList, setShowList] = useState(defaultList);
  const markerId = `concept-arrow-${useId().replace(/:/g, "")}`;
  const isArabic = locale === "ar";
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const { nodes, width, height, centerX, centerY, nodeWidth, nodeHeight, columnCount } = useMemo(() => {
    const visibleSections = sections.slice(0, 6);
    const columnCount = visibleSections.length <= 3 ? Math.max(1, visibleSections.length) : 2;
    const rows = Math.max(1, Math.ceil(visibleSections.length / columnCount));
    const width = 640;
    const nodeWidth = columnCount === 1 ? 320 : columnCount === 2 ? 240 : 174;
    const nodeHeight = 48;
    const startY = 156;
    const rowGap = 78;
    const height = Math.max(260, startY + (rows - 1) * rowGap + nodeHeight + 28);
    const centerX = width / 2;
    const centerY = 54;
    const nodes: MapNode[] = visibleSections.map((section, index) => {
      const row = Math.floor(index / columnCount);
      const column = index % columnCount;
      const spacing = width / (columnCount + 1);
      const label = isArabic
        ? (section.titleAr ?? section.titleEn ?? "")
        : (section.titleEn ?? section.titleAr ?? "");
      const body = isArabic
        ? (section.bodyAr ?? section.bodyEn ?? "")
        : (section.bodyEn ?? section.bodyAr ?? "");
      return { label, body, x: spacing * (column + 1), y: startY + row * rowGap };
    });
    return { nodes, width, height, centerX, centerY, nodeWidth, nodeHeight, columnCount };
  }, [sections, isArabic]);

  if (!nodes.length) {
    return <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">{t("No map is available for this lesson yet.", "لا تتوفر خريطة لهذا الدرس بعد.")}</p>;
  }

  return (
    <section aria-label={t("Lesson concept map", "خريطة مفاهيم الدرس")}>
      <div className="mb-3 flex items-center gap-2" role="group" aria-label={t("Concept map view", "عرض خريطة المفاهيم")}>
        <Button variant={showList ? "default" : "outline"} size="sm" onClick={() => setShowList(true)} aria-pressed={showList}>
          <List className="mr-1.5 h-3.5 w-3.5" />
          {t("List", "قائمة")}
        </Button>
        <Button variant={!showList ? "default" : "outline"} size="sm" onClick={() => setShowList(false)} aria-pressed={!showList}>
          <Network className="mr-1.5 h-3.5 w-3.5" />
          {t("Diagram", "مخطط")}
        </Button>
      </div>

      {showList ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
          <p className="mb-3 font-semibold text-foreground">{lessonTitle}</p>
          <ul className="m-0 list-none space-y-3 p-0">
            {nodes.map((node, index) => (
              <li key={`${node.label}-${index}`} className="border-s-2 border-primary/60 ps-3">
                <p className="font-medium text-foreground">{node.label}</p>
                {node.body && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{shorten(node.body, 160)}</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-muted/20 p-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-[560px] w-full"
            preserveAspectRatio="xMidYMin meet"
            role="img"
            aria-labelledby={`${markerId}-title ${markerId}-desc`}
          >
            <title id={`${markerId}-title`}>{t(`Concept map for ${lessonTitle}`, `خريطة مفاهيم لـ ${lessonTitle}`)}</title>
            <desc id={`${markerId}-desc`}>{t("A central lesson topic connected to its lesson sections.", "موضوع الدرس في الوسط متصل بأقسام الدرس.")}</desc>
            <defs>
              <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L8,3 z" fill="rgb(var(--primary))" />
              </marker>
            </defs>
            {nodes.map((node, index) => (
              <line
                key={`line-${index}`}
                x1={centerX}
                y1={centerY + 28}
                x2={node.x}
                y2={node.y - nodeHeight / 2 - 7}
                stroke="rgb(var(--primary))"
                strokeWidth="1.75"
                strokeDasharray="4 3"
                markerEnd={`url(#${markerId})`}
                aria-hidden="true"
              />
            ))}
            <rect x={centerX - 138} y={centerY - 24} width="276" height="48" rx="14" fill="rgb(var(--primary))" />
            <text x={centerX} y={centerY + 5} textAnchor="middle" fill="rgb(var(--primary-foreground))" fontSize="13" fontWeight="700">
              {shorten(lessonTitle, 38)}
            </text>
            {nodes.map((node, index) => (
              <g key={`${node.label}-${index}`}>
                <rect x={node.x - nodeWidth / 2} y={node.y - nodeHeight / 2} width={nodeWidth} height={nodeHeight} rx="12" fill="rgb(var(--card))" stroke="rgb(var(--border-strong))" strokeWidth="1.25" />
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="rgb(var(--foreground))" fontSize="12" fontWeight="600" direction={isArabic ? "rtl" : undefined}>
                  {shorten(node.label, columnCount === 3 ? 22 : 31)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}
