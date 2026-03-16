"use client";

export type RubricCriterion = {
  criterion: string;
  max_points: number;
  description: string;
};

type Props = {
  value: RubricCriterion[];
  onChange: (value: RubricCriterion[]) => void;
};

export default function RubricBuilder({ value, onChange }: Props) {
  function addCriterion() {
    onChange([...value, { criterion: "", max_points: 10, description: "" }]);
  }

  function removeCriterion(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateCriterion(
    index: number,
    field: keyof RubricCriterion,
    val: string | number
  ) {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  }

  return (
    <div>
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Criterion name
                    </label>
                    <input
                      type="text"
                      value={item.criterion}
                      onChange={(e) =>
                        updateCriterion(index, "criterion", e.target.value)
                      }
                      placeholder="e.g. Clarity"
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Max points
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.max_points}
                      onChange={(e) =>
                        updateCriterion(
                          index,
                          "max_points",
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateCriterion(index, "description", e.target.value)
                    }
                    placeholder="What does this criterion evaluate?"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCriterion(index)}
                className="mt-6 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove criterion"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <p className="mb-3 text-sm text-gray-400">
          No criteria yet. Add at least one criterion.
        </p>
      )}

      <button
        type="button"
        onClick={addCriterion}
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Add criterion
      </button>
    </div>
  );
}
