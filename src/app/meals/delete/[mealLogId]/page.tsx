import { requireUser } from "@/lib/server/auth";
import prisma from "@/lib/data/prisma";
import { DeleteMealLogConfirm } from "@/components/client/DeleteMealLogConfirm";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    mealLogId: string;
  }>;
}

export default async function DeleteMealLogPage({ params }: PageProps) {
  const user = await requireUser();
  const { mealLogId } = await params;

  const mealLog = await prisma.mealLog.findUnique({
    where: { id: mealLogId },
  });

  if (!mealLog || mealLog.patientId !== user.id) {
    notFound();
  }

  const mealTypeLabel = mealLog.mealType === "OTHER" 
    ? "Other" 
    : mealLog.mealType.charAt(0) + mealLog.mealType.slice(1).toLowerCase();

  return (
    <main className="min-h-screen bg-white" aria-labelledby="delete-meal-title">
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        <header className="space-y-2">
          <h1 id="delete-meal-title" className="text-2xl font-bold text-black">Remove Meal Log</h1>
          <p className="text-sm text-black/70">
            Are you sure you want to remove this meal log?
          </p>
        </header>

        <div className="border border-black/10 rounded-xl p-4 bg-white space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">{mealTypeLabel}</p>
          <p className="text-sm text-black/80">{mealLog.descriptionText}</p>
          <p className="text-xs text-black/50">
            Logged on {mealLog.logDate} at {mealLog.loggedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>

        <DeleteMealLogConfirm mealLogId={mealLogId} />
      </div>
    </main>
  );
}
