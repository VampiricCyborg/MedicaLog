/**
 * Compatibility Filter Engine
 *
 * Filters ingredient lists against medication interaction tags.
 * Deterministic filtering only — no advice language, no UI text.
 */

import {
  FoodCategory,
  InteractionCategory,
} from "@/lib/medication/foodInteractions";

// === Food Category to Ingredient Keyword Mapping ===

const FOOD_CATEGORY_KEYWORDS: ReadonlyMap<FoodCategory, string[]> = new Map([
  [
    "GRAPEFRUIT",
    ["grapefruit", "grapefruit juice", "pomelo", "seville orange"],
  ],
  [
    "LEAFY_GREENS",
    [
      "spinach",
      "kale",
      "collard greens",
      "swiss chard",
      "arugula",
      "lettuce",
      "romaine",
      "bok choy",
      "mustard greens",
      "turnip greens",
    ],
  ],
  [
    "DAIRY",
    [
      "milk",
      "cheese",
      "yogurt",
      "cream",
      "butter",
      "ice cream",
      "cottage cheese",
      "greek yogurt",
      "sour cream",
      "whey",
    ],
  ],
  [
    "HIGH_POTASSIUM",
    [
      "banana",
      "orange",
      "potato",
      "tomato",
      "avocado",
      "spinach",
      "sweet potato",
      "coconut water",
      "prune",
      "raisin",
      "apricot",
      "cantaloupe",
      "honeydew",
    ],
  ],
  [
    "HIGH_TYRAMINE",
    [
      "aged cheese",
      "cheddar",
      "blue cheese",
      "parmesan",
      "soy sauce",
      "miso",
      "sauerkraut",
      "kimchi",
      "salami",
      "pepperoni",
      "cured meat",
      "smoked fish",
      "pickled herring",
      "draft beer",
      "red wine",
      "fava beans",
    ],
  ],
  [
    "ALCOHOL",
    [
      "wine",
      "beer",
      "vodka",
      "whiskey",
      "rum",
      "gin",
      "tequila",
      "cocktail",
      "champagne",
      "sake",
      "brandy",
      "liquor",
      "alcohol",
    ],
  ],
  [
    "CAFFEINE",
    [
      "coffee",
      "espresso",
      "tea",
      "green tea",
      "black tea",
      "energy drink",
      "cola",
      "chocolate",
      "dark chocolate",
      "matcha",
      "yerba mate",
    ],
  ],
  [
    "HIGH_FIBER",
    [
      "bran",
      "whole wheat",
      "whole grain",
      "oats",
      "oatmeal",
      "barley",
      "quinoa",
      "brown rice",
      "chia seeds",
      "flaxseed",
      "beans",
      "lentils",
      "chickpeas",
      "broccoli",
      "brussels sprouts",
      "artichoke",
    ],
  ],
  [
    "FATTY_FOODS",
    [
      "fried",
      "deep fried",
      "french fries",
      "bacon",
      "sausage",
      "hot dog",
      "fast food",
      "pizza",
      "burger",
      "chips",
      "doughnut",
      "pastry",
      "lard",
      "shortening",
    ],
  ],
  [
    "ACIDIC_FOODS",
    [
      "orange juice",
      "lemon",
      "lime",
      "vinegar",
      "tomato sauce",
      "citrus",
      "pineapple",
      "cranberry",
      "grapefruit juice",
    ],
  ],
  [
    "CALCIUM_RICH",
    [
      "milk",
      "cheese",
      "yogurt",
      "fortified cereal",
      "sardines",
      "salmon with bones",
      "tofu",
      "almonds",
      "calcium supplement",
      "antacid",
    ],
  ],
  [
    "IRON_RICH",
    [
      "beef",
      "liver",
      "oysters",
      "spinach",
      "lentils",
      "chickpeas",
      "dark chocolate",
      "quinoa",
      "iron supplement",
      "fortified cereal",
    ],
  ],
  [
    "ANTACIDS",
    [
      "tums",
      "antacid",
      "rolaids",
      "maalox",
      "mylanta",
      "calcium carbonate",
      "magnesium hydroxide",
    ],
  ],
  ["SOY", ["soy", "tofu", "tempeh", "edamame", "soy milk", "soy sauce", "miso"]],
  ["LICORICE", ["licorice", "black licorice", "licorice root", "licorice tea"]],
]);

// === Input/Output Types ===

export interface InteractionTag {
  foodCategory: FoodCategory;
  category: InteractionCategory;
}

export interface ExclusionReason {
  ingredient: string;
  foodCategory: FoodCategory;
  interactionCategory: InteractionCategory;
}

export interface CompatibilityFilterResult {
  /** Ingredients that passed all filters */
  compatibleIngredients: string[];

  /** Ingredients that were excluded */
  excludedIngredients: string[];

  /** Detailed reasons for each exclusion */
  exclusionReasons: ExclusionReason[];

  /** Count statistics */
  stats: {
    totalInput: number;
    compatibleCount: number;
    excludedCount: number;
  };
}

export interface FilterOptions {
  /** Only exclude AVOID interactions (ignore SEPARATE_TIMING) */
  avoidOnly?: boolean;

  /** Include SEPARATE_TIMING in exclusions */
  includeSeparateTiming?: boolean;

  /** Case-sensitive matching */
  caseSensitive?: boolean;
}

// === Internal Helpers ===

/**
 * Get all keywords associated with a food category.
 */
function getKeywordsForFoodCategory(category: FoodCategory): string[] {
  return FOOD_CATEGORY_KEYWORDS.get(category) ?? [];
}

/**
 * Check if an ingredient matches any keyword in a food category.
 */
function ingredientMatchesFoodCategory(
  ingredient: string,
  category: FoodCategory,
  caseSensitive: boolean
): boolean {
  const keywords = getKeywordsForFoodCategory(category);
  const normalizedIngredient = caseSensitive
    ? ingredient.trim()
    : ingredient.toLowerCase().trim();

  for (const keyword of keywords) {
    const normalizedKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    if (normalizedIngredient.includes(normalizedKeyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Find which food category an ingredient matches, if any.
 */
function findMatchingFoodCategory(
  ingredient: string,
  categories: FoodCategory[],
  caseSensitive: boolean
): FoodCategory | null {
  for (const category of categories) {
    if (ingredientMatchesFoodCategory(ingredient, category, caseSensitive)) {
      return category;
    }
  }
  return null;
}

// === Main Filter Function ===

/**
 * Filter ingredients against medication interaction tags.
 * Deterministic filtering — no advice, no UI text.
 *
 * @param ingredients - Array of ingredient strings to filter
 * @param interactionTags - Array of medication-food interaction tags
 * @param options - Optional filter configuration
 * @returns CompatibilityFilterResult with compatible/excluded lists and reasons
 */
export function filterIngredients(
  ingredients: string[],
  interactionTags: InteractionTag[],
  options: FilterOptions = {}
): CompatibilityFilterResult {
  const {
    avoidOnly = false,
    includeSeparateTiming = true,
    caseSensitive = false,
  } = options;

  // Determine which interaction categories to filter
  const categoriesToExclude: InteractionCategory[] = ["AVOID"];
  if (includeSeparateTiming && !avoidOnly) {
    categoriesToExclude.push("SEPARATE_TIMING");
  }

  // Build map of food categories to their interaction category
  const interactionMap = new Map<FoodCategory, InteractionCategory>();
  for (const tag of interactionTags) {
    if (categoriesToExclude.includes(tag.category)) {
      // Keep the most restrictive interaction (AVOID > SEPARATE_TIMING)
      const existing = interactionMap.get(tag.foodCategory);
      if (!existing || tag.category === "AVOID") {
        interactionMap.set(tag.foodCategory, tag.category);
      }
    }
  }

  const foodCategoriesToCheck = Array.from(interactionMap.keys());

  const compatibleIngredients: string[] = [];
  const excludedIngredients: string[] = [];
  const exclusionReasons: ExclusionReason[] = [];

  for (const ingredient of ingredients) {
    const trimmed = ingredient.trim();
    if (trimmed.length === 0) continue;

    const matchedCategory = findMatchingFoodCategory(
      trimmed,
      foodCategoriesToCheck,
      caseSensitive
    );

    if (matchedCategory) {
      const interactionCategory = interactionMap.get(matchedCategory)!;
      excludedIngredients.push(trimmed);
      exclusionReasons.push({
        ingredient: trimmed,
        foodCategory: matchedCategory,
        interactionCategory,
      });
    } else {
      compatibleIngredients.push(trimmed);
    }
  }

  return {
    compatibleIngredients,
    excludedIngredients,
    exclusionReasons,
    stats: {
      totalInput: ingredients.filter((i) => i.trim().length > 0).length,
      compatibleCount: compatibleIngredients.length,
      excludedCount: excludedIngredients.length,
    },
  };
}

// === Utility Functions ===

/**
 * Filter ingredients using AVOID interactions only.
 * SEPARATE_TIMING interactions are ignored.
 *
 * @param ingredients - Array of ingredient strings
 * @param interactionTags - Array of interaction tags
 * @returns CompatibilityFilterResult
 */
export function filterAvoidOnly(
  ingredients: string[],
  interactionTags: InteractionTag[]
): CompatibilityFilterResult {
  return filterIngredients(ingredients, interactionTags, { avoidOnly: true });
}

/**
 * Check if a single ingredient is compatible with given interaction tags.
 *
 * @param ingredient - Single ingredient string
 * @param interactionTags - Array of interaction tags
 * @returns True if compatible, false if excluded
 */
export function isIngredientCompatible(
  ingredient: string,
  interactionTags: InteractionTag[]
): boolean {
  const result = filterIngredients([ingredient], interactionTags);
  return result.stats.compatibleCount === 1;
}

/**
 * Get exclusion reason for a single ingredient, if any.
 *
 * @param ingredient - Single ingredient string
 * @param interactionTags - Array of interaction tags
 * @returns ExclusionReason or null if compatible
 */
export function getExclusionReason(
  ingredient: string,
  interactionTags: InteractionTag[]
): ExclusionReason | null {
  const result = filterIngredients([ingredient], interactionTags);
  return result.exclusionReasons[0] ?? null;
}

/**
 * Group excluded ingredients by their exclusion reason category.
 *
 * @param result - CompatibilityFilterResult from filterIngredients
 * @returns Map of food category to excluded ingredients
 */
export function groupExclusionsByCategory(
  result: CompatibilityFilterResult
): Map<FoodCategory, string[]> {
  const grouped = new Map<FoodCategory, string[]>();

  for (const reason of result.exclusionReasons) {
    const existing = grouped.get(reason.foodCategory) ?? [];
    existing.push(reason.ingredient);
    grouped.set(reason.foodCategory, existing);
  }

  return grouped;
}

/**
 * Get all ingredients excluded due to AVOID interactions.
 *
 * @param result - CompatibilityFilterResult from filterIngredients
 * @returns Array of ingredients with AVOID exclusions
 */
export function getAvoidExclusions(
  result: CompatibilityFilterResult
): string[] {
  return result.exclusionReasons
    .filter((r) => r.interactionCategory === "AVOID")
    .map((r) => r.ingredient);
}

/**
 * Get all ingredients excluded due to SEPARATE_TIMING interactions.
 *
 * @param result - CompatibilityFilterResult from filterIngredients
 * @returns Array of ingredients with SEPARATE_TIMING exclusions
 */
export function getSeparateTimingExclusions(
  result: CompatibilityFilterResult
): string[] {
  return result.exclusionReasons
    .filter((r) => r.interactionCategory === "SEPARATE_TIMING")
    .map((r) => r.ingredient);
}

/**
 * Get all known keywords for a food category.
 * Useful for understanding what triggers a category match.
 *
 * @param category - Food category
 * @returns Array of keywords
 */
export function getFoodCategoryKeywords(category: FoodCategory): string[] {
  return getKeywordsForFoodCategory(category);
}

/**
 * Get all available food categories.
 *
 * @returns Array of all food category identifiers
 */
export function getAllFoodCategories(): FoodCategory[] {
  return Array.from(FOOD_CATEGORY_KEYWORDS.keys());
}
