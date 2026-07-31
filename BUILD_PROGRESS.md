# VerityPulse Build Progress

## Current Phase
Phase 2 – Authentication: Google OAuth wired end-to-end, testing sign-in flow

## Completed
✅ Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion
✅ Homepage (login/landing page) — fully built and verified working
✅ Sidebar, layout shell, dark mode theme
✅ Dashboard (Mission Control) — frontend built and verified rendering correctly
✅ Settings page — restructured to client-facing tabs (Profile & Security / Preferences / Notifications / Billing), Advanced/internal stuff removed per product decision
✅ 2FA/Login Alerts moved from visible Settings UI to a backend-driven prompt (`TwoFactorPrompt.tsx`, shows once per session if 2FA not enabled)
✅ AWS Amplify Gen 2 backend — LIVE and deployed via Amplify Hosting (auto-deploys on push to GitHub `main` branch)
✅ Live URL: https://main.d1xtkyudcv19gl.amplifyapp.com
✅ Full 13-model DynamoDB schema deployed (UserProfile, Channel, Project, Case, TimelineEvent, Evidence, Person, Source, Narrative, SEOResult, Thumbnail, CompetitorCache, Notification, ActivityLog)
✅ Cognito User Pool live (user_pool_id: us-east-1_X51MnU3n5)
✅ Google OAuth provider added to Cognito — Client ID/Secret stored as Amplify branch Secrets (NOT sandbox secrets — those are separate systems)
✅ Google Cloud OAuth client created (project: VerityPulse), authorized origins set for both localhost:3000 and the live Amplify URL
✅ Cognito redirect URI added to Google Cloud: https://e2fdfa24b5129df1befd.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
✅ Provider Layer complete: `src/providers/{ai,search,youtube,storage}/`
✅ Real sign-in wired: `LoginCard.tsx` calls actual `signIn()` from `aws-amplify/auth` against live Cognito
✅ Fixed critical import-path bug: `lib/amplify-config.ts` lives at project ROOT (not `src/lib/`), so files under `src/` must import it via relative paths (e.g. `../../lib/amplify-config`), NOT the `@/` alias
✅ Removed duplicate/broken `src/lib/amplifyClient.ts` (never should have existed alongside `lib/amplify-config.ts`)
✅ `.gitignore` correctly excludes `amplify_outputs.json` and `.env.local` — these must be regenerated locally via `npx ampx generate outputs --app-id d1xtkyudcv19gl --branch main --profile verity-pulse-dev`, never pulled via git

## In Progress
🔄 Testing "Continue with Google" end-to-end after adding the Cognito redirect URI to Google Cloud
🔄 `src/app/register/page.tsx` does not exist yet — needs to be built (sign-up flow)
🔄 YouTube sign-in button still present on homepage but not wired — user requested Google-only, YouTube button should be removed from `LoginCard.tsx`

## Next Task
1. Confirm Google Sign-In works live (test on https://main.d1xtkyudcv19gl.amplifyapp.com)
2. Remove "Continue with YouTube" button from `LoginCard.tsx`
3. Build `src/app/register/page.tsx` (sign-up page, styled to match homepage)
4. Resolve `useDashboardStats` Amplify crash — now that backend is live, re-test if this is fixed automatically or still needs a guard
5. Then: verify remaining unverified pages (Performance, AI Assistant, Case Analyzer, Angle Builder, Find Opportunity) now that real auth/data exists

## Decisions Made
- Dark mode default, VerityPulse palette locked (Deep Navy #0F172A / Slate #334155 / Electric Blue #3B82F6)
- Provider-based architecture for external services (AI/Search/YouTube/Storage) — separate from Amplify's own auth/data client setup
- AWS Amplify Gen 2, Cognito auth, DynamoDB database — deployed via Amplify Hosting connected to GitHub (auto-deploy on push to `main`)
- AWS CLI profile name: `verity-pulse-dev` (always pass `--profile verity-pulse-dev` explicitly on ampx commands — a `default` profile also exists and has caused signature errors before)
- Settings page: only 4 client-facing tabs shown (Profile & Security, Preferences, Notifications, Billing). No Role dropdown, no Advanced tab, no API Keys/Sessions/Storage exposed to end users — those were deliberately removed as "internal/dev" surface area
- Google sign-in only (no YouTube sign-in) per product decision — YouTube button pending removal from homepage
- Amplify secrets for the LIVE branch must be set via the Console's Secrets UI, NOT via CLI (`ampx sandbox secret set` only affects the local sandbox, has zero effect on deployed branches)

## Known Issues
- Lucide-react brand icons (Youtube, Slack, Chrome) are deprecated/removed — always use custom inline SVG icons for brand logos, never import from lucide-react
- Several feature pages (Content Planner, Intelligence Feed, Channel Intelligence, Competitor Intelligence, Case Intelligence, Narrative Intelligence, SEO Studio, Thumbnail Studio) not yet built or verified — some may exist from other sessions (channel-intelligence route seen in build output) but are unverified
- File-save reliability issue in VS Code: files have intermittently ended up empty despite pasting content — always verify file contents after creating/editing
- CRITICAL: `lib/amplify-config.ts` is at project ROOT, not under `src/`. Any new file under `src/` that needs to import it MUST use a relative path counting up to root, never the `@/` alias
- When adding new Amplify secrets in the future, remember: Console Secrets = live branches, `ampx sandbox secret set` = local only. Using the wrong one causes silent failures or `ParameterNotFound` build errors
- Google Client ID/Secret values must be entered with NO protocol prefix (no `http://`) and no extra whitespace — a stray `http://` prefix caused a Cognito `supportedLoginProviders` validation failure during deployment# VerityPulse — Discover Page Build Progress

## Current Phase
Discover page rebuild (per new editorial design spec) — Case Workspace / Coverage Intelligence section just added

## Completed

### Routing
✅ Renamed route folder `src/app/(app)/find-opportunity` → `src/app/(app)/discover`
✅ Updated `src/constants/routes.ts` — sidebar nav now points to `/discover`
✅ Fixed stale `/find-opportunity` link in `src/components/case-intelligence/[id]/page.tsx` → now points to `/discover`
✅ Deleted orphaned duplicate file `src/components/find-opportunity/page.tsx` (leftover from earlier session, never actually routed since it lived under `components/` not `app/`)
✅ Confirmed clean: `src/components/find-opportunity/OpportunityCard.tsx` still lives at its original path — this is intentional, only the route folder was renamed, not the component folder

### Design System Applied (per new spec)
✅ New editorial color palette in use across Discover components: background `#09090B`/`#111114`/`#18181B`, border `rgba(255,255,255,.06)`, text `#FAFAFA`/`#A1A1AA`/`#71717A`, accent `#4F7CFF`-family blue
✅ Card radius 18px, no scale-on-hover (only translateY lift), per spec ("scaling makes SaaS interfaces feel cheap")
✅ `OpportunityCard.tsx` rebuilt — fixed the original overlapping-text bug, now: large title → short description → small metrics row → clickable whole card, no buttons inside

### Discover Page (`src/app/(app)/discover/page.tsx`)
✅ Real data wired: uses `useCases()` hook (Amplify/DynamoDB `Case` model) instead of hardcoded `OPPORTUNITIES` array
✅ Loading state uses `SkeletonCard` components (no spinners, per spec)
✅ Error and empty states handled
✅ Page entrance animations: staggered fade-up per section (header → search → CreatorDNA → RecommendedForYou → Today's Opportunities cards → Collections), using Framer Motion, ~0.05–0.1s stagger delays
✅ Search bar (large, rounded, placeholder per spec) — UI only, not yet wired to actual search logic
✅ Collections grid (6 static categories: Missing Persons, Institutional Failures, Cold Cases, Organized Crime, Police Corruption, County Lines) — UI only, not yet clickable/filtered

### Channel Onboarding
✅ `src/hooks/useChannelId.ts` — rewritten to store both `channelId` and `channelHandle` in localStorage (was ID-only before)
✅ `src/components/discover/ChannelOnboarding.tsx` — first-time "Connect your channel" screen with handle input, ambient blue radial glow background (per spec), entrance animation
✅ `src/app/api/youtube/resolve-handle/route.ts` — API route to resolve a YouTube handle → channelId via YouTube Data API (**NOT YET FUNCTIONAL — no YouTube API key added to `.env.local` yet**)
✅ Analysis progress UI built into `ChannelOnboarding.tsx`: shows 5-step sequence (Reading channel → Analyzing videos → Learning audience → Building Creator DNA → Generating recommendations), each step gets checkmark on completion, matches "feels like Cursor indexing" spec direction — **currently simulated with setTimeout, not connected to any real backend pipeline**

### Creator DNA / Recommendations (mock data — no real analysis pipeline yet)
✅ `src/constants/creatorDNA.ts` — mock strengths/weaknesses list + mock "Recommended For You" array
✅ `src/components/discover/CreatorDNACard.tsx` — displays audience strengths (✓) and weak topics (×)
✅ `src/components/discover/RecommendedForYou.tsx` — clickable cards linking to `/case-analyzer/{title}`

### Case Workspace — Coverage Intelligence (just added, mock data)
✅ `src/constants/coverageIntelligence.ts` — mock data for Coverage Map, Angle Saturation, Untapped Angles, Editorial Feedback
✅ `src/components/case-intelligence/CoverageMap.tsx` — progress-bar breakdown of narrative angle coverage %
✅ `src/components/case-intelligence/AngleSaturationTable.tsx` — angle vs. coverage % vs. opportunity score table
✅ `src/components/case-intelligence/UntappedAngles.tsx` — full editorial-reasoning cards (why it matters, documentary questions, evidence, originality/evidence strength/audience match), staggered entrance animation
✅ `src/components/case-intelligence/EditorialFeedback.tsx` — "Verity Editorial Feedback" summary block
✅ Wired all 4 into `src/components/case-intelligence/[id]/page.tsx`, below existing case detail sections

### Responsive / Mobile
✅ `src/store/useUIStore.ts` — added `mobileNavOpen` state + `toggleMobileNav`/`closeMobileNav`
✅ `src/components/layout/Sidebar.tsx` — desktop sidebar hidden below `md` breakpoint, mobile version renders as slide-in drawer with backdrop, closes automatically on route change
✅ `src/components/layout/MobileTopBar.tsx` — new component, hamburger menu + logo, visible only below `md` breakpoint
✅ `src/app/(app)/layout.tsx` — updated to include `MobileTopBar` above page content on mobile

## In Progress / Not Yet Built
🔄 YouTube API key not yet added to `.env.local` — blocks: `resolve-handle` route, real channel connect flow, actual channel analysis
🔄 Channel analysis pipeline is entirely mocked (setTimeout steps) — no real Groq/YouTube Data API calls happen yet during "connect channel"
🔄 Creator DNA, Recommended For You, Coverage Map, Angle Saturation, Untapped Angles, Editorial Feedback are ALL mock/hardcoded data — none connected to real Groq reasoning or YouTube/Tavily research yet
🔄 Search bar on Discover page — UI only, no backend search wired
🔄 Collections — not clickable/filterable yet
🔄 Full end-to-end Discover flow (connect → onboarding animation → real cases) has NOT been tested live yet — build passes clean but no browser test has been run since the merge

## Next Task (once YouTube API key is added)
1. Wire `resolve-handle` route to actually work, test real channel connect end-to-end
2. Build the real backend research pipeline: Tavily (web sources) + YouTube search (100–300 videos per case) + Groq (transcript analysis → angle classification)
3. Replace all mock data files (`creatorDNA.ts`, `coverageIntelligence.ts`) with real computed data from that pipeline
4. Wire Discover search bar to real case/person/location search against DynamoDB

## Known Issues (carried over, still relevant)
- Lucide-react brand icons (Youtube, Slack, Chrome) deprecated — always use custom inline SVG, never import from lucide-react
- `lib/amplify-config.ts` lives at project ROOT, not `src/lib/` — any file under `src/` importing it must use a relative path, never `@/` alias
- Google Client ID/Secret must have no `http://` prefix — caused a prior Cognito deployment failure
- Amplify secrets: Console Secrets UI = live branches, `ampx sandbox secret set` = local sandbox only — using the wrong one causes silent `ParameterNotFound` build failures