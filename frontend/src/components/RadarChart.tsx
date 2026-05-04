interface Dimension { name: string; target: number; actual: number; }

interface Props { dimensions: Dimension[]; }

const DIMS = ["简洁度", "朴素度", "对话密度", "含蓄度", "行动导向"];

export default function RadarChart({ dimensions }: Props) {
  const cx = 150, cy = 140, r = 110, count = DIMS.length;
  const dimMap = new Map<string, Dimension>();
  dimensions.forEach((d) => dimMap.set(d.name, d));
  const ordered = DIMS.map((name) => dimMap.get(name) || { name, target: 50, actual: 50 });
  const angleStep = (2 * Math.PI) / count;

  const points = ordered.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const tr = (d.target / 100) * r;
    const ar = (d.actual / 100) * r;
    return {
      name: d.name,
      targetX: cx + Math.cos(angle) * tr, targetY: cy + Math.sin(angle) * tr,
      actualX: cx + Math.cos(angle) * ar, actualY: cy + Math.sin(angle) * ar,
      labelX: cx + Math.cos(angle) * (r + 30), labelY: cy + Math.sin(angle) * (r + 30),
    };
  });

  const targetPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.targetX} ${p.targetY}`).join(" ") + " Z";
  const actualPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.actualX} ${p.actualY}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
      {[0.25, 0.5, 0.75, 1].map((scale, si) => {
        const gr = r * scale;
        const gridPath = ordered.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return `${i === 0 ? "M" : "L"} ${cx + Math.cos(angle) * gr} ${cy + Math.sin(angle) * gr}`;
        }).join(" ") + " Z";
        return <path key={si} d={gridPath} fill="none" stroke="#e8e6e0" strokeWidth="1" />;
      })}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.labelX} y2={p.labelY} stroke="#e8e6e0" strokeWidth="0.5" />
      ))}
      <path d={targetPath} fill="rgba(184,134,11,0.06)" stroke="#b8860b" strokeWidth="1.5" strokeDasharray="4,3" />
      <path d={actualPath} fill="rgba(239,68,68,0.06)" stroke="#ef4444" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.actualX} cy={p.actualY} r="4" fill="#ef4444" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle" fill="#6b6b63" fontSize="11">{p.name}</text>
      ))}
    </svg>
  );
}
