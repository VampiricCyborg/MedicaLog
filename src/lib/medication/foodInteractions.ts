/**
 * Medication–Food Interaction Reference Adapter
 *
 * Provides structured lookup for medication-food interactions.
 * Returns interaction tags only — no patient interpretation,
 * no UI strings, no warnings text.
 *
 * This is a reference data module, not medical advice.
 */

// === Interaction Category Types ===

export type InteractionCategory = "AVOID" | "SEPARATE_TIMING" | "NEUTRAL";

export type FoodCategory =
  | "GRAPEFRUIT"
  | "LEAFY_GREENS"
  | "DAIRY"
  | "HIGH_POTASSIUM"
  | "HIGH_TYRAMINE"
  | "ALCOHOL"
  | "CAFFEINE"
  | "HIGH_FIBER"
  | "FATTY_FOODS"
  | "ACIDIC_FOODS"
  | "CALCIUM_RICH"
  | "IRON_RICH"
  | "ANTACIDS"
  | "SOY"
  | "LICORICE";

export type MedicationClass =
  | "STATIN"
  | "BLOOD_THINNER"
  | "ACE_INHIBITOR"
  | "CALCIUM_CHANNEL_BLOCKER"
  | "BETA_BLOCKER"
  | "MAOI"
  | "SSRI"
  | "THYROID"
  | "ANTIBIOTIC_TETRACYCLINE"
  | "ANTIBIOTIC_FLUOROQUINOLONE"
  | "DIURETIC"
  | "IMMUNOSUPPRESSANT"
  | "BISPHOSPHONATE"
  | "PPI"
  | "ANTICOAGULANT"
  | "ANTIDIABETIC"
  | "NSAID";

// === Structured Types ===

export interface FoodInteraction {
  foodCategory: FoodCategory;
  category: InteractionCategory;
}

export interface MedicationInteractionProfile {
  medicationClass: MedicationClass;
  interactions: FoodInteraction[];
}

export interface InteractionLookupResult {
  medicationName: string;
  medicationClass: MedicationClass | null;
  interactions: FoodInteraction[];
}

// === Medication Name to Class Mapping ===

const MEDICATION_CLASS_MAP: ReadonlyMap<string, MedicationClass> = new Map([
  // Statins
  ["atorvastatin", "STATIN"],
  ["lipitor", "STATIN"],
  ["simvastatin", "STATIN"],
  ["zocor", "STATIN"],
  ["lovastatin", "STATIN"],
  ["pravastatin", "STATIN"],
  ["rosuvastatin", "STATIN"],
  ["crestor", "STATIN"],

  // Blood thinners / Anticoagulants
  ["warfarin", "ANTICOAGULANT"],
  ["coumadin", "ANTICOAGULANT"],
  ["heparin", "ANTICOAGULANT"],
  ["enoxaparin", "ANTICOAGULANT"],
  ["lovenox", "ANTICOAGULANT"],
  ["rivaroxaban", "ANTICOAGULANT"],
  ["xarelto", "ANTICOAGULANT"],
  ["apixaban", "ANTICOAGULANT"],
  ["eliquis", "ANTICOAGULANT"],

  // ACE Inhibitors
  ["lisinopril", "ACE_INHIBITOR"],
  ["enalapril", "ACE_INHIBITOR"],
  ["ramipril", "ACE_INHIBITOR"],
  ["captopril", "ACE_INHIBITOR"],
  ["benazepril", "ACE_INHIBITOR"],

  // Calcium Channel Blockers
  ["amlodipine", "CALCIUM_CHANNEL_BLOCKER"],
  ["norvasc", "CALCIUM_CHANNEL_BLOCKER"],
  ["diltiazem", "CALCIUM_CHANNEL_BLOCKER"],
  ["verapamil", "CALCIUM_CHANNEL_BLOCKER"],
  ["nifedipine", "CALCIUM_CHANNEL_BLOCKER"],
  ["felodipine", "CALCIUM_CHANNEL_BLOCKER"],

  // Beta Blockers
  ["metoprolol", "BETA_BLOCKER"],
  ["atenolol", "BETA_BLOCKER"],
  ["propranolol", "BETA_BLOCKER"],
  ["carvedilol", "BETA_BLOCKER"],
  ["bisoprolol", "BETA_BLOCKER"],

  // MAOIs
  ["phenelzine", "MAOI"],
  ["nardil", "MAOI"],
  ["tranylcypromine", "MAOI"],
  ["parnate", "MAOI"],
  ["selegiline", "MAOI"],
  ["isocarboxazid", "MAOI"],

  // SSRIs
  ["sertraline", "SSRI"],
  ["zoloft", "SSRI"],
  ["fluoxetine", "SSRI"],
  ["prozac", "SSRI"],
  ["paroxetine", "SSRI"],
  ["paxil", "SSRI"],
  ["citalopram", "SSRI"],
  ["escitalopram", "SSRI"],
  ["lexapro", "SSRI"],

  // Thyroid medications
  ["levothyroxine", "THYROID"],
  ["synthroid", "THYROID"],
  ["liothyronine", "THYROID"],
  ["cytomel", "THYROID"],
  ["armour thyroid", "THYROID"],

  // Tetracycline antibiotics
  ["tetracycline", "ANTIBIOTIC_TETRACYCLINE"],
  ["doxycycline", "ANTIBIOTIC_TETRACYCLINE"],
  ["minocycline", "ANTIBIOTIC_TETRACYCLINE"],

  // Fluoroquinolone antibiotics
  ["ciprofloxacin", "ANTIBIOTIC_FLUOROQUINOLONE"],
  ["cipro", "ANTIBIOTIC_FLUOROQUINOLONE"],
  ["levofloxacin", "ANTIBIOTIC_FLUOROQUINOLONE"],
  ["levaquin", "ANTIBIOTIC_FLUOROQUINOLONE"],
  ["moxifloxacin", "ANTIBIOTIC_FLUOROQUINOLONE"],

  // Diuretics
  ["furosemide", "DIURETIC"],
  ["lasix", "DIURETIC"],
  ["hydrochlorothiazide", "DIURETIC"],
  ["spironolactone", "DIURETIC"],
  ["bumetanide", "DIURETIC"],

  // Immunosuppressants
  ["cyclosporine", "IMMUNOSUPPRESSANT"],
  ["tacrolimus", "IMMUNOSUPPRESSANT"],
  ["sirolimus", "IMMUNOSUPPRESSANT"],

  // Bisphosphonates
  ["alendronate", "BISPHOSPHONATE"],
  ["fosamax", "BISPHOSPHONATE"],
  ["risedronate", "BISPHOSPHONATE"],
  ["ibandronate", "BISPHOSPHONATE"],

  // PPIs
  ["omeprazole", "PPI"],
  ["prilosec", "PPI"],
  ["esomeprazole", "PPI"],
  ["nexium", "PPI"],
  ["pantoprazole", "PPI"],
  ["lansoprazole", "PPI"],

  // Antidiabetics
  ["metformin", "ANTIDIABETIC"],
  ["glucophage", "ANTIDIABETIC"],
  ["glipizide", "ANTIDIABETIC"],
  ["glyburide", "ANTIDIABETIC"],
  ["insulin", "ANTIDIABETIC"],

  // NSAIDs
  ["ibuprofen", "NSAID"],
  ["advil", "NSAID"],
  ["motrin", "NSAID"],
  ["naproxen", "NSAID"],
  ["aleve", "NSAID"],
  ["celecoxib", "NSAID"],
  ["celebrex", "NSAID"],
  ["aspirin", "NSAID"],
]);

// === Class to Interactions Mapping ===

const CLASS_INTERACTIONS: ReadonlyMap<MedicationClass, FoodInteraction[]> =
  new Map([
    [
      "STATIN",
      [
        { foodCategory: "GRAPEFRUIT", category: "AVOID" },
        { foodCategory: "ALCOHOL", category: "AVOID" },
        { foodCategory: "FATTY_FOODS", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "ANTICOAGULANT",
      [
        { foodCategory: "LEAFY_GREENS", category: "SEPARATE_TIMING" },
        { foodCategory: "ALCOHOL", category: "AVOID" },
        { foodCategory: "GRAPEFRUIT", category: "AVOID" },
      ],
    ],
    [
      "ACE_INHIBITOR",
      [
        { foodCategory: "HIGH_POTASSIUM", category: "AVOID" },
        { foodCategory: "ALCOHOL", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "CALCIUM_CHANNEL_BLOCKER",
      [
        { foodCategory: "GRAPEFRUIT", category: "AVOID" },
        { foodCategory: "ALCOHOL", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "BETA_BLOCKER",
      [
        { foodCategory: "ALCOHOL", category: "SEPARATE_TIMING" },
        { foodCategory: "CAFFEINE", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "MAOI",
      [
        { foodCategory: "HIGH_TYRAMINE", category: "AVOID" },
        { foodCategory: "ALCOHOL", category: "AVOID" },
        { foodCategory: "CAFFEINE", category: "AVOID" },
      ],
    ],
    [
      "SSRI",
      [
        { foodCategory: "ALCOHOL", category: "AVOID" },
        { foodCategory: "GRAPEFRUIT", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "THYROID",
      [
        { foodCategory: "CALCIUM_RICH", category: "SEPARATE_TIMING" },
        { foodCategory: "SOY", category: "SEPARATE_TIMING" },
        { foodCategory: "HIGH_FIBER", category: "SEPARATE_TIMING" },
        { foodCategory: "IRON_RICH", category: "SEPARATE_TIMING" },
        { foodCategory: "CAFFEINE", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "ANTIBIOTIC_TETRACYCLINE",
      [
        { foodCategory: "DAIRY", category: "AVOID" },
        { foodCategory: "CALCIUM_RICH", category: "AVOID" },
        { foodCategory: "IRON_RICH", category: "AVOID" },
        { foodCategory: "ANTACIDS", category: "AVOID" },
      ],
    ],
    [
      "ANTIBIOTIC_FLUOROQUINOLONE",
      [
        { foodCategory: "DAIRY", category: "SEPARATE_TIMING" },
        { foodCategory: "CALCIUM_RICH", category: "SEPARATE_TIMING" },
        { foodCategory: "IRON_RICH", category: "SEPARATE_TIMING" },
        { foodCategory: "CAFFEINE", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "DIURETIC",
      [
        { foodCategory: "HIGH_POTASSIUM", category: "SEPARATE_TIMING" },
        { foodCategory: "ALCOHOL", category: "AVOID" },
        { foodCategory: "LICORICE", category: "AVOID" },
      ],
    ],
    [
      "IMMUNOSUPPRESSANT",
      [
        { foodCategory: "GRAPEFRUIT", category: "AVOID" },
        { foodCategory: "HIGH_POTASSIUM", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "BISPHOSPHONATE",
      [
        { foodCategory: "CALCIUM_RICH", category: "SEPARATE_TIMING" },
        { foodCategory: "DAIRY", category: "SEPARATE_TIMING" },
        { foodCategory: "CAFFEINE", category: "SEPARATE_TIMING" },
        { foodCategory: "ACIDIC_FOODS", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "PPI",
      [
        { foodCategory: "ALCOHOL", category: "SEPARATE_TIMING" },
        { foodCategory: "CAFFEINE", category: "NEUTRAL" },
      ],
    ],
    [
      "ANTIDIABETIC",
      [
        { foodCategory: "ALCOHOL", category: "AVOID" },
        { foodCategory: "HIGH_FIBER", category: "SEPARATE_TIMING" },
      ],
    ],
    [
      "NSAID",
      [
        { foodCategory: "ALCOHOL", category: "AVOID" },
        { foodCategory: "CAFFEINE", category: "SEPARATE_TIMING" },
      ],
    ],
  ]);

// === Pure Functions ===

/**
 * Get the medication class for a medication name.
 * Case-insensitive matching.
 *
 * @param medicationName - The medication name (generic or brand)
 * @returns The medication class, or null if not found
 */
export function getMedicationClass(
  medicationName: string
): MedicationClass | null {
  const normalized = medicationName.toLowerCase().trim();
  return MEDICATION_CLASS_MAP.get(normalized) ?? null;
}

/**
 * Get all food interactions for a medication class.
 *
 * @param medicationClass - The medication class
 * @returns Array of food interactions
 */
export function getInteractionsForClass(
  medicationClass: MedicationClass
): FoodInteraction[] {
  return CLASS_INTERACTIONS.get(medicationClass) ?? [];
}

/**
 * Look up interactions for a medication by name.
 * Returns structured interaction data.
 *
 * @param medicationName - The medication name (generic or brand)
 * @returns Interaction lookup result with class and interactions
 */
export function lookupMedicationInteractions(
  medicationName: string
): InteractionLookupResult {
  const normalized = medicationName.toLowerCase().trim();
  const medicationClass = getMedicationClass(normalized);

  return {
    medicationName: normalized,
    medicationClass,
    interactions: medicationClass
      ? getInteractionsForClass(medicationClass)
      : [],
  };
}

/**
 * Check if a medication has any interactions with a specific food category.
 *
 * @param medicationName - The medication name
 * @param foodCategory - The food category to check
 * @returns The interaction category, or null if no interaction
 */
export function checkFoodInteraction(
  medicationName: string,
  foodCategory: FoodCategory
): InteractionCategory | null {
  const result = lookupMedicationInteractions(medicationName);

  for (const interaction of result.interactions) {
    if (interaction.foodCategory === foodCategory) {
      return interaction.category;
    }
  }

  return null;
}

/**
 * Get all food categories that should be avoided for a medication.
 *
 * @param medicationName - The medication name
 * @returns Array of food categories with AVOID interaction
 */
export function getAvoidFoods(medicationName: string): FoodCategory[] {
  const result = lookupMedicationInteractions(medicationName);

  return result.interactions
    .filter((i) => i.category === "AVOID")
    .map((i) => i.foodCategory);
}

/**
 * Get all food categories that require timing separation for a medication.
 *
 * @param medicationName - The medication name
 * @returns Array of food categories with SEPARATE_TIMING interaction
 */
export function getSeparateTimingFoods(medicationName: string): FoodCategory[] {
  const result = lookupMedicationInteractions(medicationName);

  return result.interactions
    .filter((i) => i.category === "SEPARATE_TIMING")
    .map((i) => i.foodCategory);
}

/**
 * Get all known medication names for a given class.
 *
 * @param medicationClass - The medication class
 * @returns Array of medication names in this class
 */
export function getMedicationsInClass(
  medicationClass: MedicationClass
): string[] {
  const medications: string[] = [];

  for (const [name, cls] of MEDICATION_CLASS_MAP) {
    if (cls === medicationClass) {
      medications.push(name);
    }
  }

  return medications;
}

/**
 * Get all available medication classes.
 *
 * @returns Array of all medication class identifiers
 */
export function getAllMedicationClasses(): MedicationClass[] {
  return [
    "STATIN",
    "BLOOD_THINNER",
    "ACE_INHIBITOR",
    "CALCIUM_CHANNEL_BLOCKER",
    "BETA_BLOCKER",
    "MAOI",
    "SSRI",
    "THYROID",
    "ANTIBIOTIC_TETRACYCLINE",
    "ANTIBIOTIC_FLUOROQUINOLONE",
    "DIURETIC",
    "IMMUNOSUPPRESSANT",
    "BISPHOSPHONATE",
    "PPI",
    "ANTICOAGULANT",
    "ANTIDIABETIC",
    "NSAID",
  ];
}

/**
 * Get all available food categories.
 *
 * @returns Array of all food category identifiers
 */
export function getAllFoodCategories(): FoodCategory[] {
  return [
    "GRAPEFRUIT",
    "LEAFY_GREENS",
    "DAIRY",
    "HIGH_POTASSIUM",
    "HIGH_TYRAMINE",
    "ALCOHOL",
    "CAFFEINE",
    "HIGH_FIBER",
    "FATTY_FOODS",
    "ACIDIC_FOODS",
    "CALCIUM_RICH",
    "IRON_RICH",
    "ANTACIDS",
    "SOY",
    "LICORICE",
  ];
}

/**
 * Check if a medication name is in the reference database.
 *
 * @param medicationName - The medication name to check
 * @returns True if the medication is known
 */
export function isMedicationKnown(medicationName: string): boolean {
  return getMedicationClass(medicationName) !== null;
}
