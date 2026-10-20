import type { ArenaPrompt } from '../engine/arena'

export const ARENA_PROMPTS: ArenaPrompt[] = [
  {
    id: 'tinyurl',
    title: 'Design a URL Shortener',
    difficulty: 'EASY',
    persona: 'Practical Priya — senior engineer, allergic to over-engineering',
    ask: 'Build bit.ly: 100M new URLs per month, reads dominate writes, links must resolve in <50ms worldwide.',
    clarify: {
      prompt: 'Pick the 3 clarifying questions that matter most before designing.',
      picks: 3,
      options: [
        { id: 'c1', text: 'What is the read:write ratio?', good: true, feedback: 'Reads dominate ~10:1 — this drives caching and replica strategy.' },
        { id: 'c2', text: 'Do links expire, or live forever?', good: true, feedback: 'Expiry changes storage growth, TTL design and cleanup jobs.' },
        { id: 'c3', text: 'Do we need real-time click analytics?', good: true, feedback: 'Analytics on the write path forces queues; without it, design stays simple.' },
        { id: 'c4', text: 'React or Vue for the redirect page?', good: false, feedback: 'Frontend framework is irrelevant to a system design of a redirect service.' },
        { id: 'c5', text: 'How many engineers will maintain it?', good: false, feedback: 'Team size affects process, not the architecture of reads vs writes.' },
        { id: 'c6', text: 'What font should the 404 page use?', good: false, feedback: 'The panel just silently updated your score downward.' },
      ],
    },
    estimate: [
      {
        q: '100M new URLs/month ≈ how many writes/sec?',
        options: ['~40 writes/s', '~400 writes/s', '~4,000 writes/s'],
        answer: 0,
        explain: '100M ÷ 30 days ÷ 86,400s ≈ 38.6/s. Writes are tiny — this is a READ-scale problem.',
      },
      {
        q: 'With a 10:1 read ratio, reads/sec ≈ ?',
        options: ['~390 reads/s', '~40 reads/s', '~3,900 reads/s'],
        answer: 0,
        explain: '10 × 40 ≈ 400/s average, with peak multipliers 3-5x. Still modest — caches will make this trivial.',
      },
      {
        q: '5-year storage at ~500 bytes/row ≈ ?',
        options: ['~300 GB', '~3 TB', '~30 TB'],
        answer: 1,
        explain: '6B rows × 500B = 3×10¹² B = 3TB. Trivial for one modest cluster — no exotic storage needed.',
      },
    ],
    design: {
      prompt: 'Assemble the architecture. Required components earn points; unjustified extras lose them.',
      required: ['lb', 'app', 'cache', 'nosql', 'ratelimit'],
      bonus: ['cdn', 'replicas'],
      forbidden: [
        { id: 'ws', why: 'WebSockets push state to clients — a redirect is a single stateless response.' },
        { id: 'es', why: 'Lookup is exact key→URL. That is a hash map, not a search problem.' },
        { id: 'queue', why: 'No async work in v1. Analytics can be bolted on later without changing the core.' },
      ],
    },
    defend: [
      {
        q: 'Why not sequential auto-increment IDs for short keys?',
        options: [
          'They are enumerable — competitors can scrape every link, and shards collide on ranges',
          'Auto-increment uses more storage than base62',
          'Sequential IDs cannot be cached',
        ],
        answer: 0,
        explain: 'Sequential keys leak business volume and create hot ranges when sharded. Random base62 keys distribute evenly and resist enumeration.',
      },
      {
        q: 'Bots probe millions of dead short URLs. Cache misses hammer the DB. Fix?',
        options: [
          'Cache negative results (dead keys) with a TTL',
          'Ban all bots at the firewall',
          'Increase database max connections to 5,000',
        ],
        answer: 0,
        explain: 'Negative caching absorbs the storm: dead keys cached briefly means one DB lookup per dead key, not millions.',
      },
      {
        q: 'Traffic grows 10x. What breaks first?',
        options: [
          'The key space — base62 runs out',
          'DB write throughput — shard writes by key hash',
          'The CDN — it cannot cache redirects',
        ],
        answer: 1,
        explain: '62⁷ ≈ 3.5 trillion keys — the keyspace is fine. Writes are the growth axis: consistent-hash sharding scales them linearly.',
      },
    ],
  },
  {
    id: 'twitter',
    title: 'Design the Home Timeline',
    difficulty: 'MEDIUM',
    persona: 'Devon — staff engineer, will push on fan-out until something breaks',
    ask: 'Design Twitter home timelines: 200M DAU, 100 timeline reads/user/day, 5K tweets/s (25K peak), celebrity accounts with 50M followers.',
    clarify: {
      prompt: 'Pick the 3 clarifications that shape the whole design.',
      picks: 3,
      options: [
        { id: 'c1', text: 'Fan-out on write vs on read — and do we hybridize for celebrities?', good: true, feedback: 'THE timeline question. Hybrid fan-out is the difference between O(1) reads and 50M-write storms.' },
        { id: 'c2', text: 'Strict chronological or ranked timelines?', good: true, feedback: 'Ranked feeds need feature stores and scoring; chronological needs precomputed lists. Different systems entirely.' },
        { id: 'c3', text: 'Do reads assemble from cache or hit storage directly?', good: true, feedback: 'Cache-hit ratio is the economics of the entire platform at 231K rps.' },
        { id: 'c4', text: 'Should we copy X’s exact UI?', good: false, feedback: 'Product cloning is not a system design question.' },
        { id: 'c5', text: 'What is our marketing budget?', good: false, feedback: 'Devon raises an eyebrow and writes something down.' },
        { id: 'c6', text: 'Monolith or microservices from day one?', good: false, feedback: 'Premature — first establish data flows and scale axes; the deploy topology follows.' },
      ],
    },
    estimate: [
      {
        q: 'Average timeline reads/sec?',
        options: ['~23K rps', '~231K rps', '~2.3M rps'],
        answer: 1,
        explain: '200M × 100 ÷ 86,400 ≈ 231K/s average, peaks 3-5x. Only a precomputed+cached design survives this.',
      },
      {
        q: 'Daily tweet storage at 5K tweets/s × ~1KB?',
        options: ['~43 GB/day', '~432 GB/day', '~4.3 TB/day'],
        answer: 1,
        explain: '5,000 × 86,400 = 432M tweets × 1KB ≈ 432GB/day. Media blobs live separately — this is text only.',
      },
      {
        q: 'A celebrity with 50M followers tweets. Fan-out strategy?',
        options: [
          'Push to all 50M timelines synchronously',
          'Hybrid: push to active followers, merge on read for the rest',
          'Store one tweet; every read queries all followees',
        ],
        answer: 1,
        explain: 'Pure push = 50M writes for one tweet. Pure pull = expensive reads. Hybrid (the real Twitter solution) bounds both.',
      },
    ],
    design: {
      prompt: 'Assemble the timeline machine.',
      required: ['lb', 'app', 'cache', 'nosql', 'sharding', 'queue', 'ws', 'cdn'],
      bonus: ['es', 'replicas'],
      forbidden: [{ id: 'blob', why: 'Media binaries are a separate sub-problem (S3 + CDN). The timeline is about text fan-out.' }],
    },
    defend: [
      {
        q: 'Why NoSQL over SQL for the tweet store?',
        options: [
          'SQL cannot store text',
          'Access is key-based (user→tweets, tweet→row) at massive scale; wide-column stores shard that naturally',
          'NoSQL is always faster than SQL',
        ],
        answer: 1,
        explain: 'Access pattern decides storage. Key-based time-ordered fetches with horizontal sharding favor wide-column stores; no joins needed.',
      },
      {
        q: 'Your timeline cache hit rate drops to 90% at peak. Consequence?',
        options: [
          'Nothing measurable',
          '23K rps of timeline assemblies hit storage — the tail latency collapses',
          'Only new users are affected',
        ],
        answer: 1,
        explain: 'At 231K rps, every 1% of misses = 2,300 storage assemblies/sec. The cache IS the architecture; guard its hit rate with precomputation.',
      },
      {
        q: 'How do deleted tweets disappear from 50M cached timelines?',
        options: [
          'Rebuild every fan-out list',
          'Tombstone the tweet; timelines filter on read or lazily evict',
          'Deletion is eventual — accept ghosts forever',
        ],
        answer: 1,
        explain: 'Tombstones + lazy filtering: cheap writes, correct-enough reads. Eager invalidation of 50M lists is impossible economics.',
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'Design WhatsApp Messaging',
    difficulty: 'HARD',
    persona: 'Mei — principal engineer, reliability-obsessed, will ask "what if it fails?" five times',
    ask: 'Design global messaging: 500M DAU, 60B messages/day, <500ms delivery, offline inbox, group chats to 1,024 members, media sharing.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: '1:1 vs group messaging — different fan-out models?', good: true, feedback: 'Groups of 1,024 turn one send into a thousand deliveries. Separate paths entirely.' },
        { id: 'c2', text: 'Delivery guarantee: at-least-once acceptable with client dedupe?', good: true, feedback: 'Exactly-once is a myth at this scale; at-least-once + idempotent clients is the real design.' },
        { id: 'c3', text: 'Presence and typing indicators — real-time or eventual?', good: true, feedback: 'Presence at 500M users is its own firehose; eventual consistency saves an order of magnitude.' },
        { id: 'c4', text: 'Which cloud region is cheapest for this?', good: false, feedback: 'Messaging is a latency product; regions follow users, not prices.' },
        { id: 'c5', text: 'Should we write our own protocol from scratch?', good: false, feedback: 'Mei: "People who invent protocols before measuring usually invent bugs." Use proven ones.' },
        { id: 'c6', text: 'Native or cross-platform clients?', good: false, feedback: 'Client tech choice does not shape the messaging backend design.' },
      ],
    },
    estimate: [
      {
        q: '60B messages/day ≈ average messages/sec?',
        options: ['~70K/s', '~700K/s', '~7M/s'],
        answer: 1,
        explain: '60×10⁹ ÷ 86,400 ≈ 694K/s average; evening peaks 3-5x. Each one must find one recipient among billions.',
      },
      {
        q: 'Concurrent persistent connections at any moment?',
        options: ['~5M', '~50M', '~500M'],
        answer: 2,
        explain: 'Most of 500M DAU keep an open socket. Connection management — not message storage — is the hardest scaling problem.',
      },
      {
        q: 'If 10% of messages carry 50KB media, daily media storage ≈ ?',
        options: ['~3 TB/day', '~30 TB/day', '~300 TB/day'],
        answer: 1,
        explain: '6B × 10% × 50KB = 30TB/day ≈ 11PB/year. Blob storage with lifecycle policies is mandatory, not optional.',
      },
    ],
    design: {
      prompt: 'Assemble the messaging backbone.',
      required: ['lb', 'app', 'ws', 'queue', 'nosql', 'sharding', 'blob'],
      bonus: ['cache', 'ratelimit'],
      forbidden: [{ id: 'es', why: 'In-chat search is a separate offline service. Core routing never touches a search index.' }],
    },
    defend: [
      {
        q: 'A message gets delivered twice. Why, and what is the fix?',
        options: [
          'Network retries + at-least-once semantics; clients dedupe by (sender, messageId)',
          'A bug in the sender app; ship a patch',
          'Duplicate detection is impossible at this scale',
        ],
        answer: 0,
        explain: 'Exactly-once delivery is a marketing term. The real contract: at-least-once transport + idempotent receivers keyed by message ID.',
      },
      {
        q: 'Two billion open sockets hit your load balancers. What breaks first?',
        options: [
          'Bandwidth costs',
          'Connection state — LBs need sticky sessions and a connection registry to route messages to the right gateway',
          'TLS certificate renewals',
        ],
        answer: 1,
        explain: 'A socket lives on ONE gateway. Message routing needs a registry (user→gateway) plus sticky connections — the classic WebSocket scaling wall.',
      },
      {
        q: 'A user was offline for a week and 10K group messages piled up. Open the app — what happens?',
        options: [
          'Deliver all 10K instantly through the socket',
          'Inbox pointers + lazy paginated fetch from the message store',
          'Drop messages older than 48 hours',
        ],
        answer: 1,
        explain: 'The socket delivers a lightweight "you have mail" pointer; history streams from sharded storage with pagination. Never push a firehose through a handshake.',
      },
    ],
  },
  {
    id: 'ratelimiter',
    title: 'Design a Distributed Rate Limiter',
    difficulty: 'MEDIUM',
    persona: 'Ruth — infrastructure lead, zero tolerance for hand-waving',
    ask: 'Design a rate limiter for a 200-server API fleet: 10M active users, per-user limits, accurate across all servers, must add <5ms latency.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: 'Hard cap or burst-tolerant (token bucket depth)?', good: true, feedback: 'Burst tolerance is a product decision: token buckets allow spikes, fixed windows do not.' },
        { id: 'c2', text: 'Limit granularity: per-user, per-IP, or per-API-key?', good: true, feedback: 'The key choice decides storage size, fairness, and abuse resistance.' },
        { id: 'c3', text: 'If the limiter fails, do we fail open or closed?', good: true, feedback: 'A limiter outage must not become a platform outage — this is the most senior question on the list.' },
        { id: 'c4', text: 'Should limits be round numbers?', good: false, feedback: 'Ruth stares. "That is not a question."' },
        { id: 'c5', text: 'Do we rate limit internal service-to-service calls too?', good: false, feedback: 'Scope creep — the ask is the public API edge. Interior limits are a different project.' },
        { id: 'c6', text: 'Which language should the limiter be written in?', good: false, feedback: 'Implementation detail. Design first.' },
      ],
    },
    estimate: [
      {
        q: 'Token-bucket state for 10M users at ~100 bytes each?',
        options: ['~10 MB', '~1 GB', '~100 GB'],
        answer: 1,
        explain: '10M × 100B = 1GB — fits comfortably in a Redis cluster. This is why centralized limiter state is viable.',
      },
      {
        q: 'At 100K peak rps, the limiter handles how many lookups/sec?',
        options: ['~1K', '~100K', '~10M'],
        answer: 1,
        explain: 'One check per request: 100K lookups/s. Redis handles this — the <5ms budget is the constraint that shapes deployment.',
      },
      {
        q: 'Is a single Redis node enough for 100K ops/s?',
        options: [
          'Yes, forever — Redis is infinite',
          'Throughput is fine, but you need replication/cluster for HA — a single node is a bomb',
          'You need at least 50 shards from day one',
        ],
        answer: 1,
        explain: '100K simple ops is within one node’s ability, but the limiter failing = platform unprotected. HA is non-negotiable.',
      },
    ],
    design: {
      prompt: 'Assemble the enforcement stack.',
      required: ['ratelimit', 'lb', 'cache', 'app'],
      bonus: ['queue'],
      forbidden: [
        { id: 'ws', why: 'Rate limiting is request-scoped. Persistent sockets add state the design does not need.' },
        { id: 'blob', why: 'No media anywhere near this problem.' },
        { id: 'cdn', why: 'The limiter protects origin APIs; CDN edges are downstream consumers of its decisions, not part of it.' },
      ],
    },
    defend: [
      {
        q: 'Redis cluster goes down. Fail open or closed?',
        options: [
          'Fail closed — block everything until Redis returns',
          'Fail open with local per-server counters as a degraded fallback',
          'Restart the API servers',
        ],
        answer: 1,
        explain: 'A limiter outage must not take down the platform: fail open, degrade accuracy, page an human. Local counters approximate limits until recovery.',
      },
      {
        q: 'Servers in three regions disagree about the current second. Sliding window breaks?',
        options: [
          'Use each server’s own clock; skew is tiny',
          'Take time from the central store (Redis TIME) or use logical windows — never trust fleet clocks',
          'Add atomic GPS clocks to every server',
        ],
        answer: 1,
        explain: 'Clock skew of even 50ms shifts window boundaries and breaks fairness. Centralize time or make windows skew-tolerant.',
      },
      {
        q: 'One celebrity API key does 50K rps — one hot key melts Redis. Fix?',
        options: [
          'Ban the celebrity',
          'Replicate the hot key across nodes / keep local token buckets synced asynchronously',
          'Move the limiter into the database',
        ],
        answer: 1,
        explain: 'Hot keys are the classic distributed-counter failure. Local buckets with periodic sync trade tiny accuracy for massive headroom.',
      },
    ],
  },
  {
    id: 'netflix',
    title: 'Design Video Streaming',
    difficulty: 'HARD',
    persona: 'Kofi — ex-CDN engineer, thinks in bits per second',
    ask: 'Design global video streaming: 100M subscribers, 1B hours watched/day, adaptive bitrate, start-play under 2 seconds.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: 'Video-on-demand only, or live streams too?', good: true, feedback: 'VOD is encode-once-serve-forever; live adds real-time ingest and transcoding — a different pipeline.' },
        { id: 'c2', text: 'Adaptive bitrate: client-driven or server-driven switching?', good: true, feedback: 'Determines where intelligence lives: manifest design, encoding ladders, and per-session state.' },
        { id: 'c3', text: 'What are the SLOs for start-up time and rebuffering?', good: true, feedback: 'Start <2s and rebuffer <0.5% forces multi-CDN edge strategy — the core cost and UX decision.' },
        { id: 'c4', text: 'Which DRM vendor should we pick?', good: false, feedback: 'Kofi sighs: "A real question, but a sub-component — not what shapes the architecture."' },
        { id: 'c5', text: 'Should the logo stay red?', good: false, feedback: 'Brand is not architecture.' },
        { id: 'c6', text: 'How many original series per year?', good: false, feedback: 'Content strategy, not system design.' },
      ],
    },
    estimate: [
      {
        q: '1B hours watched/day — average concurrent streams?',
        options: ['~4M', '~42M', '~420M'],
        answer: 1,
        explain: '1B hours ÷ 24h ≈ 42M streams playing simultaneously. That is sustained, not peak — prime time doubles it.',
      },
      {
        q: 'Storage for 100K titles × 4 bitrate ladders × ~2GB?',
        options: ['~80 TB', '~800 TB', '~8 PB'],
        answer: 1,
        explain: '100K × 8GB = 800TB. Large but static — perfect for cheap object storage with CDN offload.',
      },
      {
        q: 'Egress at 42M streams × 3Mbps ≈ ?',
        options: ['~12.6 Tbps', '~126 Tbps', '~1.26 Pbps'],
        answer: 1,
        explain: '42M × 3Mbps = 126 Tbps. No origin survives that — multi-tier CDN is not optional, it is the product.',
      },
    ],
    design: {
      prompt: 'Assemble the streaming platform.',
      required: ['lb', 'app', 'cache', 'blob', 'cdn', 'nosql', 'queue'],
      bonus: ['es', 'replicas'],
      forbidden: [
        { id: 'ws', why: 'Video ships as HTTP segments (HLS/DASH), not persistent sockets. Adaptive bitrate IS the transport.' },
        { id: 'ratelimit', why: 'Congestion is handled by bitrate adaptation, not request shedding — different mechanism, different layer.' },
      ],
    },
    defend: [
      {
        q: 'Why 2-10 second HLS/DASH chunks instead of one big MP4?',
        options: [
          'Chunks compress better',
          'Mid-stream quality switching: the client measures throughput per segment and switches ladders instantly',
          'MP4 cannot be cached by CDNs',
        ],
        answer: 1,
        explain: 'Segmentation turns adaptive bitrate into a per-request decision. It also gives CDNs thousands of cacheable objects instead of one uncacheable file.',
      },
      {
        q: 'Where do the 2 seconds of start-play latency go?',
        options: [
          'All in the video codec',
          'Manifest fetch + first segments — which is why they must come from edge cache, pre-warmed and predicted',
          'Client CPU decoding',
        ],
        answer: 1,
        explain: 'Manifest + first chunk from a nearby PoP is the whole game. Predictive popularity pre-warms regional caches before the premiere.',
      },
      {
        q: 'A season finale drops and 10M people press play at once. What breaks?',
        options: [
          'The encoders — re-encode everything live',
          'Origin egress — unless PoPs pre-warmed the title; predictive caching absorbs the premiere',
          'The database of user profiles',
        ],
        answer: 1,
        explain: 'Viral demand is predictable hours ahead. Pre-warming edge caches converts a 126Tbps origin problem into a non-event.',
      },
    ],
  },
  {
    id: 'uber',
    title: 'Design Ride Dispatch',
    difficulty: 'HARD',
    persona: 'Lena — mapping engineer, draws geohashes in the air while talking',
    ask: 'Design ride matching: 5M trips/day, 1M drivers online, match in <3 seconds, live ETAs, surge pricing.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: 'How often do drivers update location, and what matching radius?', good: true, feedback: 'Location update rate defines the write firehose; radius defines the geo-index design.' },
        { id: 'c2', text: 'What are we optimizing: rider wait time, driver utilization, or revenue?', good: true, feedback: 'The objective function IS the matching algorithm. Different goals, different systems.' },
        { id: 'c3', text: 'At what granularity is surge computed?', good: true, feedback: 'Per geo-cell supply/demand ratios — the cell size is a product and physics decision.' },
        { id: 'c4', text: 'Should drivers see passenger ratings before accepting?', good: false, feedback: 'Product surface, not dispatch architecture.' },
        { id: 'c5', text: 'Which car categories do we support?', good: false, feedback: 'A taxonomy question wearing a system design costume.' },
        { id: 'c6', text: 'Do we build our own maps?', good: false, feedback: 'Map data is a vendor dependency; dispatch works on coordinates regardless.' },
      ],
    },
    estimate: [
      {
        q: '1M drivers updating location every 4 seconds ≈ ?',
        options: ['~25K updates/s', '~250K updates/s', '~2.5M updates/s'],
        answer: 1,
        explain: '1M ÷ 4s = 250K writes/s into the geo-index. In-memory spatial indexing is mandatory; no database radius query survives this.',
      },
      {
        q: '5M trips/day ≈ average trips/sec?',
        options: ['~5.8/s', '~58/s', '~580/s'],
        answer: 1,
        explain: '5M ÷ 86,400 ≈ 58/s average, with city-level peaks 10-20x during commute and rain.',
      },
      {
        q: 'A metro of 500 km² divided into 1 km² surge cells → ?',
        options: ['~50 cells', '~500 cells', '~5,000 cells'],
        answer: 1,
        explain: '500 cells, each tracking supply/demand ratios — small enough for local pricing, large enough to smooth noise.',
      },
    ],
    design: {
      prompt: 'Assemble the dispatch machine.',
      required: ['lb', 'app', 'ws', 'queue', 'sharding', 'nosql', 'cache'],
      bonus: ['replicas', 'ratelimit'],
      forbidden: [
        { id: 'cdn', why: 'Dispatch is live state — nothing here is cacheable at an edge PoP. CDNs serve the map tiles, not the matching.' },
        { id: 'blob', why: 'No media in the hot path.' },
      ],
    },
    defend: [
      {
        q: 'Why an in-memory quadtree/geohash index instead of database radius queries?',
        options: [
          'Databases cannot store coordinates',
          'Nearest-N in memory answers in microseconds; SQL radius scans explode at 250K location writes/s',
          'Geohashes are more accurate than lat/long',
        ],
        answer: 1,
        explain: 'Matching is a hot-path spatial query. In-memory spatial indexes (quadtree/geohash/S2) make it O(log n) instead of O(fleet).',
      },
      {
        q: 'A driver sits at a cell boundary and flaps between two cells every update. Fix?',
        options: [
          'Ban drivers from boundaries',
          'Hysteresis: require crossing a margin before reassigning cells',
          'Increase GPS precision to centimeters',
        ],
        answer: 1,
        explain: 'Sensor jitter is noise; hysteresis (debounced cell assignment) is the classic cure. Same trick stabilizes autoscaling and circuit breakers.',
      },
      {
        q: 'Where does surge pricing actually get computed?',
        options: [
          'On the driver phone',
          'Per geo-cell demand/supply ratios, smoothed over time, broadcast to the pricing service',
          'In the rider app based on spinner color',
        ],
        answer: 1,
        explain: 'Surge is a smoothed per-cell ratio computed centrally and versioned — so pricing is auditable and riders in the same cell see the same world.',
      },
    ],
  },
  {
    id: 'crawler',
    title: 'Design a Web Crawler',
    difficulty: 'MEDIUM',
    persona: 'Sam — search infrastructure veteran, politely paranoid about politeness',
    ask: 'Design a web crawler: 10 billion pages, 10K pages/sec sustained, per-site politeness, deduplication, freshness recrawls.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: 'Freshness model: recrawl everything daily, or prioritize by change rate?', good: true, feedback: 'The frontier scheduler is the crawler’s brain — change-rate priority makes 10B pages tractable.' },
        { id: 'c2', text: 'Per-domain politeness: what QPS caps do we honor?', good: true, feedback: 'Politeness is both ethics and self-preservation: bans are an outage for a crawler.' },
        { id: 'c3', text: 'Store raw HTML or extracted text?', good: true, feedback: '10x storage difference and completely different serving patterns.' },
        { id: 'c4', text: 'Headless Chrome or plain HTTP fetching?', good: false, feedback: 'A rendering-tier decision — important, but downstream of the crawl architecture.' },
        { id: 'c5', text: 'Should the crawler be written in Go?', good: false, feedback: 'Language choice is an implementation detail; the frontier design is the system.' },
        { id: 'c6', text: 'Do we crawl the dark web?', good: false, feedback: 'Sam closes his notebook. "No."' },
      ],
    },
    estimate: [
      {
        q: '10B pages × ~100KB of HTML ≈ ?',
        options: ['~100 TB', '~1 PB', '~10 PB'],
        answer: 1,
        explain: '10¹⁰ × 10⁵ B = 10¹⁵ B = 1PB raw — before replicas and extracted-text copies. Plan for 3-5x with everything.',
      },
      {
        q: '10K pages/sec sustained = how many pages/day?',
        options: ['~86.4M', '~864M', '~8.64B'],
        answer: 1,
        explain: '10⁴ × 86,400 = 864M/day → a full 10B-page refresh every ~12 days. Freshness policy must live within this budget.',
      },
      {
        q: 'Dedup set for 10B URLs at ~300 bytes each ≈ 3TB. Practical strategy?',
        options: [
          'Keep it all in RAM on one machine',
          'Bloom filters in RAM + authoritative set on disk/sharded stores',
          'Skip dedup — duplicates are fine',
        ],
        answer: 1,
        explain: 'A 1% false-positive Bloom filter needs ~1.2GB per billion URLs — RAM-feasible — while the exact set lives sharded on disk.',
      },
    ],
    design: {
      prompt: 'Assemble the crawler.',
      required: ['lb', 'app', 'queue', 'worker', 'cache', 'nosql', 'sharding'],
      bonus: ['ratelimit', 'es'],
      forbidden: [
        { id: 'ws', why: 'Crawling is pull-based batch work; sockets add nothing.' },
        { id: 'cdn', why: 'You ARE the client here. CDNs are for serving, not fetching.' },
      ],
    },
    defend: [
      {
        q: 'Why a prioritized URL frontier instead of a plain FIFO queue?',
        options: [
          'FIFO queues are slower',
          'Priority = freshness × importance, and per-domain queues enforce politeness caps',
          'Frontiers compress better',
        ],
        answer: 1,
        explain: 'The frontier is two systems in one: a scheduler (what matters next) and a governor (never hammer one domain). FIFO is neither.',
      },
      {
        q: 'A site has infinite calendar pages: /day/1, /day/2 … 10M URLs. Survive?',
        options: [
          'Crawl them all — storage is cheap',
          'Per-domain caps + URL depth/parameter limits + content-hash dedup to detect the trap',
          'Blacklist all calendars forever',
        ],
        answer: 1,
        explain: 'Spider traps are defeated with bounds: domain QPS caps, URL pattern heuristics, and content hashing that notices you have seen this page 10,000 times.',
      },
      {
        q: 'Robots.txt: fetched per URL? That is 10B fetches.',
        options: [
          'Yes — compliance requires it',
          'Cache robots.txt per domain with a TTL; one fetch governs thousands of URLs',
          'Robots.txt is optional for good companies',
        ],
        answer: 1,
        explain: 'Robots caching with TTL is both the compliant and the only scalable answer. The per-domain cache doubles as the politeness ledger.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Design a Notification System',
    difficulty: 'EASY',
    persona: 'Ada — pragmatic platform lead, loves a good idempotency key',
    ask: 'Design notifications: 50M DAU across push/email/SMS, 500M notifications/day, per-user preferences, absolutely no duplicates.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: 'Delivery SLO: instant, or are batched digests acceptable for some types?', good: true, feedback: 'Instant vs digest splits the pipeline into real-time and batch paths with very different economics.' },
        { id: 'c2', text: 'How do preferences work — per channel per notification type?', good: true, feedback: 'The preference matrix gates every send; getting its model wrong means spam and churn.' },
        { id: 'c3', text: 'What is the deduplication window?', good: true, feedback: 'Defines the idempotency contract: (user, event) uniqueness across retries and fan-outs.' },
        { id: 'c4', text: 'What sound should push notifications make?', good: false, feedback: 'Ada smiles politely and moves on.' },
        { id: 'c5', text: 'Who writes the notification copy?', good: false, feedback: 'Content, not system design.' },
        { id: 'c6', text: 'iOS or Android first?', good: false, feedback: 'Vendors abstract this away — FCM/APNs adapters at most.' },
      ],
    },
    estimate: [
      {
        q: '500M notifications/day ≈ average sends/sec?',
        options: ['~580/s', '~5,800/s', '~58K/s'],
        answer: 1,
        explain: '5×10⁸ ÷ 86,400 ≈ 5.8K/s average — but marketing blasts create 100x spikes in seconds, which is the real design problem.',
      },
      {
        q: 'A celebrity event fans out to 20M followers. At 50K sends/sec per worker pool, delivery takes?',
        options: ['~40 seconds', '~400 seconds', '~4,000 seconds'],
        answer: 1,
        explain: '20M ÷ 50K/s = 400s ≈ 6.7 minutes. Fan-out is a queue-drain problem — users accept minutes for broadcast events.',
      },
      {
        q: 'Where is the real bottleneck for push at scale?',
        options: [
          'APNs/FCM — they cannot scale',
          'Your own token store and template rendering pipeline — vendors scale, your database might not',
          'Phone batteries',
        ],
        answer: 1,
        explain: 'Push vendors are built for planetary scale. Your billion-row device-token table and render pipeline are the parts that fall over.',
      },
    ],
    design: {
      prompt: 'Assemble the delivery machine.',
      required: ['lb', 'app', 'queue', 'worker', 'cache', 'nosql', 'ratelimit'],
      bonus: ['replicas'],
      forbidden: [
        { id: 'ws', why: 'Push notifications ARE the async transport — a WebSocket layer duplicates the job badly.' },
        { id: 'cdn', why: 'Notifications carry tiny payloads from your API; there is nothing static to edge-cache.' },
        { id: 'blob', why: 'No media in the hot path — icons live with the app.' },
      ],
    },
    defend: [
      {
        q: 'Why a queue between the event and the delivery workers?',
        options: [
          'Queues make notifications arrive faster',
          'Burst absorption, retry isolation, and per-channel pacing — a marketing blast cannot melt the real-time path',
          'It is required by APNs',
        ],
        answer: 1,
        explain: 'The queue converts a 100x burst into steady worker consumption, isolates vendor failures with retries, and paces each channel to its limits.',
      },
      {
        q: 'A user receives the same notification twice. Root cause?',
        options: [
          'The phone is haunted',
          'Producer retried after a timeout without an idempotency key — dedupe on (userId, eventId) at send time',
          'FCM duplicates by design',
        ],
        answer: 1,
        explain: 'Retries plus missing idempotency is the classic duplicate. The send must be a conditional write keyed by (user, event).',
      },
      {
        q: 'A user disables marketing notifications mid-fanout of a 20M blast. What do they receive?',
        options: [
          'The notification — the list was snapshotted',
          'Nothing — preferences are re-checked as the final gate before the vendor call',
          'Two notifications, by irony',
        ],
        answer: 1,
        explain: 'Snapshot at enqueue for stability, re-check at send for correctness. The final gate is the only one that matters to the user.',
      },
    ],
  },
  {
    id: 'autocomplete',
    title: 'Design Search Autocomplete',
    difficulty: 'MEDIUM',
    persona: 'Yuki — latency obsessive, counts milliseconds out loud',
    ask: 'Design autocomplete: 100M DAU, p99 under 50ms, typo tolerance, trending awareness, light personalization.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: 'Prefix matching only, or fuzzy/infix too?', good: true, feedback: 'Fuzzy and infix kill the simple prefix-index approach — this decides the entire data structure.' },
        { id: 'c2', text: 'Personalization: global trends, per-user history, or blended?', good: true, feedback: 'Per-user ranking breaks pure caching — the blend ratio defines your cache architecture.' },
        { id: 'c3', text: 'How fast must new trending terms appear?', good: true, feedback: 'Real-time trends require an overlay layer on top of the offline index.' },
        { id: 'c4', text: 'What font size for the suggestion dropdown?', good: false, feedback: 'Yuki blinks. "That is... not latency."' },
        { id: 'c5', text: 'Do we autocomplete emojis?', good: false, feedback: 'A product decision in a trench coat.' },
        { id: 'c6', text: 'Which JS framework renders it?', good: false, feedback: 'The dropdown is not the system.' },
      ],
    },
    estimate: [
      {
        q: '100M DAU × 2 searches × ~50 keystroke requests each ≈ requests/day?',
        options: ['~1B', '~10B', '~100B'],
        answer: 1,
        explain: '10¹⁰ keystroke requests/day ≈ 116K/s average. Every one must feel instant or users notice.',
      },
      {
        q: 'Top 50M queries cached in RAM at ~300 bytes each ≈ ?',
        options: ['~15 GB — one node + replicas handles it', '~1.5 TB', '~150 TB'],
        answer: 0,
        explain: '15GB fits in one generous node — which is why autocomplete is one of the few problems a single well-tuned cache can own.',
      },
      {
        q: 'The 50ms p99 budget: sane split?',
        options: [
          '50ms all in the database',
          '~5ms edge + ~10ms service + ~20ms index lookup, leaving margin for the tail',
          '100ms is fine, users are patient',
        ],
        answer: 1,
        explain: 'Latency budgets are allocated like money: every hop gets an allowance, and the tail (p99) is the overdraft fee.',
      },
    ],
    design: {
      prompt: 'Assemble the suggestion engine.',
      required: ['lb', 'app', 'cache', 'es', 'cdn', 'ratelimit'],
      bonus: ['replicas'],
      forbidden: [
        { id: 'queue', why: 'Suggestions are read-only and precomputed — no async work in the request path.' },
        { id: 'blob', why: 'No media.' },
        { id: 'ws', why: 'Each keystroke is an independent request; sockets add state for zero benefit.' },
      ],
    },
    defend: [
      {
        q: 'Why precomputed top-K lists per prefix instead of computing at request time?',
        options: [
          'Computing at request time is more accurate',
          'The 50ms budget forbids on-the-fly aggregation — offline builds serve in single-digit ms',
          'Prefixes are a fad',
        ],
        answer: 1,
        explain: 'Autocomplete is the canonical read-heavy precompute: build offline, serve from RAM, update incrementally. Real-time aggregation cannot make p99.',
      },
      {
        q: 'A celebrity name explodes mid-day. The offline index updates hourly. Bridge?',
        options: [
          'Rebuild everything immediately',
          'Two-tier counts: hourly base index + a real-time overlay of recent deltas, merged at serve time',
          'Show stale suggestions; users understand',
        ],
        answer: 1,
        explain: 'The overlay pattern: heavy accurate base, light fresh delta. Same idea powers stock tickers and leaderboards.',
      },
      {
        q: 'Why put a CDN in front of autocomplete at all?',
        options: [
          'To cache user-specific suggestions',
          'Popular prefixes are identical across millions of users — edge caching offloads 60%+ of keystroke traffic',
          'CDNs make requests more personal',
        ],
        answer: 1,
        explain: 'Global prefix queries are perfectly cacheable; only the personalization tail needs origin. Cache the 80%, personalize the 20%.',
      },
    ],
  },
  {
    id: 'ledger',
    title: 'Design a Payment Ledger',
    difficulty: 'HARD',
    persona: 'Marcus — ex-banking core engineer, believes in double-entry and nothing else',
    ask: 'Design a double-entry payment ledger: 10M transactions/day, money is never lost or duplicated, fully auditable for 7 years, balances always consistent.',
    clarify: {
      prompt: 'Pick the 3 clarifications that matter most.',
      picks: 3,
      options: [
        { id: 'c1', text: 'Strong consistency (ACID) or eventual with reconciliation?', good: true, feedback: 'For money movement this is usually settled: strong consistency first, reconciliation as a safety net — but making it explicit matters.' },
        { id: 'c2', text: 'Audit retention: how many years, and what regulators?', good: true, feedback: 'Retention drives the archival tier, immutability requirements, and query patterns for audits.' },
        { id: 'c3', text: 'What idempotency contract do clients get?', good: true, feedback: 'Retries are guaranteed at 10M/day. The idempotency key design IS the duplicate-prevention design.' },
        { id: 'c4', text: 'Should we add crypto payments?', good: false, feedback: 'Marcus closes his eyes briefly. "The ledger. Focus."' },
        { id: 'c5', text: 'Dark mode for the admin panel?', good: false, feedback: 'The admin panel is the least of your problems.' },
        { id: 'c6', text: 'Can we round fractional pennies away?', good: false, feedback: '"That question has caused real bankruptcies. We use integer minor units and never round silently."' },
      ],
    },
    estimate: [
      {
        q: '10M transactions/day ≈ average TPS?',
        options: ['~11.6 TPS', '~116 TPS', '~1,160 TPS'],
        answer: 1,
        explain: '10⁷ ÷ 86,400 ≈ 116 TPS average, peaks 5x. Trivial throughput — which is exactly why correctness, not scale, is the whole problem.',
      },
      {
        q: 'Double-entry means how many ledger rows per transaction?',
        options: ['1', '2 (a debit and a credit)', '10'],
        answer: 1,
        explain: 'Every transaction writes balanced debit+credit entries. The global invariant: SUM(all debits) = SUM(all credits), forever.',
      },
      {
        q: '7-year retention: 3.65B rows/year × 500B ≈ 1.8TB/year → total?',
        options: ['~180 GB', '~1.8 TB/year, ~13 TB for 7 years', '~180 TB'],
        answer: 1,
        explain: 'Hot storage stays small; cold archival (immutable, cheap) carries the decades. Audits query by account+time, which drives the archival index.',
      },
    ],
    design: {
      prompt: 'Assemble the ledger core.',
      required: ['sql', 'lb', 'app', 'queue', 'cache', 'replicas'],
      bonus: ['sharding', 'ratelimit'],
      forbidden: [
        { id: 'nosql', why: 'Eventual consistency has no place in money movement. A balance that is correct "eventually" is wrong in the meantime — with real losses.' },
        { id: 'cdn', why: 'Nothing about a ledger is publicly cacheable. Ever.' },
        { id: 'ws', why: 'Clients poll or receive webhooks from a separate service; the ledger core stays request-scoped.' },
      ],
    },
    defend: [
      {
        q: 'Why double-entry instead of just updating balances?',
        options: [
          'It is an old tradition',
          'The SUM(debits)=SUM(credits) invariant makes corruption mathematically detectable and audits reconcile by construction',
          'Single-entry cannot store amounts',
        ],
        answer: 1,
        explain: 'Balance columns drift silently when bugs strike. Append-only balanced entries turn "is the money right?" into a checksum — 500 years of accounting agrees.',
      },
      {
        q: 'Two services debit the same account simultaneously. What protects the balance?',
        options: [
          'Optimism',
          'Row-level locking / serializable isolation on the account row, plus idempotency keys for retries',
          'JavaScript is single-threaded',
        ],
        answer: 1,
        explain: 'Concurrent debits serialize on the account row; idempotency keys make the inevitable client retries harmless. Both, always.',
      },
      {
        q: 'Why is "eventually consistent" unacceptable for the ledger core?',
        options: [
          'It is slower',
          'Temporary inconsistencies are real losses: a double-spend during the window is unrecoverable, and audits cannot reconcile',
          'Eventual consistency is a NoSQL marketing term',
        ],
        answer: 1,
        explain: 'Everywhere else, eventual consistency costs a stale feed. Here it costs money. Reconciliation reports discrepancies — it does not prevent them.',
      },
    ],
  },
]
