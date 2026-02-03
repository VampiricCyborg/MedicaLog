"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { createMealLog } from "@/app/patient/meal-logs/actions";
import { useRouter } from "next/navigation";

const mealTypes = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "OTHER", label: "Other" },
] as const;

export function PatientMealForm() {
  const router = useRouter();
  const [mealType, setMealType] = useState<string>("BREAKFAST");
  const [descriptionText, setDescriptionText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(false);

    const trimmed = descriptionText.trim();
    if (!trimmed) {
      setErrors(["Please describe what you ate"]);
      return;
    }

    startTransition(async () => {
      const result = await createMealLog({
        mealType,
        descriptionText: trimmed,
      });

      if (result.ok) {
        setSuccess(true);
        setDescriptionText("");
        router.refresh();
      } else if (result.errors) {
        setErrors(result.errors);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      {success && (
        <div className="border border-green-200 bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-700">Meal logged successfully.</p>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="mealType"
          className="block text-sm font-medium text-black"
        >
          Meal type
        </label>
        <select
          id="mealType"
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md"
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          disabled={isPending}
        >
          {mealTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="descriptionText"
          className="block text-sm font-medium text-black"
        >
          What did you eat?
        </label>
        <textarea
          id="descriptionText"
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md min-h-24 resize-y"
          placeholder="Describe your meal"
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
          disabled={isPending}
          maxLength={1000}
        />
        <p className="text-xs text-black/50">
          {descriptionText.length}/1000 characters
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Logging..." : "Log Meal"}
      </Button>
    </form>
  );
}
