import { Routine } from '@/lib/types';

const TZ = 'America/Chicago';
const WEEKDAYS = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
const DAILY = 'FREQ=DAILY';

// Small factory so every routine gets the timezone and a null-default notify.
const R = (o: Omit<Routine, 'timezone'> & { timezone?: string }): Routine => ({
  notify: null,
  timezone: TZ,
  ...o
});

// ---------------------------------------------------------------------------
// Prakash — weekday day structure
// ---------------------------------------------------------------------------
const prakash: Routine[] = [
  R({
    id: 'pk-wake',
    owner: 'prakash',
    category: 'wake',
    title: 'Wake, get ready, log on',
    terseLine: 'Wake, get ready, log on',
    startLocal: '06:45',
    endLocal: '07:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: {
      summary:
        'End-state wake time — pairs with the 11:30–11:45 PM bedtime target for ~7 hours.',
      sections: [
        {
          steps: [
            'If you’re still on the bedtime ramp (lights-out not reliably before 12:30 AM yet), wake stays 7:00 AM until the ramp is done — don’t force an earlier wake before the sleep debt is repaid.'
          ]
        },
        {
          heading: 'Monday',
          steps: [
            'Check whether this is your laundry week (see the marker) — if so, start a load before you sit down to work.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'pk-wfh',
    owner: 'prakash',
    category: 'work',
    title: 'WFH work block',
    terseLine: 'WFH work block',
    startLocal: '07:00',
    endLocal: '10:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: {
      summary: 'Deep work / meetings from home.',
      sections: [
        {
          steps: [
            'Default: Shraddha owns the 8:00–9:00 AM Ahana block while you work straight through.',
            'Two mornings a week (decided fresh at the Sunday Weekly Reset, not fixed days): shift this block to start at 8:00 AM and take the 8–9 Ahana block yourself. Check this week’s decision before assuming.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'pk-commute-in',
    owner: 'prakash',
    category: 'commute',
    title: 'Commute to office',
    terseLine: 'Commute to office',
    startLocal: '10:00',
    endLocal: '10:35',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: { sections: [{ steps: ['~35 min by train + walking, or ~30 min by car.'] }] }
  }),
  R({
    id: 'pk-office',
    owner: 'prakash',
    category: 'work',
    title: 'Office work block',
    terseLine: 'Office work block',
    startLocal: '10:35',
    endLocal: '17:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: {
      summary: 'Continuous block — eat whenever fits naturally (no fixed lunch anchor for you).',
      sections: [
        {
          heading: 'Put on your WORK calendar, inside this window',
          steps: [
            'Two 45-min learning blocks per week (AI-tooling fluency, promotion evidence).',
            'The quarterly promotion-arc work (one real problem solved with AI tooling end-to-end).'
          ]
        }
      ]
    }
  }),
  R({
    id: 'pk-commute-home',
    owner: 'prakash',
    category: 'commute',
    title: 'Commute home',
    terseLine: 'Commute home',
    startLocal: '17:00',
    endLocal: '18:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: { sections: [{ steps: ['Commute + buffer — typically arriving ~6:00 PM.'] }] }
  }),
  R({
    id: 'pk-wrapup',
    owner: 'prakash',
    category: 'personal',
    title: 'Wrap up / transition',
    terseLine: 'Dinner cleanup / transition',
    startLocal: '19:30',
    endLocal: '20:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [
        { steps: ['Dishes after dinner (your standing task). Brief buffer before the evening walk.'] }
      ]
    }
  }),
  R({
    id: 'pk-gym',
    owner: 'prakash',
    category: 'fitness',
    title: 'Strength — apartment gym (empty hours)',
    terseLine: 'Strength — apartment gym',
    startLocal: '21:30',
    endLocal: '22:00',
    rrule: 'FREQ=WEEKLY;BYDAY=TU,TH',
    anchorDate: '2026-07-07',
    notify: { minutesBefore: 0 },
    gatingNote: 'Only once the bedtime ramp is reliably ≤ 12:30 AM — until then this slot is quiet time, not the gym.',
    runbook: {
      summary: '30-min routine when the apartment gym is empty.',
      sections: [
        {
          heading: 'Routine',
          steps: [
            'Goblet squats or leg press (moderate depth — knee history) 3×10',
            'Rows 3×10',
            'Incline push-ups or chest press (skip overhead pressing early — clavicle history) 3×10',
            'Carries or planks, 3 rounds'
          ]
        }
      ],
      gating: 'GATE: only once the bedtime ramp is reliably ≤ 12:30 AM.',
      notes: [
        'HARD RULES: never start later than 9:45. Out by 10:15. This replaces screen time, never sleep.'
      ]
    }
  }),
  R({
    id: 'pk-own-evening',
    owner: 'prakash',
    category: 'personal',
    title: 'Own evening',
    terseLine: 'Own evening (hobbies, reading — no doomscroll)',
    startLocal: '21:45',
    endLocal: '22:45',
    rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR,SA,SU',
    anchorDate: '2026-07-06',
    runbook: {
      sections: [
        {
          steps: [
            'Free time — hobbies, reading, whatever isn’t a screen-doomscroll. This is the time the shutdown ritual protects from turning into more work.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'pk-own-evening-gym',
    owner: 'prakash',
    category: 'personal',
    title: 'Own evening (shorter — gym night)',
    terseLine: 'Own evening (shorter — gym night)',
    startLocal: '22:00',
    endLocal: '22:45',
    rrule: 'FREQ=WEEKLY;BYDAY=TU,TH',
    anchorDate: '2026-07-07',
    runbook: {
      sections: [
        { steps: ['Shorter free-time window after the gym — not a reason to push the shutdown later.'] }
      ]
    }
  }),
  R({
    id: 'pk-shutdown',
    owner: 'prakash',
    category: 'ritual',
    title: 'Shutdown ritual',
    terseLine: 'Shutdown ritual',
    startLocal: '22:45',
    endLocal: '23:00',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'Same order every night — the intervention for late-night “just one more thing”.',
      sections: [
        {
          ordered: true,
          steps: [
            'Write tomorrow’s ONE most important task — on paper.',
            'Close every work tab/app; laptop shut and out of reach.',
            'Phone charges outside the bedroom.',
            'Wifi cuts automatically 30 min from now (router schedule).'
          ]
        }
      ]
    }
  }),
  R({
    id: 'pk-winddown',
    owner: 'prakash',
    category: 'ritual',
    title: 'Wind down',
    terseLine: 'Wind down — lights dimming, no screens',
    startLocal: '23:00',
    endLocal: '23:30',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [{ steps: ['Lights dimming, no new tasks, no screens — the buffer before lights-out.'] }]
    }
  }),
  R({
    id: 'pk-bedtime',
    owner: 'prakash',
    category: 'sleep',
    title: 'Bedtime — lights out',
    terseLine: 'Bedtime — lights out',
    startLocal: '23:30',
    endLocal: '23:45',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'End-state target 11:30–11:45 PM. The ramp helper below shows tonight’s target.',
      sections: [
        {
          steps: [
            'Ramping from a late start: shift 15 min earlier every 3–4 nights; wake stays 7:00 AM throughout the ramp.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'pk-sleep',
    owner: 'prakash',
    category: 'sleep',
    title: 'Sleep',
    terseLine: 'Sleep (~7 hours — protect it)',
    startLocal: '23:45',
    endLocal: '06:45',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [
        { steps: ['~7 hours target. Protect this over everything else on a bad day.'] }
      ]
    }
  })
];

// ---------------------------------------------------------------------------
// Shraddha — weekday day structure
// ---------------------------------------------------------------------------
const shraddha: Routine[] = [
  R({
    id: 'sh-wake',
    owner: 'shraddha',
    category: 'wake',
    title: 'Wake — gym clothes on',
    terseLine: 'Wake — gym clothes on',
    startLocal: '06:50',
    endLocal: '07:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: {
      summary: '~6:50 wake — only 10 min earlier than before the gym slot existed.',
      sections: [
        {
          steps: [
            'Guard: this must pair with lights out by ~11:45 PM or the earlier wake quietly shaves sleep below 7 hours.',
            'Monday: check whether this is your laundry week (see the marker).'
          ]
        }
      ]
    }
  }),
  R({
    id: 'sh-gym',
    owner: 'shraddha',
    category: 'fitness',
    title: 'Gym — apartment, before Ahana wakes',
    terseLine: 'Gym — apartment (back-safe)',
    startLocal: '07:00',
    endLocal: '07:30',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'Back-safe program — swap or skip anything that aggravates your back. 20–30 min. Month-one goal is showing up, not intensity.',
      sections: [
        {
          ordered: true,
          steps: [
            '5 min brisk walk warm-up',
            '2 rounds: 10 glute bridges, 8 bird-dogs per side, 10 bodyweight hip hinges (light dumbbells if you have them)',
            '5 min walk or gentle stretch to close'
          ]
        }
      ],
      notes: [
        'Nothing spine-flexing (no sit-ups/crunches) until PT clears it. Finish showered before Ahana wakes at 8:00.'
      ]
    }
  }),
  R({
    id: 'sh-shower',
    owner: 'shraddha',
    category: 'personal',
    title: 'Shower, get ready',
    terseLine: 'Shower, get ready',
    startLocal: '07:30',
    endLocal: '08:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: { sections: [{ steps: ['Done and ready before the 8:00 handoff point.'] }] }
  }),
  R({
    id: 'sh-ahana-morning',
    owner: 'shraddha',
    category: 'childcare',
    title: 'Ahana block / handoff to nanny at 9',
    terseLine: 'Ahana block → nanny at 9',
    startLocal: '08:00',
    endLocal: '09:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    swap: 'morning_ahana',
    runbook: {
      summary: 'Default owner of this block — feed and dress her, breakfast + one book. Nanny arrives 9:00 for handoff.',
      sections: [
        {
          steps: [
            'Two mornings a week (decided at the Sunday reset, not fixed days) Prakash takes this instead and you start work at 8:00 — check this week’s decision rather than assuming it’s always you.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'sh-work',
    owner: 'shraddha',
    category: 'work',
    title: 'Work block',
    terseLine: 'Work block (starts 9:00 sharp)',
    startLocal: '09:00',
    endLocal: '12:15',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: { sections: [{ steps: ['Starts 9:00 AM sharp.'] }] }
  }),
  R({
    id: 'sh-lunch-pill',
    owner: 'shraddha',
    category: 'medication',
    title: 'Lunch + midday BP pill',
    terseLine: 'Lunch + midday BP pill (non-negotiable)',
    startLocal: '12:15',
    endLocal: '12:35',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    notify: { minutesBefore: 0 },
    runbook: {
      summary:
        'A meal, not a break — desk is fine on brutal days, but the pill goes with the food. Take the midday BP pill from the kitchen-table organizer WITH the food — non-negotiable.',
      sections: [
        {
          heading: 'This week’s bowl (alternates A/B week to week)',
          steps: [
            'Bowl A: 1 cup rice + ¾ cup dal + ½ cup roasted vegetable + 2 tbsp yogurt + a spoon of pickle. Microwave rice+dal 90 sec, plate, add the rest cold. 3 minutes.',
            'Bowl B: 1 cup cooked quinoa + ¾ cup roasted chickpeas + ½ cup roasted vegetable + 2 tbsp yogurt + pickle.',
            'Friday: flex/leftovers — eat whatever’s left, or toast + peanut butter, or 2 fried eggs + toast. No decision, no cooking.'
          ]
        }
      ],
      minViable: 'Day exploded? Minimum = any food + pill by 1:00 PM. NEVER skip the pill.'
    }
  }),
  R({
    id: 'sh-work-cont',
    owner: 'shraddha',
    category: 'work',
    title: 'Work block (continued)',
    terseLine: 'Work block (continued)',
    startLocal: '12:35',
    endLocal: '18:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [
        {
          steps: [
            'Runs to — and pauses for — the 6:00 PM family block.',
            'Wednesdays: ends 15 min earlier (5:45) — the batch cook starts then.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'sh-bp-evening',
    owner: 'shraddha',
    category: 'medication',
    title: 'BP evening dose — with dinner',
    terseLine: 'BP evening dose — with dinner',
    startLocal: '18:45',
    endLocal: '18:55',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    notify: { minutesBefore: 0 },
    runbook: {
      sections: [
        { steps: ['With or right after dinner (~6:45). If dinner’s late or skipped, take with any food rather than waiting.'] }
      ]
    }
  }),
  R({
    id: 'sh-hardstop',
    owner: 'shraddha',
    category: 'ritual',
    title: 'Work hard stop',
    terseLine: 'Work hard stop — laptop closes',
    startLocal: '20:45',
    endLocal: '21:00',
    rrule: WEEKDAYS,
    anchorDate: '2026-07-06',
    notify: { minutesBefore: 0 },
    runbook: {
      sections: [
        {
          ordered: true,
          steps: [
            'Note tomorrow’s first task (30 sec).',
            'Close laptop, notifications off until morning.',
            'Anything “urgent” after this goes on tomorrow’s list.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'sh-own-evening',
    owner: 'shraddha',
    category: 'personal',
    title: 'Own evening',
    terseLine: 'Own evening (phone-away last 20 min)',
    startLocal: '21:45',
    endLocal: '23:45',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [
        { steps: ['Free time. Phone-away and lights-dimming in the last 20 minutes still helps.'] }
      ]
    }
  }),
  R({
    id: 'sh-bedtime',
    owner: 'shraddha',
    category: 'sleep',
    title: 'Bedtime — lights out',
    terseLine: 'Bedtime — lights out (~11:45)',
    startLocal: '23:45',
    endLocal: '23:55',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [
        { steps: ['Target ~11:45 PM — the guard that keeps the 6:50 AM wake from cutting into your 7 hours.'] }
      ]
    }
  }),
  R({
    id: 'sh-sleep',
    owner: 'shraddha',
    category: 'sleep',
    title: 'Sleep',
    terseLine: 'Sleep (~7 hours)',
    startLocal: '23:55',
    endLocal: '06:50',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [{ steps: ['~7 hours. The risk here is creep from work — that’s what the hard stop protects.'] }]
    }
  }),
  R({
    id: 'sh-bp-weekend',
    owner: 'shraddha',
    category: 'medication',
    title: 'BP midday dose — weekend',
    terseLine: 'BP midday dose — weekend',
    startLocal: '12:30',
    endLocal: '12:40',
    rrule: 'FREQ=WEEKLY;BYDAY=SA,SU',
    anchorDate: '2026-07-11',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'The weekday lunch block doesn’t run weekends, so this event IS the weekend cue.',
      sections: [{ steps: ['Take with lunch or any food by 1:00 PM.'] }]
    }
  })
];

// ---------------------------------------------------------------------------
// Shared / family / Ahana
// ---------------------------------------------------------------------------
const shared: Routine[] = [
  R({
    id: 'fam-walk',
    owner: 'shared',
    category: 'outdoor',
    title: 'Evening outdoors — walk / park',
    terseLine: 'Evening walk / park (summer)',
    startLocal: '20:00',
    endLocal: '20:45',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    runbook: {
      summary: 'The day’s outdoor time, post-heat. Family walk / playground — also Ahana’s gross-motor slot.',
      sections: [
        {
          steps: [
            'Tue/Fri: trash + recycling go out around now too (~10 min) — swing it out on the way rather than a second errand.',
            'Seasonal: in cooler months (~Oct–May) this can shift to daytime — edit once when the weather turns.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'fam-washup',
    owner: 'shared',
    category: 'ritual',
    title: 'Wash up / settle in',
    terseLine: 'Wash up / settle in',
    startLocal: '20:45',
    endLocal: '21:00',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    runbook: {
      sections: [{ steps: ['Quick buffer between the walk and Ahana’s wind-down — hands washed, pajamas started.'] }]
    }
  }),
  R({
    id: 'ahana-winddown',
    owner: 'ahana',
    category: 'childcare',
    title: 'Ahana wind-down + books',
    terseLine: 'Ahana wind-down + books',
    startLocal: '21:00',
    endLocal: '21:45',
    rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR,SA,SU',
    anchorDate: '2026-07-06',
    runbook: {
      summary: 'Same sequence every night — the sequence is the intervention. Lights low from the start, no screens.',
      sections: [
        {
          ordered: true,
          steps: [
            'Bath or wipe-down',
            'Pajamas',
            'Two books — her choice (rereads count)',
            'Song',
            'Crib, goodnight, leave'
          ]
        }
      ],
      notes: ['Tue/Thu have a shorter, split version — see the gym-night block.']
    }
  }),
  R({
    id: 'ahana-winddown-gym',
    owner: 'ahana',
    category: 'childcare',
    title: 'Ahana wind-down (gym night — split)',
    terseLine: 'Ahana wind-down (gym night)',
    startLocal: '21:00',
    endLocal: '21:30',
    rrule: 'FREQ=WEEKLY;BYDAY=TU,TH',
    anchorDate: '2026-07-07',
    runbook: {
      summary: 'Prakash does the first half (bath, pajamas, one book), then hands to Shraddha at 9:30 so he can get to the empty gym.',
      sections: [{ steps: ['Shraddha solo-finishes the routine on these two nights — that’s the deal, not a gap.'] }]
    }
  }),
  // ---- Weekend ----
  R({
    id: 'sat-morning',
    owner: 'shared',
    category: 'personal',
    title: 'Saturday morning — flexible',
    terseLine: 'Saturday morning — flexible',
    startLocal: '07:00',
    endLocal: '09:30',
    rrule: 'FREQ=WEEKLY;BYDAY=SA',
    anchorDate: '2026-07-11',
    runbook: {
      sections: [
        { steps: ['No fixed wake time, but avoid sleeping past ~8:30 — it protects the bedtime ramp. Otherwise open: errands, slow morning.'] }
      ]
    }
  }),
  R({
    id: 'ahana-sat-anchor',
    owner: 'ahana',
    category: 'childcare',
    title: 'Ahana’s Saturday anchor',
    terseLine: 'Ahana’s Saturday anchor (standing tradition)',
    startLocal: '09:30',
    endLocal: '11:00',
    rrule: 'FREQ=WEEKLY;BYDAY=SA',
    anchorDate: '2026-07-11',
    runbook: {
      summary: 'The standing weekly tradition — same thing every week (library story time / zoo or farm / park walk). Repetition is the point, not novelty.',
      sections: [
        { steps: ['Summer: use the indoor anchor (library) or shift outdoor ones to the evening slot — a 9:30 AM summer park run contradicts the family heat rule.', 'Pick one and rename this block once.'] }
      ]
    }
  }),
  R({
    id: 'sat-late-morning',
    owner: 'shared',
    category: 'personal',
    title: 'Saturday late morning — open',
    terseLine: 'Late morning — open',
    startLocal: '11:00',
    endLocal: '12:00',
    rrule: 'FREQ=WEEKLY;BYDAY=SA',
    anchorDate: '2026-07-11',
    runbook: { sections: [{ steps: ['Open hour between the Saturday anchor and the midday slot.'] }] }
  }),
  R({
    id: 'review-money-monthly',
    owner: 'shared',
    category: 'review',
    title: 'Monthly Money Review (1st Saturday)',
    terseLine: 'Monthly Money Review',
    startLocal: '12:00',
    endLocal: '12:30',
    rrule: 'FREQ=MONTHLY;BYDAY=1SA',
    anchorDate: '2026-08-01',
    notify: { minutesBefore: 10 },
    runbook: {
      summary: '30 min, both of you, nap window. Reconciliation, not strategy.',
      sections: [
        {
          ordered: true,
          steps: [
            'Reconcile accounts against last month.',
            'Confirm every autopay actually fired.',
            'Check savings rate vs. target.',
            'Review any open money decisions carried from last month.',
            'Log outcome (date, savings rate, decisions, anything deferred + a date).'
          ]
        }
      ]
    }
  }),
  R({
    id: 'review-quarterly',
    owner: 'shared',
    category: 'review',
    title: 'Quarterly Finance + Career Review',
    terseLine: 'Quarterly Finance + Career Review',
    startLocal: '12:00',
    endLocal: '13:30',
    rrule: 'FREQ=MONTHLY;BYMONTH=4,7,10;BYDAY=2SA',
    anchorDate: '2026-07-11',
    notify: { minutesBefore: 10 },
    runbook: {
      summary: '90 min, both of you, nap window. Apr/Jul/Oct only — January is the Annual Review instead.',
      sections: [
        {
          ordered: true,
          steps: [
            'Portfolio review — allocation drift vs. target, rebalance if outside bands.',
            'Review India-side accounts; note any PFIC/FBAR/FATCA questions for the CPA.',
            'Tax-loss/gain considerations. Insurance check-in.',
            'Home-buying gates check (life stability / financial readiness / market context / house criteria) — still “not yet” until all four pass, no re-litigating.',
            'Promotion-arc checkpoint for both — is each quarter’s artifact on track, are the two peak quarters staggered.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'review-learning-share',
    owner: 'shared',
    category: 'review',
    title: 'Monthly Learning Share (3rd Saturday)',
    terseLine: 'Monthly Learning Share',
    startLocal: '12:00',
    endLocal: '13:00',
    rrule: 'FREQ=MONTHLY;BYDAY=3SA',
    anchorDate: '2026-07-18',
    notify: { minutesBefore: 10 },
    runbook: {
      summary: '1 hour, nap window, both of you. Doubles as marriage maintenance — a conversation that isn’t logistics.',
      sections: [
        { steps: ['Each shares the most useful thing you learned that month (from the weekly learning blocks or the quarterly AI-tooling project). No prep needed beyond having paid attention.'] }
      ]
    }
  }),
  R({
    id: 'sat-afternoon',
    owner: 'shared',
    category: 'personal',
    title: 'Saturday afternoon — open',
    terseLine: 'Saturday afternoon — open',
    startLocal: '13:30',
    endLocal: '18:00',
    rrule: 'FREQ=WEEKLY;BYDAY=SA',
    anchorDate: '2026-07-11',
    runbook: { sections: [{ steps: ['Unstructured, deliberately — family time, errands, rest.'] }] }
  }),
  R({
    id: 'sat-evening',
    owner: 'shared',
    category: 'meal',
    title: 'Saturday evening — open (dinner is the release valve)',
    terseLine: 'Saturday evening — cook new together / order in',
    startLocal: '18:00',
    endLocal: '20:00',
    rrule: 'FREQ=WEEKLY;BYDAY=SA',
    anchorDate: '2026-07-11',
    runbook: {
      summary: 'Dinner is the deliberate release valve — cook something new together, or order in. No rotation here on purpose.',
      sections: [{ steps: ['Evening is unstructured until the daily rhythm (outdoor walk) picks up at 8:00 PM.'] }]
    }
  }),
  R({
    id: 'sun-morning',
    owner: 'shared',
    category: 'personal',
    title: 'Sunday morning — open (Costco weeks: errands)',
    terseLine: 'Sunday morning — open',
    startLocal: '07:00',
    endLocal: '10:00',
    rrule: 'FREQ=WEEKLY;BYDAY=SU',
    anchorDate: '2026-07-12',
    runbook: { sections: [{ steps: ['Open until the (biweekly) Costco run at 10:00 on weeks it falls.'] }] }
  }),
  R({
    id: 'costco',
    owner: 'prakash',
    category: 'errand',
    title: 'Costco run (biweekly)',
    terseLine: 'Costco run (bulk list)',
    startLocal: '10:00',
    endLocal: '11:30',
    rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=SU',
    anchorDate: '2026-07-12',
    notify: { minutesBefore: 10 },
    runbook: {
      summary: 'Bulk, shelf-stable, freezer. Starting quantities — adjust after a couple of trips based on what actually runs out. The list is the list; impulse items wait for the next trip.',
      sections: [
        {
          heading: 'Bulk list',
          steps: [
            'Rice: one 20 lb bag',
            'Lentils: 4 lb toor dal, 2 lb chana dal, 2 lb moong dal, 2 lb masoor dal',
            'Quinoa: 3 lb bag',
            'Frozen mixed vegetables: 2 large bags',
            'Tofu: 2 blocks (14 oz each)',
            'Greek yogurt: 2 large tubs (32 oz)',
            'Paneer: 2 lb',
            'Nuts/seeds: 1 mixed bag (almonds, walnuts, chia, flax)',
            'Oil: 1 bottle olive, 1 bottle avocado',
            'Plant protein powder: 1 tub. Oats: 1 large canister'
          ]
        }
      ],
      notes: ['Check Ahana’s diaper/wipe Subscribe & Save here too if it hasn’t auto-triggered.']
    }
  }),
  R({
    id: 'sun-midday',
    owner: 'shared',
    category: 'personal',
    title: 'Sunday midday — open',
    terseLine: 'Sunday midday — open',
    startLocal: '11:30',
    endLocal: '15:45',
    rrule: 'FREQ=WEEKLY;BYDAY=SU',
    anchorDate: '2026-07-12',
    runbook: { sections: [{ steps: ['Open block. Non-Costco weeks this starts at 10:00 instead.'] }] }
  }),
  R({
    id: 'robot-vacuum-maint',
    owner: 'prakash',
    category: 'chore',
    title: 'Robot vacuum maintenance',
    terseLine: 'Robot vacuum — empty bin, rinse pads',
    startLocal: '15:45',
    endLocal: '16:00',
    rrule: 'FREQ=WEEKLY;BYDAY=SU',
    anchorDate: '2026-07-12',
    runbook: {
      sections: [{ steps: ['Empty the bin, rinse/replace mop pads — right before the batch cook, same trip to the kitchen.'] }]
    }
  }),
  R({
    id: 'reset-weekly',
    owner: 'shared',
    category: 'review',
    title: 'Weekly Reset',
    terseLine: 'Weekly Reset (15 min, both of you)',
    startLocal: '17:30',
    endLocal: '17:45',
    rrule: 'FREQ=WEEKLY;BYDAY=SU',
    anchorDate: '2026-07-12',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: '15 min, both of you, hard stop. The checkpoint that catches drift within seven days.',
      sections: [
        {
          ordered: true,
          steps: [
            'Refill the 7-day AM/PM pill organizer (the non-negotiable item).',
            'Any outlier this week — travel, crunch, sick day? How did it go?',
            'Did a standing task drop? One-off, or wrong owner?',
            'Scan both work calendars for next week — travel/crunch coming?',
            'Decide who owns Wednesday’s refresh this week.',
            'Decide which 2 mornings Prakash takes the 8–9 AM block.',
            'Empty the capture inbox.'
          ]
        }
      ],
      notes: ['Set this week’s two decisions on the Reset tab so the timelines update. If it takes more than 15 minutes, it’s doing monthly work — stop and defer.']
    }
  }),
  R({
    id: 'sun-evening',
    owner: 'shared',
    category: 'meal',
    title: 'Sunday evening — home day — Simple Khichdi',
    terseLine: 'Sunday home day · Simple Khichdi',
    startLocal: '17:45',
    endLocal: '20:00',
    rrule: 'FREQ=WEEKLY;BYDAY=SU',
    anchorDate: '2026-07-12',
    runbook: {
      summary: 'Deliberately unstructured — the anti-overscheduling day. Energy goes into the batch cook, not a fancy dinner.',
      sections: [
        {
          heading: 'Dinner (fixed, no rotation): Simple Khichdi',
          steps: [
            '1 cup rice + ½ cup moong dal, 4 cups water, ½ tsp turmeric, salt. Rice cooker, or Instant Pot Manual 8 min. Serve with toast or plain, whichever’s faster.',
            'Ahana: her portion aside before any chili.'
          ]
        }
      ],
      notes: ['Then the daily evening rhythm (walk, wind-down, shutdown, bedtime) picks up as usual at 8:00 PM.']
    }
  })
];

// ---------------------------------------------------------------------------
// Sunday batch cook — the end-to-end execution card (Prakash owns it)
// ---------------------------------------------------------------------------
const batchCookSunday: Routine = R({
  id: 'sun-batch-cook',
  owner: 'prakash',
  category: 'batch_cook',
  title: 'Sunday Batch Cook — you own this end-to-end',
  terseLine: 'Sunday Batch Cook (groceries → containers)',
  startLocal: '16:00',
  endLocal: '17:30',
  rrule: 'FREQ=WEEKLY;BYDAY=SU',
  anchorDate: '2026-07-12',
  notify: { minutesBefore: 10 },
  runbook: {
    summary:
      'Groceries-to-containers, not “helping.” Zero decisions, quantities inline. The SEQUENCE is the invariant, not the clock — things finish when they finish.',
    sections: [
      {
        heading: 'Fire all three (first 10 min, any order)',
        ordered: true,
        steps: [
          'Instant Pot: 1 cup toor dal (rinsed) + 3 cups water + ½ tsp turmeric + ½ tsp salt → Manual 10 min, natural release. (Sambar week: ¾ cup dal + 3 cups water + 2 cups chopped veg, Manual 8 min.)',
          'Rice cooker: 3 cups rice, rinsed; water to the cooker’s own 3-cup line. Start.',
          'Air fryer: 14 oz tofu (2 tbsp yogurt + 1 tbsp ginger-garlic + 1 tsp chili + ½ tsp turmeric + 1 tsp garam masala + ¾ tsp salt + 1 tbsp oil → 400°F, 12 min, shake at 6) OR a vegetable tray (1 tbsp oil + salt → 400°F, ~15 min).'
        ]
      },
      {
        heading: 'While things cook (hands busy, nothing to decide)',
        ordered: true,
        steps: [
          'Chop into 3 labeled containers: 3 onions, 4 tomatoes, ginger-garlic for the week.',
          'Wash + stage Ahana’s fruit for the week.',
          'Confirm this week’s Mon/Tue dinners against the calendar; add anything missing to the HEB list.'
        ]
      },
      {
        heading: 'When the Instant Pot releases',
        ordered: true,
        steps: [
          'Tempering: 2 tbsp ghee → 1 tsp cumin (sizzle) → 4 cloves minced garlic + 1 chopped onion (golden) → 2 chopped tomatoes + ½ tsp chili powder + ½ tsp salt (soft) → pour into dal, mash lightly, simmer 5 min.',
          'AHANA FIRST: pull her portions from every pot BEFORE the tempering/final salt goes in. Small labeled containers.'
        ]
      },
      {
        heading: 'Assemble + close',
        ordered: true,
        steps: [
          '8 lunch bowls: rice + dal (or chickpeas) + roasted veg/tofu. Yogurt + pickle added day-of.',
          'Label leftovers with day tags. Wipe counters.',
          'Empty robot-vacuum bin + rinse mop pads (already its own line right before this).'
        ]
      }
    ],
    minViable: 'Bad week? Minimum viable = steps 1, 2, the Ahana pull, and the 8 lunch bowls. Everything else skippable without guilt.'
  }
});

// ---------------------------------------------------------------------------
// PDF-derived extras the personal calendars omit
// ---------------------------------------------------------------------------
const extras: Routine[] = [
  R({
    id: 'trash',
    owner: 'prakash',
    category: 'chore',
    title: 'Trash & recycling out',
    terseLine: 'Trash & recycling out (~10 min)',
    startLocal: '20:00',
    endLocal: '20:10',
    rrule: 'FREQ=WEEKLY;BYDAY=TU,FR',
    anchorDate: '2026-07-07',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'Tied to pickup days — swing it out on the way to the evening walk rather than a second errand.',
      sections: [{ steps: ['Placeholder Tue/Fri — set to your building’s real pickup days once.'] }]
    }
  }),
  R({
    id: 'heb-order',
    owner: 'shraddha',
    category: 'errand',
    title: 'HEB order (weekly perishables)',
    terseLine: 'HEB order — fresh/perishable',
    startLocal: '20:00',
    endLocal: '20:10',
    rrule: 'FREQ=WEEKLY;BYDAY=FR',
    anchorDate: '2026-07-10',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'Weekly fresh run — pilot HEB delivery. After the first order, save it as a favorite/reorder list so this drops to ~5 minutes.',
      sections: [
        {
          heading: 'List',
          steps: [
            'Onions, tomatoes, garlic, ginger; leafy greens + whatever vegetable the week’s rotation needs.',
            'Fresh curd/yogurt starter, cilantro, curry leaves, milk.',
            'Fruit for Ahana; paneer or roti/naan if not stocked from Costco.'
          ]
        }
      ]
    }
  }),
  R({
    id: 'laundry-week',
    owner: 'shared',
    category: 'chore',
    title: 'Laundry week (this week’s owner)',
    terseLine: 'Laundry week — full owner, start to finish',
    startLocal: '',
    endLocal: '',
    rrule: 'FREQ=WEEKLY;BYDAY=MO',
    anchorDate: '2026-07-06',
    marker: true,
    swap: 'laundry',
    runbook: {
      summary: 'Full ownership per week (wash, dry, fold, put away — start to finish), not split by step. Alternates weekly; set the owner at the Weekly Reset.',
      sections: [{ steps: ['Half-finished laundry is the classic failure mode of shared laundry duty — one full owner per week avoids it.'] }]
    }
  }),
  R({
    id: 'robot-vacuum-daily',
    owner: 'shared',
    category: 'chore',
    title: 'Robot vacuum runs (automated)',
    terseLine: 'Robot vacuum runs — automated 10:30 AM',
    startLocal: '10:30',
    endLocal: '10:31',
    rrule: DAILY,
    anchorDate: '2026-07-06',
    marker: true,
    runbook: {
      summary: 'Scheduled in the vacuum’s app — no human decision required. Shown here only so the household knows it’s handled.',
      sections: [{ steps: ['If it ever stops running, re-check the app schedule (post-breakfast, pre-lunch mess).'] }]
    }
  }),
  R({
    id: 'brag-doc',
    owner: 'shared',
    category: 'review',
    title: 'Brag doc — 10 min (each)',
    terseLine: 'Brag doc — log this week’s wins',
    startLocal: '16:00',
    endLocal: '16:10',
    rrule: 'FREQ=WEEKLY;BYDAY=FR',
    anchorDate: '2026-07-10',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'Each of you keeps a one-page reverse-chronological brag doc. Log every win, metric, scope expansion the week it happens — so the promo packet is a formatting exercise, not archaeology.',
      sections: [{ steps: ['10 minutes, on your own doc. Nothing fancier.'] }]
    }
  }),
  R({
    id: 'declutter-monthly',
    owner: 'shared',
    category: 'chore',
    title: 'Monthly declutter pass',
    terseLine: 'Monthly declutter + air filters',
    startLocal: '11:00',
    endLocal: '11:30',
    rrule: 'FREQ=MONTHLY;BYDAY=4SA',
    anchorDate: '2026-07-25',
    runbook: {
      summary: 'Declutter pass (toys, mail pile, closets); check air filters. Rotate between both.',
      sections: [{ steps: ['30 minutes. The point is that it happens monthly, not that it’s thorough.'] }]
    }
  }),
  R({
    id: 'physicals-annual',
    owner: 'shared',
    category: 'review',
    title: 'Book physicals + labs (annual)',
    terseLine: 'Book physicals + labs',
    startLocal: '10:00',
    endLocal: '10:30',
    rrule: 'FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=1',
    anchorDate: '2026-09-01',
    notify: { minutesBefore: 0 },
    runbook: {
      summary: 'The recurring health checkpoint the calendar was missing.',
      sections: [
        {
          heading: 'Carry these into the appointments',
          steps: [
            'Prakash: lipid-panel recheck 8–12 weeks after egg reintroduction; vitamin-D dose from actual lab value; algae DHA/EPA discussion.',
            'Shraddha: ask whether the BP prescription can step down to once daily now that it’s controlled (bring the BP log).',
            'Both: standard well-adult labs; Ahana’s well-child visit on the pediatric schedule.'
          ]
        }
      ]
    }
  })
];

export const SCHEDULE_ROUTINES: Routine[] = [
  ...prakash,
  ...shraddha,
  ...shared,
  batchCookSunday,
  ...extras
];
