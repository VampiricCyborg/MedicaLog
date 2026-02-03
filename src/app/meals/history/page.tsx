import { requireUser } from "@/lib/server/auth";
import { getMealLogsForDateRange } from "@/lib/data/persistence";
import Link from "next/link";

export default async function MealHistoryPage() {
  const user = await requireUser();

  // Get last 30 days of meal logs
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const logs = await getMealLogsForDateRange(user.id, startDate, endDate);

  // Group logs by date
  const grouped = logs.reduce((acc, log) => {
    if (!acc[log.logDate]) acc[log.logDate] = [];
    acc[log.logDate].push(log);
    return acc;
  }, {} as Record<string, typeof logs>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const mealTypeLabel = (type: string) => 
    type === "OTHER" ? "Other" : type.charAt(0) + type.slice(1).toLowerCase();

  return (
    <main className="min-h-screen bg-white" aria-labelledby="history-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <div className="flex items-center gap-4">
            <Link href="/meals" className="text-sm underline text-black/70 hover:text-black">
              ← Back to Meal Logging
            </Link>
          </div>
          <h1 id="history-title" className="text-4xl font-bold text-black tracking-tight">Meal History</h1>
          <p className="text-sm text-black/70">
            Your meal logs from the last 30 days. This is historical data only — no analysis or interpretation.
          </p>
        </header>

        {sortedDates.length === 0 ? (
          <div className="border border-black/10 rounded-xl p-6 bg-white">
            <p className="text-sm text-black/70">No meal logs recorded in the last 30 days.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateStr) => {
              const dateLogs = grouped[dateStr];
              const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <section key={dateStr} className="border border-black/10 rounded-xl overflow-hidden">
                  <div className="bg-black/5 px-4 py-2 font-medium text-sm text-black">
                    {displayDate}
                  </div>
                  <div className="divide-y divide-black/10">
                    {dateLogs.map((log) => (
                      <div key={log.id} className="px-4 py-3 flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">
                            {mealTypeLabel(log.mealType)}
                          </p>
                          <p className="text-sm text-black/80">{log.descriptionText}</p>
                          <p className="text-xs text-black/40">
                            {log.loggedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer className="border-t border-black/10 pt-6 text-xs text-black/50">
          Meal data is for personal tracking only. No nutritional calculations or dietary advice are provided by this system.
        </footer>
      </div>
    </main>
  );
}
