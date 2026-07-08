import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { getIngredients, type Meal } from "./api";

interface MealModalProps {
  meal: Meal | null;
  loading: boolean;
  onClose: () => void;
}

/** Strip "STEP 1" / "1." prefixes — our numbered list already counts. */
function cleanStep(step: string): string {
  return step
    .replace(/^STEP\s*\d+[:.\s-]*/i, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

export default function MealModal({ meal, loading, onClose }: MealModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());

  // Fresh shopping list for every recipe.
  useEffect(() => {
    setChecked(new Set());
  }, [meal?.idMeal]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggleItem = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const ingredients = meal ? getIngredients(meal) : [];
  const steps = meal
    ? meal.strInstructions
        .split(/\r?\n+/)
        .map(cleanStep)
        .filter(Boolean)
    : [];
  const tags = (meal?.strTags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="sm-backdrop" onClick={onClose}>
      <div
        className="sm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={meal?.strMeal ?? "Recipe"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="sm-iconbtn sm-close"
          onClick={onClose}
          aria-label="Close recipe"
        >
          <Icon name="close" size={18} />
        </button>

        {loading || !meal ? (
          <p className="sm-modal-loading">
            {loading ? "Plating up…" : "Couldn't load this recipe — try another."}
          </p>
        ) : (
          <>
            <img
              className="sm-modal-img"
              src={meal.strMealThumb}
              alt={meal.strMeal}
            />
            <div className="sm-modal-body">
              <h2 className="sm-modal-title">{meal.strMeal}</h2>
              <div className="sm-tagrow">
                {meal.strCategory && (
                  <span className="sm-tag">{meal.strCategory}</span>
                )}
                {meal.strArea && (
                  <span className="sm-tag sm-tag-herb">{meal.strArea}</span>
                )}
                {tags.map((tag) => (
                  <span className="sm-tag sm-tag-amber" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="sm-modal-grid">
                <section aria-label="Ingredients">
                  <h3>
                    Ingredients{" "}
                    <span className="sm-h3-count">({ingredients.length})</span>
                  </h3>
                  <p className="sm-hint">Tick them off as you cook.</p>
                  <ul className="sm-ings">
                    {ingredients.map(({ ingredient, measure }, i) => (
                      <li key={`${ingredient}-${i}`} className={checked.has(i) ? "done" : undefined}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checked.has(i)}
                            onChange={() => toggleItem(i)}
                          />
                          <span>
                            {measure && <em>{measure}</em>}
                            {ingredient}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-label="Method">
                  <h3>Method</h3>
                  <ol className="sm-steps">
                    {steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </section>
              </div>

              {(meal.strYoutube || meal.strSource) && (
                <div className="sm-modal-links">
                  {meal.strYoutube && (
                    <a
                      className="sm-btn sm-btn-ghost sm-btn-sm"
                      href={meal.strYoutube}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch on YouTube
                      <Icon name="external" size={14} />
                    </a>
                  )}
                  {meal.strSource && (
                    <a
                      className="sm-btn sm-btn-ghost sm-btn-sm"
                      href={meal.strSource}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Original recipe
                      <Icon name="external" size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
