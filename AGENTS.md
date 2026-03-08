# AGENTS.md

Practical guidance for autonomous coding/documentation agents working in this repository.

## 1) Repository Scope
- Workspace is mixed: root-level docs/assets plus an app project under `claw-empire/`.
- Root primarily contains setup/integration docs and helper scripts.
- `claw-empire/` is the main codebase (Node + TypeScript + pnpm).
- App stack: React/Vite frontend, Express backend, Vitest + Playwright tests.
- `claw-empire/` has its own local `AGENTS.md`; treat it as additional local policy when editing there.

## 2) Quick Map
- Root docs: `README.md`, `OPENCLAW_SETUP.md`, `DEPLOYMENT_GUIDE.md`, `USECASES.md`.
- Root helpers: `CLAW_EMPIRE_SETUP.md`, `CLAW_EMPIRE_DISCORD_WIRING.md`, `MULTI_AGENT_*.md`.
- Root assets/scripts: `images/`, `setup_claw_empire.bat`, `start_claw_empire.bat`, `templates/`.
- App source: `claw-empire/src/` (frontend), `claw-empire/server/` (backend), `claw-empire/tests/e2e/`.

## 3) Cursor/Copilot Rules Status
- Checked for `.cursor/rules/**`, `.cursorrules`, `.github/copilot-instructions.md`.
- Current result: none found in this workspace.
- Re-check before major edits:
  - `glob "**/.cursor/rules/**"`
  - `glob "**/.cursorrules"`
  - `glob "**/.github/copilot-instructions.md"`

## 4) Runtime Baseline
- Use Node.js `>=22` (`claw-empire/package.json` engines).
- Use pnpm (`packageManager` is pinned in `claw-empire/package.json`).
- From root, prefer `pnpm --dir claw-empire <command>`.
- Equivalent from `claw-empire/`: `pnpm <command>`.
- Never report lint/test/build success unless the command was actually run.
- Keep command execution deterministic: prefer explicit file paths and test names over broad runs.

## 5) Build, Lint, Test Commands

### 5.1 Root Docs Validation
- Lint all markdown: `npx markdownlint-cli2 "**/*.md"`
- Lint one file: `npx markdownlint-cli2 "OPENCLAW_SETUP.md"`
- Prettier check markdown: `npx prettier --check "**/*.md"`
- Prettier write markdown: `npx prettier --write "**/*.md"`
- Link check (if installed): `npx markdown-link-check README.md`

### 5.2 Install / Dev / Build (`claw-empire`)
- Install deps: `pnpm --dir claw-empire install --frozen-lockfile`
- Dev (host 0.0.0.0): `pnpm --dir claw-empire run dev`
- Dev (localhost): `pnpm --dir claw-empire run dev:local`
- Dev for e2e runtime: `pnpm --dir claw-empire run dev:e2e`
- Build: `pnpm --dir claw-empire run build`
- Preview: `pnpm --dir claw-empire run preview`
- Start API/web runtime: `pnpm --dir claw-empire run start`

### 5.3 Lint / Format / Type / Contract
- Lint all app/server files: `pnpm --dir claw-empire run lint`
- Lint with auto-fix: `pnpm --dir claw-empire run lint:fix`
- Prettier check: `pnpm --dir claw-empire run format:check`
- Prettier write: `pnpm --dir claw-empire run format`
- Type check: `pnpm --dir claw-empire exec tsc -p tsconfig.json --noEmit`
- OpenAPI check: `pnpm --dir claw-empire run openapi:check`

### 5.4 Full Test Suites
- Frontend tests: `pnpm --dir claw-empire run test:web`
- Backend tests: `pnpm --dir claw-empire run test:api`
- E2E tests: `pnpm --dir claw-empire run test:e2e`
- Main suite (web + api): `pnpm --dir claw-empire run test`
- CI-like full suite: `pnpm --dir claw-empire run test:ci`

### 5.5 Single-Test / Focused Commands (Important)
- Frontend single file: `pnpm --dir claw-empire run test:web -- src/hooks/usePolling.test.tsx`
- Frontend by test name: `pnpm --dir claw-empire run test:web -- src/hooks/usePolling.test.tsx -t "initial"`
- Backend single file: `pnpm --dir claw-empire run test:api -- server/security/auth.test.ts`
- Backend by test name: `pnpm --dir claw-empire run test:api -- server/security/auth.test.ts -t "세션 발급"`
- E2E single spec: `pnpm --dir claw-empire run test:e2e -- tests/e2e/smoke.spec.ts`
- E2E by title grep: `pnpm --dir claw-empire run test:e2e -- --grep "loads application shell"`
- Single-file ESLint: `pnpm --dir claw-empire exec eslint server/security/auth.ts`
- Single-file Prettier check: `pnpm --dir claw-empire exec prettier --check server/security/auth.ts`
- Single markdown file lint: `npx markdownlint-cli2 "DEPLOYMENT_GUIDE.md"`

### 5.6 CI-Equivalent Sequence (`claw-empire/`)
- `pnpm run format:check`
- `pnpm run lint`
- `pnpm run openapi:check`
- `pnpm exec tsc -p tsconfig.json --noEmit`
- `pnpm run build`
- `pnpm exec playwright install --with-deps` (when browsers/deps are missing)
- `pnpm run test:ci`

### 5.7 Quick Single-Test Recipes (inside `claw-empire/`)
- Frontend one file: `pnpm run test:web -- src/path/to/file.test.tsx`
- Frontend one test name: `pnpm run test:web -- src/path/to/file.test.tsx -t "name"`
- Backend one file: `pnpm run test:api -- server/path/to/file.test.ts`
- Backend one test name: `pnpm run test:api -- server/path/to/file.test.ts -t "name"`
- E2E one spec: `pnpm run test:e2e -- tests/e2e/file.spec.ts`
- E2E title grep: `pnpm run test:e2e -- --grep "title text"`

### 5.8 Fast Verification Matrix
- UI/component behavior changed: run target file with `test:web`; run full `test:web` only after focused pass.
- API/domain logic changed: run target file with `test:api`; run full `test:api` before handoff.
- Contract/schema routes changed: run `openapi:check` plus relevant `test:api` scope.
- Cross-layer runtime behavior changed: run `test` (web + api).
- Navigation/auth/critical flows changed: run focused `test:e2e` spec or `--grep` title.
- Release-level confidence needed: run CI-equivalent sequence in 5.6.

## 6) Change Scope and Safety
- Keep edits minimal and task-focused; avoid unrelated refactors.
- Do not delete/overwrite user data (`*.sqlite`, logs, `.env`) unless explicitly requested.
- Do not commit secrets from env files, runtime logs, or copied command output.
- Preserve markdown links and image references when editing docs.
- Prefer commands that are directly runnable in this repository.

## 7) Code Style Guidelines (TypeScript + React + Node)

### 7.1 Imports and Module Boundaries
- Prefer explicit named imports; avoid wildcard imports.
- Group imports logically: builtin/external first, then internal/local.
- Prefer `import type` for type-only usage (`@typescript-eslint/consistent-type-imports` is enabled).
- In `server/**/*.ts`, keep local imports with `.ts` extensions to match current convention.
- In `src/api.ts` and `src/api/**/*.ts`, follow strict import ordering and keep API layer isolated from UI imports.
- Do not import from `src/components/**`, `src/app/**`, or `src/hooks/**` inside API-layer files.

### 7.2 Formatting and Linting
- Prettier baseline (`claw-empire/.prettierrc.json`): width 120, semicolons on, double quotes, trailing commas.
- Run format and lint after non-trivial edits.
- Keep diffs focused; do not mass-format unrelated files.
- Respect existing ESLint overrides before introducing new exceptions.
- Preserve React Hooks correctness (`react-hooks/rules-of-hooks` error, `react-hooks/exhaustive-deps` warn).

### 7.3 Types and Contracts
- TypeScript is strict (`tsconfig.app.json`, `tsconfig.node.json`); maintain strict-safe code.
- Add explicit types on exported APIs/utilities when inference is ambiguous.
- Validate untrusted boundary inputs (request payloads, env, external API data).
- `any` is tolerated in parts of the codebase, but prefer narrower types or `unknown` at boundaries.
- Keep environment/config identifiers explicit and uppercase where they are constants.
- Keep module conventions aligned with project config (`moduleResolution: bundler`, `allowImportingTsExtensions: true`).

### 7.4 Naming Conventions
- React components: `PascalCase` file and symbol names (`TaskBoard.tsx`).
- Hooks: `useXxx` camelCase (`usePolling.ts`).
- Server/util modules: descriptive kebab-case (`meeting-prompt-tools.ts`).
- Constants: `UPPER_SNAKE_CASE` for true constants; otherwise meaningful camelCase.
- Tests: `*.test.ts(x)` or `*.spec.ts(x)` colocated with relevant source areas.

### 7.5 Error Handling and Logging
- Fail fast for missing required config with actionable messages.
- Return structured HTTP errors (e.g., `{ error: "message" }`).
- Prefer typed/domain-specific errors for predictable handling paths.
- Do not silently swallow unexpected exceptions; scope intentional ignores tightly.
- Never log secrets (`API_AUTH_TOKEN`, `INBOX_WEBHOOK_SECRET`, OAuth tokens, cookies).

### 7.6 Testing Expectations
- Update/add tests with behavior changes.
- Favor deterministic tests (mock timers/network where reasonable).
- Frontend test glob: `src/**/*.{test,spec}.{ts,tsx}`.
- Backend test glob: `server/**/*.{test,spec}.ts`.
- E2E specs live in `tests/e2e/*.spec.ts`.
- For bug fixes, add a regression test unless not feasible (document why when skipped).

### 7.7 Error and API Boundaries
- At HTTP boundaries, prefer predictable JSON failures over thrown raw errors.
- Keep error payloads stable for clients (`{ error: "..." }` shape when possible).
- Convert unknown exceptions into safe, actionable messages for callers.
- Avoid leaking stack traces, tokens, cookie values, or private file paths in responses.

## 8) Documentation Conventions (Root)
- One `#` H1 per markdown file.
- Use short sections with clear `##`/`###` headers.
- Use `-` bullets for lists and numbered steps for procedures.
- Use fenced code blocks with language tags (`bash`, `json`, `env`, etc.).
- Prefer relative links for repository-local docs/assets and verify targets after edits.
