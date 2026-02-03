/**
 * Day Window Utilities
 *
 * Server-side utilities for managing day boundaries in meal/intake logging.
 * A "log day" runs from 00:00 to 23:59 local time.
 *
 * Rules:
 * - A log day closes at local 23:59
 * - Past days are immutable for analysis purposes
 * - Editing old meal logs is allowed but flagged as late-entry
 */

// === Types ===

export interface LocalDateResult {
  /** ISO date string YYYY-MM-DD */
  dateString: string;
  /** Full Date object at start of day (00:00:00.000) */
  dayStart: Date;
  /** Full Date object at end of day (23:59:59.999) */
  dayEnd: Date;
  /** Year component */
  year: number;
  /** Month component (1-12) */
  month: number;
  /** Day component (1-31) */
  day: number;
}

export interface SameLogDayResult {
  /** Whether the timestamp falls within the given log day */
  isSameDay: boolean;
  /** The log day the timestamp belongs to (YYYY-MM-DD) */
  timestampLogDay: string;
  /** The comparison log day (YYYY-MM-DD) */
  comparisonLogDay: string;
  /** Days difference (positive = timestamp is in future, negative = past) */
  daysDifference: number;
}

export interface DayClosedResult {
  /** Whether the log day has closed (past 23:59) */
  isClosed: boolean;
  /** The log day being checked (YYYY-MM-DD) */
  logDay: string;
  /** Current log day (YYYY-MM-DD) */
  currentLogDay: string;
  /** How many days ago this day closed (0 = today/not closed, 1 = yesterday, etc.) */
  daysAgo: number;
  /** Whether entries for this day would be flagged as late-entry */
  isLateEntry: boolean;
  /** Human-readable status */
  status: "open" | "closed-yesterday" | "closed-past";
}

// === Internal Helpers ===

/**
 * Convert a Date to YYYY-MM-DD string in local timezone
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get start of day (00:00:00.000) for a given date in local timezone
 */
function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day (23:59:59.999) for a given date in local timezone
 */
function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Parse a YYYY-MM-DD string to a Date at start of that day (local timezone)
 */
function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Calculate the difference in calendar days between two dates
 * Positive if date1 > date2
 */
function daysDifference(date1: Date, date2: Date): number {
  const start1 = getStartOfDay(date1);
  const start2 = getStartOfDay(date2);
  const diffMs = start1.getTime() - start2.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

// === Public API ===

/**
 * Get the current local date with structured information.
 *
 * @returns LocalDateResult with date string, boundaries, and components
 */
export function getCurrentLocalDate(): LocalDateResult {
  const now = new Date();
  const dateString = toLocalDateString(now);

  return {
    dateString,
    dayStart: getStartOfDay(now),
    dayEnd: getEndOfDay(now),
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

/**
 * Check if a timestamp falls within the same log day as a given date.
 *
 * @param timestamp - The timestamp to check (Date object or ISO string)
 * @param date - The date to compare against (Date object or YYYY-MM-DD string)
 * @returns SameLogDayResult with comparison details
 */
export function isSameLogDay(
  timestamp: Date | string,
  date: Date | string
): SameLogDayResult {
  // Normalize timestamp
  const tsDate = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const timestampLogDay = toLocalDateString(tsDate);

  // Normalize comparison date
  let comparisonLogDay: string;
  if (typeof date === "string") {
    // If it's already YYYY-MM-DD format, use directly; otherwise parse as Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      comparisonLogDay = date;
    } else {
      comparisonLogDay = toLocalDateString(new Date(date));
    }
  } else {
    comparisonLogDay = toLocalDateString(date);
  }

  const tsParsed = parseDateString(timestampLogDay);
  const compParsed = parseDateString(comparisonLogDay);
  const diff = daysDifference(tsParsed, compParsed);

  return {
    isSameDay: timestampLogDay === comparisonLogDay,
    timestampLogDay,
    comparisonLogDay,
    daysDifference: diff,
  };
}

/**
 * Check if a log day has closed (is in the past).
 * A day closes at local 23:59:59.999.
 *
 * Past days are immutable for analysis purposes, but editing is allowed
 * with a late-entry flag.
 *
 * @param date - The date to check (Date object or YYYY-MM-DD string)
 * @returns DayClosedResult with closure status and late-entry flag
 */
export function isDayClosed(date: Date | string): DayClosedResult {
  const now = new Date();
  const currentLogDay = toLocalDateString(now);

  // Normalize input date
  let logDay: string;
  let checkDate: Date;

  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      logDay = date;
      checkDate = parseDateString(date);
    } else {
      checkDate = new Date(date);
      logDay = toLocalDateString(checkDate);
    }
  } else {
    checkDate = date;
    logDay = toLocalDateString(date);
  }

  const daysAgo = daysDifference(parseDateString(currentLogDay), parseDateString(logDay));
  const isClosed = daysAgo > 0;

  // Determine status
  let status: "open" | "closed-yesterday" | "closed-past";
  if (!isClosed) {
    status = "open";
  } else if (daysAgo === 1) {
    status = "closed-yesterday";
  } else {
    status = "closed-past";
  }

  return {
    isClosed,
    logDay,
    currentLogDay,
    daysAgo: Math.max(0, daysAgo),
    isLateEntry: isClosed,
    status,
  };
}

/**
 * Get the log day for a given timestamp.
 * Convenience function for extracting just the date string.
 *
 * @param timestamp - The timestamp (Date object or ISO string)
 * @returns YYYY-MM-DD string representing the log day
 */
export function getLogDay(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return toLocalDateString(date);
}

/**
 * Check if adding/editing a log for a given date would be a late entry.
 * This is a convenience wrapper around isDayClosed.
 *
 * @param logDate - The date of the log entry (Date object or YYYY-MM-DD string)
 * @returns Object with isLateEntry flag and days since closure
 */
export function checkLateEntry(logDate: Date | string): {
  isLateEntry: boolean;
  daysSinceClosure: number;
  logDay: string;
} {
  const result = isDayClosed(logDate);
  return {
    isLateEntry: result.isLateEntry,
    daysSinceClosure: result.daysAgo,
    logDay: result.logDay,
  };
}
