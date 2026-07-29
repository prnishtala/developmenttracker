// Helpers for making repeated day-recaps additive instead of destructive.
// A day may be recapped several times (nanny at nap time, nanny before leaving,
// parents at night). Re-mentioned items should merge/dedupe, not overwrite or
// duplicate. Shared by the client (optimistic UI) and the API routes (persist).

import { QUANTITY_OPTIONS } from '@/lib/constants';

// Split a free-text meal note into comparable fragments (split on commas and
// newlines), trimmed and non-empty.
function noteFragments(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// Union of existing + incoming note fragments, preserving order and dropping
// case-insensitive duplicates. Keeps meals additive across recaps while a food
// mentioned twice only appears once.
export function mergeMealNotes(existing: string | null | undefined, incoming: string | null | undefined): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const fragment of [...noteFragments(existing), ...noteFragments(incoming)]) {
    const key = fragment.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fragment);
  }
  return out.join(', ');
}

// Pick the more substantial of two quantities (Low < Normal < High).
export function higherQuantity(a: string | null | undefined, b: string | null | undefined): string {
  const rank = (value: string | null | undefined) => {
    const index = QUANTITY_OPTIONS.indexOf((value ?? '') as (typeof QUANTITY_OPTIONS)[number]);
    return index === -1 ? 1 : index; // default to Normal's rank when unknown
  };
  return rank(a) >= rank(b) ? (a ?? 'Normal') : (b ?? 'Normal');
}

// Append fragments to a day-note, skipping lines already present
// (case-insensitive) so repeated recaps don't stack duplicate observations.
export function mergeDayNote(existing: string, incoming: string): string {
  const existingLines = existing
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const seen = new Set(existingLines.map((line) => line.toLowerCase()));
  const out = [...existingLines];
  for (const line of incoming.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join('\n');
}
