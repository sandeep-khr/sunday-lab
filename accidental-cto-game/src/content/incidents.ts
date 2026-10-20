export interface IncidentAction {
  id: string
  label: string
  kind: 'correct' | 'wasteful' | 'harmful'
  feedback: string
}

export interface IncidentEvent {
  atS: number
  title: string
  text: string
  severity: 'P3' | 'P2' | 'P1'
  actions: IncidentAction[]
}

export interface IncidentDef {
  id: string
  name: string
  brief: string
  trafficRps: number
  events: IncidentEvent[]
  durationS: number
  retro: { q: string; options: [string, string, string, string]; answer: 0 | 1 | 2 | 3; explain: string }
  concepts: string[]
}

export const INCIDENTS: IncidentDef[] = [
  {
    id: 'checkout-500s',
    name: 'INCIDENT 01 · CHECKOUT IS BLEEDING',
    brief: 'Friday, 19:42. Checkout error rate climbs from 0.1% to 14% in six minutes. You are incident commander until it is over.',
    trafficRps: 6000,
    durationS: 90,
    concepts: ['postmortem', 'monitoring', 'caching'],
    events: [
      {
        atS: 3,
        title: 'P2 · ERROR RATE CLIMBING',
        text: 'checkout-service 5xx at 14% and rising. Dashboards show DB connection pool at 100%.',
        severity: 'P2',
        actions: [
          { id: 'a1', label: 'Acknowledge, open incident channel, page the DB owner', kind: 'correct', feedback: 'Textbook: declare, communicate, route to the owner. Command established.' },
          { id: 'a2', label: 'Restart all app servers immediately', kind: 'harmful', feedback: 'Blind restarts drop in-flight checkouts AND destroy the evidence you need for diagnosis.' },
          { id: 'a3', label: 'Reply "looking into it" in Slack and keep reading dashboards solo', kind: 'wasteful', feedback: 'Solo heroics are how 15-minute incidents become 3-hour ones.' },
        ],
      },
      {
        atS: 22,
        title: 'P1 · CHECKOUT NEARLY DOWN',
        text: 'Errors hit 38%. Support is being flooded. The DB owner reports: a new release shipped a query doing a full table scan per checkout.',
        severity: 'P1',
        actions: [
          { id: 'b1', label: 'Roll back the release — the bad query shipped 12 minutes before the spike', kind: 'correct', feedback: 'Correlation with the deploy + mechanism = confident mitigation. Rollback first, debug later.' },
          { id: 'b2', label: 'Try to hot-patch the query in production', kind: 'harmful', feedback: 'Editing prod mid-incident under pressure is how data corruption happens. Roll back.' },
          { id: 'b3', label: 'Scale up app servers to absorb the slow queries', kind: 'wasteful', feedback: 'Adding capacity to a full-table-scan just burns money while errors keep climbing.' },
        ],
      },
      {
        atS: 45,
        title: 'P2 · RECOVERY WAVES',
        text: 'Rollout complete. Errors falling: 38% → 9% → 3%. Cache is cold and hammering the DB with misses.',
        severity: 'P2',
        actions: [
          { id: 'c1', label: 'Warm the cache with a controlled traffic replay, keep status page updated', kind: 'correct', feedback: 'Protect recovery from a second spike and keep merchants informed. Command until the end.' },
          { id: 'c2', label: 'Declare victory, close the channel, go to dinner', kind: 'wasteful', feedback: 'Cold-cache stampedes have caused second outages 10 minutes after "resolution" more times than anyone can count.' },
          { id: 'c3', label: 'Disable the cache entirely so it cannot stampede', kind: 'harmful', feedback: 'Now every request hits the DB directly — you just re-created the original outage.' },
        ],
      },
    ],
    retro: {
      q: 'Postmortem: what was the ROOT CAUSE?',
      options: [
        'App servers were undersized for Friday traffic',
        'A release shipped an unindexed full-scan query on the checkout path',
        'The cache was too small',
        'The database owner responded too slowly',
      ],
      answer: 1,
      explain: 'Root cause = the change that introduced the failure mechanism: an unindexed query in the release. Everything else was impact or contributing factor. Blameless postmortems separate mechanism from people.',
    },
  },
  {
    id: 'queue-lag',
    name: 'INCIDENT 02 · ORDERS STUCK IN THE VOID',
    brief: 'Merchants report orders "pending" for 20+ minutes. Kafka consumer lag: 1.2M messages and climbing. Go.',
    trafficRps: 4500,
    durationS: 90,
    concepts: ['kafka', 'postmortem', 'estimation'],
    events: [
      {
        atS: 3,
        title: 'P2 · CONSUMER LAG EXPLODING',
        text: 'Lag graph is a ski jump: 1.2M messages behind, growing 8K/sec. Order events are IN the log, not being processed.',
        severity: 'P2',
        actions: [
          { id: 'a1', label: 'Check consumer group health: are workers alive and assigned?', kind: 'correct', feedback: 'Lag with healthy log = consumption problem. Always check the consumers before the brokers.' },
          { id: 'a2', label: 'Restart Kafka brokers', kind: 'harmful', feedback: 'The brokers are fine — the log is durable and growing. Restarting them adds risk and fixes nothing.' },
          { id: 'a3', label: 'Increase producer rate limits', kind: 'wasteful', feedback: 'Production is not the bottleneck; consumption is. Throttling producers delays orders further.' },
        ],
      },
      {
        atS: 24,
        title: 'P1 · WORKERS POISON-LOOPING',
        text: 'Root cause found: one malformed order payload crashes the consumer on every attempt. The partition is poison-pill loop: process → crash → reprocess.',
        severity: 'P1',
        actions: [
          { id: 'b1', label: 'Route poison messages to a dead-letter queue, redeploy consumers with try/catch + DLQ', kind: 'correct', feedback: 'The canonical poison-pill cure. DLQ isolates the bad payload; the fleet resumes draining 1.2M good orders.' },
          { id: 'b2', label: 'Delete the malformed message from the log', kind: 'harmful', feedback: 'Kafka logs are immutable by design. Mutating the log to fix a consumer bug is fighting your own guarantees.' },
          { id: 'b3', label: 'Bump consumer count 10x and hope', kind: 'wasteful', feedback: 'More consumers on a poison partition = more crashes per second. Fix the pill, then scale.' },
        ],
      },
      {
        atS: 50,
        title: 'P2 · DRAINING, BUT MERCHANTS ANGRY',
        text: 'Lag falling 40K/sec. Merchants want to know if their 20-minute-pending orders went through.',
        severity: 'P2',
        actions: [
          { id: 'c1', label: 'Publish a merchant-facing status note + reconciliation plan for the lag window', kind: 'correct', feedback: 'After mitigation comes communication. Merchants forgive incidents; they do not forgive silence.' },
          { id: 'c2', label: 'Say nothing until lag hits zero', kind: 'wasteful', feedback: 'Every silent hour breeds refund requests and churn rumors.' },
          { id: 'c3', label: 'Manually re-run every pending order through the admin panel', kind: 'harmful', feedback: 'Manual replay of live traffic duplicates orders and corrupts inventory. The system is draining — let it.' },
        ],
      },
    ],
    retro: {
      q: 'What is the DURABLE fix so this never recurs?',
      options: [
        'Add more consumer instances permanently',
        'Schema validation at the producer + DLQ handling with alerting in the consumer',
        'Increase consumer timeout to 10 minutes',
        'Switch from Kafka to RabbitMQ',
      ],
      answer: 1,
      explain: 'Durable fixes live at the boundary: validate at produce (reject poison early), DLQ + alert at consume (isolate what slips through). Scaling and timeouts just resize the blast radius.',
    },
  },
  {
    id: 'dns-outage',
    name: 'INCIDENT 03 · THE INTERNET LOST YOU',
    brief: 'Traffic from Europe is ZERO. US is fine. Monitoring from inside the network shows everything green. Go.',
    trafficRps: 8000,
    durationS: 90,
    concepts: ['chaos', 'monitoring', 'edge'],
    events: [
      {
        atS: 3,
        title: 'P2 · EUROPE VANISHED',
        text: 'EU traffic: 0 rps. US: normal. All internal health checks green. Support: "can\'t reach shop from London".',
        severity: 'P2',
        actions: [
          { id: 'a1', label: 'Test from OUTSIDE your network: dig from an EU vantage point', kind: 'correct', feedback: 'Inside-out monitoring cannot see outside-in failures. External vantage points are your eyes for DNS/edge issues.' },
          { id: 'a2', label: 'Restart the EU app fleet', kind: 'harmful', feedback: 'EU servers are healthy and receiving nothing. Restarting them is theater, not mitigation.' },
          { id: 'a3', label: 'Check the payment provider status page', kind: 'wasteful', feedback: 'Payments are unrelated — EU traffic never even reaches your servers.' },
        ],
      },
      {
        atS: 25,
        title: 'P1 · DNS RESOLUTION FAILING IN EU',
        text: 'dig from London: your domain returns SERVFAIL. Your DNS provider\'s EU PoPs are sick. US resolvers cached the old answers; EU TTLs expired.',
        severity: 'P1',
        actions: [
          { id: 'b1', label: 'Fail traffic over to the secondary DNS provider and drop EU TTLs', kind: 'correct', feedback: 'This is why multi-provider DNS exists. Secondary provider + low TTL = recovery in minutes.' },
          { id: 'b2', label: 'Open an urgent ticket with the DNS provider and wait', kind: 'wasteful', feedback: 'Waiting on a third party while Europe is dark is not a plan — it is a prayer with paperwork.' },
          { id: 'b3', label: 'Move EU traffic to US servers by editing the app config', kind: 'harmful', feedback: 'Users cannot RESOLVE your domain. No server config change fixes a name that will not resolve.' },
        ],
      },
      {
        atS: 52,
        title: 'P2 · EU TRICKLING BACK',
        text: 'Secondary DNS is serving. EU traffic recovering as resolver caches refresh. Some carrier-level resolvers still hold stale answers.',
        severity: 'P2',
        actions: [
          { id: 'c1', label: 'Verify recovery per-carrier, publish status updates, schedule the postmortem', kind: 'correct', feedback: 'Recovery is verified per vantage point, communicated, and studied. Commander\'s job ends with learning secured.' },
          { id: 'c2', label: 'Assume fixed once one London test succeeds', kind: 'wasteful', feedback: 'One vantage point is an anecdote. Carrier resolvers cache independently — verify breadth, not a single data point.' },
          { id: 'c3', label: 'Set DNS TTL to 60 seconds permanently everywhere', kind: 'harmful', feedback: 'Tiny TTLs multiply resolver query load and add latency everywhere, to guard against a rare failure. Proportional response matters.' },
        ],
      },
    ],
    retro: {
      q: 'What is the structural lesson?',
      options: [
        'Internal monitoring must query more often',
        'Monitor from outside your network AND run secondary DNS — your edge is part of your production system',
        'EU users should use US resolvers',
        'DNS providers never fail; this was bad luck',
      ],
      answer: 1,
      explain: 'Two durable truths: you are blind to failures your internal monitoring cannot see, and single-provider DNS is a single point of failure hiding in plain sight.',
    },
  },
]
