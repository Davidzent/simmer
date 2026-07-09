<div align="center">

# Simmer

**Find your next favorite meal.**

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TheMealDB](https://img.shields.io/badge/API-TheMealDB-c9502e)](https://www.themealdb.com/api.php)

A live demo by [David Guijosa](https://www.zntsns.com) · part of the
[portfolio](../../README.md) · served at `/recipes/`

</div>

![Simmer home](../../docs/simmer/home.jpg)

Simmer is a standalone **recipe finder** with its own warm, editorial identity,
powered by the free [TheMealDB](https://www.themealdb.com/api.php) API. Search
hundreds of dishes, browse by category or ingredient, or let the pot decide.

---

## Features

- **Four ways to search** — by name, by category (browse the bubbles), by main
  ingredient (with an autocomplete of every ingredient), or **shuffle** random
  meals.
- **Full recipe view** — a photo header, tag chips, a **check-off ingredient
  list**, and numbered **method steps** (cleaned of TheMealDB's inconsistent
  `STEP 1` / `1.` prefixes), plus YouTube & source links.
- **Pagination** — 16 results per page with a tidy pager.
- **Light / dark theme** — warm cream by day, espresso by night; remembers your
  choice.
- **Loading & empty states**, keyboard-accessible modal, `prefers-reduced-motion`
  support.

<table>
  <tr>
    <td width="50%"><img src="../../docs/simmer/home.jpg" alt="Search & random meals"><p align="center"><em>Search modes & random picks</em></p></td>
    <td width="50%"><img src="../../docs/simmer/recipe.jpg" alt="Full recipe view"><p align="center"><em>Full recipe — ingredients & method</em></p></td>
  </tr>
</table>

---

## Tech

- React 19 + TypeScript (strict)
- A tiny typed [`api.ts`](api.ts) client wrapping TheMealDB endpoints
  (`search.php`, `filter.php`, `lookup.php`, `random.php`, `categories.php`,
  `list.php`)
- Hand-written CSS (`Fraunces` display serif + `Inter`), no UI framework

## Run it

It's part of the portfolio monorepo:

```bash
npm install
npm run dev
# then open http://localhost:5173/recipes/
```

## Credits

Recipe data & photography from [TheMealDB](https://www.themealdb.com) (free
test API). Simmer is a portfolio demo and not affiliated with TheMealDB.
