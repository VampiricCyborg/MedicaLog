"use server";

import { requireUser } from "@/lib/server/auth";
import { addMealLog, deleteMealLog } from "@/lib/data/persistence";
import { validateMealLogInput } from "@/lib/validation/inputSchemas";
import { mapToSafeError } from "@/lib/errors";
import { redirect } from "next/navigation";

export interface AddMealLogInput {
  mealType: string;
  descriptionText: string;
}

export interface AddMealLogResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Server action: add a meal log for the authenticated user.
 * Multiple logs per meal type per day are allowed.
 */
export async function addMealLogAction(input: AddMealLogInput): Promise<AddMealLogResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  // Validate input
  const validation = validateMealLogInput(input);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  try {
    await addMealLog(user.id, {
      mealType: validation.value.mealType as any,
      descriptionText: validation.value.descriptionText,
    });

    // Success: redirect to meals page with confirmation
    redirect("/meals?logged=1");
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to log meal");
    return { ok: false, errors: [safe.message] };
  }
}

export interface DeleteMealLogInput {
  mealLogId: string;
}

export interface DeleteMealLogResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Server action: delete a meal log with ownership enforcement.
 */
export async function deleteMealLogAction(input: DeleteMealLogInput): Promise<DeleteMealLogResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  if (!input.mealLogId || typeof input.mealLogId !== "string" || input.mealLogId.trim().length === 0) {
    return { ok: false, errors: ["Meal log identifier is required"] };
  }

  try {
    await deleteMealLog(user.id, input.mealLogId);

    // Success: redirect to meals page with confirmation
    redirect("/meals?deleted=1");
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to delete meal log");
    return { ok: false, errors: [safe.message] };
  }
}
