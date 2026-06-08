# SUV Compare — Jodhpur

Personal SUV comparison tool for Jodhpur, Rajasthan.

## Setup

1. Clone this repo
2. Open `index.html` in a browser (use a local server for ES modules: `npx serve .`)
3. Or deploy to GitHub Pages via Settings → Pages → main branch

## Data refresh

The "Refresh" button triggers the GitHub Actions workflow.
Requires a GitHub PAT with `workflow` scope stored as secret `GH_PAT` in repo settings.

## Tests

```bash
npm install
npm test
```
