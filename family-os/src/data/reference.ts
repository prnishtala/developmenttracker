import { Routine } from '@/lib/types';

// Reference cards — the "manual" from Module 6's Notion, surfaced read-only in
// the app so the whole system lives in one place. No time, no recurrence; they
// appear on the Reference tab, not the timeline.
const ref = (
  id: string,
  title: string,
  terseLine: string,
  runbook: Routine['runbook']
): Routine => ({
  id,
  owner: 'shared',
  category: 'reference',
  title,
  terseLine,
  startLocal: '',
  endLocal: '',
  timezone: 'America/Chicago',
  rrule: '',
  anchorDate: '2026-07-06',
  notify: null,
  runbook
});

export const REFERENCE_ROUTINES: Routine[] = [
  ref('ref-emergency', 'Emergency Information', 'Emergency contacts & shutoffs', {
    summary: 'Fill in the blanks today; the decision trees cover disrupted days, this covers actual emergencies.',
    sections: [
      {
        steps: [
          'Emergency: 911 · Address to say out loud: ______',
          'Poison Control (24/7): 1-800-222-1222',
          'Pediatrician: ______ · phone: ______',
          'Nearest urgent care: ______ · Nearest ER: ______',
          'Prakash cell: ______ · Shraddha cell: ______',
          'Nanny: ______ · Backup sitter: ______',
          'Building mgmt / maintenance: ______',
          'Ahana — DOB: ______ · allergies/meds: ______',
          'Utility shutoffs (water valve / breaker panel) located at: ______'
        ]
      }
    ],
    notes: ['Post on the fridge; share a photo with the nanny.']
  }),
  ref('ref-nanny-sick', 'Decision tree — Nanny calls in sick', 'If the nanny is out', {
    sections: [
      {
        ordered: true,
        steps: [
          'Check BOTH work calendars — who has the lighter meeting load today?',
          'Lighter-day parent takes point; the other proceeds normally.',
          'Neither can? Call the backup sitter (fill that line in NOW, not during the emergency).',
          'No backup available same-day? Split the day — one parent AM, one PM.',
          'Both: tell managers early and proactively, not apologetically after.',
          'Lower the bar everywhere else today: fastest dinner, skip workouts, no deep-work guilt.'
        ]
      }
    ]
  }),
  ref('ref-child-sick', 'Decision tree — Ahana is sick', 'If Ahana is sick', {
    sections: [
      {
        steps: [
          'Default: the parent with the more moveable day takes point on doctor calls/visits; revisit at the reset if it always falls the same way.',
          'Nanny’s presence depends on the illness and her comfort — confirm directly, don’t assume.',
          'Lower the bar everywhere else: skip the rotation dinner for whatever’s fastest (Friday’s option works any day), and don’t also try a workout or deep-work block.'
        ]
      }
    ]
  }),
  ref('ref-crunch', 'Decision tree — Work deadline crunch', 'If one of you is in a crunch', {
    sections: [
      {
        steps: [
          'The non-crunched parent temporarily absorbs both people’s standing tasks — explicitly time-boxed (“through Friday”), not open-ended.',
          'Lean harder on outsourcing that week: order in; lean on the cleaner if timing lines up.',
          'Protect the crunched parent’s sleep once it ends — several short nights reopens the sleep-debt problem.',
          'After: a short honest debrief — was the crunch unavoidable, or a procrastination pattern returning?'
        ]
      }
    ]
  }),
  ref('ref-travel', 'Decision tree — One parent traveling', 'If one of you travels', {
    sections: [
      {
        steps: [
          'Before: extend the Sunday batch cook by one portion set; confirm nanny hours unaffected; confirm the backup sitter is on call.',
          'During: the traveling parent’s standing tasks (trash, dishes) get explicitly reassigned or deferred — in writing, not by remote control.',
          'The home parent gets a pass on anything non-essential that week.'
        ]
      }
    ]
  }),
  ref('ref-screen-policy', 'Screen policy', 'Screens — the written rule', {
    sections: [
      {
        ordered: true,
        steps: [
          'Default: no screens. Exception: live video calls with family (interaction, not viewing).',
          'The rule binds adults too: phones out of the 6:00–7:30 PM family room.',
          'Policy is written down and shared with the nanny and visiting family, so enforcement never depends on an in-the-moment confrontation.'
        ]
      }
    ]
  }),
  ref('ref-ownership', 'Standing task ownership', 'Who owns what, permanently', {
    summary: 'Standing ownership by task, permanent until deliberately renegotiated — so nobody has to notice or ask.',
    sections: [
      {
        steps: [
          'Dishes after dinner — Prakash (daily).',
          'Trash & recycling — Prakash (2×/week, pickup days).',
          'Robot vacuum run — automated daily; empty bin/mop pads — Prakash (Sunday).',
          'Laundry — alternates weekly, one full owner per week.',
          'Costco — Prakash (biweekly). HEB run/delivery — Shraddha (weekly).',
          'Ahana supply restocking — automated subscription.',
          'Nanny coordination — Shraddha (revisit in 3 months).',
          'Mail/packages/maintenance, car — Prakash. Bills — autopay everywhere.'
        ]
      }
    ]
  }),
  ref('ref-meal-grid', '4-week dinner rotation grid', 'The rotation, at a glance', {
    summary: 'Same weekday theme every week; only the dish rotates. Full recipes live on each dinner block.',
    sections: [
      { heading: 'Monday — Dal + sabzi', steps: ['Tadka dal + aloo gobi', 'Chana dal + bhindi', 'Moong dal + baingan bharta', 'Rajma + jeera rice'] },
      { heading: 'Tuesday — South Indian', steps: ['Sambar + beans poriyal', 'Rasam + cabbage poriyal', 'Veg kurma + idli', 'Curd rice + vathal kuzhambu'] },
      { heading: 'Wednesday — one-pot (batch)', steps: ['Veg khichdi', 'Veg pulao', 'Dal khichdi + roast veg', 'Lemon rice + tofu'] },
      { heading: 'Thursday — leftover remix', steps: ['Dal paratha', 'Fried rice', 'Dal soup + toast', 'Rajma wrap'] },
      { heading: 'Friday — convenience', steps: ['Dosa/uttapam', 'Pasta', 'Air-fryer paneer + salad', 'Frozen paratha + curd'] },
      { heading: 'Weekend', steps: ['Saturday: cook new together or order in.', 'Sunday: simple khichdi — energy goes into the batch cook.'] }
    ]
  }),
  ref('ref-home-gates', 'Home-buying gates', 'Gates, not a date', {
    summary: 'Checked quarterly. Until all four pass, the decision is automatically “not yet” — no re-litigating in between.',
    sections: [
      {
        ordered: true,
        steps: [
          'Life stability — both jobs stable 2+ years? Relocation risk? (School district isn’t urgent — 3+ years out.)',
          'Financial readiness — down payment fully funded in liquid non-retirement assets without the emergency fund; PITI + HOA + reserve fits inside one income.',
          'Market & rate context — rerun rent-vs-buy for your neighborhoods at current rates each quarter.',
          'The house itself — only after 1–3 pass; criteria list built in advance so viewings are checklist-driven.'
        ]
      }
    ]
  }),
  ref('ref-cpa', 'Cross-border CPA question list', 'Bring these to the CPA', {
    summary: 'US residents with India-side assets — the one place to spend real money on advice.',
    sections: [
      {
        steps: [
          'FBAR (FinCEN 114) and FATCA (Form 8938) reporting for Indian accounts.',
          'PFIC treatment of any Indian mutual funds — lead with this one.',
          'NRE/NRO structuring and tax treatment of Indian interest income on the US return.',
          'NRO/NRE repatriation rules for moving funds out of India (LRS applies to India residents, not to you as NRIs).'
        ]
      }
    ]
  }),
  ref('ref-nanny-alignment', 'Nanny alignment — the 40-hour lever', 'Five asks for the nanny', {
    summary: 'A respectful-professional conversation, framed as collaboration. The nanny is the primary developmental environment Mon–Fri.',
    sections: [
      {
        steps: [
          'Narrate the day out loud, constantly — the single highest-value thing at this age.',
          'Books on demand, no cap — rereading the same book 40 times is developmentally correct.',
          'Outside time daily (weather allowing) — the apartment constrains gross-motor play.',
          'No screens during nanny hours (exception: video calls with family in India).',
          'A 2-line end-of-day note: what she played with, any new words or firsts.'
        ]
      }
    ]
  })
];
