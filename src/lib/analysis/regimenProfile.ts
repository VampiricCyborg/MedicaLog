/**
 * Regimen Profile Analyzer
 *
 * Analyzes a medication list to extract drug classes, known side-effect domains,
 * and known nutrient interaction domains.
 *
 * Reference-based only — no personalization, no predictions.
 */

import {
  MedicationClass,
  FoodCategory,
  InteractionCategory,
  getMedicationClass,
  getInteractionsForClass,
} from "@/lib/medication/foodInteractions";

// === Side Effect Domain Types ===

export type SideEffectDomain =
  | "GI_DISTURBANCE"
  | "DROWSINESS"
  | "DIZZINESS"
  | "HEADACHE"
  | "NAUSEA"
  | "APPETITE_CHANGE"
  | "WEIGHT_CHANGE"
  | "ELECTROLYTE_IMBALANCE"
  | "BLOOD_PRESSURE_CHANGE"
  | "HEART_RATE_CHANGE"
  | "PHOTOSENSITIVITY"
  | "MUSCLE_EFFECTS"
  | "BLEEDING_RISK"
  | "IMMUNE_SUPPRESSION"
  | "BONE_DENSITY_EFFECT"
  | "GLUCOSE_EFFECT"
  | "LIVER_EFFECT"
  | "KIDNEY_EFFECT";

// === Output Types ===

export interface MedicationClassification {
  medicationName: string;
  medicationClass: MedicationClass | null;
  isKnown: boolean;
}

export interface ClassSideEffects {
  medicationClass: MedicationClass;
  sideEffectDomains: SideEffectDomain[];
}

export interface ClassNutrientInteractions {
  medicationClass: MedicationClass;
  interactions: {
    foodCategory: FoodCategory;
    category: InteractionCategory;
  }[];
}

export interface RegimenProfileResult {
  /** Total medications analyzed */
  totalMedications: number;

  /** Count of medications with known classifications */
  knownMedicationCount: number;

  /** Count of medications without known classifications */
  unknownMedicationCount: number;

  /** Classification for each medication */
  classifications: MedicationClassification[];

  /** Unique drug classes in the regimen */
  uniqueDrugClasses: MedicationClass[];

  /** Side effect domains by class */
  sideEffectsByClass: ClassSideEffects[];

  /** All unique side effect domains in regimen */
  uniqueSideEffectDomains: SideEffectDomain[];

  /** Nutrient interactions by class */
  nutrientInteractionsByClass: ClassNutrientInteractions[];

  /** All unique food categories with interactions */
  uniqueFoodInteractions: {
    foodCategory: FoodCategory;
    categories: InteractionCategory[];
    affectedClasses: MedicationClass[];
  }[];
}

// === Reference Data: Class to Side Effects ===

const CLASS_SIDE_EFFECTS: ReadonlyMap<MedicationClass, SideEffectDomain[]> =
  new Map([
    [
      "STATIN",
      ["MUSCLE_EFFECTS", "LIVER_EFFECT", "GI_DISTURBANCE", "HEADACHE"],
    ],
    [
      "ANTICOAGULANT",
      ["BLEEDING_RISK", "GI_DISTURBANCE", "NAUSEA"],
    ],
    [
      "ACE_INHIBITOR",
      ["DIZZINESS", "HEADACHE", "ELECTROLYTE_IMBALANCE", "KIDNEY_EFFECT"],
    ],
    [
      "CALCIUM_CHANNEL_BLOCKER",
      ["DIZZINESS", "HEADACHE", "HEART_RATE_CHANGE", "GI_DISTURBANCE"],
    ],
    [
      "BETA_BLOCKER",
      [
        "DROWSINESS",
        "DIZZINESS",
        "HEART_RATE_CHANGE",
        "BLOOD_PRESSURE_CHANGE",
        "WEIGHT_CHANGE",
      ],
    ],
    [
      "MAOI",
      [
        "DIZZINESS",
        "DROWSINESS",
        "HEADACHE",
        "WEIGHT_CHANGE",
        "BLOOD_PRESSURE_CHANGE",
      ],
    ],
    [
      "SSRI",
      [
        "NAUSEA",
        "HEADACHE",
        "DROWSINESS",
        "APPETITE_CHANGE",
        "WEIGHT_CHANGE",
        "GI_DISTURBANCE",
      ],
    ],
    [
      "THYROID",
      [
        "HEART_RATE_CHANGE",
        "WEIGHT_CHANGE",
        "APPETITE_CHANGE",
        "HEADACHE",
        "BONE_DENSITY_EFFECT",
      ],
    ],
    [
      "ANTIBIOTIC_TETRACYCLINE",
      ["GI_DISTURBANCE", "NAUSEA", "PHOTOSENSITIVITY"],
    ],
    [
      "ANTIBIOTIC_FLUOROQUINOLONE",
      [
        "GI_DISTURBANCE",
        "NAUSEA",
        "DIZZINESS",
        "HEADACHE",
        "PHOTOSENSITIVITY",
        "MUSCLE_EFFECTS",
      ],
    ],
    [
      "DIURETIC",
      [
        "ELECTROLYTE_IMBALANCE",
        "DIZZINESS",
        "BLOOD_PRESSURE_CHANGE",
        "KIDNEY_EFFECT",
        "GLUCOSE_EFFECT",
      ],
    ],
    [
      "IMMUNOSUPPRESSANT",
      [
        "IMMUNE_SUPPRESSION",
        "KIDNEY_EFFECT",
        "LIVER_EFFECT",
        "GI_DISTURBANCE",
        "ELECTROLYTE_IMBALANCE",
      ],
    ],
    [
      "BISPHOSPHONATE",
      ["GI_DISTURBANCE", "NAUSEA", "BONE_DENSITY_EFFECT", "MUSCLE_EFFECTS"],
    ],
    [
      "PPI",
      [
        "GI_DISTURBANCE",
        "HEADACHE",
        "BONE_DENSITY_EFFECT",
        "ELECTROLYTE_IMBALANCE",
      ],
    ],
    [
      "ANTIDIABETIC",
      ["GI_DISTURBANCE", "GLUCOSE_EFFECT", "WEIGHT_CHANGE", "NAUSEA"],
    ],
    [
      "NSAID",
      [
        "GI_DISTURBANCE",
        "BLEEDING_RISK",
        "KIDNEY_EFFECT",
        "BLOOD_PRESSURE_CHANGE",
      ],
    ],
  ]);

// === Pure Functions ===

/**
 * Get known side effect domains for a medication class.
 *
 * @param medicationClass - The medication class
 * @returns Array of side effect domains
 */
export function getSideEffectsForClass(
  medicationClass: MedicationClass
): SideEffectDomain[] {
  return CLASS_SIDE_EFFECTS.get(medicationClass) ?? [];
}

/**
 * Analyze a medication list to build a regimen profile.
 * Reference-based only — no personalization or predictions.
 *
 * @param medications - Array of medication names
 * @returns RegimenProfileResult with classes, side effects, and interactions
 */
export function analyzeRegimenProfile(
  medications: string[]
): RegimenProfileResult {
  // Handle empty input
  if (medications.length === 0) {
    return {
      totalMedications: 0,
      knownMedicationCount: 0,
      unknownMedicationCount: 0,
      classifications: [],
      uniqueDrugClasses: [],
      sideEffectsByClass: [],
      uniqueSideEffectDomains: [],
      nutrientInteractionsByClass: [],
      uniqueFoodInteractions: [],
    };
  }

  // Classify each medication
  const classifications: MedicationClassification[] = medications.map(
    (name) => {
      const medClass = getMedicationClass(name);
      return {
        medicationName: name.toLowerCase().trim(),
        medicationClass: medClass,
        isKnown: medClass !== null,
      };
    }
  );

  const knownMedicationCount = classifications.filter((c) => c.isKnown).length;
  const unknownMedicationCount = classifications.filter(
    (c) => !c.isKnown
  ).length;

  // Extract unique drug classes
  const classSet = new Set<MedicationClass>();
  for (const c of classifications) {
    if (c.medicationClass) {
      classSet.add(c.medicationClass);
    }
  }
  const uniqueDrugClasses = Array.from(classSet);

  // Build side effects by class
  const sideEffectsByClass: ClassSideEffects[] = uniqueDrugClasses.map(
    (cls) => ({
      medicationClass: cls,
      sideEffectDomains: getSideEffectsForClass(cls),
    })
  );

  // Extract unique side effect domains
  const sideEffectSet = new Set<SideEffectDomain>();
  for (const entry of sideEffectsByClass) {
    for (const domain of entry.sideEffectDomains) {
      sideEffectSet.add(domain);
    }
  }
  const uniqueSideEffectDomains = Array.from(sideEffectSet);

  // Build nutrient interactions by class
  const nutrientInteractionsByClass: ClassNutrientInteractions[] =
    uniqueDrugClasses.map((cls) => ({
      medicationClass: cls,
      interactions: getInteractionsForClass(cls),
    }));

  // Build unique food interactions with affected classes
  const foodInteractionMap = new Map<
    FoodCategory,
    { categories: Set<InteractionCategory>; classes: Set<MedicationClass> }
  >();

  for (const entry of nutrientInteractionsByClass) {
    for (const interaction of entry.interactions) {
      const existing = foodInteractionMap.get(interaction.foodCategory) ?? {
        categories: new Set(),
        classes: new Set(),
      };
      existing.categories.add(interaction.category);
      existing.classes.add(entry.medicationClass);
      foodInteractionMap.set(interaction.foodCategory, existing);
    }
  }

  const uniqueFoodInteractions: RegimenProfileResult["uniqueFoodInteractions"] =
    [];
  for (const [foodCategory, data] of foodInteractionMap) {
    uniqueFoodInteractions.push({
      foodCategory,
      categories: Array.from(data.categories),
      affectedClasses: Array.from(data.classes),
    });
  }

  // Sort food interactions by severity (AVOID first)
  uniqueFoodInteractions.sort((a, b) => {
    const aHasAvoid = a.categories.includes("AVOID") ? 0 : 1;
    const bHasAvoid = b.categories.includes("AVOID") ? 0 : 1;
    return aHasAvoid - bHasAvoid;
  });

  return {
    totalMedications: medications.length,
    knownMedicationCount,
    unknownMedicationCount,
    classifications,
    uniqueDrugClasses,
    sideEffectsByClass,
    uniqueSideEffectDomains,
    nutrientInteractionsByClass,
    uniqueFoodInteractions,
  };
}

// === Utility Functions ===

/**
 * Get all unique drug classes from a medication list.
 *
 * @param medications - Array of medication names
 * @returns Array of unique medication classes
 */
export function getDrugClasses(medications: string[]): MedicationClass[] {
  return analyzeRegimenProfile(medications).uniqueDrugClasses;
}

/**
 * Get all unique side effect domains from a medication list.
 *
 * @param medications - Array of medication names
 * @returns Array of unique side effect domains
 */
export function getAllSideEffectDomains(
  medications: string[]
): SideEffectDomain[] {
  return analyzeRegimenProfile(medications).uniqueSideEffectDomains;
}

/**
 * Get all food categories that require attention for a medication list.
 *
 * @param medications - Array of medication names
 * @returns Array of food categories with interaction info
 */
export function getFoodInteractionSummary(
  medications: string[]
): RegimenProfileResult["uniqueFoodInteractions"] {
  return analyzeRegimenProfile(medications).uniqueFoodInteractions;
}

/**
 * Check if any medication in the list has a specific side effect domain.
 *
 * @param medications - Array of medication names
 * @param domain - Side effect domain to check
 * @returns True if any medication has this side effect domain
 */
export function hasAnySideEffect(
  medications: string[],
  domain: SideEffectDomain
): boolean {
  const result = analyzeRegimenProfile(medications);
  return result.uniqueSideEffectDomains.includes(domain);
}

/**
 * Check if any medication in the list interacts with a food category.
 *
 * @param medications - Array of medication names
 * @param foodCategory - Food category to check
 * @returns The interaction categories, or empty array if no interaction
 */
export function checkFoodCategoryInteraction(
  medications: string[],
  foodCategory: FoodCategory
): InteractionCategory[] {
  const result = analyzeRegimenProfile(medications);
  const found = result.uniqueFoodInteractions.find(
    (f) => f.foodCategory === foodCategory
  );
  return found?.categories ?? [];
}

/**
 * Get human-readable label for a side effect domain.
 *
 * @param domain - The side effect domain
 * @returns Human-readable label
 */
export function getSideEffectLabel(domain: SideEffectDomain): string {
  const labels: Record<SideEffectDomain, string> = {
    GI_DISTURBANCE: "GI Disturbance",
    DROWSINESS: "Drowsiness",
    DIZZINESS: "Dizziness",
    HEADACHE: "Headache",
    NAUSEA: "Nausea",
    APPETITE_CHANGE: "Appetite Change",
    WEIGHT_CHANGE: "Weight Change",
    ELECTROLYTE_IMBALANCE: "Electrolyte Imbalance",
    BLOOD_PRESSURE_CHANGE: "Blood Pressure Change",
    HEART_RATE_CHANGE: "Heart Rate Change",
    PHOTOSENSITIVITY: "Photosensitivity",
    MUSCLE_EFFECTS: "Muscle Effects",
    BLEEDING_RISK: "Bleeding Risk",
    IMMUNE_SUPPRESSION: "Immune Suppression",
    BONE_DENSITY_EFFECT: "Bone Density Effect",
    GLUCOSE_EFFECT: "Glucose Effect",
    LIVER_EFFECT: "Liver Effect",
    KIDNEY_EFFECT: "Kidney Effect",
  };

  return labels[domain];
}

/**
 * Get all available side effect domains.
 *
 * @returns Array of all side effect domain identifiers
 */
export function getAllSideEffectDomainTypes(): SideEffectDomain[] {
  return [
    "GI_DISTURBANCE",
    "DROWSINESS",
    "DIZZINESS",
    "HEADACHE",
    "NAUSEA",
    "APPETITE_CHANGE",
    "WEIGHT_CHANGE",
    "ELECTROLYTE_IMBALANCE",
    "BLOOD_PRESSURE_CHANGE",
    "HEART_RATE_CHANGE",
    "PHOTOSENSITIVITY",
    "MUSCLE_EFFECTS",
    "BLEEDING_RISK",
    "IMMUNE_SUPPRESSION",
    "BONE_DENSITY_EFFECT",
    "GLUCOSE_EFFECT",
    "LIVER_EFFECT",
    "KIDNEY_EFFECT",
  ];
}
