# Home MOT — Property Health Check UK

React Native (Expo SDK 57) field app for the PHCUK **Home MOT** property-condition inspection. Built from the client's Word template (`PHCUK_Home_MOT_Word_App.docx`) and a voice-note brief.

## What it does

- **Three survey levels.** Bronze = roof only (drone photos plus seven roof questions). Silver = everything external (gutters, fascias, ridge/verge, chimney stack, walls, windows, doors, drainage and French drains, boundary walls, trees, outbuildings). Gold = Silver plus every room and the roof space, services and damp checks. Domestic and commercial option sets.
- **Pre-filled instructions.** Paste the insurer's instruction email and the claim number, policy number, policyholder contact and address are extracted.
- **The report writes itself.** Property-profile dropdowns build the description live ("The subject property is a two-storey semi-detached house…"). Every Yes / No / N/A and condition answer has report wording behind it, shown under the question as soon as it's tapped.
- **AI photo scan.** Room photos are described (ceiling, walls, floor, features, defects, condition) and the room's questions are pre-filled for the surveyor to confirm. External elements work the same way. Runs on Convex through the Convex AI Gateway (Claude Sonnet 5.5), so no API key is stored in the app.
- **No recommendations.** The firm isn't FCA-registered, so no generated text recommends or advises. Adverse answers say the matter "would require further investigation, further checking and potentially repairs". A unit test enforces this.
- **Further investigation schedule.** Built automatically from adverse answers and defects, prioritised 1 Immediate → 4 Routine. Items can be re-prioritised or dismissed, and manual items added.
- **Suggested assessments and rating.** Storm vulnerability, defects level, priority and overall rating are suggested from the findings. The inspector summary is drafted automatically.
- **Sign-off and report.** Draw a signature, then preview the A4 report and share it as a PDF or AirPrint it.
- **Offline-first.** Inspections and photos are saved on the device (Documents/homemot) as you go. Only the AI scan needs signal.

## Run it

```bash
npm install
npx expo prebuild --platform ios   # first time (LANG=en_US.UTF-8 if pod install fails)
npx expo run:ios                   # builds the dev client and starts Metro
```

Backend (`convex/`), deployed to the Convex project `home-mot-2` (team `maxidev`):

```bash
npx convex dev --once              # deploy functions to the dev deployment
```

`.env.local` holds `EXPO_PUBLIC_CONVEX_URL`. Without it the app still works; only AI scanning is disabled.

```bash
npm test          # engine, wording compliance, instruction parser, report
npm run typecheck
```

## Where things live

| Path | What |
| --- | --- |
| `src/survey/schema.ts` | **Questions and the wording library.** Change jargon here. |
| `src/survey/engine.ts` | Description, wording assembly, progress, findings, suggestions, summary |
| `src/report/html.ts` | The A4 report (HTML, then expo-print renders the PDF) |
| `src/store/` | zustand store persisted to a JSON file |
| `src/lib/photos.ts` | Capture, resize and store photos (relative paths) |
| `src/lib/ai.ts`, `convex/scan.ts` | AI scan client and Convex action |
| `src/app/` | Screens (Expo Router) |

## To confirm with the client

- The seven Bronze roof questions and the "HRV / 11 storeys" items are my reading of a garbled transcript (implemented as *over 11 metres* and *Higher-Risk Building*).
- Their own list of wording behind Yes/No answers hasn't been supplied yet. `Settings → Wording library` shows everything currently used.
- Template Section 7 wording was lightly adapted to remove "recommended" / "should be considered".
