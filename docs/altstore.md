# AltStore distribution

Home MOT ships to iPhone and iPad testers through **AltStore Classic**, the
same way NavSafe does (`navsafe-app/docs/25-altstore-distribution.md`).

- **Code repo (private):** <https://github.com/maxtheobaldd/building-survey-2>
- **Public source repo:** <https://github.com/maxtheobaldd/home-mot-altstore>
  (holds only `source.json`, the README install guide, the icon and four
  screenshots of the built-in sample inspection; no app
  code). It has to be public: AltStore fetches the source and the IPA without
  signing in to GitHub, so anyone with the link can install the app.
- **Source URL testers add:**
  `https://raw.githubusercontent.com/maxtheobaldd/home-mot-altstore/main/source.json`
- **IPAs:** GitHub Releases on that repo, tagged `v<version>-<build>`

## Releasing a new build

1. When `convex/` changed, deploy it to production first so the build's
   functions exist there: `npx convex deploy` (prod deployment
   `fast-minnow-872`, project `home-mot-2`). `npx convex run --prod
   scan:health` should return `"ok": true`.
2. Commit everything, then build and package (Release, `.env.production`,
   unsigned then ad-hoc signed):

   ```bash
   scripts/build-altstore.sh output/altstore-YYYY-MM-DD
   ```

   The script refuses a dirty tree (tracked changes, or untracked files under
   `src/`, `assets/` and the root build files), runs `npm test` and
   `npm run typecheck`, regenerates `ios/` with `expo prebuild` and stamps the
   commit into `HomeMOT-AltStore.verification.json` (`"gitCommit"`). The build
   number defaults to `YYYYMMDDHH` in **UTC** and must be new for every
   release (override with `HOMEMOT_BUILD_NUMBER`). Run it outside the Claude
   Code sandbox: `pod install` and the Metro bundle need the network.
3. Push the commit (the publish script checks), write release notes to a
   file, then publish:

   ```bash
   scripts/publish-altstore.sh output/altstore-YYYY-MM-DD notes.md
   ```

   It checks the IPA still matches its verification report, asks
   `Publish vX-Y publicly? [y/N]` (`--yes` skips it), adds the version to a
   fresh clone of the source repo (refusing a reused build number), creates
   the GitHub release with "Built from commit …" appended, re-downloads the
   asset to check its SHA-256 and only then pushes `source.json`. Commits to
   the public repo use the GitHub noreply address.

AltStore users see the update in **My Apps** on their next source refresh.

## Production config

`.env.production` holds the prod Convex URL. `@expo/env` would let
`.env.local` (the dev deployment) override it, so `build-altstore.sh` turns
dotenv loading off (`EXPO_NO_DOTENV=1`) and exports the production values
itself. `package-altstore.py` then refuses any bundle that calls a Convex
deployment other than the production one.

## Why the source is generated, not hand-written

AltStore refuses to install an app whose bundle ID, `version`, `buildVersion`,
entitlements or privacy usage descriptions differ from its source entry.
`scripts/altstore-source.py` reads all of them from the IPA, so adding an
`NS…UsageDescription` (via an Expo config plugin in `app.json`) needs no
manual source edit. The build carries no entitlements; adding one a free
Apple ID cannot sign (push, App Groups, Sign in with Apple) would make
installs fail for most testers, and `package-altstore.py` rejects the common
ones.

## Sideload constraints

- AltStore re-signs with each tester's Apple ID and rewrites the bundle ID to
  `uk.propertyhealthcheck.homemot.<TEAMID>`. Inspections live in the app's
  Documents folder, which survives refreshes and updates but not deleting the
  app.
- Free Apple IDs: 7-day refresh, three sideloaded apps including AltStore.
  Home MOT uses one App ID (no extensions).
- The AI scan calls the public prod Convex URL baked into the IPA; the
  per-device (40/h) and global (400/h) rate limits in `convex/rateLimits.ts`
  are what cap the AI bill if the URL is abused.
