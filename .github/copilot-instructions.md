# CRS Calculator - AI Coding Agent Instructions

## Project Overview
A **React + TypeScript questionnaire app** that calculates Canadian Permanent Residency (Express Entry) scores based on the Comprehensive Ranking System (CRS). Single-file monolithic structure (`src/App.tsx`) with embedded logic, state management, and UI components.

**Key Goal**: Guide users through a multi-step quiz, compute CRS points across 4 categories (core skills, spouse factors, skill transferability, additional points), and compare scores against historical draw cut-offs.

## Tech Stack & Conventions
- **React 19** + **TypeScript 5.9** with functional components and hooks only
- **Vite 7** (dev server & build)
- **Tailwind CSS 3** (utility-first styling, no custom CSS)
- **ESLint + Prettier** (run via `npm run lint`)
- **No external UI libraries** – all components built from scratch with semantic HTML

### Build & Dev Workflow
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Type-check (tsc -b) then vite build → dist/
npm run lint     # ESLint checks
npm run preview  # Preview production build locally
```

## Architecture & Data Flow

### Core Data Structures (src/App.tsx)
All logic resides in **App.tsx** (931 lines). Key interfaces:

- **`UserProfile`** (48 fields): Captures all questionnaire answers (age, education, language CLB levels, work experience, spouse details, etc.)
- **`CRSBreakdown`**: Computed result with 4 score categories + subtotals + total (max 1200)
- **`Draw`** / **`GROUPED_DRAWS`**: Historical immigration draw data with cut-off scores organized by stream (General, CEC, PNP, French, Healthcare, STEM, Trades, Transport)

### CRS Calculation Logic (`calculateCRS()`)
Implements official Immigration Canada formula across 4 sections:
1. **Core Human Capital** (~436 pts max): Age, Education, Language, Canadian work
2. **Spouse Factors** (~40 pts): Education, language, work (only if accompanying + not Canadian)
3. **Skill Transferability** (~100 pts): Education combos with language/work, foreign work combos, trade certificates
4. **Additional Points** (~600 pts): Sibling in Canada (15), French proficiency (25–50), Canadian education (15–30), Provincial Nomination (600)

**Key thresholds**:
- CLB 7 vs CLB 9 in English unlocks bonus points (Skill Transferability)
- Combined education + work experience caps at 50 pts per combination
- PNP (Provincial Nomination) = automatic +600 points

### UI State Flow
```
LandingPage (start button)
    ↓
Quiz Loop (questions[currentQIndex])
    ↓ getNextQuestionIndex() (skips questions based on conditions)
    ↓
ResultPage (displays CRS + draw comparisons)
    ↓ onRestart() → back to LandingPage
```

## Code Patterns & Conventions

### Type System
- Use literal union types for enums (`MaritalStatus = 'Single' | 'Married' | 'Common-Law'`)
- Use `Record<Key, Value>` for lookup tables (age points map, education points map)
- Interface fields are not optional unless truly optional (strict structure)

### Data Mapping Pattern
- `EDUCATION_MAP`: Reverse lookup (full UI text → logic key)
- `EDUCATION_MAP_REVERSE`: Forward lookup (logic key → full UI text)
- **Reason**: Questions show full descriptive text; internal logic uses short keys (`'ThreeYear'`, `'PhD'`)
- **Pattern**: When mapping select input values, always check if it's an education field and use `EDUCATION_MAP_REVERSE[val]`

### Question System
- **`questions` array**: 17+ dynamic questions with optional `condition()` logic
- **Conditional rendering**: Some spouse questions only show if `maritalStatus !== 'Single' && spouseAccompanying && !spouseCanadian`
- **Jargon injection**: Questions can specify `jargonId` (e.g., `'CLB'`, `'TEER'`, `'PNP'`) to show definitions in UI
- **Multi-value fields**: `multi-number` type (English/French/Spouse language) uses 4-element arrays `[speak, listen, read, write]`

### Styling Approach
- **High-contrast "Build Canada" aesthetic**: Red/white/gray palette, flag-inspired asymmetrical design
- **Component-level Tailwind**: Classes inline in JSX; no component libraries
- **Responsive grid**: `grid-cols-1 md:grid-cols-2` for results breakdown
- **Stateful accordions**: Draw history accordion toggles with `DrawHistoryAccordion` component

### Component Structure
- **`LandingPage`**: Entry screen with motivation text and CTA
- **`QuestionInput`**: Polymorphic input handler (select, yes/no, number, multi-number)
- **`DrawHistoryAccordion`**: Expandable card showing latest score vs. user score + past 5 draws
- **`ResultPage`**: Displays full CRS breakdown + relevant draw streams sorted by relevance

## Critical Developer Workflows

### Adding a New CRS Factor
1. Add field to `UserProfile` interface
2. Add question to `questions` array with appropriate `type` and optional `condition()`
3. Add calculation logic in `calculateCRS()` → update respective `breakdown.X.Y` property
4. Update `CRSBreakdown` interface if creating new category
5. If applicable, add `JARGON_MAP` entry for terminology

### Modifying CRS Points Formula
- All point values are **hardcoded in lookup maps** (e.g., `ageMap`, `eduPointsMap`, `canWorkPoints`)
- Search for the specific factor name (e.g., "French Ability") in `calculateCRS()` to locate point assignments
- **Companion points**: Always check if `withSpouse` flag applies (different point values for accompanied vs. single)

### Updating Draw History
- Edit `ALL_DRAW_HISTORY` array with new draw objects: `{ stream, score, date, category? }`
- Categories auto-group by `GROUPED_DRAWS` reducer; no separate category manager needed

## Integration Points & Dependencies

### External APIs
- **None** – fully client-side application (no backend calls, no authentication)

### State Management
- **React hooks only** (`useState`) – no Redux/Context (monolithic structure keeps it simple)
- Single `profile` state object updates per question answer via `handleNext()`

### Language/Validation
- **CLB (Canadian Language Benchmark)** is the only external standard referenced
- **No validation** of input ranges in UI (user can enter age 200+); calculation gracefully handles edge cases
- Education credential assessment (ECA) is external but only mentioned in jargon, not enforced

## Common Pitfalls & How to Avoid Them

1. **Education field mapping**: If adding a new education question, **always use `EDUCATION_MAP_REVERSE`** to convert UI text back to keys. Not doing this breaks point calculation.
2. **Spouse factor conditions**: Spouse questions are conditional on `spouseCanadian === false` AND `spouseAccompanying === true`. Test both paths (single, accompanied spouse, Canadian spouse).
3. **Score capping**: Skill Transferability and Additional sections have **hard caps** (100 and 600 respectively). Use `Math.min()` when combining sub-scores.
4. **Draw stream relevance**: Streams are auto-filtered in `ResultPage` by profile category + work experience. Ensure new streams have a `category` field or default to 'General'.
5. **Multi-number field unpacking**: Language fields expect 4-element arrays. Use index positions consistently: `[0]=speak, [1]=listen, [2]=read, [3]=write`.

## File Organization
```
src/
├── App.tsx          # Monolithic: all logic, state, UI, data
├── App.css          # (Currently unused; all Tailwind)
├── index.css        # Tailwind imports
└── main.tsx         # React root mount

.github/
└── copilot-instructions.md  # This file
```

## Immediate Productivity Checklist
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:5173 in browser
- [ ] Walk through questionnaire to understand UX flow
- [ ] Inspect `calculateCRS()` logic for one CRS section (e.g., "Core Human Capital")
- [ ] Trace how a question answer flows: `questions[i]` → `handleNext()` → `UserProfile` update → `calculateCRS()`
- [ ] Check `EDUCATION_MAP` and `EDUCATION_MAP_REVERSE` to understand text↔key mapping
- [ ] Review `DrawHistoryAccordion` for collapsible card pattern (reusable for other expandable sections)

