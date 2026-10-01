# Rank Ruler AI

Rank Ruler AI is an AI-powered SEO auditing and optimization application built with TanStack Start, React 19, TypeScript, Tailwind CSS and Bun. It scans public websites, prioritizes SEO issues, analyzes page context and keyword signals, and generates practical optimization guidance.

**Live app:** https://rank-ruler-ai.lovable.app

## What it does

- Audits technical SEO, metadata, headings, canonicals, robots directives and sitemaps.
- Reviews speed-related signals including TTFB, HTML size, compression and render-blocking assets.
- Analyzes content, keywords, internal/external links and structured data.
- Evaluates AI/search visibility signals and page context.
- Produces rewrite and optimization suggestions for titles, descriptions, headings and content.
- Connects to published Lovable projects and custom domains for pre-scan checks.
- Includes analytics, keyword, growth and fix-oriented application modules.

## Stack

- TanStack Start / TanStack Router
- React 19
- TypeScript
- TanStack Query
- Tailwind CSS 4
- Radix UI
- React Three Fiber / Three.js
- Zod
- Bun + Vite

## Development

Bun is recommended because the repository includes `bun.lock`.

```sh
git clone https://github.com/arivuwallet-sketch/rank-ruler-ai.git
cd rank-ruler-ai
bun install
bun run dev
```

The app is then served by Vite in development mode.

## Quality checks

```sh
bun run typecheck
bun run lint
bun run format:check
bun run build
```

Run the blocking verification pipeline with:

```sh
bun run check
```

`bun run check` performs strict TypeScript validation followed by a production build. GitHub Actions blocks pushes and pull requests on those checks. Lint also runs in CI as a non-blocking audit while the repository's existing Prettier baseline is cleaned up; `bun run lint` remains available locally for the complete report.

## Production endpoints and discovery

- `/healthz` — lightweight application health response.
- `/robots.txt` — crawler policy and sitemap discovery.
- `/sitemap.xml` — current public route sitemap.
- `/llms.txt` — concise AI-agent/product description.
- `/site.webmanifest` — installable web-app metadata.

## Lovable sync

This project is connected to [Lovable](https://lovable.dev). Commits pushed to `main` sync back into the Lovable project. Keep published Git history linear and avoid force-pushing, rebasing or amending commits that Lovable has already synced.

## Important note

SEO recommendations are diagnostic guidance, not guaranteed ranking outcomes. Search engines continually change ranking, crawling and presentation systems, so production decisions should be validated against current first-party webmaster documentation and real analytics/search-console data.
