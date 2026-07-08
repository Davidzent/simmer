/**
 * Thin client for TheMealDB's free API (test key "1").
 * Docs: https://www.themealdb.com/api.php
 */

const BASE = "https://www.themealdb.com/api/json/v1/1";

export interface MealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

/** Full meal record — includes strIngredient1..20 / strMeasure1..20. */
export interface Meal extends MealSummary {
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  [key: string]: string | null;
}

export interface Category {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) {
    throw new Error(`TheMealDB request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** search.php?s= — full meal records matching a name. */
export async function searchByName(name: string): Promise<Meal[]> {
  const data = await get<{ meals: Meal[] | null }>(
    `search.php?s=${encodeURIComponent(name)}`,
  );
  return data.meals ?? [];
}

/** filter.php?c= — summaries only (name, thumb, id). */
export async function filterByCategory(category: string): Promise<MealSummary[]> {
  const data = await get<{ meals: MealSummary[] | null }>(
    `filter.php?c=${encodeURIComponent(category)}`,
  );
  return data.meals ?? [];
}

/** filter.php?i= — the API expects underscores instead of spaces. */
export async function filterByIngredient(
  ingredient: string,
): Promise<MealSummary[]> {
  const slug = ingredient.trim().replace(/\s+/g, "_");
  const data = await get<{ meals: MealSummary[] | null }>(
    `filter.php?i=${encodeURIComponent(slug)}`,
  );
  return data.meals ?? [];
}

/** lookup.php?i= — full record for one meal id. */
export async function lookupById(id: string): Promise<Meal | null> {
  const data = await get<{ meals: Meal[] | null }>(`lookup.php?i=${id}`);
  return data.meals?.[0] ?? null;
}

/** random.php returns a single meal — fan out and dedupe for a grid. */
export async function getRandomMeals(count: number): Promise<Meal[]> {
  const results = await Promise.all(
    Array.from({ length: count }, () =>
      get<{ meals: Meal[] | null }>("random.php"),
    ),
  );
  const seen = new Set<string>();
  const meals: Meal[] = [];
  for (const result of results) {
    const meal = result.meals?.[0];
    if (meal && !seen.has(meal.idMeal)) {
      seen.add(meal.idMeal);
      meals.push(meal);
    }
  }
  return meals;
}

export async function getCategories(): Promise<Category[]> {
  const data = await get<{ categories: Category[] | null }>("categories.php");
  return data.categories ?? [];
}

/** list.php?i=list — every known ingredient, for the datalist. */
export async function listIngredients(): Promise<string[]> {
  const data = await get<{ meals: { strIngredient: string }[] | null }>(
    "list.php?i=list",
  );
  return (data.meals ?? []).map((m) => m.strIngredient).filter(Boolean);
}

/** Collapse strIngredient1..20 / strMeasure1..20 into a clean list. */
export function getIngredients(
  meal: Meal,
): { ingredient: string; measure: string }[] {
  const items: { ingredient: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    if (ingredient && ingredient.trim()) {
      items.push({
        ingredient: ingredient.trim(),
        measure: (meal[`strMeasure${i}`] ?? "").trim(),
      });
    }
  }
  return items;
}
