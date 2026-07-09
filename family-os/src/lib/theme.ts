// Shared visual tokens. Dark, calm, high-contrast — a glanceable timeline.
export const theme = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#243449',
  border: '#334155',
  text: '#f1f5f9',
  textDim: '#94a3b8',
  textFaint: '#64748b',
  accent: '#38bdf8',
  done: '#22c55e',
  radius: 16,
  space: (n: number) => n * 4
};

export type Theme = typeof theme;
