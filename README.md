# CSV Analytics

A privacy-first, browser-only Angular app for exploring CSV data. There is no login or server-side upload: files are parsed in the browser and datasets, workspaces, and preferences are stored locally in IndexedDB and browser storage.

## Run locally

```bash
npm ci
npm start
```

Open the URL printed by Angular CLI (usually `http://localhost:4200`), then drop a `.csv` file or choose **Explore a sample dataset**. The sample is generated locally by the app; it is not fetched from an external service.

## Features

- CSV import with delimiter detection or manual selection, optional headers and whitespace trimming, progress, cancellation, and a 100 MB size limit
- Dataset overview and data explorer with search, sorting, column profiles, and type-aware text, number, date, and boolean filters
- Data-quality checks, summary statistics, grouping, correlation, and rule-based insights
- Bar, line, area, pie, donut, scatter, histogram, and KPI visualizations
- Chart builder with live preview, saved charts, reorderable dashboards, and dashboard presentation mode
- Safe calculated fields using arithmetic, column references, text concatenation, and supported built-in functions (no JavaScript evaluation)
- Light/dark/system appearance settings and a saved app-wide accent color
- Dataset/workspace libraries, CSV/JSON export, and chart/dashboard PNG export

## Commands

```bash
npm start       # Development server
npm run build   # Production build
npm test        # Unit tests
```

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds the static app and deploys it to GitHub Pages. In repository settings, enable Pages with **GitHub Actions** as the source.

## Local data

Datasets and workspaces stay in the current browser profile. Clearing site data or using the Settings page's **Delete all local data** action removes them. Appearance and other preferences are stored in browser local storage. Do not use shared browser profiles for sensitive datasets.

## Project structure

- `src/app/core/` — domain models, CSV processing, analytics, formulas, and IndexedDB repository
- `src/app/features/` — upload, explorer, analytics, quality, chart/dashboard builder, libraries, and settings
- `src/app/layout/` — responsive workspace application shell
- `specs/` — product requirements and UI/UX specifications
