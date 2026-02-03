import { requireUser } from "@/lib/server/auth";
import prisma from "@/lib/data/prisma";
import { redirect } from "next/navigation";
import { getCurrentLocalDate } from "@/lib/dayWindow";
import { PatientMealForm } from "./PatientMealForm";
import Link from "next/link";
import { MealType } from "@prisma/client";

// Ordered meal types for display grouping
const MEAL_TYPE_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "OTHER"];

function mealTypeLabel(type: MealType): string {
  switch (type) {
    case "BREAKFAST":
      return "Breakfast";
    case "LUNCH":
      return "Lunch";
    case "DINNER":
      return "Dinner";
    case "OTHER":
      return "Other";
    default:
      return type;
  }
}

export default async function PatientMealsPage() {
  const user = await requireUser();

  // Ensure user is a patient (not a doctor)
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
  });

  if (doctorProfile) {
    redirect("/doctor");
  }

  // Get today's date info
  const today = getCurrentLocalDate();

  // Fetch today's meal logs for display
  const todayLogs = await prisma.mealLog.findMany({
    where: {
      patientId: user.id,
      logDate: today.dateString,
    },
    orderBy: { loggedAt: "asc" },
  });

  // Group logs by meal type
  const logsByType = MEAL_TYPE_ORDER.map((type) => ({
    type,
    label: mealTypeLabel(type),
    logs: todayLogs.filter((log) => log.mealType === type),
  }));

  // Check if any logs exist
  const hasLogs = todayLogs.length > 0;

  return (
    <main className="min-h-screen bg-white" aria-labelledby="meals-title">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <h1
            id="meals-title"
            className="text-3xl font-bold text-black tracking-tight"
          >
            Meal Logging
          </h1>
          <p className="text-sm text-black/70">
            Record what you ate. This is for personal tracking only.
          </p>
        </header>

        <section className="space-y-4" aria-label="Log a meal">
          <h2 className="text-xl font-semibold text-black">Log a Meal</h2>
          <div className="border border-black/10 rounded-xl p-6 bg-white">
            <PatientMealForm />
          </div>
        </section>

        <section className="space-y-4" aria-label="Today's meals">
          <h2 className="text-xl font-semibold text-black">Today's Meals</h2>
          <p className="text-sm text-black/60">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {!hasLogs ? (
            <div className="border border-black/10 rounded-xl p-6 bg-white">
              <p className="text-sm text-black/50">No meals logged today.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {logsByType.map(({ type, label, logs }) => (
                <div
                  key={type}
                  className="border border-black/10 rounded-xl p-4 bg-white"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-black/60 mb-3">
                    {label}
                  </h3>

                  {logs.length === 0 ? (
                    <p className="text-sm text-black/40 italic">Not logged</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="space-y-1 pb-3 border-b border-black/5 last:border-0 last:pb-0"
                        >
                          <p className="text-sm text-black/80">
                            {log.descriptionText}
                          </p>
                          <p className="text-xs text-black/40">
                            {log.loggedAt.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-black/10 pt-6 space-y-2">
          <Link
            href="/dashboard"
            className="text-sm underline text-black/70 hover:text-black"
          >
            ← Back to Dashboard
          </Link>
          <p className="text-xs text-black/50">
            Meal data is for personal tracking only. No nutritional analysis is
            provided.
          </p>
        </footer>
      </div>
    </main>
  );
}
