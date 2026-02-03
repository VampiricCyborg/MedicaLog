/**
 * Nutrition Knowledge Adapter
 *
 * Maps ingredient keywords to nutrient domains.
 * Keyword-based only — no quantities, no scoring, no database calls.
 *
 * This module provides a static knowledge base for identifying
 * potential nutrient sources from meal descriptions.
 */

// === Nutrient Domain Types ===

export type NutrientDomain =
  | "PROTEIN_SOURCE"
  | "IRON_SOURCE"
  | "FIBER_SOURCE"
  | "OMEGA_FAT_SOURCE"
  | "ELECTROLYTE_SOURCE"
  | "CALCIUM_SOURCE"
  | "VITAMIN_C_SOURCE"
  | "VITAMIN_D_SOURCE"
  | "CARBOHYDRATE_SOURCE"
  | "ANTIOXIDANT_SOURCE";

export interface IngredientMatch {
  keyword: string;
  domains: NutrientDomain[];
}

export interface DomainMatchResult {
  domain: NutrientDomain;
  matchedKeywords: string[];
}

// === Keyword to Domain Mapping ===

const INGREDIENT_DOMAIN_MAP: ReadonlyMap<string, NutrientDomain[]> = new Map([
  // Protein sources
  ["chicken", ["PROTEIN_SOURCE"]],
  ["beef", ["PROTEIN_SOURCE", "IRON_SOURCE"]],
  ["pork", ["PROTEIN_SOURCE"]],
  ["lamb", ["PROTEIN_SOURCE", "IRON_SOURCE"]],
  ["turkey", ["PROTEIN_SOURCE"]],
  ["fish", ["PROTEIN_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["salmon", ["PROTEIN_SOURCE", "OMEGA_FAT_SOURCE", "VITAMIN_D_SOURCE"]],
  ["tuna", ["PROTEIN_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["sardines", ["PROTEIN_SOURCE", "OMEGA_FAT_SOURCE", "CALCIUM_SOURCE"]],
  ["mackerel", ["PROTEIN_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["trout", ["PROTEIN_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["shrimp", ["PROTEIN_SOURCE"]],
  ["crab", ["PROTEIN_SOURCE"]],
  ["lobster", ["PROTEIN_SOURCE"]],
  ["eggs", ["PROTEIN_SOURCE", "VITAMIN_D_SOURCE"]],
  ["egg", ["PROTEIN_SOURCE", "VITAMIN_D_SOURCE"]],
  ["tofu", ["PROTEIN_SOURCE", "CALCIUM_SOURCE"]],
  ["tempeh", ["PROTEIN_SOURCE"]],
  ["seitan", ["PROTEIN_SOURCE"]],
  ["edamame", ["PROTEIN_SOURCE", "FIBER_SOURCE"]],

  // Legumes (protein + fiber + iron)
  ["beans", ["PROTEIN_SOURCE", "FIBER_SOURCE", "IRON_SOURCE"]],
  ["lentils", ["PROTEIN_SOURCE", "FIBER_SOURCE", "IRON_SOURCE"]],
  ["chickpeas", ["PROTEIN_SOURCE", "FIBER_SOURCE", "IRON_SOURCE"]],
  ["black beans", ["PROTEIN_SOURCE", "FIBER_SOURCE", "IRON_SOURCE"]],
  ["kidney beans", ["PROTEIN_SOURCE", "FIBER_SOURCE", "IRON_SOURCE"]],
  ["pinto beans", ["PROTEIN_SOURCE", "FIBER_SOURCE", "IRON_SOURCE"]],
  ["hummus", ["PROTEIN_SOURCE", "FIBER_SOURCE"]],

  // Dairy (protein + calcium)
  ["milk", ["PROTEIN_SOURCE", "CALCIUM_SOURCE", "VITAMIN_D_SOURCE"]],
  ["cheese", ["PROTEIN_SOURCE", "CALCIUM_SOURCE"]],
  ["yogurt", ["PROTEIN_SOURCE", "CALCIUM_SOURCE"]],
  ["cottage cheese", ["PROTEIN_SOURCE", "CALCIUM_SOURCE"]],
  ["greek yogurt", ["PROTEIN_SOURCE", "CALCIUM_SOURCE"]],

  // Iron sources
  ["spinach", ["IRON_SOURCE", "FIBER_SOURCE", "VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["kale", ["IRON_SOURCE", "FIBER_SOURCE", "VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["liver", ["IRON_SOURCE", "PROTEIN_SOURCE"]],
  ["oysters", ["IRON_SOURCE", "PROTEIN_SOURCE"]],
  ["dark chocolate", ["IRON_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["quinoa", ["IRON_SOURCE", "PROTEIN_SOURCE", "FIBER_SOURCE"]],

  // Fiber sources
  ["oats", ["FIBER_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["oatmeal", ["FIBER_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["brown rice", ["FIBER_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["whole wheat", ["FIBER_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["whole grain", ["FIBER_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["barley", ["FIBER_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["bran", ["FIBER_SOURCE"]],
  ["chia seeds", ["FIBER_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["flax", ["FIBER_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["flaxseed", ["FIBER_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["broccoli", ["FIBER_SOURCE", "VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["brussels sprouts", ["FIBER_SOURCE", "VITAMIN_C_SOURCE"]],
  ["artichoke", ["FIBER_SOURCE"]],
  ["avocado", ["FIBER_SOURCE", "OMEGA_FAT_SOURCE", "ELECTROLYTE_SOURCE"]],
  ["peas", ["FIBER_SOURCE", "PROTEIN_SOURCE"]],
  ["carrots", ["FIBER_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["sweet potato", ["FIBER_SOURCE", "CARBOHYDRATE_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["apple", ["FIBER_SOURCE"]],
  ["pear", ["FIBER_SOURCE"]],
  ["raspberries", ["FIBER_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["blackberries", ["FIBER_SOURCE", "ANTIOXIDANT_SOURCE"]],

  // Omega fat sources
  ["walnuts", ["OMEGA_FAT_SOURCE", "PROTEIN_SOURCE"]],
  ["almonds", ["OMEGA_FAT_SOURCE", "PROTEIN_SOURCE", "CALCIUM_SOURCE"]],
  ["olive oil", ["OMEGA_FAT_SOURCE"]],
  ["avocado oil", ["OMEGA_FAT_SOURCE"]],
  ["hemp seeds", ["OMEGA_FAT_SOURCE", "PROTEIN_SOURCE"]],

  // Electrolyte sources
  ["banana", ["ELECTROLYTE_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["coconut water", ["ELECTROLYTE_SOURCE"]],
  ["potato", ["ELECTROLYTE_SOURCE", "CARBOHYDRATE_SOURCE"]],
  ["tomato", ["ELECTROLYTE_SOURCE", "VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["orange", ["ELECTROLYTE_SOURCE", "VITAMIN_C_SOURCE"]],
  ["watermelon", ["ELECTROLYTE_SOURCE"]],
  ["pickle", ["ELECTROLYTE_SOURCE"]],
  ["celery", ["ELECTROLYTE_SOURCE", "FIBER_SOURCE"]],

  // Calcium sources
  ["sardines", ["CALCIUM_SOURCE", "PROTEIN_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["collard greens", ["CALCIUM_SOURCE", "FIBER_SOURCE"]],
  ["bok choy", ["CALCIUM_SOURCE", "FIBER_SOURCE"]],
  ["fortified cereal", ["CALCIUM_SOURCE", "CARBOHYDRATE_SOURCE"]],

  // Vitamin C sources
  ["citrus", ["VITAMIN_C_SOURCE"]],
  ["lemon", ["VITAMIN_C_SOURCE"]],
  ["lime", ["VITAMIN_C_SOURCE"]],
  ["grapefruit", ["VITAMIN_C_SOURCE"]],
  ["strawberries", ["VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["bell pepper", ["VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["peppers", ["VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["kiwi", ["VITAMIN_C_SOURCE"]],
  ["papaya", ["VITAMIN_C_SOURCE"]],
  ["mango", ["VITAMIN_C_SOURCE", "ANTIOXIDANT_SOURCE"]],
  ["pineapple", ["VITAMIN_C_SOURCE"]],
  ["cauliflower", ["VITAMIN_C_SOURCE", "FIBER_SOURCE"]],

  // Vitamin D sources
  ["mushrooms", ["VITAMIN_D_SOURCE", "FIBER_SOURCE"]],
  ["cod liver oil", ["VITAMIN_D_SOURCE", "OMEGA_FAT_SOURCE"]],
  ["fortified milk", ["VITAMIN_D_SOURCE", "CALCIUM_SOURCE"]],

  // Carbohydrate sources
  ["rice", ["CARBOHYDRATE_SOURCE"]],
  ["pasta", ["CARBOHYDRATE_SOURCE"]],
  ["bread", ["CARBOHYDRATE_SOURCE"]],
  ["noodles", ["CARBOHYDRATE_SOURCE"]],
  ["cereal", ["CARBOHYDRATE_SOURCE"]],
  ["corn", ["CARBOHYDRATE_SOURCE", "FIBER_SOURCE"]],
  ["crackers", ["CARBOHYDRATE_SOURCE"]],

  // Antioxidant sources
  ["blueberries", ["ANTIOXIDANT_SOURCE", "FIBER_SOURCE"]],
  ["acai", ["ANTIOXIDANT_SOURCE"]],
  ["pomegranate", ["ANTIOXIDANT_SOURCE"]],
  ["green tea", ["ANTIOXIDANT_SOURCE"]],
  ["turmeric", ["ANTIOXIDANT_SOURCE"]],
  ["ginger", ["ANTIOXIDANT_SOURCE"]],
  ["garlic", ["ANTIOXIDANT_SOURCE"]],
  ["beets", ["ANTIOXIDANT_SOURCE", "FIBER_SOURCE"]],
  ["red cabbage", ["ANTIOXIDANT_SOURCE", "FIBER_SOURCE"]],
]);

// === Pure Functions ===

/**
 * Get all nutrient domains associated with a single keyword.
 * Case-insensitive matching.
 *
 * @param keyword - The ingredient keyword to look up
 * @returns Array of nutrient domains, or empty array if no match
 */
export function getDomainsForKeyword(keyword: string): NutrientDomain[] {
  const normalized = keyword.toLowerCase().trim();
  return INGREDIENT_DOMAIN_MAP.get(normalized) ?? [];
}

/**
 * Check if a keyword is associated with a specific nutrient domain.
 *
 * @param keyword - The ingredient keyword to check
 * @param domain - The nutrient domain to check for
 * @returns True if the keyword is associated with the domain
 */
export function hasNutrientDomain(
  keyword: string,
  domain: NutrientDomain
): boolean {
  const domains = getDomainsForKeyword(keyword);
  return domains.includes(domain);
}

/**
 * Extract all matching keywords and their domains from a text description.
 * Performs case-insensitive substring matching.
 *
 * @param description - Free-text meal description
 * @returns Array of ingredient matches found in the description
 */
export function extractIngredientMatches(
  description: string
): IngredientMatch[] {
  const normalized = description.toLowerCase();
  const matches: IngredientMatch[] = [];
  const seen = new Set<string>();

  for (const [keyword, domains] of INGREDIENT_DOMAIN_MAP) {
    if (normalized.includes(keyword) && !seen.has(keyword)) {
      seen.add(keyword);
      matches.push({ keyword, domains: [...domains] });
    }
  }

  return matches;
}

/**
 * Get all unique nutrient domains present in a meal description.
 *
 * @param description - Free-text meal description
 * @returns Array of unique domain match results with matched keywords
 */
export function identifyNutrientDomains(
  description: string
): DomainMatchResult[] {
  const matches = extractIngredientMatches(description);
  const domainMap = new Map<NutrientDomain, string[]>();

  for (const match of matches) {
    for (const domain of match.domains) {
      const existing = domainMap.get(domain) ?? [];
      existing.push(match.keyword);
      domainMap.set(domain, existing);
    }
  }

  const results: DomainMatchResult[] = [];
  for (const [domain, keywords] of domainMap) {
    results.push({ domain, matchedKeywords: keywords });
  }

  return results;
}

/**
 * Check if a meal description contains any keywords for a specific domain.
 *
 * @param description - Free-text meal description
 * @param domain - The nutrient domain to check for
 * @returns Array of matched keywords, or empty array if none found
 */
export function findDomainKeywords(
  description: string,
  domain: NutrientDomain
): string[] {
  const matches = extractIngredientMatches(description);
  return matches
    .filter((m) => m.domains.includes(domain))
    .map((m) => m.keyword);
}

/**
 * Get all known keywords for a specific nutrient domain.
 *
 * @param domain - The nutrient domain to query
 * @returns Array of all keywords associated with this domain
 */
export function getKeywordsForDomain(domain: NutrientDomain): string[] {
  const keywords: string[] = [];

  for (const [keyword, domains] of INGREDIENT_DOMAIN_MAP) {
    if (domains.includes(domain)) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

/**
 * Get all available nutrient domains.
 *
 * @returns Array of all nutrient domain identifiers
 */
export function getAllDomains(): NutrientDomain[] {
  return [
    "PROTEIN_SOURCE",
    "IRON_SOURCE",
    "FIBER_SOURCE",
    "OMEGA_FAT_SOURCE",
    "ELECTROLYTE_SOURCE",
    "CALCIUM_SOURCE",
    "VITAMIN_C_SOURCE",
    "VITAMIN_D_SOURCE",
    "CARBOHYDRATE_SOURCE",
    "ANTIOXIDANT_SOURCE",
  ];
}

/**
 * Get a human-readable label for a nutrient domain.
 *
 * @param domain - The nutrient domain
 * @returns Human-readable label
 */
export function getDomainLabel(domain: NutrientDomain): string {
  const labels: Record<NutrientDomain, string> = {
    PROTEIN_SOURCE: "Protein",
    IRON_SOURCE: "Iron",
    FIBER_SOURCE: "Fiber",
    OMEGA_FAT_SOURCE: "Omega Fatty Acids",
    ELECTROLYTE_SOURCE: "Electrolytes",
    CALCIUM_SOURCE: "Calcium",
    VITAMIN_C_SOURCE: "Vitamin C",
    VITAMIN_D_SOURCE: "Vitamin D",
    CARBOHYDRATE_SOURCE: "Carbohydrates",
    ANTIOXIDANT_SOURCE: "Antioxidants",
  };

  return labels[domain];
}
