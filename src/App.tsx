import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./components/Icon";
import { useTheme } from "./hooks/useTheme";
import {
  filterByCategory,
  filterByIngredient,
  getCategories,
  getRandomMeals,
  listIngredients,
  lookupById,
  searchByName,
  type Category,
  type Meal,
  type MealSummary,
} from "./components/api";
import MealModal from "./components/MealModal";

type Mode = "name" | "category" | "ingredient" | "random";

/** Results per page — big lists (e.g. Seafood ≈ 80) get a pager. */
const PAGE_SIZE = 16;
const RANDOM_COUNT = 8;

const modes: { value: Mode; label: string }[] = [
  { value: "name", label: "By name" },
  { value: "category", label: "Categories" },
  { value: "ingredient", label: "By ingredient" },
  { value: "random", label: "Random" },
];

/** Simmer brand mark — a steaming pot on a terracotta dot. */
function SimmerMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Simmer logo"
    >
      <circle cx="24" cy="24" r="24" fill="var(--sm-primary)" />
      <path
        d="M19.5 9.5c-1.5 1.8 1 3-.6 4.8M28.7 9.5c-1.5 1.8 1 3-.6 4.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M13 21h22v7a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8v-7Z" fill="#fff" />
      <path
        d="M9.5 21h29"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MealCard({
  meal,
  onOpen,
}: {
  meal: Meal | MealSummary;
  onOpen: () => void;
}) {
  const full = "strCategory" in meal ? (meal as Meal) : null;
  return (
    <button type="button" className="sm-card" onClick={onOpen}>
      <img src={meal.strMealThumb} alt="" loading="lazy" />
      <span className="sm-card-body">
        <span className="sm-card-name">{meal.strMeal}</span>
        {full && (full.strCategory || full.strArea) && (
          <span className="sm-card-tags">
            {full.strCategory && <span className="sm-tag">{full.strCategory}</span>}
            {full.strArea && (
              <span className="sm-tag sm-tag-herb">{full.strArea}</span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<Mode>("name");
  const [nameQuery, setNameQuery] = useState("");
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allIngredients, setAllIngredients] = useState<string[]>([]);

  const [meals, setMeals] = useState<(Meal | MealSummary)[] | null>(null);
  const [resultLabel, setResultLabel] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMeal, setModalMeal] = useState<Meal | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Only the latest request may write results (fast typers, slow network).
  const requestSeq = useRef(0);

  const run = useCallback(
    async (
      label: string,
      fetcher: () => Promise<(Meal | MealSummary)[]>,
    ) => {
      const seq = ++requestSeq.current;
      setLoading(true);
      setError("");
      try {
        const result = await fetcher();
        if (seq !== requestSeq.current) return;
        setMeals(result);
        setResultLabel(label);
        setPage(1);
      } catch {
        if (seq !== requestSeq.current) return;
        setError("The kitchen isn't answering — check your connection and try again.");
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [],
  );

  const rollRandom = useCallback(() => {
    void run("Chef's random picks", () => getRandomMeals(RANDOM_COUNT));
  }, [run]);

  const surpriseMe = () => {
    setMode("random");
    rollRandom();
  };

  // First paint: show something tasty instead of an empty grid.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    rollRandom();
  }, [rollRandom]);

  // Lazy-load option lists the first time their mode is opened.
  useEffect(() => {
    if (mode === "category" && categories.length === 0) {
      getCategories()
        .then(setCategories)
        .catch(() => {});
    }
    if (mode === "ingredient" && allIngredients.length === 0) {
      listIngredients()
        .then(setAllIngredients)
        .catch(() => {});
    }
  }, [mode, categories.length, allIngredients.length]);

  const submitName = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = nameQuery.trim();
    if (!q) return;
    void run(`Meals matching “${q}”`, () => searchByName(q));
  };

  const submitIngredient = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = ingredientQuery.trim();
    if (!q) return;
    void run(`Cooked with ${q}`, () => filterByIngredient(q));
  };

  const pickCategory = (category: string) => {
    setSelectedCategory(category);
    void run(`${category} recipes`, () => filterByCategory(category));
  };

  const openMeal = (meal: Meal | MealSummary) => {
    setModalOpen(true);
    if ("strInstructions" in meal && meal.strInstructions) {
      setModalMeal(meal as Meal);
      return;
    }
    // Category/ingredient filters return summaries — fetch the full record.
    setModalMeal(null);
    setModalLoading(true);
    lookupById(meal.idMeal)
      .then(setModalMeal)
      .catch(() => setModalMeal(null))
      .finally(() => setModalLoading(false));
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalMeal(null);
  }, []);

  const retry = () => {
    if (mode === "random") rollRandom();
    else if (mode === "category" && selectedCategory) pickCategory(selectedCategory);
    else if (mode === "ingredient" && ingredientQuery.trim())
      void run(`Cooked with ${ingredientQuery.trim()}`, () =>
        filterByIngredient(ingredientQuery),
      );
    else if (nameQuery.trim())
      void run(`Meals matching “${nameQuery.trim()}”`, () =>
        searchByName(nameQuery.trim()),
      );
    else rollRandom();
  };

  // Client-side pagination — the free API always returns the full list.
  const totalPages = meals ? Math.ceil(meals.length / PAGE_SIZE) : 0;
  const pageMeals = meals
    ? meals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : [];

  const goToPage = (next: number) => {
    setPage(next);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    resultsRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="sm-page">
      <header className="sm-header">
        <div className="sm-shell sm-header-inner">
          <a href="/recipes/" className="sm-brand">
            <SimmerMark size={34} />
            <span className="sm-brand-name">Simmer</span>
          </a>
          <div className="sm-header-actions">
            <button
              type="button"
              className="sm-btn sm-btn-ghost sm-btn-sm sm-surprise"
              onClick={surpriseMe}
            >
              <Icon name="shuffle" size={15} />
              Surprise me
            </button>
            <button
              type="button"
              className="sm-iconbtn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="sm-shell sm-main">
        <section className="sm-hero">
          <p className="sm-kicker">🍳 Hundreds of free recipes</p>
          <h1 className="sm-h1">Find your next favorite meal.</h1>
          <p className="sm-sub">
            Search by name, browse categories, hunt by ingredient — or let the
            pot decide. Click any dish for the full recipe.
          </p>
        </section>

        <div className="sm-tabs" role="group" aria-label="Search mode">
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`sm-tab${mode === m.value ? " active" : ""}`}
              aria-pressed={mode === m.value}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "name" && (
          <form className="sm-search" onSubmit={submitName}>
            <Icon name="search" size={18} className="sm-search-icon" />
            <input
              className="sm-search-input"
              type="search"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder='Try "Arrabiata", "pie", or "chicken"…'
              aria-label="Search meals by name"
            />
            <button className="sm-btn sm-btn-primary" type="submit">
              Search
            </button>
          </form>
        )}

        {mode === "ingredient" && (
          <form className="sm-search" onSubmit={submitIngredient}>
            <Icon name="search" size={18} className="sm-search-icon" />
            <input
              className="sm-search-input"
              type="search"
              list="sm-ingredient-list"
              value={ingredientQuery}
              onChange={(e) => setIngredientQuery(e.target.value)}
              placeholder='What&apos;s in the fridge? Try "salmon" or "garlic"…'
              aria-label="Search meals by main ingredient"
            />
            <datalist id="sm-ingredient-list">
              {allIngredients.map((ing) => (
                <option value={ing} key={ing} />
              ))}
            </datalist>
            <button className="sm-btn sm-btn-primary" type="submit">
              Find meals
            </button>
          </form>
        )}

        {mode === "category" && (
          <div className="sm-cats" role="group" aria-label="Meal categories">
            {categories.length === 0 && (
              <p className="sm-hint">Warming up the categories…</p>
            )}
            {categories.map((c) => (
              <button
                key={c.idCategory}
                type="button"
                className={`sm-cat${selectedCategory === c.strCategory ? " selected" : ""}`}
                onClick={() => pickCategory(c.strCategory)}
                title={c.strCategory}
              >
                <span className="sm-cat-img">
                  <img src={c.strCategoryThumb} alt="" loading="lazy" />
                </span>
                {c.strCategory}
              </button>
            ))}
          </div>
        )}

        {mode === "random" && (
          <div className="sm-random-bar">
            <button
              type="button"
              className="sm-btn sm-btn-primary"
              onClick={rollRandom}
            >
              <Icon name="shuffle" size={16} />
              Stir the pot — {RANDOM_COUNT} random meals
            </button>
          </div>
        )}

        {error && (
          <div className="sm-note" role="alert">
            <p>{error}</p>
            <button type="button" className="sm-btn sm-btn-ghost" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="sm-grid" aria-hidden="true">
            {Array.from({ length: RANDOM_COUNT }, (_, i) => (
              <div className="sm-skel" key={i} />
            ))}
          </div>
        )}

        {!error && !loading && meals && meals.length === 0 && (
          <div className="sm-note">
            <p>
              No meals found — the pantry is picky about spelling. Try another
              search, or let us surprise you.
            </p>
            <button
              type="button"
              className="sm-btn sm-btn-ghost"
              onClick={surpriseMe}
            >
              <Icon name="shuffle" size={15} />
              Surprise me
            </button>
          </div>
        )}

        {!error && !loading && meals && meals.length > 0 && (
          <div className="sm-results" ref={resultsRef}>
            <p className="sm-count" aria-live="polite">
              {resultLabel} · {meals.length} meal{meals.length === 1 ? "" : "s"}
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </p>
            <div className="sm-grid">
              {pageMeals.map((meal) => (
                <MealCard
                  key={meal.idMeal}
                  meal={meal}
                  onOpen={() => openMeal(meal)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="sm-pager" aria-label="Result pages">
                <button
                  type="button"
                  className="sm-page-btn"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <Icon name="chevron-left" size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`sm-page-btn${n === page ? " active" : ""}`}
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => {
                      if (n !== page) goToPage(n);
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="sm-page-btn"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <Icon name="chevron-right" size={16} />
                </button>
              </nav>
            )}
          </div>
        )}
      </main>

      <footer className="sm-footer">
        <SimmerMark size={22} />
        <p>
          Simmer is a live demo by{" "}
          <a href="/portfolio" title="David's portfolio">
            David Guijosa
          </a>{" "}
          · recipe data from{" "}
          <a href="https://www.themealdb.com" target="_blank" rel="noreferrer">
            TheMealDB
          </a>
        </p>
      </footer>

      {modalOpen && (
        <MealModal meal={modalMeal} loading={modalLoading} onClose={closeModal} />
      )}
    </div>
  );
}
