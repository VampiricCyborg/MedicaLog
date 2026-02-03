/**
 * AI Enrichment Service Wrapper
 *
 * Accepts structured regimen + meal pattern data, calls external AI API,
 * and returns strictly validated JSON.
 *
 * Rules:
 * - No prompt text inside UI
 * - No direct UI calls
 * - Strict schema validation on response
 * - Fail closed if schema mismatch
 */

import type { RegimenProfileResult } from "@/lib/analysis/regimenProfile";
import type { MealPatternResult } from "@/lib/analysis/mealPatterns";
import type { NutrientDomain } from "@/lib/nutrition/ingredientMap";
import type { FoodCategory, InteractionCategory } from "@/lib/medication/foodInteractions";
import type { SideEffectDomain } from "@/lib/analysis/regimenProfile";

// === Output Schema Types ===

export interface NutrientGapObservation {
  domain: NutrientDomain;
  observationType: "low_frequency" | "absent" | "declining";
  confidence: "low" | "moderate" | "high";
}

export interface InteractionConcern {
  foodCategory: FoodCategory;
  interactionCategory: InteractionCategory;
  affectedMedicationClasses: string[];
  mealOccurrences: number;
}

export interface MealTimingPattern {
  patternType: "irregular_timing" | "skipped_meals" | "clustered_meals";
  mealType: string;
  confidence: "low" | "moderate" | "high";
}

export interface RegimenMealCorrelation {
  correlationType: "side_effect_timing" | "interaction_timing" | "nutrient_gap";
  description: string;
  confidence: "low" | "moderate" | "high";
}

export interface EnrichmentResult {
  /** Observations about nutrient domain gaps */
  nutrientGapObservations: NutrientGapObservation[];

  /** Detected interaction concerns from meal logs */
  interactionConcerns: InteractionConcern[];

  /** Meal timing patterns detected */
  mealTimingPatterns: MealTimingPattern[];

  /** Correlations between regimen and meal patterns */
  regimenMealCorrelations: RegimenMealCorrelation[];

  /** Data quality assessment */
  dataQuality: {
    mealLogCount: number;
    medicationCount: number;
    analysisConfidence: "insufficient" | "low" | "moderate" | "high";
  };

  /** Processing metadata */
  metadata: {
    processedAt: string;
    modelUsed: string | null;
    fallbackUsed: boolean;
  };
}

// === Input Types ===

export interface EnrichmentInput {
  regimenProfile: RegimenProfileResult;
  mealPatterns: MealPatternResult;
}

export interface EnrichmentOptions {
  openaiApiKey?: string;
  model?: string;
  timeoutMs?: number;
}

// === Schema Validation ===

function isValidNutrientGapObservation(obj: unknown): obj is NutrientGapObservation {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  
  const validTypes = ["low_frequency", "absent", "declining"];
  const validConfidence = ["low", "moderate", "high"];
  
  return (
    typeof o.domain === "string" &&
    typeof o.observationType === "string" &&
    validTypes.includes(o.observationType) &&
    typeof o.confidence === "string" &&
    validConfidence.includes(o.confidence)
  );
}

function isValidInteractionConcern(obj: unknown): obj is InteractionConcern {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  
  const validCategories = ["AVOID", "SEPARATE_TIMING", "NEUTRAL"];
  
  return (
    typeof o.foodCategory === "string" &&
    typeof o.interactionCategory === "string" &&
    validCategories.includes(o.interactionCategory) &&
    Array.isArray(o.affectedMedicationClasses) &&
    typeof o.mealOccurrences === "number"
  );
}

function isValidMealTimingPattern(obj: unknown): obj is MealTimingPattern {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  
  const validTypes = ["irregular_timing", "skipped_meals", "clustered_meals"];
  const validConfidence = ["low", "moderate", "high"];
  
  return (
    typeof o.patternType === "string" &&
    validTypes.includes(o.patternType) &&
    typeof o.mealType === "string" &&
    typeof o.confidence === "string" &&
    validConfidence.includes(o.confidence)
  );
}

function isValidRegimenMealCorrelation(obj: unknown): obj is RegimenMealCorrelation {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  
  const validTypes = ["side_effect_timing", "interaction_timing", "nutrient_gap"];
  const validConfidence = ["low", "moderate", "high"];
  
  return (
    typeof o.correlationType === "string" &&
    validTypes.includes(o.correlationType) &&
    typeof o.description === "string" &&
    typeof o.confidence === "string" &&
    validConfidence.includes(o.confidence)
  );
}

function validateEnrichmentResponse(parsed: unknown): EnrichmentResult | null {
  if (!parsed || typeof parsed !== "object") return null;
  
  const obj = parsed as Record<string, unknown>;
  
  // Validate arrays exist
  if (!Array.isArray(obj.nutrientGapObservations)) return null;
  if (!Array.isArray(obj.interactionConcerns)) return null;
  if (!Array.isArray(obj.mealTimingPatterns)) return null;
  if (!Array.isArray(obj.regimenMealCorrelations)) return null;
  
  // Validate each item in arrays
  const nutrientGapObservations: NutrientGapObservation[] = [];
  for (const item of obj.nutrientGapObservations) {
    if (isValidNutrientGapObservation(item)) {
      nutrientGapObservations.push(item);
    }
    // Invalid items are silently dropped (fail closed = return null for entire response)
  }
  
  const interactionConcerns: InteractionConcern[] = [];
  for (const item of obj.interactionConcerns) {
    if (isValidInteractionConcern(item)) {
      interactionConcerns.push(item);
    }
  }
  
  const mealTimingPatterns: MealTimingPattern[] = [];
  for (const item of obj.mealTimingPatterns) {
    if (isValidMealTimingPattern(item)) {
      mealTimingPatterns.push(item);
    }
  }
  
  const regimenMealCorrelations: RegimenMealCorrelation[] = [];
  for (const item of obj.regimenMealCorrelations) {
    if (isValidRegimenMealCorrelation(item)) {
      regimenMealCorrelations.push(item);
    }
  }
  
  return {
    nutrientGapObservations,
    interactionConcerns,
    mealTimingPatterns,
    regimenMealCorrelations,
    dataQuality: {
      mealLogCount: 0,
      medicationCount: 0,
      analysisConfidence: "low",
    },
    metadata: {
      processedAt: new Date().toISOString(),
      modelUsed: null,
      fallbackUsed: false,
    },
  };
}

// === Prompt Construction (Internal Only) ===

function buildSystemPrompt(): string {
  return `You are a deterministic pattern analysis system for medication regimen and meal pattern correlation.

CONSTRAINTS (MANDATORY):
- You MUST NOT provide medical advice, diagnoses, recommendations, or dietary instructions.
- You MUST NOT use imperative language, urgency language, or action directives.
- You MUST NOT infer causation or suggest interventions.
- You MUST output valid JSON only, with no additional text or explanation.
- You MUST assign confidence levels (low, moderate, high) based solely on data evidence.
- If data is sparse or patterns are unclear, use "low" confidence or return empty arrays.
- You MUST NOT guess, extrapolate, or infer beyond the provided data.

ROLE:
- Identify patterns in nutrient domain frequencies from meal logs.
- Identify potential medication-food interaction occurrences (factual, not advisory).
- Identify meal timing patterns (regularity, gaps, clustering).
- Identify correlations between medication regimen and meal patterns (observational only).

OUTPUT FORMAT:
Always respond with valid JSON matching this exact structure:
{
  "nutrientGapObservations": [
    {
      "domain": "PROTEIN_SOURCE" | "IRON_SOURCE" | "FIBER_SOURCE" | etc.,
      "observationType": "low_frequency" | "absent" | "declining",
      "confidence": "low" | "moderate" | "high"
    }
  ],
  "interactionConcerns": [
    {
      "foodCategory": "GRAPEFRUIT" | "DAIRY" | "CAFFEINE" | etc.,
      "interactionCategory": "AVOID" | "SEPARATE_TIMING" | "NEUTRAL",
      "affectedMedicationClasses": ["STATIN", "THYROID"],
      "mealOccurrences": 5
    }
  ],
  "mealTimingPatterns": [
    {
      "patternType": "irregular_timing" | "skipped_meals" | "clustered_meals",
      "mealType": "BREAKFAST" | "LUNCH" | "DINNER" | "OTHER",
      "confidence": "low" | "moderate" | "high"
    }
  ],
  "regimenMealCorrelations": [
    {
      "correlationType": "side_effect_timing" | "interaction_timing" | "nutrient_gap",
      "description": "factual observation only, no advice",
      "confidence": "low" | "moderate" | "high"
    }
  ]
}

FORBIDDEN OUTPUTS:
- "Patient should eat more protein" ← FORBIDDEN (advice)
- "This diet may cause deficiency" ← FORBIDDEN (diagnosis)
- "Dangerous interaction detected" ← FORBIDDEN (urgency)
- "Recommend avoiding grapefruit" ← FORBIDDEN (directive)

ALLOWED OUTPUTS:
- "PROTEIN_SOURCE domain appeared in 2 of 21 meals" ← OK (fact)
- "GRAPEFRUIT category foods logged 3 times with STATIN class medications present" ← OK (observation)
- "BREAKFAST logged on 4 of 7 days" ← OK (pattern)`;
}

function buildUserPrompt(input: EnrichmentInput): string {
  const { regimenProfile, mealPatterns } = input;
  
  // Summarize regimen profile
  const medicationClasses = regimenProfile.uniqueDrugClasses.join(", ") || "none";
  const sideEffects = regimenProfile.uniqueSideEffectDomains.slice(0, 10).join(", ") || "none";
  const foodInteractions = regimenProfile.uniqueFoodInteractions
    .map((f) => `${f.foodCategory} (${f.categories.join("/")})`)
    .slice(0, 10)
    .join(", ") || "none";
  
  // Summarize meal patterns
  const nutrientDomains = mealPatterns.nutrientDomainFrequencies
    .slice(0, 10)
    .map((f) => `${f.domain}: ${f.count}`)
    .join(", ") || "none";
  
  const mealTypeCounts = mealPatterns.mealTypeFrequencies
    .map((f) => `${f.mealType}: ${f.count}`)
    .join(", ") || "none";
  
  return `Analyze correlation between medication regimen and meal patterns.

REGIMEN PROFILE:
- Total medications: ${regimenProfile.totalMedications}
- Known medication classes: ${medicationClasses}
- Side effect domains: ${sideEffects}
- Food interaction categories: ${foodInteractions}

MEAL PATTERNS (${mealPatterns.period.totalDays} days, ${mealPatterns.totalMeals} meals):
- Days with meals: ${mealPatterns.period.daysWithMeals}
- Meal type counts: ${mealTypeCounts}
- Nutrient domain frequencies: ${nutrientDomains}
- Unique ingredient keywords: ${mealPatterns.diversity.uniqueIngredientCount}
- Detected nutrient domains: ${mealPatterns.diversity.uniqueDomainCount}/${mealPatterns.diversity.totalPossibleDomains}

Identify patterns, gaps, and correlations. Output JSON only.`;
}

// === Safe JSON Parsing ===

function parseAIResponse(text: string): unknown | null {
  try {
    // Extract JSON from response (may have surrounding text)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// === Fallback Result ===

function createFallbackResult(
  input: EnrichmentInput,
  reason: string
): EnrichmentResult {
  return {
    nutrientGapObservations: [],
    interactionConcerns: [],
    mealTimingPatterns: [],
    regimenMealCorrelations: [],
    dataQuality: {
      mealLogCount: input.mealPatterns.totalMeals,
      medicationCount: input.regimenProfile.totalMedications,
      analysisConfidence: "insufficient",
    },
    metadata: {
      processedAt: new Date().toISOString(),
      modelUsed: null,
      fallbackUsed: true,
    },
  };
}

// === Data Sufficiency Check ===

function assessDataSufficiency(
  input: EnrichmentInput
): "insufficient" | "low" | "moderate" | "high" {
  const { mealPatterns, regimenProfile } = input;
  
  // Need at least some medications and meals
  if (regimenProfile.totalMedications === 0) return "insufficient";
  if (mealPatterns.totalMeals < 3) return "insufficient";
  
  // Assess based on coverage
  const mealsPerDay = mealPatterns.totalMeals / Math.max(1, mealPatterns.period.daysWithMeals);
  const domainCoverage = mealPatterns.diversity.uniqueDomainCount / mealPatterns.diversity.totalPossibleDomains;
  
  if (mealsPerDay < 1 || domainCoverage < 0.1) return "low";
  if (mealsPerDay < 2 || domainCoverage < 0.3) return "moderate";
  return "high";
}

// === Main Enrichment Function ===

/**
 * Enrich regimen and meal pattern data with AI analysis.
 * Fail closed: returns fallback result if AI fails or schema mismatch.
 *
 * @param input - Structured regimen profile and meal pattern data
 * @param options - Optional configuration (API key, model, timeout)
 * @returns EnrichmentResult with validated structure
 */
export async function enrichRegimenMealData(
  input: EnrichmentInput,
  options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
  const {
    openaiApiKey = process.env.OPENAI_API_KEY,
    model = "gpt-4o-mini",
    timeoutMs = 30000,
  } = options;
  
  // Check data sufficiency first
  const sufficiency = assessDataSufficiency(input);
  if (sufficiency === "insufficient") {
    return createFallbackResult(input, "Insufficient data for analysis");
  }
  
  // Check for API key
  if (!openaiApiKey) {
    return createFallbackResult(input, "No API key configured");
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(input) },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return createFallbackResult(input, `API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content || typeof content !== "string") {
      return createFallbackResult(input, "Empty API response");
    }
    
    // Parse and validate response
    const parsed = parseAIResponse(content);
    if (!parsed) {
      return createFallbackResult(input, "Invalid JSON in response");
    }
    
    const validated = validateEnrichmentResponse(parsed);
    if (!validated) {
      return createFallbackResult(input, "Schema validation failed");
    }
    
    // Merge with computed metadata
    return {
      ...validated,
      dataQuality: {
        mealLogCount: input.mealPatterns.totalMeals,
        medicationCount: input.regimenProfile.totalMedications,
        analysisConfidence: sufficiency,
      },
      metadata: {
        processedAt: new Date().toISOString(),
        modelUsed: model,
        fallbackUsed: false,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return createFallbackResult(input, message);
  }
}

// === Utility Functions ===

/**
 * Check if an enrichment result used fallback (no AI analysis).
 */
export function isFallbackResult(result: EnrichmentResult): boolean {
  return result.metadata.fallbackUsed;
}

/**
 * Check if enrichment result has sufficient confidence for display.
 */
export function hasAdequateConfidence(result: EnrichmentResult): boolean {
  return (
    result.dataQuality.analysisConfidence === "moderate" ||
    result.dataQuality.analysisConfidence === "high"
  );
}

/**
 * Get interaction concerns with AVOID category only.
 */
export function getAvoidInteractionConcerns(
  result: EnrichmentResult
): InteractionConcern[] {
  return result.interactionConcerns.filter(
    (c) => c.interactionCategory === "AVOID"
  );
}

/**
 * Get high-confidence observations only.
 */
export function getHighConfidenceObservations(
  result: EnrichmentResult
): NutrientGapObservation[] {
  return result.nutrientGapObservations.filter(
    (o) => o.confidence === "high"
  );
}
