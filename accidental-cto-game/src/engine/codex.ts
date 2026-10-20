export interface CodexEntry {
  id: string
  term: string
  tag: string
  definition: string
  analogy?: string
  points: string[]
}

export const CODEX: Record<string, CodexEntry> = {
  monitoring: {
    id: 'monitoring',
    term: 'Monitoring & Alerting',
    tag: 'Operations',
    definition: 'Continuously measuring system health (uptime, latency, errors, saturation) and paging a human when thresholds break.',
    analogy: 'A smoke detector for your platform — the fire should page you before it pages your customers.',
    points: [
      'Uptime checks from outside your network catch what internal metrics miss',
      'Alert on user-facing symptoms (latency, error rate), not just machine stats',
      'Every alert must be actionable; unactionable alerts train humans to ignore alarms',
    ],
  },
  mvp: {
    id: 'mvp',
    term: 'MVP (Minimum Viable Product)',
    tag: 'Product',
    definition: 'The smallest experiment that tests your riskiest business hypothesis with real users.',
    analogy: 'Not version 1 of the car — the skateboard before the scooter before the bicycle before the car.',
    points: [
      'It exists to generate learning, not revenue',
      'Ship in weeks, not months; polish follows proof',
      'Technical debt in an MVP is fine if you plan to repay it after validation',
    ],
  },
  db_split: {
    id: 'db_split',
    term: 'App / Database Separation',
    tag: 'Architecture',
    definition: 'Moving the database to dedicated hardware so application and storage scale, tune, and fail independently.',
    analogy: 'The first "divorce" on the road to scale — two specialists beat one generalist.',
    points: [
      'Databases are CPU/RAM/disk-hungry in ways apps are not',
      'Separation enables independent scaling and security boundaries',
      'It also introduces the network as a failure mode — monitor that hop',
    ],
  },
  scaling: {
    id: 'scaling',
    term: 'Vertical vs Horizontal Scaling',
    tag: 'Scaling',
    definition: 'Vertical = buy a bigger box. Horizontal = add more boxes behind a front door.',
    analogy: 'A taller tower vs more branches of the same bank.',
    points: [
      'Vertical hits a hard ceiling and is a single point of failure',
      'Horizontal needs stateless app tiers to work well',
      'Only horizontal scaling reaches high availability and massive scale',
    ],
  },
  lb: {
    id: 'lb',
    term: 'Load Balancer',
    tag: 'Traffic',
    definition: 'A traffic cop that distributes incoming requests across a pool of servers, health-checks them, and routes around failures.',
    analogy: 'The traffic cop of your infrastructure — wave cars to open lanes only.',
    points: [
      'Algorithms matter: round-robin, least-connections, weighted',
      'Health checks make failures invisible to users',
      'Stateless app servers are what make pooling possible',
    ],
  },
  replicas: {
    id: 'replicas',
    term: 'Read Replicas & Replication Lag',
    tag: 'Data',
    definition: 'Copies of the primary database that serve read queries. Writes replicate asynchronously, so replicas trail reality by milliseconds... or seconds.',
    analogy: 'The bouncer lets reads into the club through side doors — but Priya\'s price change travels via the VIP pass, or she sees a ghost.',
    points: [
      'Reads scale almost infinitely; writes still funnel to one primary',
      'Read-your-writes consistency requires session pinning after writes',
      'Lag is normal weather, not an anomaly — design for it',
    ],
  },
  staging: {
    id: 'staging',
    term: 'Staging Environment',
    tag: 'Delivery',
    definition: 'A production twin where every release rehearses before performing. The insurance policy against self-inflicted outages.',
    analogy: '"Don\'t test on prod, bro" — the dress rehearsal stage before opening night.',
    points: [
      'Catches integration surprises that unit tests cannot',
      'Costs a fraction of one production incident',
      'Must stay in sync with prod config or it lies to you',
    ],
  },
  caching: {
    id: 'caching',
    term: 'Caching & Invalidation',
    tag: 'Performance',
    definition: 'Keeping hot data in fast memory (Redis) so repeated reads never touch slow storage. Invalidation decides when cached answers expire.',
    analogy: 'Speed is a feature — a slow website is a broken website.',
    points: [
      'There are only two hard things: cache invalidation and naming things',
      'Write-through vs write-behind vs TTL — pick per data type',
      'A stampede (cache expiring under load) needs locking or soft expiry',
    ],
  },
  strangler: {
    id: 'strangler',
    term: 'Strangler Fig Migration',
    tag: 'Architecture',
    definition: 'Extracting one capability at a time into new services while routing keeps the old monolith running underneath, until nothing strangles remains.',
    analogy: 'Never rewrite a complex system from scratch — grow the new system around the old like a strangler fig.',
    points: [
      'Route by URL/feature, migrate incrementally, keep shippable at all times',
      'Each extraction ships value; big-bang rewrites ship risk',
      'Dual-running both paths makes rollback cheap',
    ],
  },
  kafka: {
    id: 'kafka',
    term: 'Event Streaming & Durable Logs',
    tag: 'Data',
    definition: 'Kafka persists every event to an ordered, replicated log. Consumers read at their own pace, can crash and resume, and deduplicate via idempotency.',
    analogy: 'The unbreakable promise: once an order is written to the log, losing it becomes structurally impossible.',
    points: [
      'Fire-and-forget HTTP between services loses orders during blips',
      'Idempotent consumers make redelivery safe',
      'Consumer groups scale processing without changing producers',
    ],
  },
  docker: {
    id: 'docker',
    term: 'Containers & Docker',
    tag: 'Infrastructure',
    definition: 'Packaging an app plus its dependencies into an immutable image that runs identically anywhere.',
    analogy: 'The shipping container revolution: standardize the box and any crane in any port can lift it.',
    points: [
      'Kills "works on my machine" — the image IS the machine spec',
      'Containers share the host kernel: lighter than VMs, denser packing',
      'Immutable images + version tags = reproducible deploys and instant rollback',
    ],
  },
  search: {
    id: 'search',
    term: 'Full-Text Search & Inverted Indexes',
    tag: 'Data',
    definition: 'Search engines (Elasticsearch) pre-tokenize documents into an inverted index: term → document list, making queries millisecond-fast instead of table scans.',
    analogy: 'The smart clerk who has memorized every catalog page, versus SQL LIKE flipping through every row.',
    points: [
      'LIKE %term% scans everything — O(table size) every query',
      'Indexes trade disk space and write cost for instant lookup',
      'Relevance ranking, typo tolerance and facets come free with real engines',
    ],
  },
  cdn: {
    id: 'cdn',
    term: 'CDN & Edge Caching',
    tag: 'Performance',
    definition: 'Content Delivery Networks replicate static assets to hundreds of Points of Presence worldwide, serving users from the nearest city.',
    analogy: 'The delivery boy with warehouses in every neighborhood instead of one central depot.',
    points: [
      'Cache-Control headers decide freshness at the edge',
      'Offloads most bytes from origin — often 80%+ of traffic',
      'Also absorbs DDoS floods and regional spikes',
    ],
  },
  k8s: {
    id: 'k8s',
    term: 'Kubernetes & Desired State',
    tag: 'Infrastructure',
    definition: 'You declare how many healthy replicas should exist; controllers continuously reconcile reality toward that declaration, replacing dead containers and rolling deploys.',
    analogy: 'The conductor of your container orchestra — automation replaces error-prone manual tasks.',
    points: [
      'Self-healing: crashed pods restart automatically',
      'Rolling updates and rollbacks are declarative one-liners',
      'Powerful but complex: run managed K8s unless operating it IS your product',
    ],
  },
  edge: {
    id: 'edge',
    term: 'Edge Compute & Regional Topology',
    tag: 'Architecture',
    definition: 'Pushing computation and read data into regions near users — edge functions plus regional replicas — so distance stops dictating latency.',
    analogy: 'Our global brain: decisions made where the user stands, not where HQ sits.',
    points: [
      'Physics tax: speed of light sets a floor you cannot optimize away',
      'Writes still home to a primary region; reads fan out globally',
      'Edge logic handles auth/personalization close to the user',
    ],
  },
  cloud_econ: {
    id: 'cloud_econ',
    term: 'Cloud Economics & Bare Metal',
    tag: 'Business',
    definition: 'Cloud rent buys elasticity and zero ops. At steady-state scale, owning hardware amortizes far cheaper — hybrid architectures take each workload where its economics win.',
    analogy: 'Escaping the golden cage: convenience was priced into every instance-hour.',
    points: [
      'Elastic workloads belong in cloud; stable baselines justify metal',
      'Migration risk is real — move boring stateless layers first',
      'Unit economics (cost per order) is the metric that matters',
    ],
  },
  sla: {
    id: 'sla',
    term: 'SLAs & Enterprise Readiness',
    tag: 'Business',
    definition: 'Contractual uptime promises (99.95% = ~22 minutes down/month) backed by monitoring, penalties, SSO, audit trails and priority support.',
    analogy: 'Onboarding the whale: big fish bring big money and bigger expectations.',
    points: [
      'Promise only what architecture already delivers',
      'Error budgets turn SLAs into engineering priorities',
      'Enterprise features are products, not hacks — forked codebases rot',
    ],
  },
  cicd: {
    id: 'cicd',
    term: 'CI/CD & Progressive Delivery',
    tag: 'Delivery',
    definition: 'Continuous Integration runs tests on every commit; Continuous Delivery automates releases through staging to production, ideally progressively: canary → percentage ramp → full rollout.',
    analogy: 'From fear-driven quarterly releases to boring daily ones — boring is the goal.',
    points: [
      'Fast pipelines keep branches short-lived and conflicts rare',
      'Canary deployments blast-radius-limit bad releases',
      'One-click rollback turns incidents into non-events',
    ],
  },
  brand: {
    id: 'brand',
    term: 'Engineering Brand & Recruiting',
    tag: 'Leadership',
    definition: 'Publishing your architecture story — blogs, talks, open source — builds a talent magnet and commercial credibility simultaneously.',
    analogy: 'Top talent is attracted to hard problems, not just paychecks.',
    points: [
      'Your engineering story is a recruiting weapon',
      'Writing forces clarity about your own systems',
      'Candidates who join because of the problems stay for them',
    ],
  },
  chaos: {
    id: 'chaos',
    term: 'Game Days & Chaos Engineering',
    tag: 'Operations',
    definition: 'Deliberately injecting failures (killing servers, draining regions) in controlled conditions to prove resilience before reality improvises the test.',
    analogy: 'Fire drills for distributed systems — rehearse the outage on your schedule, not its own.',
    points: [
      'Untested failover is a hypothesis, not a capability',
      'Runbooks turn panic into checklists',
      'The ultimate test is failing live, with grace, in public',
    ],
  },
  postmortem: {
    id: 'postmortem',
    term: 'Blameless Postmortems',
    tag: 'Culture',
    definition: 'After every incident: reconstruct the timeline, find contributing causes, and fix systems — never blame people.',
    analogy: 'Every outage is tuition paid; postmortems collect the education.',
    points: [
      'Blame hides information; safety surfaces it',
      'Track action items to closure or the same outage returns',
      'Sharing postmortems publicly builds enormous trust',
    ],
  },
  sharding: {
    id: 'sharding',
    term: 'Sharding & Consistent Hashing',
    tag: 'Data',
    definition: 'Splitting one database into many shards, each owning a slice of rows. Consistent hashing maps keys to shards so adding a node only moves ~1/N of data, not everything.',
    analogy: 'Instead of one giant warehouse, open many branch warehouses — and a smart GPS (consistent hashing) that reroutes only one street when a new branch opens.',
    points: [
      'Choose a high-cardinality shard key (user_id beats country)',
      'Cross-shard joins/transactions are painful — design around them',
      'Consistent hashing + virtual nodes = smooth resharding',
      'Hot shards still happen; monitor per-shard load',
    ],
  },
  nosql: {
    id: 'nosql',
    term: 'NoSQL & the CAP Theorem',
    tag: 'Data',
    definition: 'Under a network partition you must choose: consistency or availability. Document stores choose availability — always writable, eventually consistent.',
    analogy: 'During a flood you can keep every branch OPEN with slightly stale ledgers (AP), or CLOSE branches to guarantee perfect ledgers (CP). Pick per workload.',
    points: [
      'CAP only applies during partitions; PACELC adds latency tradeoff',
      'Eventual consistency suits feeds/carts; money wants strong consistency',
      'Denormalize for access patterns — schema follows queries',
      'Polyglot persistence: right store per job',
    ],
  },
  ratelimit: {
    id: 'ratelimit',
    term: 'Rate Limiting & Backpressure',
    tag: 'Traffic',
    definition: 'Cap requests per client/window (token bucket, sliding window) so floods degrade gracefully instead of cascading into collapse.',
    analogy: "The bouncer's clipboard: VIPs pass, everyone else waits in line — the club never exceeds fire code.",
    points: [
      'Token bucket allows bursts while capping averages',
      'Return 429 with Retry-After, never silent drops',
      'Limit by API key/IP/user tier at the edge',
      'Backpressure protects databases from retry storms',
    ],
  },
  realtime: {
    id: 'realtime',
    term: 'WebSockets & Real-time Delivery',
    tag: 'Architecture',
    definition: 'Persistent bidirectional connections push events instantly — no polling. Requires connection-aware load balancing and fan-out via pub/sub.',
    analogy: 'Polling is calling the shop every minute asking "order ready?"; WebSockets is the clerk ringing you the second it is.',
    points: [
      'Sticky sessions or a shared Redis pub/sub fan out across servers',
      'Heartbeats detect dead connections behind proxies',
      'Scale via pub/sub channels, not per-socket state in app memory',
    ],
  },
  cache_patterns: {
    id: 'cache_patterns',
    term: 'Cache Write Patterns',
    tag: 'Performance',
    definition: 'Cache-aside reads fill on miss. Writes choose: write-through (sync to DB+cache, consistent), write-back (cache first, flush later, fast but lossy), write-around (skip cache for cold writes).',
    analogy: 'Write-through = carbon-copy receipts; write-back = notes on a napkin you hope to transcribe before the coffee spills.',
    points: [
      'Write-through for data you cannot lose',
      'Write-back needs fsync discipline and loss acceptance',
      'LRU eviction approximates recency; LFU guards hot keys',
      'Measure hit rate before optimizing anything else',
    ],
  },
  estimation: {
    id: 'estimation',
    term: 'Back-of-Envelope Estimation',
    tag: 'Interviews',
    definition: 'Fermi estimates of QPS, storage and bandwidth from rough daily-active numbers — the opening move of every system design interview.',
    analogy: 'Before building the bridge, estimate how many cars cross per hour.',
    points: [
      '1M DAU × 10 reads/day ≈ ~116 RPS average, ~5x peak ≈ 580 RPS',
      'Remember powers: 1K=10³, 1M=10⁶, 1GB=10⁹ bytes',
      'Read:write ratios dictate cache and replica strategy',
      'State assumptions out loud — process matters more than precision',
    ],
  },
}

export function codexForComponent(id: string): string[] {
  switch (id) {
    case 'monitoring':
      return ['monitoring']
    case 'mvp':
      return ['mvp']
    case 'db_split':
      return ['db_split']
    case 'lb':
      return ['scaling', 'lb']
    case 'replicas':
      return ['replicas']
    case 'staging':
      return ['staging']
    case 'redis':
      return ['caching']
    case 'microservice':
      return ['strangler']
    case 'kafka':
      return ['kafka']
    case 'docker':
      return ['docker']
    case 'es':
      return ['search']
    case 'cdn':
      return ['cdn']
    case 'k8s':
      return ['k8s']
    case 'edge':
      return ['edge']
    case 'bare_metal':
      return ['cloud_econ']
    case 'enterprise':
      return ['sla']
    case 'cicd':
      return ['cicd']
    default:
      return []
  }
}
