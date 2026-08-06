export default function ConceptMapSVG({ lessonTitle, sections, locale }: {
  lessonTitle: string; sections: any[]; locale: string;
}) {
  const W = 560; const H = 280;
  const cx = W / 2; const cy = 60; const r = 110;
  const nodes = sections.slice(0, 6).map((s, i) => {
    const angle = (Math.PI / (sections.length + 1)) * (i + 1);
    return { x: cx + r * Math.cos(angle - Math.PI / 2), y: cy + r * Math.sin(angle - Math.PI / 2) + 60, label: locale === "ar" ? (s.titleAr ?? s.titleEn ?? "") : (s.titleEn ?? "") };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={`Concept map for ${lessonTitle}`} role="img">
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="var(--color-primary)" /></marker></defs>
      <ellipse cx={cx} cy={cy} rx={90} ry={24} fill="var(--color-primary)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{lessonTitle.slice(0, 28)}</text>
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1={cx} y1={cy + 24} x2={n.x} y2={n.y - 18} stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrow)" />
          <rect x={n.x - 70} y={n.y - 18} width={140} height={36} rx={8} fill="var(--color-muted)" stroke="var(--color-border)" strokeWidth="1" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="var(--color-foreground)">{n.label.slice(0, 22)}</text>
        </g>
      ))}
    </svg>
  );
}
