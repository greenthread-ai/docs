# GreenThread Docs

Customer-facing documentation site for GreenThread, deployed to GitHub Pages.

## Development

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:5173`.

## Build

```bash
pnpm build
```

Static output goes to `build/client/`. All pages are pre-rendered at build time.

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages.

## Stack

- React Router v7 (SPA mode, static prerender)
- MDX with Shiki syntax highlighting
- Tailwind CSS v4
- Mermaid diagrams
- cmdk search
