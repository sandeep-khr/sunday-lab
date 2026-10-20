import type { Effects } from './types'

export interface ComponentMeta {
  name: string
  cost: number
  cap: number
  blurb: string
}

export const COMPONENTS: Record<string, ComponentMeta> = {
  monitoring: { name: 'Monitoring & Alerts', cost: 2, cap: 3, blurb: 'Know before the customer calls' },
  mvp: { name: 'WhatsApp Catalog MVP', cost: 3, cap: 8, blurb: 'PDF catalogs over WhatsApp' },
  db_split: { name: 'Dedicated Database', cost: 5, cap: 15, blurb: 'App and DB live apart' },
  lb: { name: 'Load Balancer + App Pool', cost: 8, cap: 40, blurb: 'Horizontal scaling' },
  replicas: { name: 'Read Replicas', cost: 10, cap: 35, blurb: 'Reads scale, lag lurks' },
  staging: { name: 'Staging Environment', cost: 4, cap: 0, blurb: 'Insurance against self-inflicted outages' },
  redis: { name: 'Redis Cache', cost: 6, cap: 60, blurb: 'Speed is a feature' },
  microservice: { name: 'Catalog Microservice', cost: 9, cap: 25, blurb: 'Strangler fig, not rewrite' },
  kafka: { name: 'Kafka Event Bus', cost: 12, cap: 40, blurb: 'Guaranteed delivery for orders' },
  docker: { name: 'Docker Containers', cost: 7, cap: 30, blurb: 'Ship the machine, not the instructions' },
  es: { name: 'Elasticsearch', cost: 8, cap: 30, blurb: 'Search that thinks in indexes' },
  cdn: { name: 'CDN Edge', cost: 11, cap: 150, blurb: 'Your assets, everywhere at once' },
  k8s: { name: 'Kubernetes', cost: 14, cap: 50, blurb: 'The conductor for your containers' },
  edge: { name: 'Edge Network', cost: 13, cap: 200, blurb: 'Move compute and data to the user' },
  bare_metal: { name: 'Bare Metal Fleet', cost: -12, cap: 90, blurb: 'Own racks, cut the cloud bill' },
  cicd: { name: 'CI/CD Pipeline', cost: 5, cap: 0, blurb: 'Ship daily without fear' },
  enterprise: { name: 'Enterprise Tier', cost: 9, cap: 25, blurb: 'SLAs, SSO, audits — big fish welcome' },
  sharding: { name: 'Sharded Postgres', cost: 12, cap: 220, blurb: 'Consistent hashing splits the data' },
  nosql: { name: 'Document Store', cost: 10, cap: 90, blurb: 'Flexible scale, eventual consistency' },
  ratelimit: { name: 'Rate Limiter', cost: 6, cap: 45, blurb: 'Protect the core from floods' },
  realtime: { name: 'WebSocket Layer', cost: 8, cap: 70, blurb: 'Live updates, zero refresh' },
}

export const ROADMAP = ['Edge Network', 'Global Failover', 'IPO']

export interface GameState {
  month: number
  users: number
  cash: number
  reliability: number
  speed: number
  morale: number
  debt: number
  reputation: number
  unlocked: string[]
  flags: Record<string, boolean>
  chapterIndex: number
  sceneIndex: number
}

export function initialState(): GameState {
  return {
    month: 1,
    users: 0.5,
    cash: 120,
    reliability: 55,
    speed: 60,
    morale: 70,
    debt: 10,
    reputation: 50,
    unlocked: [],
    flags: {},
    chapterIndex: 0,
    sceneIndex: 0,
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

export function applyEffects(s: GameState, e: Effects): void {
  s.reliability = clamp(s.reliability + (e.reliability ?? 0))
  s.speed = clamp(s.speed + (e.speed ?? 0))
  s.morale = clamp(s.morale + (e.morale ?? 0))
  s.debt = clamp(s.debt + (e.debt ?? 0))
  s.reputation = clamp(s.reputation + (e.reputation ?? 0))
  s.cash += e.cash ?? 0
}

export function loadOf(s: GameState): number {
  return s.users
}

export function capacityOf(s: GameState): number {
  let c = 2
  for (const id of s.unlocked) c += COMPONENTS[id]?.cap ?? 0
  if (s.unlocked.includes('k8s')) c *= 1.35
  else if (s.unlocked.includes('docker')) c *= 1.15
  return Math.round(c)
}

export function p95ms(s: GameState): number {
  return Math.round(Math.max(45, Math.min(999, 880 - s.speed * 7.5)))
}

export function deployCadence(s: GameState): string {
  const has = (id: string) => s.unlocked.includes(id)
  if (has('cicd') && has('staging')) return '~240 deploys/mo'
  if (has('cicd')) return '~90 deploys/mo'
  if (has('staging')) return '~40 deploys/mo'
  return '~4 deploys/mo'
}

export function monthlyCosts(s: GameState): number {
  const base = 6 + s.unlocked.reduce((acc, id) => acc + (COMPONENTS[id]?.cost ?? 0), 0)
  return Math.max(4, Math.round(base + s.users * 0.06))
}

export function monthlyRevenue(s: GameState): number {
  return Math.round(s.users * 2.1 * (s.unlocked.includes('enterprise') ? 1.3 : 1))
}

export interface Incident {
  id: string
  title: string
  text: string
  effects: Effects
  setFlags?: string[]
}

type Rule = Incident & { when: (s: GameState) => boolean }

export const INCIDENT_RULES: Rule[] = [
  {
    id: 'stale-prices',
    title: 'Priya saw a ghost price',
    text: 'A seller saved a new price but her store kept showing the old one for minutes. Word spreads in merchant WhatsApp groups. You pin her session to the primary and ship read-your-writes.',
    effects: { reputation: -12 },
    setFlags: ['pinned_reads'],
    when: (s) => s.flags['stale_risk'] === true && !s.flags['pinned_reads'] && !s.flags['incident_stale-prices'],
  },
  {
    id: 'friday-deploy',
    title: 'Friday deploy took checkout down',
    text: 'A hotfix pushed straight to prod during peak hours broke the cart. Merchants lost an evening of sales; support inboxes flooded.',
    effects: { reliability: -10, reputation: -8, morale: -5, cash: -5 },
    when: (s) => !s.unlocked.includes('staging') && s.debt >= 45 && !s.flags['incident_friday-deploy'],
  },
  {
    id: 'db-melt',
    title: 'Database melted during a flash sale',
    text: 'Every page view hammered Postgres with identical queries. CPU pegged at 100%, the site crawled, carts were abandoned mid-checkout.',
    effects: { speed: -12, reputation: -6 },
    when: (s) => !s.unlocked.includes('redis') && s.users >= 25 && !s.flags['incident_db-melt'],
  },
  {
    id: 'lost-orders',
    title: 'Orders vanished between services',
    text: 'The catalog service and the monolith talked over fire-and-forget HTTP. When it timed out, orders silently disappeared. Finance noticed before you did.',
    effects: { reliability: -6, reputation: -6 },
    when: (s) => s.unlocked.includes('microservice') && !s.unlocked.includes('kafka') && !s.flags['incident_lost-orders'],
  },
  {
    id: 'env-drift',
    title: '"Works on my machine" struck in prod',
    text: 'A deploy that ran fine on a laptop crashed in production: different library versions, different OS patches. Three engineers lost a night replaying the environment by hand.',
    effects: { morale: -7, reliability: -5, cash: -3 },
    when: (s) => !s.unlocked.includes('docker') && s.unlocked.length >= 8 && !s.flags['incident_env-drift'],
  },
  {
    id: 'search-melt',
    title: 'Search took the database hostage',
    text: "A shopper searched \"%discount%\" and the SQL LIKE query scanned every product row. One curious query became an outage.",
    effects: { speed: -9, reputation: -4 },
    when: (s) => !s.unlocked.includes('es') && s.users >= 60 && !s.flags['incident_search-melt'],
  },
  {
    id: 'global-slowdown',
    title: 'Overseas sellers gave up waiting',
    text: 'Product images traveled 900ms from your single region while international sellers watched spinners. Their buyers swiped away before pages painted.',
    effects: { reputation: -7, speed: -5 },
    when: (s) => !s.unlocked.includes('cdn') && s.users >= 90 && !s.flags['incident_global-slowdown'],
  },
  {
    id: 'container-chaos',
    title: 'Orphaned containers ate the cluster',
    text: 'Someone restarted containers by hand across a dozen hosts; two got skipped, one ran twice. Nobody knew what was supposed to be running where.',
    effects: { reliability: -7, morale: -5 },
    when: (s) => s.unlocked.includes('docker') && !s.unlocked.includes('k8s') && s.users >= 140 && !s.flags['incident_container-chaos'],
  },
  {
    id: 'cloud-bill-shock',
    title: 'The cloud bill arrived wearing a tuxedo',
    text: 'Steady-state workloads on premium cloud instances cost 4x what owned hardware would. Finance asks why rent keeps climbing with no ceiling.',
    effects: { cash: -18, reputation: -3 },
    when: (s) => !s.unlocked.includes('bare_metal') && s.users >= 200 && !s.flags['incident_cloud-bill-shock'],
  },
  {
    id: 'bug-avalanche',
    title: 'Tech debt avalanche',
    text: 'Three unrelated features broke at once. Every fix touched five others. The team spent the week firefighting instead of shipping.',
    effects: { morale: -8, speed: -6, debt: -5 },
    when: (s) => s.debt >= 65 && !s.flags['incident_bug-avalanche'],
  },
  {
    id: 'attrition',
    title: 'Your best engineer quit',
    text: 'Burnout won. The on-call rotation got thinner and everyone else started polishing their resumes.',
    effects: { morale: -6, reputation: -4, speed: -4 },
    when: (s) => s.morale <= 25 && !s.flags['incident_attrition'],
  },
]

export interface TickReport {
  month: number
  prevUsers: number
  users: number
  revenue: number
  costs: number
  net: number
  load: number
  capacity: number
  incidents: Incident[]
}

export function tick(s: GameState, surge: number): TickReport {
  const prevUsers = s.users
  const rawGrowth = prevUsers * (1.03 + (s.reputation + s.speed + s.reliability) / 1000) * surge
  const ceiling = Math.max(prevUsers, capacityOf(s) * 1.25)
  s.users = Math.round(Math.min(rawGrowth, ceiling) * 10) / 10

  let revenue = monthlyRevenue(s)
  const costs = monthlyCosts(s)

  const load = loadOf(s)
  const capacity = capacityOf(s)
  const incidents: Incident[] = []

  if (load > capacity * 1.05) {
    if (s.unlocked.includes('lb') || s.unlocked.includes('k8s')) {
      revenue -= 14
      incidents.push({
        id: 'elastic-scale',
        title: 'Traffic burst — autoscaling saved you, the bill noticed',
        text: 'Load exceeded planned capacity. Extra servers spun up automatically and absorbed the spike. Nothing broke; finance raised an eyebrow at the bill.',
        effects: {},
      })
      s.cash -= 14
    } else {
      incidents.push({
        id: 'overload-outage',
        title: 'CAPACITY EXCEEDED — the site went dark',
        text: 'Requests queued past timeouts and the platform fell over. Merchants refreshed error pages while competitors tweeted uptime screenshots.',
        effects: { reliability: -13, reputation: -11, morale: -4 },
      })
      applyEffects(s, { reliability: -13, reputation: -11, morale: -4 })
    }
  }

  for (const rule of INCIDENT_RULES) {
    if (rule.when(s)) {
      incidents.push({ id: rule.id, title: rule.title, text: rule.text, effects: rule.effects })
      s.flags[`incident_${rule.id}`] = true
      if (rule.setFlags) for (const f of rule.setFlags) s.flags[f] = true
      applyEffects(s, rule.effects)
    }
  }

  if (s.unlocked.includes('cicd')) s.debt = clamp(s.debt - 2)
  s.cash += revenue - costs
  const month = s.month
  s.month += 1
  s.debt = clamp(s.debt + (s.unlocked.includes('staging') ? 1 : 3))

  return { month, prevUsers, users: s.users, revenue, costs, net: revenue - costs, load, capacity, incidents }
}

export type GameOverReason =
  | { kind: 'bankrupt'; title: 'BANKRUPT'; text: string }
  | { kind: 'fired'; title: 'FIRED'; text: string }
  | { kind: 'exodus'; title: 'TEAM EXODUS'; text: string }
  | { kind: 'meltdown'; title: 'CREDIBILITY MELTDOWN'; text: string }

export function checkGameOver(s: GameState): GameOverReason | null {
  if (s.cash <= -40)
    return { kind: 'bankrupt', title: 'BANKRUPT', text: 'The runway ran out. Payroll bounced, the board called an emergency meeting, and your badge stopped working on Monday.' }
  if (s.reputation <= 10)
    return { kind: 'fired', title: 'FIRED', text: 'Too many outages, too many angry merchants. The CEO asks for "a fresh perspective on technology" and you are escorted to collect your plants.' }
  if (s.morale <= 8)
    return { kind: 'exodus', title: 'TEAM EXODUS', text: 'The whole senior team resigned in the same week. There is no one left to keep the servers running.' }
  if (s.reliability <= 8)
    return { kind: 'meltdown', title: 'CREDIBILITY MELTDOWN', text: 'The platform has been down more than it has been up. Merchants migrate to competitors on a group call, live, while you watch.' }
  return null
}

export type EndingKind = 'ipo' | 'acquired' | 'survived'

export function computeEnding(s: GameState): { kind: EndingKind; score: number } {
  const score = Math.round(
    s.users +
      s.reputation * 1.5 +
      Math.max(s.cash, 0) * 0.2 +
      s.unlocked.length * 7 +
      (s.reliability >= 70 ? 25 : 0) +
      (s.speed >= 70 ? 15 : 0) +
      (s.flags['failover_passed'] ? 40 : 0),
  )
  const kind: EndingKind = score >= 300 ? 'ipo' : score >= 190 ? 'acquired' : 'survived'
  return { kind, score }
}
