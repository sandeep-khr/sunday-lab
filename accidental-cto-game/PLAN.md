# THE ACCIDENTAL CTO — Master Production Plan v2

**Goal:** The definitive game for learning system design — from "what is a server" to "cracks any system design interview." Studio-quality: 12 weeks, 5–10 people.

**Current build = vertical slice foundation** (27 chapters, incident consoles, codex, journey map, live charts, synth audio, capacity sim). This plan turns it into a product.

---

## 1. Vision

> *"You are the CTO. You build it, you break it, you defend it in front of a panel — and you walk out a system designer."*

**Pillars**
1. **Learn by operating** — every concept is something you DO (debug, configure, trade off), not read.
2. **Real-world fidelity** — real tools (`kubectl`, `redis-cli`, `psql`, Grafana), real numbers (RPS, p95, error budgets), real consequences.
3. **Mastery, measurable** — a visible skill tree + spaced repetition + interview rubric scoring prove growth.
4. **Epic presentation** — war-room aesthetic, live data-viz everywhere, cinematic moments, full sound design.

---

## 2. The Player Journey (0 → Master)

```
ACT I–VII Campaign        →  SANDBOX LAB         →  INTERVIEW ARENA      →  MASTERY
"live the story"             "build anything,        "face the panel,        "prove & retain
 (guided, narrative)          break everything"       get scored"             forever"
```

| Stage | Player state | Exit criteria |
|---|---|---|
| Novice | Finishes Campaign Acts I–II | Understands servers, DBs, LB, caching basics |
| Operator | Finishes Campaign + all investigations | Can debug incidents using real tooling |
| Architect | Completes 10+ Sandbox challenges | Can design multi-component systems under constraints |
| Candidate | Passes 8/10 Interview Arenas | Rubric ≥ 80%: clarifies, estimates, designs, defends |
| Master | Mastery tree 90% + SRS retention ≥ 30 days | Ready for real interviews |

---

## 3. Game Modes (7)

### M1 — Campaign (exists, deepen)
22+6 chapters → expand to **35 chapters / 8 acts**. New acts:
- **Act VIII: Data at Scale** — sharding strategies deep, CDC pipelines, OLAP vs OLTP, data lakes
- **Act IX: The Platform Era** — API gateways, service mesh, auth (OAuth2/JWT), multi-tenancy
- **Act X: Chaos Incarnate** — 3 consecutive real-time incident bosses (Black Friday, DNS apocalypse, poisoned cache)
- Every chapter: 1 investigation console + 1 decision scene + quiz (standard structure)

### M2 — Sandbox Lab (NEW — the killer feature)
A **discrete-event simulator**: drag-drop components (LB, app pool, Redis, SQL, shards, Kafka, CDN, rate limiter…), wire them, set traffic profile, press RUN.
- Live packet flow, queue depths, per-node CPU/latency, error rates
- Break things live: kill a node, spike traffic 50x, exhaust connection pool
- **20 scripted challenges**: "Serve 500K users under $30K/mo", "Survive the flash sale with zero downtime", "Get p95 < 150ms for EU users"
- Free-play mode with mission generator
- *This teaches more than any card ever will: cause → effect, instantly.*

### M3 — Incident Commander (NEW)
Real-time (60–120s) incident response under pressure:
- Alerts escalate across the screen; you triage (ack, investigate, mitigate, escalate)
- Correct triage chains build "commander score"; wrong calls cascade
- Post-incident blameless postmortem mini-game: pick root cause from timeline
- 15 scripted incidents + endless mode

### M4 — Interview Arena (NEW)
Mock system design interviews, scored by rubric:
- **Phase 1 — Clarify** (pick right clarifying questions from a list; wrong ones cost time)
- **Phase 2 — Estimate** (Fermi drills: DAU→QPS→storage→bandwidth, timed)
- **Phase 3 — Design** (assemble architecture in simplified sandbox UI against requirements)
- **Phase 4 — Defend** (choose responses to interviewer pushback: "What if 10x?", "Why not NoSQL here?")
- 10 famous prompts: URL shortener, Twitter feed, WhatsApp, Uber dispatch, Netflix, rate limiter, web crawler, autocomplete, notification system, payment ledger
- Rubric scoring (like real loops): problem scoping 20 / estimation 20 / design depth 30 / trade-off defense 20 / communication 10
- AI-free (scripted interviewer personas) for v1; LLM interviewer as v2 option

### M5 — Estimation Gym (NEW)
60-second drills, spaced repetition: QPS math, storage math, cache sizing, shard counts. Streaks, leagues, daily challenge. The "gym" players return to daily.

### M6 — Trade-off Duels (NEW)
Structured debates: "SQL vs NoSQL for X", "Kafka vs RabbitMQ", "gRPC vs REST", "Monolith vs Microservices at Y scale". Pick sides, allocate argument points, get verdict + cheat-sheet. Teaches the #1 interview skill: reasoned trade-offs.

### M7 — Mastery Systems (NEW)
- **Skill tree**: 60+ nodes across 8 domains (each = codex concept), unlocks gated by performance
- **SRS flashcards** auto-generated from your mistakes + codex (SM-2 algorithm)
- **Mastery %** per domain; final "Master CTO" certificate (shareable card)

---

## 4. Learning Coverage Matrix (interview-topic → mechanic)

| Domain | Topics | Taught in |
|---|---|---|
| Foundations | client-server, DNS, HTTP/HTTPS, REST | Campaign I + Codex |
| Scaling | vertical/horizontal, LB algos, autoscaling | Campaign I/III, Lab |
| Databases | replication, sharding, consistent hashing, indexing, SQL vs NoSQL, CAP/PACELC, OLTP/OLAP | Campaign II/VI/VIII, Duels |
| Caching | patterns, invalidation, stampedes, TTL/LRU, CDN | Campaign II/VI, Lab |
| Async | queues, Kafka, idempotency, exactly-once myths | Campaign II, Lab |
| Resilience | timeouts, retries, circuit breakers, bulkheads, failover, chaos | Campaign IV/VII, Incident Cmdr |
| APIs & Edge | gateways, rate limiting, WebSockets, auth | Campaign VI/IX |
| Observability | golden signals, tracing, SLOs/error budgets | Campaign I/V, Incident Cmdr |
| Cloud economics | unit economics, reserved vs metal, FinOps | Campaign V |
| Interviews | estimation, clarifying, trade-off defense, famous prompts | Arena, Gym, Duels |

**Coverage target: 90% of common SD interview topics.**

---

## 5. UI / Art Direction

- **Design system "WAR ROOM"**: tokens (colors, spacing, motion), component library (panels, terminals, charts, cards), dark-first + light "day shift" theme
- **Motion language**: 120–200ms micro, 400ms transitions, spring physics; screen-shake/vignette grammar for incidents; unlock fanfares
- **Data-viz everywhere**: every screen shows live, truthful numbers from the sim engine
- **Diagram v3**: pan/zoom, minimap, node status LEDs, animated packets w/ trails, hover tooltips, click-to-inspect (exists in embryo → productionize)
- **Cinematics**: act-openers with key art + parallax; incident "red protocol" mode
- **Audio**: 4 music loops + 30 SFX (prompts ready) + mix bus (music/ambience/SFX volumes)
- **Accessibility**: reduced-motion mode, colorblind-safe palettes, keyboard nav, subtitles for audio cues

---

## 6. Technical Architecture

```
apps/web            React 19 + Vite + Tailwind v4 (exists)
packages/engine     pure TS: state machine, economy, incident rules (exists)
packages/sim        NEW discrete-event simulator (the Lab heart)
packages/content    typed content packs + Zod schemas (exists, extend)
packages/ui         design system components
tools/content-cli   validate/build content packs, lint lessons (CI)
services/api        optional: progress sync + leaderboards (Supabase)
```

- **Sim engine**: event-loop sim (tick = 100ms virtual), components as nodes with queueing (M/M/1-ish approximations), latency = base + queueing + network; failure injection API; deterministic seeds for challenges. ~2 engineer-months — the hardest, highest-value build.
- **Content pipeline**: JSON packs validated in CI; every lesson/investigation linted for schema + pedagogy (has quiz, has takeaway, solvable investigation).
- **State**: Zustand stores per mode; save/sync via localStorage + optional cloud.
- **Testing**: engine/sim unit (Vitest), content validation (CI), Playwright e2e for 5 critical flows, visual regression for design system (Loki/Chromatic).
- **Performance**: sim in web worker; target 60fps with 500 nodes; code-split modes.
- **Analytics**: learning events (concept_attempted, misconception_detected, mastery_gained) → dashboard for us to balance difficulty.

---

## 7. Team (8 people + specialists)

| Role | Count | Owns |
|---|---|---|
| Tech lead / architect | 1 | sim engine, architecture, reviews |
| Gameplay engineers | 2 | sim, Lab, Incident Commander, Arena logic |
| Frontend engineers | 2 | design system, all mode UIs, motion |
| Content engineer | 1 | 35 chapters, 20 Lab challenges, 15 incidents, 10 arenas, rubrics |
| Product/UX designer | 1 | flows, wireframes, playtest cycles, learning design w/ consultant |
| Artist (motion/illustration) | 1 | art direction, act cinematics, icons, promo |
| QA / playtest | 0.5→1 | test plans, balance playtests, a11y |
| Audio (contract) | 0.5 | music + SFX from prompt pack |

---

## 8. 12-Week Milestones

| Weeks | Milestone | Exit criteria |
|---|---|---|
| 1–2 | **Foundations**: design system v1, sim engine spike (10 node types), content schema v3, CI | Sim demo: LB→app→DB with live queueing; DS storybook |
| 3–5 | **Sandbox Lab alpha**: editor, 10 challenges, break-it interactions | Playtesters solve challenges and articulate WHY it broke |
| 6–7 | **Campaign VIII–X** + investigations v2 (typed commands) | 35 chapters shippable; console supports free-typing |
| 8–9 | **Interview Arena** + **Incident Commander** + Estimation Gym | Rubric scores 10 prompts; 15 incidents timed & balanced |
| 10 | **Mastery systems**: skill tree, SRS, analytics dashboard | Mastery % tracks; cards generate from mistakes |
| 11 | **Polish & balance**: audio pass, motion pass, difficulty curve from analytics, a11y | Playtest NPS ≥ 40; zero P1 bugs |
| 12 | **Launch hardening**: e2e green, perf budget (LCP<2s), deploy, landing page | Public v1 shipped |

Parallel tracks: content (W1–10), art (W1–9), audio (W8–11), QA (W3–12).

---

## 9. Effort Estimates (person-weeks)

| Feature | PW |
|---|---|
| Sim engine + worker | 8 |
| Sandbox Lab (editor, challenges, UX) | 8 |
| Campaign expansion (13 chapters + investigations) | 6 |
| Interview Arena (4 phases, 10 prompts, rubric) | 6 |
| Incident Commander | 4 |
| Estimation Gym + Trade-off Duels | 3 |
| Mastery (tree, SRS, analytics) | 4 |
| Design system + diagram v3 + motion | 6 |
| Audio integration | 2 |
| QA, a11y, perf, launch | 5 |
| **Total** | **~52 PW ≈ 8 people × 12 weeks with slack** |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Sim feels fake/unfair | Deterministic seeds, visible formulas ("why" panel), tune with real SRE playtests |
| Scope explosion (7 modes!) | Modes share one sim + one design system; Arena reuses Lab editor; cut-line = Duels + endless modes |
| Content quality drift | Content CI linting + weekly learning-design review + playtest comprehension checks |
| Learning ≠ fun | Weekly playtests with comprehension quizzes post-session (measure both) |
| Audio/asset delays | Synth engine already ships; files are drop-in upgrades |

---

## 11. Build Order Recommendation

1. **Sim engine** (everything depends on it)
2. **Sandbox Lab alpha** (biggest learning win, proves the sim)
3. **Campaign expansion** (cheap, uses existing pipeline)
4. **Interview Arena** (the promise: "crack any interview")
5. **Incident Commander → Mastery → polish**

---

## 12. What Already Exists (foundation)

✅ 27 chapters, 8 acts · investigation consoles with typed commands · codex (27 concepts) · quizzes · capacity/economy sim · live charts · synth SFX engine · journey tracker · save system · Zod content pipeline · Vitest engine tests · deploy-ready Vite app

This is roughly the W0 state; the plan above is additive.
