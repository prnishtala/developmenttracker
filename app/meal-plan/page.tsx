import { NutritionPlan } from '@/components/NutritionPlan';

export const metadata = {
  title: "Ahana's Nutrition Plan"
};

export default function MealPlanPage() {
  return (
    <div className="futuristic-shell">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-amber-400/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <NutritionPlan />
      </div>
    </div>
  );
}
