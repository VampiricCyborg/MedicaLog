/**
 * Readiness Validator
 *
 * Checks data sufficiency for analysis features:
 * - Minimum meal log days
 * - Minimum medication entries
 * - Logging coverage percentage
 *
 * Returns structured readiness object with reasons.
 * No UI, no medical advice, pure validation logic.
 */

// === Configuration Thresholds ===

export interface ReadinessThresholds {
  /** Minimum days with at least one meal log */
  minMealLogDays: number;
  /** Minimum total medication entries */
  minMedicationEntries: number;
  /** Minimum logging coverage percentage (0-100) */
  minCoveragePercent: number;
  /** Window size in days for coverage calculation */
  coverageWindowDays: number;
}

export const DEFAULT_THRESHOLDS: ReadinessThresholds = {
  minMealLogDays: 3,
  minMedicationEntries: 1,
  minCoveragePercent: 40,
  coverageWindowDays: 7,
};

// === Input Types ===

export interface ReadinessInput {
  /** Number of unique days with at least one meal log */
  mealLogDays: number;
  /** Total number of medication entries */
  medicationEntries: number;
  /** Number of days in the analysis window */
  windowDays: number;
  /** Number of days with any logged activity (meals or intakes) */
  daysWithActivity: number;
}

// === Check Result Types ===

export type CheckStatus = "pass" | "fail" | "warn";

export interface ReadinessCheck {
  /** Unique identifier for this check */
  checkId: string;
  /** Status of the check */
  status: CheckStatus;
  /** Current value */
  currentValue: number;
  /** Required threshold */
  requiredValue: number;
  /** Unit of measurement */
  unit: string;
}

export interface ReadinessResult {
  /** Overall readiness status */
  isReady: boolean;
  /** Individual check results */
  checks: {
    mealLogDays: ReadinessCheck;
    medicationEntries: ReadinessCheck;
    loggingCoverage: ReadinessCheck;
  };
  /** List of failing check IDs */
  failingChecks: string[];
  /** List of warning check IDs */
  warningChecks: string[];
  /** Computed coverage percentage */
  coveragePercent: number;
  /** Summary counts */
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
  };
}

// === Core Validation Functions ===

/**
 * Check if meal log days meet minimum threshold.
 */
function checkMealLogDays(
  mealLogDays: number,
  threshold: number
): ReadinessCheck {
  const status: CheckStatus =
    mealLogDays >= threshold
      ? "pass"
      : mealLogDays >= threshold * 0.5
        ? "warn"
        : "fail";

  return {
    checkId: "meal_log_days",
    status,
    currentValue: mealLogDays,
    requiredValue: threshold,
    unit: "days",
  };
}

/**
 * Check if medication entries meet minimum threshold.
 */
function checkMedicationEntries(
  medicationEntries: number,
  threshold: number
): ReadinessCheck {
  const status: CheckStatus = medicationEntries >= threshold ? "pass" : "fail";

  return {
    checkId: "medication_entries",
    status,
    currentValue: medicationEntries,
    requiredValue: threshold,
    unit: "medications",
  };
}

/**
 * Check if logging coverage meets minimum threshold.
 */
function checkLoggingCoverage(
  daysWithActivity: number,
  windowDays: number,
  thresholdPercent: number
): ReadinessCheck {
  const effectiveWindow = Math.max(1, windowDays);
  const coveragePercent = Math.round(
    (daysWithActivity / effectiveWindow) * 100
  );

  const status: CheckStatus =
    coveragePercent >= thresholdPercent
      ? "pass"
      : coveragePercent >= thresholdPercent * 0.5
        ? "warn"
        : "fail";

  return {
    checkId: "logging_coverage",
    status,
    currentValue: coveragePercent,
    requiredValue: thresholdPercent,
    unit: "percent",
  };
}

// === Main Validation Function ===

/**
 * Validate data readiness for analysis features.
 *
 * @param input - Current data counts
 * @param thresholds - Optional custom thresholds (defaults to DEFAULT_THRESHOLDS)
 * @returns ReadinessResult with check details and overall status
 */
export function validateReadiness(
  input: ReadinessInput,
  thresholds: Partial<ReadinessThresholds> = {}
): ReadinessResult {
  const config: ReadinessThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...thresholds,
  };

  // Run individual checks
  const mealLogDaysCheck = checkMealLogDays(
    input.mealLogDays,
    config.minMealLogDays
  );

  const medicationEntriesCheck = checkMedicationEntries(
    input.medicationEntries,
    config.minMedicationEntries
  );

  const loggingCoverageCheck = checkLoggingCoverage(
    input.daysWithActivity,
    input.windowDays,
    config.minCoveragePercent
  );

  // Aggregate results
  const checks = {
    mealLogDays: mealLogDaysCheck,
    medicationEntries: medicationEntriesCheck,
    loggingCoverage: loggingCoverageCheck,
  };

  const allChecks = Object.values(checks);
  const failingChecks = allChecks
    .filter((c) => c.status === "fail")
    .map((c) => c.checkId);
  const warningChecks = allChecks
    .filter((c) => c.status === "warn")
    .map((c) => c.checkId);

  const passedChecks = allChecks.filter((c) => c.status === "pass").length;

  // Overall readiness requires no failures
  const isReady = failingChecks.length === 0;

  // Compute coverage percentage
  const effectiveWindow = Math.max(1, input.windowDays);
  const coveragePercent = Math.round(
    (input.daysWithActivity / effectiveWindow) * 100
  );

  return {
    isReady,
    checks,
    failingChecks,
    warningChecks,
    coveragePercent,
    summary: {
      totalChecks: allChecks.length,
      passedChecks,
      failedChecks: failingChecks.length,
      warningChecks: warningChecks.length,
    },
  };
}

// === Utility Functions ===

/**
 * Check if result indicates full readiness (no failures, no warnings).
 */
export function isFullyReady(result: ReadinessResult): boolean {
  return result.isReady && result.warningChecks.length === 0;
}

/**
 * Check if a specific check passed.
 */
export function didCheckPass(
  result: ReadinessResult,
  checkId: keyof ReadinessResult["checks"]
): boolean {
  return result.checks[checkId].status === "pass";
}

/**
 * Get the most critical failing check (if any).
 */
export function getMostCriticalFailure(
  result: ReadinessResult
): ReadinessCheck | null {
  if (result.failingChecks.length === 0) return null;

  // Priority: medication_entries > meal_log_days > logging_coverage
  const priority = ["medication_entries", "meal_log_days", "logging_coverage"];

  for (const checkId of priority) {
    if (result.failingChecks.includes(checkId)) {
      const key = checkId === "medication_entries"
        ? "medicationEntries"
        : checkId === "meal_log_days"
          ? "mealLogDays"
          : "loggingCoverage";
      return result.checks[key as keyof ReadinessResult["checks"]];
    }
  }

  return null;
}

/**
 * Calculate progress percentage toward readiness.
 */
export function calculateReadinessProgress(result: ReadinessResult): number {
  const { checks } = result;
  let totalProgress = 0;
  let checkCount = 0;

  for (const check of Object.values(checks)) {
    checkCount++;
    if (check.requiredValue === 0) {
      totalProgress += 100;
    } else {
      const progress = Math.min(
        100,
        Math.round((check.currentValue / check.requiredValue) * 100)
      );
      totalProgress += progress;
    }
  }

  return checkCount > 0 ? Math.round(totalProgress / checkCount) : 0;
}

/**
 * Create input from meal pattern and regimen profile data.
 * Helper for integration with existing analysis modules.
 */
export function createReadinessInputFromAnalysis(
  mealPatternData: {
    period: { daysWithMeals: number; totalDays: number };
    totalMeals: number;
  },
  regimenData: { totalMedications: number }
): ReadinessInput {
  return {
    mealLogDays: mealPatternData.period.daysWithMeals,
    medicationEntries: regimenData.totalMedications,
    windowDays: mealPatternData.period.totalDays,
    daysWithActivity: mealPatternData.period.daysWithMeals,
  };
}
