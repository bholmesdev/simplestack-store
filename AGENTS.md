# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the TypeScript source and tests. Public entry points live in `src/index.ts` and `src/react.ts`.
- Tests sit alongside source files as `*.test.ts` or `*.test.tsx` (for example, `src/react.test.tsx`).
- `dist/` contains the build output produced by TypeScript (`tsc`).
- `examples/` contains runnable example apps (Vite and Next.js).

## Build, Test, and Development Commands
- `pnpm run build`: compile TypeScript into `dist/` using `tsc`.
- `pnpm run dev`: watch mode for local development (`tsc -w`).
- `pnpm run check`: run Biome lint/format checks.
- `pnpm run check:fix`: auto-fix formatting and lint issues with Biome.
- `pnpm run test`: run Vitest once in CI mode.
- `pnpm run test:ui`: launch the Vitest UI for interactive debugging.

## Coding Style & Naming Conventions
- Indentation: tabs (Biome formatter enforces this).
- Quotes: double quotes in JavaScript/TypeScript (Biome configured).
- File naming: lowercase with dashes for docs and configs, and `*.test.ts(x)` for tests.
- Use Biome for formatting and linting; run `pnpm run check:fix` before pushing.

## Testing Guidelines
- Framework: Vitest with `happy-dom`.
- Test files: `src/**/*.{test,spec}.{ts,tsx}`.
- Coverage: V8 provider with text/json/html reporters; excludes test files.
- Prefer colocated tests next to the module they cover.

## Commit & Pull Request Guidelines
- Commit messages are short and direct, often lowercase, with release tags like `0.7.3`.
- Use imperative summaries (e.g., “add useStoreValue selector function”).
- PRs should include a clear description, test notes (`pnpm run test`), and link issues when relevant.

## Configuration Tips
- Package manager: `pnpm@10.12.1` (see `package.json`).
- `prepublishOnly` runs `pnpm run build`; ensure `dist/` is up to date before publishing.
