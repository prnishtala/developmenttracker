// Developmental milestone catalog (roughly CDC/WHO-aligned) for ~12–30 months,
// grouped by domain, with the age by which most children show each skill.
// Advisory and reassuring — not a screening tool. Red-flag notes point to when
// a pediatrician chat is worthwhile.

export type MilestoneDomain = 'gross_motor' | 'fine_motor' | 'language' | 'social' | 'cognitive';
export type MilestoneStatus = 'achieved' | 'emerging' | 'not_yet';

export type Milestone = { key: string; domain: MilestoneDomain; byMonths: number; text: string };

export const DOMAIN_LABELS: Record<MilestoneDomain, string> = {
  gross_motor: 'Gross motor',
  fine_motor: 'Fine motor',
  language: 'Language',
  social: 'Social & emotional',
  cognitive: 'Cognitive'
};

export const MILESTONES: Milestone[] = [
  // Gross motor
  { key: 'gm_stand_alone', domain: 'gross_motor', byMonths: 12, text: 'Stands alone for a moment' },
  { key: 'gm_walk', domain: 'gross_motor', byMonths: 15, text: 'Walks independently' },
  { key: 'gm_climb', domain: 'gross_motor', byMonths: 18, text: 'Climbs onto low furniture; walks up steps with help' },
  { key: 'gm_run', domain: 'gross_motor', byMonths: 18, text: 'Runs (a little stiffly)' },
  { key: 'gm_kick', domain: 'gross_motor', byMonths: 24, text: 'Kicks a ball' },
  { key: 'gm_stairs', domain: 'gross_motor', byMonths: 24, text: 'Walks up and down stairs holding on' },
  { key: 'gm_jump', domain: 'gross_motor', byMonths: 30, text: 'Jumps with both feet off the floor' },
  // Fine motor
  { key: 'fm_pincer', domain: 'fine_motor', byMonths: 12, text: 'Picks up small objects with thumb and finger' },
  { key: 'fm_stack2', domain: 'fine_motor', byMonths: 15, text: 'Stacks 2 blocks; scribbles' },
  { key: 'fm_spoon', domain: 'fine_motor', byMonths: 18, text: 'Uses a spoon; stacks 3–4 blocks' },
  { key: 'fm_pages', domain: 'fine_motor', byMonths: 24, text: 'Turns book pages; stacks 6 blocks' },
  { key: 'fm_lines', domain: 'fine_motor', byMonths: 30, text: 'Draws lines; turns knobs / unscrews lids' },
  // Language
  { key: 'lang_words', domain: 'language', byMonths: 15, text: 'Says a few single words; responds to name' },
  { key: 'lang_point', domain: 'language', byMonths: 18, text: 'Points to show you something; 10+ words' },
  { key: 'lang_bodypart', domain: 'language', byMonths: 18, text: 'Points to a body part when asked' },
  { key: 'lang_2word', domain: 'language', byMonths: 24, text: 'Puts 2 words together; follows a 2-step direction' },
  { key: 'lang_50words', domain: 'language', byMonths: 24, text: 'Uses ~50 words' },
  { key: 'lang_names', domain: 'language', byMonths: 30, text: 'Names things in a book; uses "I"/"you"' },
  // Social & emotional
  { key: 'soc_wave', domain: 'social', byMonths: 12, text: 'Waves bye-bye; plays peekaboo' },
  { key: 'soc_affection', domain: 'social', byMonths: 15, text: 'Shows affection; claps' },
  { key: 'soc_pretend', domain: 'social', byMonths: 18, text: 'Simple pretend (feeds a doll); points to share interest' },
  { key: 'soc_imitate', domain: 'social', byMonths: 24, text: 'Imitates others; plays alongside other children' },
  { key: 'soc_emotions', domain: 'social', byMonths: 30, text: 'Shows a range of emotions; more pretend play' },
  // Cognitive
  { key: 'cog_hidden', domain: 'cognitive', byMonths: 12, text: 'Looks for a hidden object' },
  { key: 'cog_directions', domain: 'cognitive', byMonths: 18, text: 'Follows a simple direction with a gesture' },
  { key: 'cog_explore', domain: 'cognitive', byMonths: 18, text: 'Explores objects in different ways (shakes, bangs, throws)' },
  { key: 'cog_sort', domain: 'cognitive', byMonths: 24, text: 'Sorts shapes/colours; completes a simple puzzle' },
  { key: 'cog_match', domain: 'cognitive', byMonths: 30, text: 'Matches objects; solves simple problems' }
];

export const RED_FLAGS: Record<MilestoneDomain, string> = {
  gross_motor: 'Mention to your pediatrician if she is not walking by 18 months, or loses a skill she had.',
  fine_motor: 'Mention if she is not using her hands together or picking up small objects by 18 months.',
  language: 'Mention if there are no words by 18 months, no 2-word phrases by 24 months, or she loses words.',
  social: 'Mention if she does not point to show you things or share interest by 18 months, or withdraws.',
  cognitive: 'Mention if she cannot follow a simple instruction by 24 months or do simple pretend play.'
};

// Weak-area suggestions drawn from the development activities already in the app.
export const DOMAIN_ACTIVITY_SUGGESTIONS: Record<MilestoneDomain, string[]> = {
  gross_motor: ['Squat-and-drop tidy', 'Step up, step down', 'Cushion mountain climb', 'Ball kick and chase'],
  fine_motor: ['Stack-and-topple towers', 'Post the lids', 'Spoon transfer', 'Clothespin clip'],
  language: ['Read board books', 'Chatter stretchers', 'Name it in the kitchen', 'Help me fetch game'],
  social: ['Pretend care play', 'Independent play', 'Clean-up sorting'],
  cognitive: ['Which cup hides it?', 'Lid-and-container match', 'Treasure dig']
};

export const DOMAINS: MilestoneDomain[] = ['gross_motor', 'fine_motor', 'language', 'social', 'cognitive'];

export type DomainAssessment = {
  domain: MilestoneDomain;
  status: 'on_track' | 'emerging' | 'watch';
  dueTotal: number;
  achieved: number;
  overdueNotYet: number;
};

// Assess a domain from the child's status records and current age. "Due" means
// the typical age has arrived. A due milestone still "not yet" flags a watch.
export function assessDomain(
  domain: MilestoneDomain,
  statusByKey: Map<string, MilestoneStatus>,
  ageMonths: number
): DomainAssessment {
  const due = MILESTONES.filter((m) => m.domain === domain && m.byMonths <= ageMonths);
  let achieved = 0;
  let overdueNotYet = 0;
  for (const m of due) {
    const status = statusByKey.get(m.key) ?? 'not_yet';
    if (status === 'achieved') achieved += 1;
    else if (status === 'not_yet' && m.byMonths <= ageMonths) overdueNotYet += 1;
  }
  const emergingCount = due.filter((m) => (statusByKey.get(m.key) ?? 'not_yet') === 'emerging').length;
  let status: DomainAssessment['status'] = 'on_track';
  if (overdueNotYet > 0) status = 'watch';
  else if (emergingCount > 0) status = 'emerging';
  return { domain, status, dueTotal: due.length, achieved, overdueNotYet };
}
