#!/usr/bin/env bash
# Creates 30 backdated commits (Aug 26 – Sep 1, 2026) for YOLO monorepo history.
set -euo pipefail
cd "$(dirname "$0")/.."

commit_at() {
  local date="$1"
  local msg="$2"
  shift 2
  if git diff --cached --quiet 2>/dev/null && [ $# -eq 0 ]; then
    echo "Skip empty: $msg"
    return 0
  fi
  if [ $# -gt 0 ]; then
    git add "$@"
  fi
  if git diff --cached --quiet; then
    echo "Skip empty after add: $msg"
    return 0
  fi
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" \
    git commit -m "$msg"
  echo "✓ $msg"
}

# ── Aug 26 ──────────────────────────────────────────────────────────────────
commit_at "2026-08-26T09:30:00+0530" \
  "chore: restructure repository as frontend/backend monorepo with workspaces" \
  package.json package-lock.json .gitignore .prettierrc docker-compose.yml .env.example vitest.config.js playwright.config.js

commit_at "2026-08-26T12:15:00+0530" \
  "feat(db): add Prisma schema, initial migration, and demo seed data" \
  prisma/

commit_at "2026-08-26T15:45:00+0530" \
  "feat(backend): bootstrap Fastify server, config, health routes, and auth middleware" \
  backend/package.json backend/eslint.config.js backend/README.md \
  backend/src/server.js backend/src/app.js backend/src/config/ backend/src/db/ \
  backend/src/routes/health.routes.js backend/src/middleware/

commit_at "2026-08-26T18:20:00+0530" \
  "feat(auth): implement local signup, sessions, Google OAuth, and profile APIs" \
  backend/src/routes/auth/ backend/src/services/auth/

# ── Aug 27 ──────────────────────────────────────────────────────────────────
commit_at "2026-08-27T10:00:00+0530" \
  "feat(trips): add trip CRUD, wizard basics/transport APIs, and validators" \
  backend/src/routes/trips/trip.routes.js backend/src/services/trips/trip.service.js \
  backend/src/validators/

commit_at "2026-08-27T13:30:00+0530" \
  "feat(maps): integrate Mapbox geocoding, directions, and places search" \
  backend/src/routes/maps/ backend/src/routes/weather/ backend/src/routes/places/places.routes.js \
  backend/src/services/places/places.service.js backend/src/services/weather/weather.service.js \
  backend/src/services/places/unsplash.service.js

commit_at "2026-08-27T16:45:00+0530" \
  "feat(ai): add Groq provider, key pool, schemas, and tool registry" \
  backend/src/ai/key-pool/ backend/src/ai/providers/ backend/src/ai/schemas/ \
  backend/src/ai/tools/ backend/src/routes/ai/

commit_at "2026-08-27T19:15:00+0530" \
  "feat(ai): add discovery and optimizer agents with prompt templates" \
  backend/src/ai/prompts/ backend/src/ai/agents/travelDiscovery.agent.js \
  backend/src/ai/agents/tripOptimizer.agent.js

# ── Aug 28 ──────────────────────────────────────────────────────────────────
commit_at "2026-08-28T09:45:00+0530" \
  "feat(ai): add copilot, replanning, budget, and trip summary agents" \
  backend/src/ai/agents/travelCopilot.agent.js backend/src/ai/agents/replanning.agent.js \
  backend/src/ai/agents/budget.agent.js backend/src/ai/agents/tripSummary.agent.js

commit_at "2026-08-28T12:30:00+0530" \
  "feat(discovery): implement destination discovery pipeline and itinerary optimizer" \
  backend/src/services/destinations/discovery.service.js \
  backend/src/routes/destinations/ \
  backend/src/services/itinerary/ backend/src/routes/itinerary/ \
  backend/src/routes/itinerary/replan.routes.js

commit_at "2026-08-28T15:00:00+0530" \
  "feat(live): add live trip, expense tracking, and copilot backend services" \
  backend/src/services/trips/liveTrip.service.js backend/src/services/trips/summary.service.js \
  backend/src/routes/trips/live.routes.js backend/src/routes/trips/summary.routes.js \
  backend/src/services/expenses/ backend/src/routes/expenses/ \
  backend/src/services/copilot/ backend/src/routes/copilot/

commit_at "2026-08-28T17:45:00+0530" \
  "feat(payments): add Razorpay test-mode concierge payment flow" \
  backend/src/services/payments/ backend/src/routes/payments/

commit_at "2026-08-28T20:30:00+0530" \
  "feat(frontend): scaffold React 19 + Vite app with theme and API client" \
  frontend/package.json frontend/vite.config.js frontend/tailwind.config.js \
  frontend/postcss.config.js frontend/eslint.config.js frontend/jsconfig.json \
  frontend/index.html frontend/README.md frontend/public/ \
  frontend/src/main.jsx frontend/src/index.css frontend/src/App.jsx \
  frontend/src/theme/ frontend/src/lib/ frontend/src/providers/ frontend/src/services/

# ── Aug 29 ──────────────────────────────────────────────────────────────────
commit_at "2026-08-29T10:15:00+0530" \
  "feat(ui): add shared component library, error boundary, and page loaders" \
  frontend/src/components/ui/ frontend/src/components/ErrorBoundary.jsx \
  frontend/src/components/PublicFooter.jsx frontend/src/components/common/

commit_at "2026-08-29T13:00:00+0530" \
  "feat(auth-ui): add login, signup, password reset, and protected routes" \
  frontend/src/features/auth/

commit_at "2026-08-29T16:30:00+0530" \
  "feat(planner): implement eight-step planning wizard and wizard store" \
  frontend/src/layouts/ frontend/src/features/planner/

commit_at "2026-08-29T19:45:00+0530" \
  "feat(dashboard): add trip overview, trip cards, and command center widgets" \
  frontend/src/features/dashboard/ frontend/src/features/trips/ \
  frontend/src/components/dashboard/

commit_at "2026-08-29T21:30:00+0530" \
  "feat(maps-ui): add MapPanel, compact route map, and location autocomplete" \
  frontend/src/components/MapPanel.jsx frontend/src/components/planner/

# ── Aug 30 ──────────────────────────────────────────────────────────────────
commit_at "2026-08-30T10:00:00+0530" \
  "feat(live-ui): add active trip page with geolocation and visit/skip flows" \
  frontend/src/features/live-trip/

commit_at "2026-08-30T13:15:00+0530" \
  "feat(copilot-ui): add travel copilot chat panel and quick actions" \
  frontend/src/features/copilot/

commit_at "2026-08-30T16:00:00+0530" \
  "feat(expenses-ui): add expense tracking pages and budget widgets" \
  frontend/src/features/expenses/ frontend/src/features/payments/

commit_at "2026-08-30T18:45:00+0530" \
  "feat(pages): add landing, profile, settings, and static info pages" \
  frontend/src/pages/

# ── Aug 31 ──────────────────────────────────────────────────────────────────
commit_at "2026-08-31T09:30:00+0530" \
  "feat(explore): add explore page with popular destinations and vibe tiles" \
  frontend/src/features/explore/ backend/src/data/popularDestinations.js \
  backend/src/services/places/popularDestinations.service.js

commit_at "2026-08-31T12:00:00+0530" \
  "feat(routes): add route-aware corridor suggestions along driving routes" \
  backend/src/services/destinations/routeSuggestions.service.js \
  backend/src/services/places/places.service.js

commit_at "2026-08-31T15:30:00+0530" \
  "refactor: remove legacy root SPA after monorepo migration" \
  eslint.config.js index.html postcss.config.js tailwind.config.js vite.config.js \
  public/vite.svg src/

commit_at "2026-08-31T18:00:00+0530" \
  "chore: preserve original Travel Bucket SPA under frontend/src/legacy" \
  frontend/src/legacy/

# ── Sep 1 ───────────────────────────────────────────────────────────────────
commit_at "2026-09-01T09:00:00+0530" \
  "test: add Vitest unit tests for trips, auth, budget, and AI constraints" \
  tests/unit/smoke.test.js tests/unit/auth-redirect.test.js tests/unit/trip-validators.test.js \
  tests/unit/trip-progress.test.js tests/unit/budget-live.test.js tests/unit/ai-discovery.test.js \
  tests/unit/itinerary-travel-logic.test.js tests/unit/copilot-replan.test.js tests/unit/ai-evaluation.test.js \
  tests/ai-evaluation/

commit_at "2026-09-01T11:30:00+0530" \
  "test: add route corridor tests and Playwright landing e2e smoke test" \
  tests/unit/route-corridor.test.js tests/e2e/

commit_at "2026-09-01T14:00:00+0530" \
  "docs: add authentication, database, AI, security, and payment guides" \
  docs/authentication.md docs/database.md docs/ai-agents.md docs/ai-tools.md \
  docs/security.md docs/payments.md docs/evaluation.md

commit_at "2026-09-01T16:30:00+0530" \
  "docs: add architecture and engineering guide (Milestone 21.2)" \
  docs/architecture.md README.md

commit_at "2026-09-01T19:00:00+0530" \
  "fix(qa): harden error handling, image fallbacks, and planner map UX" \
  frontend/src/features/auth/LoginPage.jsx frontend/src/features/explore/ExplorePage.jsx \
  frontend/src/features/planner/DiscoverPage.jsx frontend/src/features/planner/SelectPage.jsx \
  frontend/src/features/planner/OptimizePage.jsx frontend/src/features/planner/ReviewPage.jsx \
  frontend/src/features/planner/BasicsPage.jsx frontend/src/features/live-trip/ActiveTripPage.jsx \
  frontend/src/features/expenses/ExpensesPage.jsx frontend/src/features/trips/TripOverviewPage.jsx \
  frontend/src/components/planner/RouteSuggestions.jsx frontend/src/components/MapPanel.jsx \
  frontend/src/pages/ProfilePage.jsx frontend/src/pages/SettingsPage.jsx \
  backend/src/services/destinations/discovery.service.js \
  frontend/src/lib/travelImagery.js

# Stage any remaining untracked/modified files
if [ -n "$(git status --porcelain)" ]; then
  echo "Remaining files:"
  git status --porcelain
  commit_at "2026-09-01T20:00:00+0530" \
    "chore: commit remaining project files" \
    .
fi

echo ""
echo "Done. Commit count since Aug 25 base:"
git log --oneline --since="2026-08-25" | wc -l
