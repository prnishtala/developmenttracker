import { Category, PersonKey, View } from './types';

interface CategoryMeta {
  label: string;
  /** Accent color (works on the dark app background). */
  color: string;
  emoji: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  sleep: { label: 'Sleep', color: '#6366f1', emoji: '😴' },
  wake: { label: 'Wake', color: '#f59e0b', emoji: '☀️' },
  work: { label: 'Work', color: '#38bdf8', emoji: '💻' },
  commute: { label: 'Commute', color: '#94a3b8', emoji: '🚆' },
  childcare: { label: 'Ahana', color: '#f472b6', emoji: '🧒' },
  meal: { label: 'Meal', color: '#fb923c', emoji: '🍽️' },
  batch_cook: { label: 'Batch cook', color: '#f97316', emoji: '🍲' },
  medication: { label: 'Medication', color: '#ef4444', emoji: '💊' },
  fitness: { label: 'Fitness', color: '#22c55e', emoji: '🏋️' },
  chore: { label: 'Chore', color: '#a78bfa', emoji: '🧺' },
  errand: { label: 'Errand', color: '#c084fc', emoji: '🛒' },
  review: { label: 'Review', color: '#eab308', emoji: '📋' },
  ritual: { label: 'Ritual', color: '#818cf8', emoji: '🌙' },
  outdoor: { label: 'Outdoors', color: '#34d399', emoji: '🌳' },
  personal: { label: 'Personal', color: '#2dd4bf', emoji: '🧘' },
  reference: { label: 'Reference', color: '#64748b', emoji: '📖' }
};

export function categoryMeta(category: Category): CategoryMeta {
  return CATEGORY_META[category] ?? CATEGORY_META.personal;
}

export const PERSON_LABEL: Record<PersonKey, string> = {
  prakash: 'Prakash',
  shraddha: 'Shraddha',
  ahana: 'Ahana',
  shared: 'Together'
};

/**
 * Which owners appear in each view.
 *  - prakash / shraddha: that person's own blocks + shared (joint) blocks.
 *  - family: the joint blocks — shared + everything for/with Ahana.
 */
export function ownersForView(view: View): PersonKey[] {
  switch (view) {
    case 'prakash':
      return ['prakash', 'shared'];
    case 'shraddha':
      return ['shraddha', 'shared'];
    case 'family':
      return ['shared', 'ahana'];
  }
}

export function isInView(owner: PersonKey, view: View): boolean {
  return ownersForView(view).includes(owner);
}
