interface Props { value: number; }

export default function GaugeChart({ value }: Props) {
  const color = value >= 75 ? "#059669" : value >= 50 ? "#d97706" : "#dc2626";
  const angle = Math.min(100, Math.max(0, value)) * 1.8;
  const radius = 70;
  const centerX = 100;
  const centerY = 90;
  const startAngle = -180;
  const endAngle = startAngle + angle;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const needleAngle = -90 + angle;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 8;
  const needleX = centerX + Math.cos(needleRad) * needleLength;
  const needleY = centerY + Math.sin(needleRad) * needleLength;

  return (
    <svg viewBox="0 0 200 130" className="w-full">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d={describeArc(centerX, centerY, radius, -180, 0)} fill="none" stroke="#f2f1ed" strokeWidth="12" strokeLinecap="round" />
      {value > 0 && (
        <path d={describeArc(centerX, centerY, radius, startAngle, endAngle)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" style={{ transition: "all 1s ease-out" }} />
      )}
      {[0, 25, 50, 75, 100].map((tick) => {
        const ta = ((-180 + tick * 1.8) * Math.PI) / 180;
        return (
          <line key={tick} x1={centerX + Math.cos(ta) * (radius - 8)} y1={centerY + Math.sin(ta) * (radius - 8)}
            x2={centerX + Math.cos(ta) * (radius + 10)} y2={centerY + Math.sin(ta) * (radius + 10)}
            stroke="#d4d2ca" strokeWidth="1" />
        );
      })}
      <circle cx={centerX} cy={centerY} r="5" fill="#b8860b" />
      <line x1={centerX} y1={centerY} x2={needleX} y2={needleY} stroke="#b8860b" strokeWidth="2" style={{ transition: "all 1s ease-out" }} />
      <text x={centerX} y={centerY + 22} textAnchor="middle" fill="#1c1c1c" fontSize="16" fontWeight="bold">{value}</text>
    </svg>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
