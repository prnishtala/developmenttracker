import { Routine, RunbookSection } from '@/lib/types';

// The 4-week dinner rotation, transcribed from the Family OS calendars. Same
// weekday theme every week; only the dish rotates across a 4-week cycle. Encoded
// as a table + generator so the recipes stay readable and the RRULEs stay correct.
//
// Every dinner ends with the same invariant from the plan: pull Ahana's portion
// BEFORE the final chili/tempering. That line is appended automatically.

type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR';

// Base (Week 1) anchor dates from the calendars — one weekday each, INTERVAL=4.
const BASE_ANCHOR: Record<Weekday, string> = {
  MO: '2026-07-06',
  TU: '2026-07-07',
  WE: '2026-07-08',
  TH: '2026-07-09',
  FR: '2026-07-10'
};

interface Dish {
  name: string;
  steps: string[];
  ahana?: string; // overrides the default set-aside note
}

interface DayTheme {
  weekday: Weekday;
  theme: string;
  weeks: [Dish, Dish, Dish, Dish]; // week 1..4
}

const AHANA_DEFAULT = 'Ahana: pull her portion aside before the final chili/salt.';

const ROTATION: DayTheme[] = [
  {
    weekday: 'MO',
    theme: 'Dal + sabzi',
    weeks: [
      {
        name: 'Tadka Dal + Aloo Gobi + Rice',
        steps: [
          'Dal: reheat Sunday’s batch dal (1 cup toor base) with a fresh tempering — 1 tbsp ghee, 1 tsp cumin seeds, 2 crushed garlic cloves, 1 dried red chili, pinch hing; pour over dal, simmer 3 min.',
          'Aloo gobi: 2 cups cauliflower florets + 2 medium potatoes, cubed. Heat 2 tbsp oil + 1 tsp cumin, add potato/cauliflower, ½ tsp turmeric, 1 tsp coriander powder, ½ tsp red chili powder, salt. Cover, cook 12–15 min, stir occasionally, finish with cilantro.',
          'Serve over Sunday’s batch rice.'
        ]
      },
      {
        name: 'Chana Dal + Bhindi Fry + Rice',
        steps: [
          'Chana dal: 1 cup chana dal, Instant Pot Manual 12 min + natural release, 3 cups water, ½ tsp turmeric, salt. Temper 1 tbsp oil, 1 tsp cumin, 1 chopped onion, 1 tomato, ½ tsp red chili powder — cook till soft, mix in, simmer 5 min.',
          'Bhindi fry: 3 cups sliced okra, sauté uncovered in 2 tbsp oil, medium-high, 12–15 min, with ½ tsp turmeric, 1 tsp coriander powder, salt, until crisp-edged (uncovered keeps it from getting slimy).',
          'Serve with rice.'
        ]
      },
      {
        name: 'Moong Dal + Baingan Bharta + Roti',
        steps: [
          'Moong dal: 1 cup split moong dal, Instant Pot Manual 6 min + quick release, ½ tsp turmeric, salt, 3 cups water. Temper 1 tbsp ghee, 1 tsp cumin, pinch hing, 1 chopped tomato — mix in.',
          'Baingan bharta: roast 1 large eggplant whole (air fryer 400°F, 25 min) until soft, peel, mash. Sauté 1 chopped onion, 2 cloves garlic, 1 tomato in 2 tbsp oil, add mashed eggplant, ½ tsp turmeric, ½ tsp red chili powder, salt, cook 8 min.',
          'Serve with fresh roti.'
        ]
      },
      {
        name: 'Rajma + Jeera Rice',
        steps: [
          'Rajma: 1 cup rajma (soaked overnight, or canned & drained), Instant Pot Manual 20 min soaked / 8 min canned + natural release, with 1 chopped onion, 1 tomato, 1 tbsp ginger-garlic paste, 1 tsp rajma masala or garam masala, salt, 2.5 cups water.',
          'Jeera rice: 2 cups basmati rice — sauté 1 tbsp ghee + 1 tsp cumin seeds first, then cook rice as usual (rice cooker) with the cumin-ghee mixed in.'
        ]
      }
    ]
  },
  {
    weekday: 'TU',
    theme: 'South Indian',
    weeks: [
      {
        name: 'Sambar + Rice + Beans Poriyal',
        steps: [
          'Sambar: reheat 1.5 cups leftover dal base, add 1 cup mixed vegetables (drumstick, carrot, pumpkin — whatever’s on hand), 2 tbsp sambar powder, 1 tbsp tamarind paste, salt. Simmer 10 min. Temper 1 tbsp oil, ½ tsp mustard seeds, curry leaves, 2 dried red chilies — pour over.',
          'Beans poriyal: 2 cups chopped green beans, sauté/steam 8 min with 1 tbsp oil, ½ tsp mustard seeds, curry leaves, 2 tbsp grated coconut, salt.',
          'Serve with rice.'
        ],
        ahana: 'Ahana: pull her portion aside before the final tempering.'
      },
      {
        name: 'Rasam + Rice + Cabbage Poriyal',
        steps: [
          'Rasam: 2 tbsp cooked toor dal mashed + 2 cups water, 1 tbsp rasam powder, 1 tbsp tamarind paste, 1 chopped tomato, salt. Simmer 10 min. Temper 1 tsp mustard seeds, curry leaves, pinch hing in 1 tbsp ghee — pour over, finish with cilantro.',
          'Cabbage poriyal: 3 cups shredded cabbage, sauté 8 min with 1 tbsp oil, ½ tsp mustard seeds, 2 tbsp grated coconut, salt.',
          'Serve with rice.'
        ],
        ahana: 'Ahana: pull her portion aside before the final tempering.'
      },
      {
        name: 'Vegetable Kurma + Idli',
        steps: [
          'Kurma: sauté 1 chopped onion, 1 tbsp ginger-garlic paste in 2 tbsp oil, add 2 cups mixed vegetables (carrot, beans, potato, peas), ½ cup coconut-cashew paste (blend 3 tbsp grated coconut + 5 cashews + water), 1 tsp garam masala, salt, 1 cup water — simmer covered 12 min.',
          'Serve with steamed idli (store-bought batter is fine).'
        ],
        ahana: 'Ahana: pull her portion aside before the final spice.'
      },
      {
        name: 'Curd Rice + Vathal Kuzhambu',
        steps: [
          'Curd rice: mix 2 cups cooked rice (mashed slightly) with 1.5 cups yogurt, ½ cup milk, salt. Temper 1 tsp mustard seeds, curry leaves, 1 dried red chili in 1 tbsp oil — mix in.',
          'Vathal kuzhambu: 2 tbsp tamarind paste + 1.5 cups water, 2 tbsp sambar powder, salt, simmer 10 min, same temper as sambar. (Short on time: leftover sambar substitutes.)'
        ],
        ahana: 'Ahana: plain curd rice, no tempering, set aside first.'
      }
    ]
  },
  {
    weekday: 'TH',
    theme: 'Leftover remix, ~10 min',
    weeks: [
      {
        name: 'Dal Paratha',
        steps: [
          'Mix 1 cup leftover thick dal with 1.5 cups whole wheat flour, ½ tsp ajwain, salt, a splash of water — knead into a soft dough.',
          'Roll into 6 parathas, cook on a hot tawa with ½ tsp ghee each side until golden spots appear. Serve with yogurt/pickle.'
        ],
        ahana: 'Ahana: a plain paratha, no pickle, torn into small pieces.'
      },
      {
        name: 'Fried Rice',
        steps: [
          '3 cups leftover rice, 1 cup diced mixed vegetables (frozen is fine) — sauté vegetables in 2 tbsp oil 4 min, push aside, scramble in 2 eggs or extra tofu cubes, mix in rice, 2 tbsp soy sauce, ½ tsp black pepper, toss 3–4 min on high heat.'
        ],
        ahana: 'Ahana: a plain portion set aside before the soy sauce goes in.'
      },
      {
        name: 'Dal Soup + Toast',
        steps: [
          'Blend or mash 1.5 cups leftover dal with 1 cup vegetable broth or water to soup consistency, reheat with a squeeze of lemon and black pepper.',
          'Toast 4 slices bread with butter. Done in 5 minutes.'
        ],
        ahana: 'Ahana: her portion without the lemon/pepper, lukewarm.'
      },
      {
        name: 'Rajma Wrap',
        steps: [
          'Warm 4 tortillas or rotis. Fill with leftover rajma (mash slightly so it doesn’t spill), chopped onion, a spoon of yogurt or chutney, shredded lettuce. Roll and serve — reheating only, no real cooking.'
        ],
        ahana: 'Ahana: rajma and rice separately rather than wrapped, easier for her to eat.'
      }
    ]
  },
  {
    weekday: 'FR',
    theme: 'Convenience, lowest effort',
    weeks: [
      {
        name: 'Dosa / Uttapam',
        steps: [
          'Heat a tawa, pour a ladle of batter — spread thin for dosa, or leave thick with chopped onion/tomato pressed in for uttapam. Cook 2–3 min per side with a little oil.',
          'Serve with sambar (Tuesday’s leftovers, if any) and coconut chutney (store-bought is fine).'
        ],
        ahana: 'Ahana: a soft, plain uttapam piece, torn small.'
      },
      {
        name: 'Pasta Night',
        steps: [
          'Boil 300g pasta per package instructions.',
          'Sauce: sauté 1 chopped onion + 3 cloves garlic in 2 tbsp olive oil, add 1 cup jarred marinara + 1 cup chopped vegetables (zucchini, bell pepper, spinach), simmer 8 min, salt + chili flakes to taste. Toss with pasta, top with grated cheese.'
        ],
        ahana: 'Ahana: her portion before the chili flakes go in.'
      },
      {
        name: 'Air-Fryer Paneer + Salad',
        steps: [
          'Toss 300g paneer cubes in 2 tbsp yogurt, 1 tbsp ginger-garlic paste, 1 tsp tikka masala, salt — air fryer 400°F, 10 min, shake at 5 min.',
          'Side salad: cucumber, tomato, onion, lemon juice, salt.'
        ],
        ahana: 'Ahana: plain paneer cubes set aside before the masala marinade.'
      },
      {
        name: 'Frozen Paratha + Curd',
        steps: [
          'Pan-fry 4 frozen parathas with a little ghee/oil per package instructions, 2–3 min per side. Serve with fresh curd/yogurt and pickle. Zero-effort Friday, by design.'
        ],
        ahana: 'Ahana: plain paratha piece + plain curd, no pickle.'
      }
    ]
  }
];

function anchorFor(weekday: Weekday, week: number): string {
  const [y, m, d] = BASE_ANCHOR[weekday].split('-').map((n) => parseInt(n, 10));
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + (week - 1) * 7);
  return base.toISOString().slice(0, 10);
}

/** The Mon/Tue/Thu/Fri shared family dinners (Wednesday is the batch-cook block). */
export function dinnerRoutines(): Routine[] {
  const out: Routine[] = [];
  for (const day of ROTATION) {
    day.weeks.forEach((dish, i) => {
      const week = i + 1;
      const sections: RunbookSection[] = [
        { heading: `Dinner (Week ${week}): ${dish.name}`, steps: dish.steps },
        {
          heading: 'The block',
          steps: [
            'Dinner ~6:30, then floor play or books — her pick. Phone physically out of the room.',
            'Narrate, expand her sentences, offer one real choice.',
            dish.ahana ?? AHANA_DEFAULT
          ]
        }
      ];
      out.push({
        id: `dinner-${day.weekday.toLowerCase()}-w${week}`,
        owner: 'shared',
        category: 'meal',
        title: `Family dinner — ${dish.name}`,
        terseLine: `Family block (no phones) · ${dish.name}`,
        startLocal: '18:00',
        endLocal: '19:30',
        timezone: 'America/Chicago',
        rrule: `FREQ=WEEKLY;INTERVAL=4;BYDAY=${day.weekday}`,
        anchorDate: anchorFor(day.weekday, week),
        weekIndex: week,
        noPhone: true,
        notify: { minutesBefore: 10 },
        runbook: {
          summary: `${day.theme}. Protected family time — work paused.`,
          sections
        }
      });
    });
  }
  return out;
}

/** Wednesday one-pot batch cook (doubles as dinner). Owner rotates at the reset. */
export function wednesdayBatchRoutines(): Routine[] {
  const dishes: { name: string; steps: string[] }[] = [
    {
      name: 'Vegetable Khichdi',
      steps: [
        '1 cup rice + ½ cup moong dal, rinsed together. 3 cups mixed chopped vegetables (carrot, beans, peas, potato). 4.5 cups water, ½ tsp turmeric, 1 tsp cumin seeds, 1 tbsp ghee, salt.',
        'Instant Pot: sauté cumin in ghee 30 sec → add rice, dal, vegetables, turmeric, salt, water → Manual/Pressure Cook 8 min → natural release 10 min.',
        'Ahana: set aside and mash her portion before any final salt/chili.'
      ]
    },
    {
      name: 'Vegetable Pulao',
      steps: [
        '2 cups basmati rice, rinsed. 2 cups mixed vegetables (peas, carrot, beans). 1 sliced onion, 1 tbsp ginger-garlic paste. Whole spices: 1 bay leaf, 2 cloves, 1 small cinnamon stick, 2 cardamom pods. 2 tbsp ghee, 3.5 cups water, salt.',
        'Instant Pot: sauté whole spices + onion in ghee 3 min → add ginger-garlic, vegetables, rice, water, salt → Manual/Pressure Cook 6 min → natural release 10 min.',
        'Ahana: set aside and mash her portion before serving with any extra chili.'
      ]
    },
    {
      name: 'Dal Khichdi + Roasted Veg',
      steps: [
        '⅓ cup toor dal + ⅓ cup moong dal + 1 cup rice, rinsed together. 4 cups water, ½ tsp turmeric, salt. Instant Pot: combine all → Manual/Pressure Cook 8 min → natural release.',
        'Roasted veg (air fryer, alongside): 3 cups mixed vegetables (cauliflower, carrot, sweet potato) tossed in 1 tbsp oil, salt, ½ tsp cumin powder → 400°F, 15 min, shake at 8 min.',
        'Ahana: her portion aside before any final chili on the khichdi.'
      ]
    },
    {
      name: 'Lemon Rice + Air-Fryer Tofu',
      steps: [
        'Lemon rice: 3 cups cooked rice. Temper 2 tbsp oil, 1 tsp mustard seeds, 1 tbsp chana dal, 1 tbsp peanuts, curry leaves, 2 dried red chilies, pinch turmeric → mix into rice with juice of 1.5 lemons, salt.',
        'Tofu (air fryer, alongside): 14 oz tofu cubes tossed in 2 tbsp yogurt + 1 tbsp ginger-garlic paste + 1 tsp chili powder + ½ tsp turmeric + 1 tsp garam masala + ¾ tsp salt + 1 tbsp oil → 400°F, 12 min, shake at 6 min.',
        'Ahana: plain rice portion aside before the lemon/chili tempering.'
      ]
    }
  ];
  return dishes.map((dish, i) => {
    const week = i + 1;
    return {
      id: `wed-batch-w${week}`,
      owner: 'shared' as const,
      category: 'batch_cook' as const,
      title: `Wednesday batch cook — ${dish.name}`,
      terseLine: `Wed batch cook · ${dish.name} (doubles as dinner)`,
      startLocal: '17:45',
      endLocal: '18:15',
      timezone: 'America/Chicago',
      rrule: 'FREQ=WEEKLY;INTERVAL=4;BYDAY=WE',
      anchorDate: anchorFor('WE', week),
      weekIndex: week,
      swap: 'wednesday_refresh' as const,
      notify: { minutesBefore: 10 },
      runbook: {
        summary:
          'Shorter refresh that doubles as tonight’s one-pot dinner — starting at 5:45 lands dinner ~6:30. Owner rotates; check this week’s Weekly Reset decision.',
        sections: [{ heading: dish.name, steps: dish.steps }],
        notes: [
          'Home by 5:45 is realistic mostly on WFH days. If you can’t make 5:45, shift to whenever you’re both home, before 6:30 — the recipe doesn’t change, just the clock.'
        ]
      }
    };
  });
}
