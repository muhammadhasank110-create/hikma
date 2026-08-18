import { useCallback, useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import { BookOpen, Check, ImageIcon, List, MessageCircle, Network, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type ConceptGraph = {
  nodes?: Array<{ id: string; label: string; labelAr?: string; type?: string; detail?: string }>;
  edges?: Array<{ from: string; to: string; label?: string; labelAr?: string }>;
  textAlternative?: string;
  textAlternativeAr?: string;
};

interface Props {
  lessonTitle: string;
  sections: Array<{
    id?: number;
    titleEn?: string | null;
    titleAr?: string | null;
    summaryEn?: string | null;
    summaryAr?: string | null;
    bodyEn?: string | null;
    bodyAr?: string | null;
  }>;
  locale: string;
  defaultList?: boolean;
  conceptGraph?: ConceptGraph | null;
  subjectArea?: string;
  onAskTutor?: () => void;
}

type VisualizationType = "network" | "process" | "timeline" | "comparison" | "hierarchy" | "geography" | "literature" | "mathematics";
type MapNode = { id: string; label: string; body: string; type: string; relatedIds: string[]; isPriority: boolean };
type VisualAsset = { imageUrl: string; altText: string; description: string };
type VisualState = { status: "idle" | "loading" | "ready" | "error"; visual?: VisualAsset };

const visualCachePrefix = "hikma:visual-learning-map:";

const shorten = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

export function chooseVisualizationType(subjectArea: string, nodes: Array<{ type: string }>): VisualizationType {
  const subject = subjectArea.toLocaleLowerCase();
  if (/(math|رياضيات|algebra|geometry)/.test(subject)) return "mathematics";
  if (/(history|تاريخ)/.test(subject)) return "timeline";
  if (/(geography|جغرافيا|geographic)/.test(subject)) return "geography";
  if (/(english|لغة|literature|أدب)/.test(subject)) return "literature";
  if (nodes.some((node) => node.type === "process" || node.type === "input" || node.type === "output")) return "process";
  if (/(science|biology|chemistry|physics|علوم|أحياء|كيمياء|فيزياء)/.test(subject)) return "process";
  return "network";
}

function readCachedVisual(key: string): VisualAsset | null {
  try {
    const saved = window.sessionStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as VisualAsset;
    return parsed.imageUrl && parsed.altText && parsed.description ? parsed : null;
  } catch {
    return null;
  }
}

function saveCachedVisual(key: string, visual: VisualAsset) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(visual));
  } catch {
    // The current visual remains usable even when browser storage is disabled.
  }
}

export default function ConceptMapSVG({ lessonTitle, sections, locale, defaultList = false, conceptGraph, subjectArea = "", onAskTutor }: Props) {
  const [showList, setShowList] = useState(defaultList);
  const [selectedId, setSelectedId] = useState("");
  const [visualState, setVisualState] = useState<VisualState>({ status: "idle" });
  const [actionNote, setActionNote] = useState("");
  const componentId = `visual-learning-map-${useId().replace(/:/g, "")}`;
  const isArabic = locale === "ar";
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const nodes = useMemo(() => {
    const graphNodes = conceptGraph?.nodes?.slice(0, 7) ?? [];
    const sourceNodes = graphNodes.length
      ? graphNodes.map((node, index) => ({
        id: node.id || `concept-${index}`,
        label: isArabic ? (node.labelAr || node.label) : node.label,
        body: node.detail || "",
        type: node.type || "concept",
      }))
      : sections.slice(0, 6).map((section, index) => ({
        id: String(section.id ?? `section-${index}`),
        label: isArabic ? (section.titleAr ?? section.titleEn ?? "") : (section.titleEn ?? section.titleAr ?? ""),
        body: isArabic
          ? (section.summaryAr ?? section.bodyAr ?? section.summaryEn ?? section.bodyEn ?? "")
          : (section.summaryEn ?? section.bodyEn ?? section.summaryAr ?? section.bodyAr ?? ""),
        type: "concept",
      }));

    return sourceNodes
      .filter((node) => node.label.trim())
      .map((node, index): MapNode => ({
        ...node,
        relatedIds: (conceptGraph?.edges ?? []).flatMap((edge) => edge.from === node.id ? [edge.to] : edge.to === node.id ? [edge.from] : []),
        isPriority: index === 0 || node.type === "process" || node.body.length > 120,
      }));
  }, [conceptGraph, isArabic, sections]);

  const visualizationType = useMemo(() => chooseVisualizationType(subjectArea, nodes), [nodes, subjectArea]);
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const cacheKey = selectedNode
    ? `${visualCachePrefix}${locale}:${subjectArea}:${lessonTitle}:${selectedNode.id}`.toLocaleLowerCase()
    : "";
  const mapTextAlternative = isArabic
    ? (conceptGraph?.textAlternativeAr || conceptGraph?.textAlternative)
    : (conceptGraph?.textAlternative || conceptGraph?.textAlternativeAr);
  const visualMutation = trpc.tutor.generateConceptVisual.useMutation();

  useEffect(() => {
    if (!nodes.length) return;
    if (!nodes.some((node) => node.id === selectedId)) setSelectedId(nodes[0].id);
  }, [nodes, selectedId]);

  useEffect(() => {
    setActionNote("");
    if (!cacheKey) {
      setVisualState({ status: "idle" });
      return;
    }
    const cached = readCachedVisual(cacheKey);
    setVisualState(cached ? { status: "ready", visual: cached } : { status: "idle" });
  }, [cacheKey]);

  const requestVisual = useCallback(() => {
    if (!selectedNode || !cacheKey) return;
    const cached = readCachedVisual(cacheKey);
    if (cached) {
      setVisualState({ status: "ready", visual: cached });
      return;
    }
    setVisualState({ status: "loading" });
    visualMutation.mutate({
      conceptLabel: selectedNode.label,
      conceptDetail: selectedNode.body,
      subjectArea,
      lessonTitle,
      locale: isArabic ? "ar" : "en",
      studentLevel: 9,
      visualType: visualizationType === "mathematics" ? "network" : visualizationType,
    }, {
      onSuccess: (visual) => {
        const asset: VisualAsset = { imageUrl: visual.imageUrl, altText: visual.altText, description: visual.description };
        saveCachedVisual(cacheKey, asset);
        setVisualState({ status: "ready", visual: asset });
      },
      onError: () => setVisualState({ status: "error" }),
    });
  }, [cacheKey, isArabic, lessonTitle, selectedNode, subjectArea, visualMutation, visualizationType]);

  const selectRelativeNode = (event: KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-visual-node]");
    if (!button) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-visual-node]"));
    const currentIndex = buttons.indexOf(button);
    if (currentIndex < 0) return;
    event.preventDefault();
    const nextIndex = event.key === "ArrowUp" || event.key === "ArrowLeft"
      ? (currentIndex - 1 + buttons.length) % buttons.length
      : (currentIndex + 1) % buttons.length;
    const nextButton = buttons[nextIndex];
    nextButton?.focus();
    if (nextButton?.dataset.visualNode) setSelectedId(nextButton.dataset.visualNode);
  };

  const useTutorAction = (action: string) => {
    setActionNote(t(`Hikma AI is ready to help you ${action.toLocaleLowerCase()} ${selectedNode?.label ?? "this concept"}.`, `حكمة AI جاهزة لمساعدتك على ${action} ${selectedNode?.label ?? "هذا المفهوم"}.`));
    onAskTutor?.();
  };

  if (!nodes.length) {
    return <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">{t("No map is available for this lesson yet.", "لا تتوفر خريطة لهذا الدرس بعد.")}</p>;
  }

  return (
    <section aria-label={t("Visual Learning Map", "خريطة التعلّم البصرية")} dir={isArabic ? "rtl" : undefined}>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label={t("Visual Learning Map view", "عرض خريطة التعلّم البصرية")}>
        <Button variant={showList ? "default" : "outline"} size="sm" onClick={() => setShowList(true)} aria-pressed={showList}>
          <List className="h-3.5 w-3.5" />
          {t("List", "قائمة")}
        </Button>
        <Button variant={!showList ? "default" : "outline"} size="sm" onClick={() => setShowList(false)} aria-pressed={!showList}>
          <Network className="h-3.5 w-3.5" />
          {t("Visual map", "خريطة بصرية")}
        </Button>
      </div>

      {showList ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
          <p className="mb-3 font-semibold text-foreground">{lessonTitle}</p>
          <ul className="m-0 list-none space-y-3 p-0">
            {nodes.map((node) => (
              <li key={node.id} className="border-s-2 border-primary/60 ps-3">
                <p className="font-medium text-foreground">{node.label}</p>
                {node.body && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{shorten(node.body, 160)}</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
          <p id={`${componentId}-description`} className="sr-only">
            {mapTextAlternative || t("Select a related concept to read its explanation and optional visual representation.", "اختر مفهوماً مرتبطاً لقراءة شرحه وتمثيله البصري الاختياري.")}
          </p>
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-4 text-center shadow-sm">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{t("Central lesson concept", "مفهوم الدرس المركزي")}</p>
            <h3 className="mt-1 text-base font-bold text-foreground">{lessonTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t(`Representation: ${visualizationType === "mathematics" ? "mathematical relationships" : visualizationType}`, `نوع التمثيل: ${visualizationType === "mathematics" ? "علاقات رياضية" : visualizationType}`)}</p>
          </div>

          <ul
            className={`mt-4 grid gap-2 ${visualizationType === "timeline" ? "sm:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}
            aria-describedby={`${componentId}-description`}
            aria-label={t("Related lesson concepts", "مفاهيم الدرس المرتبطة")}
            onKeyDown={selectRelativeNode}
          >
            {nodes.map((node, index) => {
              const isSelected = selectedNode?.id === node.id;
              const isDirectlyRelated = !isSelected && Boolean(selectedNode?.relatedIds.includes(node.id));
              const stateLabel = isSelected
                ? t("Selected concept", "المفهوم المحدد")
                : isDirectlyRelated
                  ? t("Directly connected concept", "مفهوم مرتبط مباشرة")
                  : node.type === "process" ? t("Process step", "خطوة في عملية") : t("Related concept", "مفهوم مرتبط");

              return (
              <li key={node.id} className="list-none">
                <button
                  type="button"
                  data-visual-node={node.id}
                  data-visual-state={isSelected ? "selected" : isDirectlyRelated ? "related" : "background"}
                  aria-pressed={isSelected}
                  aria-label={t(`Open ${node.label}`, `افتح ${node.label}`)}
                  onClick={() => setSelectedId(node.id)}
                  className={`min-h-14 w-full rounded-xl border p-3 text-start transition-[background-color,border-color,box-shadow] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isSelected ? "border-primary bg-primary text-primary-foreground shadow-md outline outline-2 outline-primary-foreground outline-offset-2" : isDirectlyRelated ? "border-primary/70 bg-primary/10 text-card-foreground shadow-sm hover:border-primary hover:bg-primary/15 hover:shadow-md" : "border-border bg-card text-card-foreground hover:border-primary/70 hover:bg-primary/5 hover:shadow-sm"}`}
                >
                  <span className="flex items-start gap-2">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isSelected ? "bg-primary-foreground text-primary" : isDirectlyRelated ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`} aria-hidden="true">
                      {isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : isDirectlyRelated ? <Network className="h-3 w-3" strokeWidth={2.5} /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{node.label}</span>
                      <span className={`mt-0.5 block text-xs ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>{stateLabel}</span>
                    </span>
                  </span>
                </button>
              </li>
              );
            })}
          </ul>

          {selectedNode && (
            <aside className="mt-4 rounded-xl border border-border bg-card p-4" aria-labelledby={`${componentId}-detail-title`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Selected concept", "المفهوم المحدد")}</p>
                  <h3 id={`${componentId}-detail-title`} className="mt-1 text-base font-bold text-card-foreground">{selectedNode.label}</h3>
                </div>
                {selectedNode.relatedIds.length > 0 && <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{t(`${selectedNode.relatedIds.length} related`, `${selectedNode.relatedIds.length} مفاهيم مرتبطة`)}</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selectedNode.body || t("This concept is part of the lesson’s central idea. Use Hikma AI to explore it in more detail.", "هذا المفهوم جزء من الفكرة المركزية للدرس. استخدم حكمة AI لاستكشافه بتفصيل أكبر.")}</p>

              {visualizationType === "mathematics" ? (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3" aria-label={t("Programmatic mathematical representation", "تمثيل رياضي برمجي")}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Network className="h-4 w-4 text-primary" />{t("Mathematical relationship", "علاقة رياضية")}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`Use the connected concepts above to trace how ${selectedNode.label} relates to the lesson topic. Mathematical ideas remain text and diagram based so values and relationships stay precise.`, `استخدم المفاهيم المرتبطة أعلاه لتتبع علاقة ${selectedNode.label} بموضوع الدرس. تبقى الأفكار الرياضية نصية ومخططية للحفاظ على دقة القيم والعلاقات.`)}</p>
                </div>
              ) : selectedNode.isPriority ? (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3" aria-live="polite" aria-busy={visualState.status === "loading"}>
                  {visualState.status === "ready" && visualState.visual ? (
                    <figure>
                      <img
                        src={visualState.visual.imageUrl}
                        alt={visualState.visual.altText}
                        className="max-h-72 w-full rounded-md object-cover"
                        loading="eager"
                        decoding="async"
                        onError={() => setVisualState({ status: "error" })}
                      />
                      <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">{visualState.visual.description}</figcaption>
                    </figure>
                  ) : visualState.status === "loading" ? (
                    <div className="space-y-3" role="status">
                      <div className="h-36 rounded-md bg-muted" aria-hidden="true" />
                      <p className="text-sm font-medium text-foreground">{t("Building your visual explanation…", "نبني شرحك البصري…")}</p>
                      <p className="text-xs text-muted-foreground">{t("The text explanation remains available while the optional visual is prepared.", "يبقى الشرح النصي متاحاً أثناء تجهيز التمثيل البصري الاختياري.")}</p>
                    </div>
                  ) : visualState.status === "error" ? (
                    <div role="status" className="text-sm">
                      <div className="flex items-center gap-2 font-medium text-foreground"><ImageIcon className="h-4 w-4 text-primary" />{t("The visual is unavailable right now.", "التمثيل البصري غير متاح حالياً.")}</div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("Use the written explanation and connected concept diagram instead; no learning information is lost.", "استخدم الشرح المكتوب ومخطط المفاهيم المرتبطة بدلاً من ذلك؛ لا تضيع أي معلومات تعليمية.")}</p>
                      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={requestVisual}>{t("Try visual again", "حاول إنشاء التمثيل مرة أخرى")}</Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-primary" />{t("Optional visual explanation", "شرح بصري اختياري")}</div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("Generate one focused educational illustration for this major concept. Supporting concepts stay text based to reduce waiting and visual clutter.", "أنشئ رسماً تعليمياً واحداً ومركزاً لهذا المفهوم المهم. تبقى المفاهيم الداعمة نصية لتقليل الانتظار والفوضى البصرية.")}</p>
                      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={requestVisual} disabled={visualMutation.isPending}><ImageIcon className="h-3.5 w-3.5" />{t("Build visual explanation", "أنشئ شرحاً بصرياً")}</Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">{t("This supporting concept stays text based so the map remains focused. Its explanation and relationships are available above.", "يبقى هذا المفهوم الداعم نصياً حتى تظل الخريطة مركزة. شرحه وعلاقاته متاحة أعلاه.")}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("Learn more about this concept", "تعلّم المزيد عن هذا المفهوم")}>
                <Button type="button" size="sm" onClick={() => useTutorAction(t("explain", "شرح"))}><BookOpen className="h-3.5 w-3.5" />{t("Explain this", "اشرح هذا")}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => useTutorAction(t("show an example of", "عرض مثال على"))}>{t("Show an example", "اعرض مثالاً")}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => useTutorAction(t("go deeper into", "التعمق في"))}>{t("Go deeper", "تعمّق")}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => useTutorAction(t("quiz you about", "اختبارك في"))}>{t("Quiz me", "اختبرني")}</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => useTutorAction(t("explore", "استكشاف"))}><MessageCircle className="h-3.5 w-3.5" />{t("Ask AI", "اسأل AI")}</Button>
              </div>
              {actionNote && <p className="mt-3 text-xs text-muted-foreground" role="status">{actionNote}</p>}
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
