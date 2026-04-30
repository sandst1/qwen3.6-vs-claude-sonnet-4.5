# Benchmark spec: Qwen3.6-27B vs Claude Sonnet 4.5

Two real tasks against small existing codebases, designed to surface
architectural judgment and ambiguity-handling — not raw correctness.

## How to run

For each task, do this twice (once per model) in OpenCode:

1. Make a fresh clone of the starter directory (so each run starts from the
   same state).
2. Open it in OpenCode with the model under test.
3. Paste the **starting prompt** verbatim. Don't add helpful context. The
   ambiguity is the point — handling it is one of the things being measured.
4. Let the agent work until it claims to be done. Don't intervene with
   guidance. If it asks clarifying questions, answer briefly and accurately
   but don't lead it. (How and *whether* it asks is itself a signal — note
   it down.)
5. After it claims done, do not ask follow-ups. Capture: the diff, any
   summary the model wrote, and the wall-clock time.
6. Run the rubric. Score honestly — a strong model on a bad day can
   underperform a weak model on a lucky day, so plan to do at least 2 runs
   per (model, task) pair if you want signal vs. noise.

> **Important methodology note**: agent-mode introduces variance the chat
> interface doesn't have. Same model, same prompt, two runs can diverge
> noticeably because of which file the agent reads first, what it
> hallucinates is in a file before reading it, etc. Plan for 2 runs minimum.

---

## Task 1 — Make the sync resumable

Repo: `task-b-resumable-sync/`

### Starting prompt

> We've been hitting cases where this sync gets interrupted halfway
> through — sometimes the host gets restarted, sometimes someone Ctrl-C's
> it, sometimes GitHub flakes out in a way our retry doesn't recover from.
> Right now when that happens, we have to start over from the beginning,
> which on the bigger repos is a real pain.
>
> Make it resumable.

That's it. Nothing else.

### What's actually being tested

This task has no single right answer, which is the whole point. The
*ambiguity-resolution* dimension scores how well the model navigates that.
The *architectural judgment* dimension scores whether the implementation
choice is good given whatever resolution it picked.

The honest design space:

- **Per-page checkpoint** (cheap, simple): write a cursor after each page
  commits. On restart, resume from the cursor. Loses at most one page of
  progress on crash. Suits this script well because pages already align
  with DB commits.
- **Per-record checkpoint** (overkill): track every issue/comment ID
  individually. Storage and complexity blow up for marginal gain — page
  upserts are already idempotent.
- **State-machine across runs**: model the sync as states (fetching
  issues, fetching comments for issue X, done). Most flexible but heavy.
- **Use GitHub's `since` parameter**: incremental sync by `updated_at`. A
  *different* feature (incremental refresh, not crash recovery) but a model
  may conflate them.
- **Idempotent re-run**: argue the existing upserts already make re-runs
  safe and the only fix needed is to skip already-fetched records via a
  `WHERE id NOT IN (...)` check. Clever-sounding but doesn't address the
  user's real complaint (wall-clock time of restarting).

### Rubric (40 pts)

#### Architectural judgment — 12 pts

- **Picks the right granularity** (4): Per-page is the natural fit here.
  Per-record is over-engineered, per-run is too coarse to help. Strong
  models pick per-page and explain why.
- **Centralizes the checkpoint logic** (4): Does the resume state live in
  one obvious place (e.g., a `sync_state` table or a small class) or is it
  scattered as ad-hoc state across functions?
- **Handles the comments-per-issue subloop** (4): There are nested loops
  here — pages of issues, and for each issue, pages of comments. A weak
  answer only checkpoints the outer loop, so a crash mid-comment-fetch on a
  single popular issue still loses progress. A strong answer either
  checkpoints both, or argues why the inner loop doesn't need it (it's
  smaller, comments are idempotently upserted, etc.).

#### Ambiguity-handling — 10 pts

- **Names the ambiguity** (4): Does the model surface the per-page vs
  per-record question, or does it silently pick one? Either explicit
  clarification or a written-down "I went with X because Y" counts.
- **Doesn't conflate concerns** (3): Does it stay focused on resumability,
  or does it scope-creep into incremental sync via `since`, retries, or
  CLI flags that weren't asked for?
- **Reasonable defaults** (3): Whatever it picks, are the defaults
  sensible (e.g., commit interval, where state is stored)?

#### Existing-code respect — 8 pts

- **Reuses the SQLite connection / DB** (3): Does state go into the same
  DB (good — one source of truth, transactional with the data writes) or
  into a separate JSON file (worse — can drift)?
- **Matches the existing style** (2): Same logging idioms, same import
  organization, same naming conventions.
- **Doesn't break what works** (3): The retry logic, the rate-limit
  handling, the schema migration via `IF NOT EXISTS` — does the model
  preserve these or accidentally undo them?

#### Debugging / failure-mode reasoning — 6 pts

- **Considers the partial-page crash case** (3): What happens if we crash
  *during* page processing but *after* some inserts? Does the
  implementation use a transaction so the page is all-or-nothing, or does
  it leave partial pages?
- **Considers schema drift** (3): If the sync state schema changes in a
  later version, what happens to old state? Bonus if the model uses
  `IF NOT EXISTS` consistently or adds a state-version field.

#### Code quality — 4 pts

- Clarity, naming, comments. Adds at least minimal documentation of the
  resume mechanism.

### Tells: strong vs weak

| Strong signal | Weak signal |
| --- | --- |
| Writes resume state in a transaction with the page commits | Writes resume state separately, async, or after the commit |
| Stores state in `issues.db` itself (e.g., `sync_state` table) | Creates `state.json` next to the script |
| Notes the per-page-vs-per-record tradeoff in writing | Just picks and codes |
| Tracks per-repo cursors (config has 2 repos) | Single global cursor, breaks if repos list changes |
| Adds the resume info to the README | Silent diff |
| Uses GitHub's `since` *only* if it explicitly explains it as orthogonal to crash recovery | Uses `since` and conflates it with resumability |
| If asks a question, asks the *right* one (e.g., "should partial pages roll back?") | Asks generic "what would you like?" or asks nothing |

---

## Task 2 — Make the dashboard widgets pluggable

Repo: `task-f-pluggable-widgets/`

### Starting prompt

> We want users to be able to customize this dashboard — add and remove
> widgets, reorder them. And from our side, we want it to be easy to add
> new widget types when product asks (which they will).
>
> Make it pluggable.

### What's actually being tested

The interesting tension: there are two distinct things the prompt could be
asking for:

1. **End-user extensibility**: drag-and-drop, layout persistence, an "add
   widget" button.
2. **Developer extensibility**: a clean `Widget` API/registry so adding
   new widget types is mechanical.

Both are reasonable readings; in real life you want both eventually, but in
30 minutes you have to pick. A weak model picks unconsciously and just
does whichever feels easier (usually #1, the user-facing thing, because
it's more visible). A strong model recognizes the fork, picks one with
reasoning, and makes the *other* one easy to add later.

The other architectural question: does the model design a real Widget
contract — metadata + settings schema + data hook + render — or does it
just bolt visibility/order props onto the existing components and call
that "pluggable"?

### Rubric (40 pts)

#### Architectural judgment — 14 pts

- **Designs a Widget contract** (6): Is there a `Widget` type/interface
  that captures the right shape (id, title, render, default settings,
  maybe a settings schema)? Or are the existing components just lightly
  parameterized? The contract is the abstraction; everything else is
  scaffolding around it.
- **Picks a registration pattern** (4): Registry object,
  `widgetTypes.tsx` array, plugin function — anything that answers "where
  is the list of available widget types?" with one obvious place. Weak
  answers leave the list scattered (e.g., a switch in the renderer plus an
  array of types in the toolbar plus a default-layouts file).
- **Separates "widget type" from "widget instance"** (4): To support
  add/remove/reorder, the dashboard's state has to be a list of widget
  *instances* (with their own ids, position, per-instance settings), and
  the registry has to be the catalog of *types* you can instantiate.
  Conflating these is the most common architectural failure mode here.

#### Ambiguity-handling — 10 pts

- **Names the user-vs-developer fork** (4): The strong-vs-weak signal
  here is whether the model recognizes that "pluggable" has two readings
  and picks one with stated reasoning.
- **Picks scope appropriately for 30 min** (3): Doesn't try to ship a
  full drag-and-drop grid + react-grid-layout + persistence + settings UI
  in one go. Either picks the smaller surface or stubs honestly.
- **Doesn't over-engineer** (3): No JSON-schema runtime validators, no
  zod for a 5-widget internal tool, no plugin lifecycle hooks. Cuts to
  what's actually useful.

#### Existing-code respect — 8 pts

- **Doesn't rewrite working widgets gratuitously** (3): If the existing
  data-fetching pattern is fine, keep it (or refactor it consistently
  across all widgets, not haphazardly across some).
- **Preserves the visual design** (2): Same CSS variables, same widget
  chrome, same grid feel.
- **Migrates layout state somewhere reasonable** (3): If user
  configurability is in scope, where does the layout live?
  `localStorage` is fine. URL state is fine. In-memory only is fine if
  honestly scoped. Cookies or IndexedDB is suspicious. Inventing a
  backend endpoint with no backend is wrong.

#### Frontend craft — 4 pts

- TypeScript discipline (no `any` outside genuinely needed boundaries),
  reasonable hook usage, no obvious React footguns (effect dependency
  bugs, infinite re-renders, key warnings).

#### Code quality — 4 pts

- Clarity, naming, file organization. A new developer adding the 6th
  widget type can do it by reading just one file.

### Tells: strong vs weak

| Strong signal | Weak signal |
| --- | --- |
| Defines `Widget` / `WidgetDefinition` type with explicit fields | Just adds props to existing components |
| One file lists all widget types (`widgets/registry.ts`) | List of types appears in 2+ files |
| Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | Single `Widget` shape muddles both |
| Per-widget settings shape is generic (`settings: TSettings`) with a generic on the type | Settings hardcoded per widget |
| If layout persists, uses `localStorage` with a versioned key | Persists but never reads back / no migration story |
| Calls out which fork (user vs dev) it picked and why | Silent pick, often just one feature implemented |
| Refactors data-fetching consistently or doesn't refactor at all | Refactors one widget, leaves three alone |
| The 6th widget type is genuinely 1 file | The 6th widget type requires edits in 3+ files |

---

## Scoring & comparison

For each (model, task) run, fill in:

- Numeric score per rubric section
- Total score (out of 40)
- 1-paragraph qualitative note: what surprised you, where did the model
  shine, where did it stumble?
- Whether you'd actually merge the PR

Then for each task, compare the two models head-to-head:

- Score delta
- Which dimensions did they differ most on?
- Did the *type* of mistake differ? (e.g., one over-engineers, the other
  under-thinks?)

The total score across both tasks (out of 80) is your headline number.
But the qualitative differences will probably be more useful than the
numbers — keep notes liberally.

## Methodological caveats

1. **Single-run results are noisy.** Two runs minimum per pair if you
   want to draw conclusions. Three or four if the first two diverge.
2. **OpenCode itself adds a layer.** OpenCode's prompting, tool wrappers,
   and context management affect both models. You're benchmarking
   "Qwen3.6 in OpenCode" vs "Sonnet 4.5 in OpenCode", not the raw models.
3. **You will be tempted to help.** Don't. The whole point of an
   underspecified prompt is to see how each model handles the
   underspecification. If a model asks a question, give a short factual
   answer; don't volunteer guidance.
4. **Sonnet 4.5 has been training on lots of Anthropic-written prompts
   and codebases.** Qwen has been training on lots of GitHub. Both have
   biases. The tasks here aim to be far enough from any obvious
   "tutorial shape" to mostly avoid this, but be aware.
