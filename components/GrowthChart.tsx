import { GrowthMetric, percentileLinesAtAge } from '@/lib/growth';

type Point = { age: number; value: number };

type GrowthChartProps = {
  metric: GrowthMetric;
  unit: string;
  points: Point[];
  maxAge: number; // months
};

const W = 340;
const H = 240;
const M = { l: 34, r: 12, t: 12, b: 24 };

export function GrowthChart({ metric, unit, points, maxAge }: GrowthChartProps) {
  const ages: number[] = [];
  for (let a = 0; a <= maxAge; a += 1) ages.push(a);
  const lines = ages.map((a) => ({ a, ...percentileLinesAtAge(metric, a) }));

  const lo = Math.min(...lines.map((l) => l.p3), ...points.map((p) => p.value));
  const hi = Math.max(...lines.map((l) => l.p97), ...points.map((p) => p.value));
  const yMin = Math.floor(lo - (hi - lo) * 0.08);
  const yMax = Math.ceil(hi + (hi - lo) * 0.08);

  const xOf = (age: number) => M.l + (age / maxAge) * (W - M.l - M.r);
  const yOf = (v: number) => M.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - M.t - M.b);

  const bandTop = lines.map((l) => `${xOf(l.a)},${yOf(l.p97)}`).join(' ');
  const bandBottom = lines
    .slice()
    .reverse()
    .map((l) => `${xOf(l.a)},${yOf(l.p3)}`)
    .join(' ');
  const medianPath = lines.map((l, i) => `${i === 0 ? 'M' : 'L'}${xOf(l.a)},${yOf(l.p50)}`).join(' ');
  const childPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.age)},${yOf(p.value)}`).join(' ');

  const xTicks = [];
  for (let a = 0; a <= maxAge; a += 6) xTicks.push(a);
  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${metric} for age chart`} style={{ maxWidth: '100%' }}>
      {/* WHO 3rd–97th band */}
      <polygon points={`${bandTop} ${bandBottom}`} fill="rgba(45,212,191,0.14)" stroke="none" />
      {/* gridlines + y labels */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const v = yMin + ((yMax - yMin) * i) / yTicks;
        const y = yOf(v);
        return (
          <g key={i}>
            <line x1={M.l} y1={y} x2={W - M.r} y2={y} stroke="rgba(255,255,255,0.08)" />
            <text x={M.l - 4} y={y + 3} textAnchor="end" fontSize="8" fill="rgba(226,232,240,0.6)">
              {Math.round(v)}
            </text>
          </g>
        );
      })}
      {/* x labels */}
      {xTicks.map((a) => (
        <text key={a} x={xOf(a)} y={H - 6} textAnchor="middle" fontSize="8" fill="rgba(226,232,240,0.6)">
          {a}m
        </text>
      ))}
      {/* median */}
      <path d={medianPath} fill="none" stroke="rgba(148,163,184,0.7)" strokeWidth="1" strokeDasharray="3 2" />
      {/* child trajectory */}
      {points.length > 0 && <path d={childPath} fill="none" stroke="#22d3ee" strokeWidth="2" />}
      {points.map((p, i) => (
        <circle key={i} cx={xOf(p.age)} cy={yOf(p.value)} r="3" fill="#22d3ee" stroke="#0f172a" strokeWidth="1" />
      ))}
      <text x={M.l} y={10} fontSize="8" fill="rgba(226,232,240,0.55)">
        {unit}
      </text>
    </svg>
  );
}
