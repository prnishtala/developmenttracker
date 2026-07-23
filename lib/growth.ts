// WHO Child Growth Standards reference (girls), used to give context to logged
// weight/height. Values are approximate percentile anchors at whole-month ages;
// they are guidance only — the pediatrician's official chart is authoritative.

export type GrowthMetric = 'weight' | 'height';

type PercentileTable = {
  ages: number[]; // months
  p3: number[];
  p15: number[];
  p50: number[];
  p85: number[];
  p97: number[];
};

// WHO girls, weight-for-age (kg).
const GIRLS_WEIGHT: PercentileTable = {
  ages: [0, 3, 6, 9, 12, 15, 18, 21, 24, 30, 36],
  p3: [2.4, 4.6, 5.7, 6.5, 7.0, 7.6, 8.1, 8.6, 9.0, 10.0, 10.8],
  p15: [2.8, 5.1, 6.4, 7.3, 7.9, 8.5, 9.1, 9.6, 10.2, 11.2, 12.1],
  p50: [3.2, 5.8, 7.3, 8.2, 8.9, 9.6, 10.2, 10.9, 11.5, 12.7, 13.9],
  p85: [3.7, 6.6, 8.3, 9.3, 10.1, 10.9, 11.6, 12.3, 13.0, 14.4, 15.8],
  p97: [4.2, 7.5, 9.3, 10.5, 11.5, 12.4, 13.2, 14.0, 14.8, 16.5, 18.1]
};

// WHO girls, length/height-for-age (cm).
const GIRLS_HEIGHT: PercentileTable = {
  ages: [0, 3, 6, 9, 12, 15, 18, 21, 24, 30, 36],
  p3: [45.6, 55.6, 61.2, 65.3, 68.9, 72.0, 74.9, 77.5, 80.0, 84.5, 88.4],
  p15: [47.2, 57.3, 63.5, 67.7, 71.4, 74.8, 77.8, 80.6, 83.2, 87.9, 91.9],
  p50: [49.1, 59.8, 65.7, 70.1, 74.0, 77.5, 80.7, 83.7, 86.4, 91.3, 95.1],
  p85: [51.0, 61.7, 68.0, 72.6, 76.6, 80.2, 83.6, 86.7, 89.6, 94.7, 98.9],
  p97: [52.7, 63.5, 70.3, 75.0, 79.2, 83.0, 86.5, 89.8, 92.9, 98.1, 102.7]
};

const TABLES: Record<GrowthMetric, PercentileTable> = { weight: GIRLS_WEIGHT, height: GIRLS_HEIGHT };

function interpolate(ages: number[], values: number[], ageMonths: number): number {
  if (ageMonths <= ages[0]) return values[0];
  if (ageMonths >= ages[ages.length - 1]) return values[values.length - 1];
  for (let i = 0; i < ages.length - 1; i += 1) {
    if (ageMonths >= ages[i] && ageMonths <= ages[i + 1]) {
      const t = (ageMonths - ages[i]) / (ages[i + 1] - ages[i]);
      return values[i] + t * (values[i + 1] - values[i]);
    }
  }
  return values[values.length - 1];
}

export type PercentileLines = { p3: number; p15: number; p50: number; p85: number; p97: number };

export function percentileLinesAtAge(metric: GrowthMetric, ageMonths: number): PercentileLines {
  const t = TABLES[metric];
  return {
    p3: interpolate(t.ages, t.p3, ageMonths),
    p15: interpolate(t.ages, t.p15, ageMonths),
    p50: interpolate(t.ages, t.p50, ageMonths),
    p85: interpolate(t.ages, t.p85, ageMonths),
    p97: interpolate(t.ages, t.p97, ageMonths)
  };
}

// A coarse, honest percentile band label — avoids implying false precision.
export function percentileBand(metric: GrowthMetric, ageMonths: number, value: number): string {
  const l = percentileLinesAtAge(metric, ageMonths);
  if (value < l.p3) return 'below the 3rd percentile';
  if (value < l.p15) return 'between the 3rd–15th percentile';
  if (value < l.p50) return 'between the 15th–50th percentile';
  if (value < l.p85) return 'around the 50th–85th percentile';
  if (value < l.p97) return 'between the 85th–97th percentile';
  return 'above the 97th percentile';
}

export function ageInMonths(birthDate: string, onDate: string): number {
  const b = new Date(`${birthDate}T00:00:00`);
  const o = new Date(`${onDate}T00:00:00`);
  if (Number.isNaN(b.getTime()) || Number.isNaN(o.getTime())) return 0;
  const months = (o.getFullYear() - b.getFullYear()) * 12 + (o.getMonth() - b.getMonth());
  const dayAdjust = o.getDate() >= b.getDate() ? 0 : -1;
  return Math.max(0, months + dayAdjust);
}

export function ageLabel(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m === 1 ? '' : 's'}`;
  if (m === 0) return `${y} year${y === 1 ? '' : 's'}`;
  return `${y}y ${m}m`;
}

export const GROWTH_REFERENCE_NOTE =
  'Reference bands are the WHO girls growth standard (approximate). Your pediatrician’s official chart is authoritative.';
