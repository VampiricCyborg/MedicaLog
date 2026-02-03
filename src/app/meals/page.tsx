import { requireUser } from "@/lib/server/auth";
import { getMealLogsForDate } from "@/lib/data/persistence";
import { AddMealForm } from "@/components/client/AddMealForm";
import Link from "next/link";

export default async function MealsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const todayLogs = await getMealLogsForDate(user.id, new Date());
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const getParam = (key: string) => {
    const v = (resolvedSearchParams as any)?.[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const logged = getParam("logged") === "1";
  const deleted = getParam("deleted") === "1";

  // Group logs by meal type for display
  const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "OTHER"] as const;
  const logsByType = mealOrder.map((type) => ({
    type,
    label: type === "OTHER" ? "Other" : type.charAt(0) + type.slice(1).toLowerCase(),
    logs: todayLogs.filter((l) => l.mealType === type),
  }));

  return (
    <main className="min-h-screen bg-white" aria-labelledby="meals-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {logged && (
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <p className="text-sm text-black/80">Meal logged successfully.</p>
          </div>
        )}
        {deleted && (
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <p className="text-sm text-black/80">Meal log removed.</p>
          </div>
        )}

        <header className="space-y-2">
          <h1 id="meals-title" className="text-4xl font-bold text-black tracking-tight">Meal Logging</h1>
          <p className="text-sm text-black/70">
            Record your daily meals. This is informational data capture only — no nutritional analysis or medical advice.
          </p>
        </header>

        <section className="space-y-4" aria-label="Log a meal">
          <h2 className="text-2xl font-bold text-black">Log a Meal</h2>
          <AddMealForm />
        </section>

        <section className="space-y-4" aria-label="Today's meals">
          <h2 className="text-2xl font-bold text-black">Today's Meals</h2>
          <p className="text-sm text-black/70">
            Meals logged for {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {logsByType.map(({ type, label, logs }) => (
              <div key={type} className="border border-black/10 rounded-xl p-4 bg-white min-h-24">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-black/60">{label}</p>
                </div>
                {logs.length > 0 ? (
                  <ul className="space-y-2">
                    {logs.map((log) => (
                      <li key={log.id} className="flex items-start justify-between gap-2">
                        <p className="text-sm text-black/80 flex-1">{log.descriptionText}</p>
                        <Link
                          href={`/meals/delete/${log.id}`}
                          className="text-xs text-black/50 underline hover:text-black shrink-0"
                        >
                          Remove
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-black/40 italic">Not logged</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-black/10 pt-6 space-y-2" aria-label="History link">
          <Link href="/meals/history" className="text-sm underline text-black hover:text-black/70">
            View meal history »
          </Link>
        </section>

        <footer className="border-t border-black/10 pt-6 text-xs text-black/50">
          Meal data is for personal tracking only. No nutritional calculations or dietary advice are provided by this system.
        </footer>
      </div>
    </main>
  );
}
