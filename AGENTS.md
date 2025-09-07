# Repository Guidelines

## Project Structure & Module Organization
- Root HTML: `index.html`, `dataset.html`, `privacy.html`, `legal.html`.
- Data: `data/` JSON by domain (e.g., `data/energia/*.json`). Catalogs: `data/catalog.json`, `data/catalog_en.json`.
- Assets: `assets/` (JS: `main.js`, `dataset.js`, `i18n.js`, `theme.js`; CSS: `input.css` → `output.css`; images under `assets/images/`).
- Scripts & tooling: Node utilities in `*.js` (e.g., `generate_sitemap.js`, `fix_datasets.js`), shell helpers (`check-sitemap.sh`).

## Build, Test, and Development Commands
- `npm run serve`: Start local Node server on `http://localhost:8000`.
- `npm run serve:python`: Simple Python alternative server.
- `npm run build:css`: Build Tailwind from `assets/input.css` to `assets/output.css` (minified).
- `npm run generate:sitemap`: Generate `sitemap*.xml` files.
- `npm run check:sitemap`: Validate sitemap links.
- `npm test`: Run JSON lint, ESLint, and HTMLHint.

## Coding Style & Naming Conventions
- JavaScript: ES modules, browser context; prefer 4-space indent, semicolons, single quotes.
- Linting: ESLint with `no-unused-vars` as warning; globals allowed: `lucide`, `echarts`, `AOS`.
- Files: scripts use lowercase snake_case (e.g., `generate_sitemap.js`); asset modules are short lowercase names (`main.js`).
- Data files and IDs: lowercase snake_case with version suffix, e.g., `co2_mundial_v2.json`, dataset ids like `ia_generativa_v2`.

## Testing Guidelines
- Run locally: `npm test` (or `npm run test:json`, `test:js`, `test:html`).
- JSON: keep valid schemas and arrays consistent with consumers in `assets/*.js`.
- HTML: fix accessibility/structure issues flagged by HTMLHint.
- JS: resolve unused variables and modern syntax issues flagged by ESLint.

## Commit & Pull Request Guidelines
- Commits: concise imperative subject; prefer Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). Example: `feat(data): add energia solar series v2`.
- PRs: include purpose, scope, and before/after screenshots for UI; link issues; list testing steps (`npm test`, local server check) and sitemap impact if relevant.

## Security & Configuration Tips
- Do not commit secrets; this repo is static—no backend keys needed.
- Keep `.htaccess` and `robots.txt` changes intentional.
- When adding external libs, prefer local assets and declare globals in `eslint.config.js`.
