# CSV Analytics

A privacy-first, browser-only Angular app for exploring CSV data. Files are parsed in the browser and datasets/workspaces are stored locally in IndexedDB; imported data is not uploaded.

## Run locally

```bash
npm ci
npm start
```

Open the URL printed by Angular CLI (usually `http://localhost:4200`), then drop a `.csv` file or choose the sample dataset.

## Features

- CSV import with delimiter detection, headers, progress, and a 100 MB size limit
- Dataset overview, data explorer with search, sorting, type-aware filters, and column profiles
- Data-quality checks, summary statistics, grouping, correlation, and rule-based insights
- Bar, line, area, pie, donut, scatter, histogram, and KPI visualizations
- Locally saved charts, reorderable dashboards, and dashboard presentation mode
- Safe calculated fields using arithmetic, column references, and text concatenation (no JavaScript evaluation)
- Local dataset/workspace library, settings with a saved app-wide accent color, CSV/JSON export, and chart/dashboard PNG export

## Commands

```bash
npm start       # Development server
npm run build   # Production build
npm test        # Unit tests
```

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds the static app and deploys it to GitHub Pages. In repository settings, enable Pages with **GitHub Actions** as the source.

## Local data

Datasets and workspaces stay in the current browser profile. Clearing site data or using the Settings page's **Delete all local data** action removes them. Do not use shared browser profiles for sensitive datasets.

## Project structure

- `src/app/core/` — domain models, CSV processing, analytics, formulas, and IndexedDB repository
- `src/app/features/` — upload, explorer, analytics, quality, chart/dashboard builder, libraries, and settings
- `src/app/layout/` — responsive workspace application shell
- `specs/` — product requirements and UI/UX specifications
