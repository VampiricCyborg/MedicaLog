"use server";

/**
 * Server actions for patient meal logging.
 *
 * Rules:
 * - Patient role validated (user without DoctorProfile)
 * - patientId derived from session, never from client input
 * - logDate derived server-side from loggedAt timestamp
 * - Empty descriptions rejected
 * - No nutrition computation
 * - Returns plain DTO objects
 */

import { requireUser } from "@/lib/server/auth";
import prisma from "@/lib/data/prisma";
import { MealType } from "@prisma/client";
import { getLogDay, checkLateEntry } from "@/lib/dayWindow";

// === DTO Types ===

export interface MealLogDTO {
  id: string;
  patientId: string;
  mealType: MealType;
  descriptionText: string;
  loggedAt: string; // ISO string for serialization
  logDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  isLateEntry: boolean;
}

export interface ActionResult<T = void> {
  ok: boolean;
  data?: T;
  errors?: string[];
}

// === Internal Helpers ===

/**
 * Validate that the current user is a patient (not a doctor).
 * Returns the user id if valid, throws AuthError otherwise.
 */
async function requirePatient(): Promise<string> {
  const user = await requireUser({ onFail: "throw" });

  // Check if user has a doctor profile - if so, they are not a patient
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
  });

  if (doctorProfile) {
    const { AuthError } = await import("@/lib/errors");
    throw new AuthError("Patient access required. Doctors cannot log meals.");
  }

  return user.id;
}

/**
 * Validate meal type is a valid enum value.
 */
function isValidMealType(value: unknown): value is MealType {
  return (
    typeof value === "string" &&
    ["BREAKFAST", "LUNCH", "DINNER", "OTHER"].includes(value)
  );
}

/**
 * Validate description text is non-empty.
 */
function validateDescription(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 1000) return null;
  return trimmed;
}

/**
 * Convert a Prisma MealLog to a plain DTO.
 */
function toMealLogDTO(log: {
  id: string;
  patientId: string;
  mealType: MealType;
  descriptionText: string;
  loggedAt: Date;
  logDate: string;
  createdAt: Date;
}): MealLogDTO {
  const lateEntry = checkLateEntry(log.logDate);

  return {
    id: log.id,
    patientId: log.patientId,
    mealType: log.mealType,
    descriptionText: log.descriptionText,
    loggedAt: log.loggedAt.toISOString(),
    logDate: log.logDate,
    createdAt: log.createdAt.toISOString(),
    isLateEntry: lateEntry.isLateEntry,
  };
}

// === Public Server Actions ===

export interface CreateMealLogInput {
  mealType: string;
  descriptionText: string;
}

/**
 * Create a new meal log for the authenticated patient.
 *
 * - patientId attached from session
 * - logDate derived server-side from current timestamp
 * - Empty descriptions rejected
 * - No nutrition computation
 */
export async function createMealLog(
  input: CreateMealLogInput
): Promise<ActionResult<MealLogDTO>> {
  try {
    const patientId = await requirePatient();

    // Validate input structure
    if (!input || typeof input !== "object") {
      return { ok: false, errors: ["Invalid input"] };
    }

    // Validate meal type
    if (!isValidMealType(input.mealType)) {
      return {
        ok: false,
        errors: ["Meal type must be BREAKFAST, LUNCH, DINNER, or OTHER"],
      };
    }

    // Validate description
    const description = validateDescription(input.descriptionText);
    if (!description) {
      return {
        ok: false,
        errors: ["Meal description is required (1-1000 characters)"],
      };
    }

    // Derive loggedAt and logDate server-side
    const loggedAt = new Date();
    const logDate = getLogDay(loggedAt);

    // Create the meal log
    const created = await prisma.mealLog.create({
      data: {
        patientId,
        mealType: input.mealType as MealType,
        descriptionText: description,
        loggedAt,
        logDate,
      },
    });

    return {
      ok: true,
      data: toMealLogDTO(created),
    };
  } catch (err) {
    const { mapToSafeError } = await import("@/lib/errors");
    const safe = mapToSafeError(err, "Failed to create meal log");
    return { ok: false, errors: [safe.message] };
  }
}

export interface UpdateMealLogInput {
  mealLogId: string;
  descriptionText: string;
}

/**
 * Update an existing meal log for the authenticated patient.
 *
 * - Ownership enforced via patientId from session
 * - Only descriptionText can be updated (mealType and logDate are immutable)
 * - Empty descriptions rejected
 * - Late entries are flagged but allowed
 */
export async function updateMealLog(
  input: UpdateMealLogInput
): Promise<ActionResult<MealLogDTO>> {
  try {
    const patientId = await requirePatient();

    // Validate input structure
    if (!input || typeof input !== "object") {
      return { ok: false, errors: ["Invalid input"] };
    }

    // Validate mealLogId
    if (
      !input.mealLogId ||
      typeof input.mealLogId !== "string" ||
      input.mealLogId.trim().length === 0
    ) {
      return { ok: false, errors: ["Meal log identifier is required"] };
    }

    // Validate description
    const description = validateDescription(input.descriptionText);
    if (!description) {
      return {
        ok: false,
        errors: ["Meal description is required (1-1000 characters)"],
      };
    }

    // Find the existing meal log with ownership check
    const existing = await prisma.mealLog.findUnique({
      where: { id: input.mealLogId.trim() },
    });

    if (!existing) {
      return { ok: false, errors: ["Meal log not found"] };
    }

    if (existing.patientId !== patientId) {
      return { ok: false, errors: ["Meal log not accessible"] };
    }

    // Update the meal log (only descriptionText is mutable)
    const updated = await prisma.mealLog.update({
      where: { id: existing.id },
      data: {
        descriptionText: description,
      },
    });

    return {
      ok: true,
      data: toMealLogDTO(updated),
    };
  } catch (err) {
    const { mapToSafeError } = await import("@/lib/errors");
    const safe = mapToSafeError(err, "Failed to update meal log");
    return { ok: false, errors: [safe.message] };
  }
}

export interface ListMealLogsByDateInput {
  date: string; // YYYY-MM-DD format
}

/**
 * List all meal logs for the authenticated patient on a specific date.
 *
 * - patientId from session
 * - Returns plain DTO array
 * - No nutrition computation
 */
export async function listMealLogsByDate(
  input: ListMealLogsByDateInput
): Promise<ActionResult<MealLogDTO[]>> {
  try {
    const patientId = await requirePatient();

    // Validate input structure
    if (!input || typeof input !== "object") {
      return { ok: false, errors: ["Invalid input"] };
    }

    // Validate date format (YYYY-MM-DD)
    if (
      !input.date ||
      typeof input.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.date)
    ) {
      return { ok: false, errors: ["Date must be in YYYY-MM-DD format"] };
    }

    // Query meal logs for the patient on the specified date
    const logs = await prisma.mealLog.findMany({
      where: {
        patientId,
        logDate: input.date,
      },
      orderBy: { loggedAt: "asc" },
    });

    return {
      ok: true,
      data: logs.map(toMealLogDTO),
    };
  } catch (err) {
    const { mapToSafeError } = await import("@/lib/errors");
    const safe = mapToSafeError(err, "Failed to list meal logs");
    return { ok: false, errors: [safe.message] };
  }
}
