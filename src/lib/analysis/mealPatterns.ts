/**
 * Meal Pattern Extraction Service
 *
 * Analyzes meal logs to extract frequency patterns and diversity metrics.
 * Pure aggregation only — no deficiency diagnosis, no thresholds, no recommendations.
 */

import {
  NutrientDomain,
  extractIngredientMatches,
  getAllDomains,
} from "@/lib/nutrition/ingredientMap";
import { MealType } from "@prisma/client";

// === Input Types ===

export interface MealLogEntry {
  id: string;
  mealType: MealType;
  descriptionText: string;
  logDate: string; // YYYY-MM-DD
  loggedAt: Date | string;
}

// === Output Types ===

export interface NutrientDomainFrequency {
  domain: NutrientDomain;
  count: number;
  mealIds: string[];
}

export interface MealTypeFrequency {
  mealType: MealType;
  count: number;
}

export interface DailyMealCount {
  date: string;
  count: number;
  mealTypes: MealType[];
}

export interface DiversityMetrics {
  /** Number of unique nutrient domains detected */
  uniqueDomainCount: number;
  /** Total possible domains */
  totalPossibleDomains: number;
  /** Number of unique ingredient keywords detected */
  uniqueIngredientCount: number;
  /** List of detected domains */
  detectedDomains: NutrientDomain[];
}

export interface MealPatternResult {
  /** Analysis period info */
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
    daysWithMeals: number;
  };

  /** Total meal count in period */
  totalMeals: number;

  /** Frequency counts by nutrient domain */
  nutrientDomainFrequencies: NutrientDomainFrequency[];

  /** Frequency counts by meal type */
  mealTypeFrequencies: MealTypeFrequency[];

  /** Daily meal counts */
  dailyCounts: DailyMealCount[];

  /** Diversity metrics */
  diversity: DiversityMetrics;
}

// === Internal Helpers ===

function toDateString(date: Date | string): string {
  if (typeof date === "string") {
    // If already YYYY-MM-DD, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    return new Date(date).toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function getUniqueDates(logs: MealLogEntry[]): string[] {
  const dates = new Set<string>();
  for (const log of logs) {
    dates.add(log.logDate);
  }
  return Array.from(dates).sort();
}

function calculateDateRange(dates: string[]): {
  startDate: string;
  endDate: string;
  totalDays: number;
} {
  if (dates.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    return { startDate: today, endDate: today, totalDays: 0 };
  }

  const sorted = [...dates].sort();
  const startDate = sorted[0];
  const endDate = sorted[sorted.length - 1];

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1;

  return { startDate, endDate, totalDays };
}

// === Main Analysis Function ===

/**
 * Extract meal patterns from a list of meal logs.
 * Pure aggregation — no diagnosis, thresholds, or recommendations.
 *
 * @param logs - Array of meal log entries
 * @returns MealPatternResult with frequency counts and diversity metrics
 */
export function extractMealPatterns(logs: MealLogEntry[]): MealPatternResult {
  // Handle empty input
  if (logs.length === 0) {
    return {
      period: {
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        totalDays: 0,
        daysWithMeals: 0,
      },
      totalMeals: 0,
      nutrientDomainFrequencies: [],
      mealTypeFrequencies: [],
      dailyCounts: [],
      diversity: {
        uniqueDomainCount: 0,
        totalPossibleDomains: getAllDomains().length,
        uniqueIngredientCount: 0,
        detectedDomains: [],
      },
    };
  }

  // Calculate period info
  const uniqueDates = getUniqueDates(logs);
  const dateRange = calculateDateRange(uniqueDates);

  // Aggregate nutrient domain frequencies
  const domainCounts = new Map<NutrientDomain, Set<string>>();
  const allIngredients = new Set<string>();

  for (const log of logs) {
    const matches = extractIngredientMatches(log.descriptionText);

    for (const match of matches) {
      allIngredients.add(match.keyword);

      for (const domain of match.domains) {
        const existing = domainCounts.get(domain) ?? new Set();
        existing.add(log.id);
        domainCounts.set(domain, existing);
      }
    }
  }

  const nutrientDomainFrequencies: NutrientDomainFrequency[] = [];
  for (const [domain, mealIdSet] of domainCounts) {
    nutrientDomainFrequencies.push({
      domain,
      count: mealIdSet.size,
      mealIds: Array.from(mealIdSet),
    });
  }

  // Sort by count descending
  nutrientDomainFrequencies.sort((a, b) => b.count - a.count);

  // Aggregate meal type frequencies
  const mealTypeCounts = new Map<MealType, number>();
  for (const log of logs) {
    const current = mealTypeCounts.get(log.mealType) ?? 0;
    mealTypeCounts.set(log.mealType, current + 1);
  }

  const mealTypeFrequencies: MealTypeFrequency[] = [];
  for (const [mealType, count] of mealTypeCounts) {
    mealTypeFrequencies.push({ mealType, count });
  }

  // Sort by count descending
  mealTypeFrequencies.sort((a, b) => b.count - a.count);

  // Calculate daily counts
  const dailyMap = new Map<string, { count: number; types: Set<MealType> }>();
  for (const log of logs) {
    const existing = dailyMap.get(log.logDate) ?? {
      count: 0,
      types: new Set(),
    };
    existing.count++;
    existing.types.add(log.mealType);
    dailyMap.set(log.logDate, existing);
  }

  const dailyCounts: DailyMealCount[] = [];
  for (const [date, data] of dailyMap) {
    dailyCounts.push({
      date,
      count: data.count,
      mealTypes: Array.from(data.types),
    });
  }

  // Sort by date ascending
  dailyCounts.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate diversity metrics
  const detectedDomains = Array.from(domainCounts.keys());
  const diversity: DiversityMetrics = {
    uniqueDomainCount: detectedDomains.length,
    totalPossibleDomains: getAllDomains().length,
    uniqueIngredientCount: allIngredients.size,
    detectedDomains,
  };

  return {
    period: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      totalDays: dateRange.totalDays,
      daysWithMeals: uniqueDates.length,
    },
    totalMeals: logs.length,
    nutrientDomainFrequencies,
    mealTypeFrequencies,
    dailyCounts,
    diversity,
  };
}

// === Utility Functions ===

/**
 * Get nutrient domain frequencies only.
 *
 * @param logs - Array of meal log entries
 * @returns Array of nutrient domain frequency counts
 */
export function getNutrientDomainCounts(
  logs: MealLogEntry[]
): NutrientDomainFrequency[] {
  return extractMealPatterns(logs).nutrientDomainFrequencies;
}

/**
 * Get meal type frequencies only.
 *
 * @param logs - Array of meal log entries
 * @returns Array of meal type frequency counts
 */
export function getMealTypeCounts(logs: MealLogEntry[]): MealTypeFrequency[] {
  return extractMealPatterns(logs).mealTypeFrequencies;
}

/**
 * Get diversity metrics only.
 *
 * @param logs - Array of meal log entries
 * @returns Diversity metrics
 */
export function getDiversityMetrics(logs: MealLogEntry[]): DiversityMetrics {
  return extractMealPatterns(logs).diversity;
}

/**
 * Get average meals per day.
 *
 * @param logs - Array of meal log entries
 * @returns Average meals per day (0 if no days with meals)
 */
export function getAverageMealsPerDay(logs: MealLogEntry[]): number {
  const result = extractMealPatterns(logs);
  if (result.period.daysWithMeals === 0) return 0;
  return result.totalMeals / result.period.daysWithMeals;
}

/**
 * Get domains that appeared in meals, sorted by frequency.
 *
 * @param logs - Array of meal log entries
 * @returns Array of domains sorted by occurrence count
 */
export function getDomainsRankedByFrequency(
  logs: MealLogEntry[]
): NutrientDomain[] {
  const frequencies = getNutrientDomainCounts(logs);
  return frequencies.map((f) => f.domain);
}

/**
 * Count how many meals contain a specific nutrient domain.
 *
 * @param logs - Array of meal log entries
 * @param domain - The nutrient domain to count
 * @returns Number of meals containing this domain
 */
export function countMealsWithDomain(
  logs: MealLogEntry[],
  domain: NutrientDomain
): number {
  const frequencies = getNutrientDomainCounts(logs);
  const found = frequencies.find((f) => f.domain === domain);
  return found?.count ?? 0;
}

/**
 * Get all unique ingredient keywords found in meal logs.
 *
 * @param logs - Array of meal log entries
 * @returns Set of unique ingredient keywords
 */
export function getUniqueIngredients(logs: MealLogEntry[]): Set<string> {
  const ingredients = new Set<string>();

  for (const log of logs) {
    const matches = extractIngredientMatches(log.descriptionText);
    for (const match of matches) {
      ingredients.add(match.keyword);
    }
  }

  return ingredients;
}
