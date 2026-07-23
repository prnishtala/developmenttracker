import Link from 'next/link';

const PRINCIPLES = [
  ['Aim for the week, not the day', 'Toddler appetite swings — big one day, birdlike the next. Judge nutrition across 7 days.'],
  ['Flip the plate', 'Protein + a healthy fat are the centre of every main meal; rice/roti is the side. This fixes most of the carb skew.'],
  ['Cap milk at ~400–500 ml/day', 'Milk + curd + cheese combined. Too much milk blunts iron and kills appetite.'],
  ['You decide what & when; she decides how much', 'Offer without pressure. Re-offer refused foods — 8–15 tries is normal.'],
  ['Pair iron with vitamin C', 'Serve an iron food with something tangy (orange, mosambi, tomato, lemon) and keep big milk away from that meal.'],
  ['A little fat at every meal', '¼–½ tsp ghee or 1 tsp nut-seed powder. Her brain is ~60% fat; she needs calories in small volume.']
];

const RHYTHM = [
  ['7–8 am', 'Breakfast', 'Protein + fat + complex carb', 'Veggie egg omelet/bhurji + ¼ mini paratha · moong/besan chilla + curd · paneer bhurji · ragi-oats porridge + nut powder + banana'],
  ['~10 am', 'Mid-morning snack', 'Fruit + a fat or protein', 'Banana + 1 tsp nut-seed powder · apple + thinned peanut/almond butter · ghee-roasted makhana'],
  ['12:30 pm', 'Lunch — main', '1 protein + veg + ghee + small carb + curd + vitamin C', 'Moong dal + palak, rice, ghee, curd, orange · paneer-peas + mini roti · veg-dal khichdi (tomato in the dal)'],
  ['~4 pm', 'Pre-dinner snack', 'Energy + iron/fat — the batch-prep slot', 'Date-nut ladoo · sattu/ragi ladoo · cheese + cucumber · ragi-banana cookie · makhana'],
  ['7 pm', 'Dinner — lighter', 'Protein + veg + a small carb', '2 idli + sambar · veg-moong khichdi · paneer + veg + small roti · egg bhurji + soft veg'],
  ['~8 pm', 'Bedtime — A2 milk', '150–200 ml — counts toward the milk cap', 'A2 milk, optionally + ½ tsp dry-fruit powder']
];

const PILLARS: { name: string; target: string; items: string[]; foot: string; tone: string }[] = [
  {
    name: 'Protein',
    target: '~13 g/day · hit it at breakfast, lunch & dinner',
    items: ['Egg (~6 g each)', 'Dals — moong, masoor, toor', 'Paneer & tofu', 'Curd & cheese (full-fat)', 'Besan — chilla, cheela', 'Sprouted moong, soft rajma/chhole', 'Nut & seed butters, ragi'],
    foot: 'A protein at every eating occasion beats one big protein meal.',
    tone: 'emerald'
  },
  {
    name: 'Iron',
    target: '~7 mg/day + her drops · always pair with vitamin C',
    items: ['Ragi, poha, oats', 'Palak & greens', 'Egg yolk, dal, besan, tofu', 'Dates, raisins, dried apricot', 'Pumpkin & sesame seed powder'],
    foot: 'Boost: orange, mosambi, guava, amla, tomato, lemon. Keep big milk/curd away at iron meals. Continue iron drops + multivitamin per your pediatrician.',
    tone: 'rose'
  },
  {
    name: 'Healthy fats',
    target: '~30–40% of calories · a little at every meal',
    items: ['Ghee — ¼–½ tsp per meal', 'Nut & seed powders / butters', 'Avocado, full-fat curd/paneer/cheese', 'Egg yolk, coconut', 'Cold-pressed mustard / groundnut / olive oil'],
    foot: 'Omega-3: ½ tsp ground flax + walnut in porridge/curd a few times a week.',
    tone: 'amber'
  }
];

const SWAPS = [
  ['A bowl of plain rice', 'Dal-heavy khichdi with veg + ghee'],
  ['Biscuits / puffs / white bread', 'Besan or ragi chilla, cheese + fruit, or makhana'],
  ['Roti-only meal', 'Roti + paneer/dal + veg (or knead ragi/besan/oats into the dough)'],
  ['Milk to fill her up', 'Food first, milk after — capped at ~500 ml/day'],
  ['Sweet packaged snack', 'Date-nut ladoo or fruit + nut butter'],
  ['Sugary / sweet porridge', 'Ragi-oats-nut porridge, little to no added sugar']
];

const WEEK: { day: string; egg: boolean[]; cells: string[] }[] = [
  { day: 'Mon', egg: [true, false, false, false, false], cells: ['Veggie omelet + ¼ paratha', 'Banana + nut powder', 'Moong dal + palak, rice, ghee, curd · orange', 'Date-nut ladoo', 'Veg-moong khichdi + ghee'] },
  { day: 'Tue', egg: [false, false, false, false, false], cells: ['Ragi-oats porridge + nut powder + banana', 'Apple + almond butter', 'Paneer-peas, mini roti, cucumber · tomato', 'Ghee-roasted makhana', '2 idli + sambar'] },
  { day: 'Wed', egg: [false, false, false, false, false], cells: ['Moong chilla + curd', 'Mango + seed powder', 'Toor dal, carrot-beans, rice, ghee, curd · mosambi', 'Cheese + cucumber', 'Veg-paneer soft pulao + curd'] },
  { day: 'Thu', egg: [true, false, false, false, false], cells: ['Egg bhurji + ½ ragi chilla', 'Pear + nut powder', 'Rajma (mashed) + rice + ghee + curd · lemon', 'Ragi-banana cookie', 'Dal-veg khichdi + ghee'] },
  { day: 'Fri', egg: [false, false, false, false, false], cells: ['Paneer bhurji + mini paratha', 'Soft guava + seeds', 'Masoor dal + lauki, roti, curd · tomato', 'Date-nut ladoo', 'Besan-veg chilla + curd'] },
  { day: 'Sat', egg: [true, false, false, false, false], cells: ['Veggie omelet + toast + avocado', 'Banana + peanut butter', 'Chhole (soft) + rice + ghee · capsicum', 'Makhana + cheese', 'Veg-moong khichdi'] },
  { day: 'Sun', egg: [false, false, false, false, true], cells: ['Oats-ragi pancake + nut butter + berries', 'Papaya + seed powder', 'Sambar + idli/rice + ghee + curd · orange', 'Sattu ladoo', 'Egg bhurji + soft veg'] }
];

const PORTIONS = [
  ['Protein', '1 egg · ~½ cup dal · ~30 g paneer — roughly her palm'],
  ['Grain / carb', '2–4 tbsp rice or ½–1 mini roti — the side, not the base'],
  ['Vegetables', '2–3 tbsp, soft-cooked — two colours a day'],
  ['Fruit', '½ small fruit or 2–3 tbsp, chopped/soft'],
  ['Added fat', '¼–½ tsp ghee/oil or 1 tsp nut-seed powder per meal'],
  ['Milk + dairy', '≤ 500 ml/day total (milk + curd + cheese)'],
  ['Water', 'Small open/straw cup — sips through the day']
];

const DAILY_CHECKS = [
  'Protein at ≥ 3 eating occasions',
  'An iron food + a vitamin-C food, paired',
  'A healthy fat at every meal',
  '2+ vegetables · 2 fruits',
  'Milk + dairy kept ≤ 500 ml',
  'Iron drops + multivitamin given',
  'One refused/new food re-offered'
];

const LIMITS = ['Added sugar & salt (minimal under 2)', 'Juice & sweet drinks — whole fruit + water instead', 'Packaged biscuits, chips, fried snacks', 'Milk over ~500 ml', 'Whole nuts, whole grapes, hard raw chunks (choking — grate/soften/quarter)'];

const TONE_BORDER: Record<string, string> = {
  emerald: 'border-t-emerald-400/70',
  rose: 'border-t-rose-400/70',
  amber: 'border-t-amber-400/70'
};
const TONE_TEXT: Record<string, string> = {
  emerald: 'text-emerald-300',
  rose: 'text-rose-300',
  amber: 'text-amber-300'
};

function SectionHead({ n, title, lede }: { n: string; title: string; lede?: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-cyan-300">{n}</span>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {lede && <p className="mt-1 max-w-2xl text-sm text-slate-300">{lede}</p>}
    </div>
  );
}

export function NutritionPlan() {
  return (
    <div className="space-y-8">
      <header className="futuristic-panel p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Toddler nutrition · Indian vegetarian + egg</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Ahana&apos;s Nutrition Plan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          A weekly structure built to flip her plate from carb-heavy to protein-, iron-, and fat-forward — designed to
          batch-cook and follow on the busiest mornings.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['19 months', '~1000 kcal/day', 'Milk ≤ 500 ml', 'Egg 4–5×/week'].map((b) => (
            <span key={b} className="futuristic-chip">{b}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Log meals (including by voice) on the{' '}
          <Link href="/" className="text-cyan-300 underline">Home → Food &amp; Nutrition</Link> tab; the dashboard compares intake against her targets.
        </p>
      </header>

      <section>
        <SectionHead n="01" title="Six principles that do the heavy lifting" lede="Get these right and the daily details forgive themselves." />
        <div className="grid gap-2 sm:grid-cols-2">
          {PRINCIPLES.map(([title, body], i) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white"><span className="text-cyan-300">{i + 1}.</span> {title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead n="02" title="The daily rhythm" lede="Mapped to the meal slots the tracker already uses. Each slot lists its job, then easy options — rotate freely." />
        <div className="space-y-2">
          {RHYTHM.map(([time, name, formula, options]) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex sm:gap-4">
              <div className="sm:w-40 sm:shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">{time}</p>
                <p className="text-base font-semibold text-white">{name}</p>
              </div>
              <div className="mt-1 sm:mt-0">
                <p className="text-xs font-semibold text-slate-400">{formula}</p>
                <p className="mt-0.5 text-sm text-slate-200">{options}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border-l-2 border-cyan-300/60 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <b className="text-white">The plate rule:</b> every main meal = 1 protein + 1 healthy fat + 1 veg, <em>then</em> a small scoop of rice or half a roti. If the bowl is mostly rice, rebalance before serving.
        </div>
      </section>

      <section>
        <SectionHead n="03" title="The three pillars to defend" lede="The nutrients most at risk in a carb-leaning Indian-veg toddler diet. Keep a source from each in view every day." />
        <div className="grid gap-3 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.name} className={`rounded-2xl border border-white/10 border-t-2 bg-white/5 p-4 ${TONE_BORDER[p.tone]}`}>
              <h3 className={`text-lg font-semibold ${TONE_TEXT[p.tone]}`}>{p.name}</h3>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">{p.target}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {p.items.map((it) => (
                  <li key={it}>• {it}</li>
                ))}
              </ul>
              <p className="mt-3 border-t border-dashed border-white/15 pt-2 text-xs text-slate-400">{p.foot}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead n="04" title="Flip the carb-heavy habits" lede="Same effort, better ratio." />
        <div className="space-y-2">
          {SWAPS.map(([from, to]) => (
            <div key={from} className="grid items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
              <span className="text-slate-400 line-through decoration-rose-400/60">{from}</span>
              <span className="hidden font-bold text-cyan-300 sm:block">→</span>
              <span className="font-medium text-slate-100">{to}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead n="05" title="The batch-prep system" lede="Cook the hard things once, assemble on weeknights — jars, freezer, snacks, plus a Sunday rhythm." />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Monthly jars <span className="text-xs font-normal text-slate-400">· room temp, 3–4 wks</span></h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              <li><b>Dry-fruit &amp; nut powder</b> (almonds, cashews, walnuts, pistachios + dates) — 1 tsp into milk/curd/porridge/dough. Fat + iron + calories.</li>
              <li><b>Multigrain / sattu mix</b> (roasted ragi + oats + moong dal + rice + chana, ground) — 2 tbsp = 3-min porridge.</li>
              <li><b>Seed powder</b> (roasted flax + sesame + pumpkin) — <em>keep in fridge</em> — ½ tsp/day for omega-3, iron, zinc.</li>
              <li><b>Veggie powder</b> (optional) — dried carrot/beet/spinach, stirred into dal &amp; khichdi.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Freezer &amp; snacks <span className="text-xs font-normal text-slate-400">· label + date, 2–4 wks</span></h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">
              <li>• Dal &amp; sambar portions; veg purées in ice-cube trays</li>
              <li>• Mashed rajma/chana; paneer cubes</li>
              <li>• Idli/dosa/chilla batter; ragi pancakes; single-serve khichdi</li>
              <li>• Besan-veg tikkis/nuggets</li>
              <li className="pt-1"><b>Snacks:</b> date-nut energy balls, sattu/ragi ladoo, ghee-roasted makhana, ragi-banana cookies, cheese cubes</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 rounded-2xl border-l-2 border-cyan-300/60 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <b className="text-white">Sunday (60–90 min):</b> grind 1–2 powders · roll ladoo · roast makhana · make idli/chilla batter · cook &amp; freeze 2 dals + 1 veg purée + paneer. Weeknights become “assemble,” not cook-from-scratch.
        </div>
      </section>

      <section>
        <SectionHead n="06" title="A 7-day sample plan" lede="Varied enough to fight menu-boredom, built entirely from the batch-prep above. ⬤ marks egg mornings (4–5/week)." />
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="p-2.5">Day</th><th className="p-2.5">Breakfast</th><th className="p-2.5">Mid-morning</th><th className="p-2.5">Lunch</th><th className="p-2.5">Pre-dinner</th><th className="p-2.5">Dinner</th>
              </tr>
            </thead>
            <tbody>
              {WEEK.map((row) => (
                <tr key={row.day} className="border-t border-white/10 align-top">
                  <th className="p-2.5 text-left font-semibold text-cyan-200">{row.day}</th>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="p-2.5 text-slate-200">
                      {row.egg[i] && <span className="mr-1 text-rose-300" aria-label="egg">⬤</span>}
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">Rotate grains (rice · ragi · oats · wheat · besan), use ≥ 3 different dals, and land greens on ~4 days.</p>
      </section>

      <section>
        <SectionHead n="07" title="How much — portion guide" lede="Start small, let her ask for more. First offer ≈ 1 tbsp of each food per year of age." />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dl className="space-y-2">
            {PORTIONS.map(([k, v]) => (
              <div key={k} className="grid gap-0.5 border-b border-dashed border-white/10 pb-2 last:border-0 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-3">
                <dt className="text-sm font-semibold text-cyan-200">{k}</dt>
                <dd className="text-sm text-slate-300">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-400">Hand guide: her fist ≈ a carb/veg portion · her palm ≈ protein · her thumb-tip ≈ a fat portion.</p>
        </div>
      </section>

      <section>
        <SectionHead n="08" title="The picky-day playbook" lede="How to get her to eat something good without the plate collapsing into carbs." />
        <ul className="grid gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          {[
            'Keep offering with a neutral face — no bribing, pressure, or force.',
            'Put a rejected food next to a liked one, in tiny portions.',
            'Every plate carries one “safe” favourite — but never an all-carb plate.',
            'Don’t backfill a refused meal with milk or biscuits; offer the next planned snack on schedule.',
            'Same food, new form: dal as soup vs over rice vs in a chilla.',
            'Dips win — curd, hummus, nut butter. So does eating together.',
            'A skipped meal is fine. Zoom out to the week.'
          ].map((t) => (
            <li key={t} className="pl-4 -indent-4"><span className="text-cyan-300">→</span> {t}</li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHead n="09" title="Weekly checklist & what to limit" lede="The checklist maps onto the tracker’s meal slots — aim to hit most of these most days." />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">Daily — tick most days</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
              {DAILY_CHECKS.map((c) => (
                <li key={c} className="flex gap-2"><span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-white/25" /> {c}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400"><b className="text-slate-300">Weekly:</b> egg 4–5× · ≥ 3 dals &amp; grains rotated · greens ~4 days.</p>
          </div>
          <div className="rounded-2xl border border-white/10 border-t-2 border-t-rose-400/70 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-300">Keep to a minimum</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
              {LIMITS.map((l) => (
                <li key={l} className="pl-4 -indent-4"><span className="text-rose-300">✕</span> {l}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">Honey is fine now that she&apos;s over 12 months.</p>
          </div>
        </div>
      </section>

      <p className="border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
        General, well-established toddler-nutrition guidance tailored to an Indian vegetarian + egg diet — not medical
        advice. Confirm iron/vitamin supplementation, portion targets, growth, and any food allergies with Ahana&apos;s
        pediatrician or a pediatric dietitian, and adjust to her.
      </p>
    </div>
  );
}
