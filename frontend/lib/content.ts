export const nav = {
  brand: "Auralis",
  links: [
    { label: "Problem", href: "#problem" },
    { label: "Solution", href: "#solution" },
    { label: "Workflow", href: "#workflow" },
    { label: "Reputation", href: "#reputation" },
    { label: "Demo", href: "#preview" },
  ],
  cta: { label: "Launch app", href: "/app" },
};

export const hero = {
  badge: "Built natively on Portaldot · ink! · POT gas",
  title: ["Gotong royong,", "now governed by", "AI on Portaldot."],
  subtitle:
    "Auralis turns Indonesia's centuries-old rotating savings (Arisan) into a transparent, AI-governed coordination protocol. Multi-agent reasoning evaluates every withdrawal; the chain enforces the verdict.",
  ctaPrimary: { label: "Launch the app", href: "/app" },
  ctaSecondary: { label: "See the workflow", href: "#workflow" },
  stats: [
    { value: "24h", label: "Max approval window" },
    { value: "≥85%", label: "AI confidence → fast-track" },
    { value: "6", label: "ink! contracts" },
    { value: "256", label: "Portaldot shards" },
  ],
};

export const problems = [
  {
    title: "Opaque withdrawals",
    body: "Members lose trust when decisions can't be audited. Disputes corrode the group from inside.",
  },
  {
    title: "No measurable credit",
    body: "Approvals fall back on personal favor — not on a record anyone else can verify.",
  },
  {
    title: "Slow coordination",
    body: "Approvals drift across group chats for days. Urgent cases lose to bureaucracy.",
  },
  {
    title: "Bad actors hop groups",
    body: "A defaulter in one Arisan can quietly re-appear in another. No portable signal warns the next group.",
  },
  {
    title: "No accountability for absentees",
    body: "Missed contributions stay invisible. The free-rider problem compounds until the group dissolves.",
  },
];

export const solution = {
  eyebrow: "Solution",
  title: "Six ink! contracts. One coordinated protocol.",
  body:
    "Auralis splits a single group into composable onchain primitives — each with one job, all auditable, all paid in POT.",
  contracts: [
    {
      name: "GroupRegistry",
      role: "Factory + global directory of Arisan groups.",
      tag: "Coordination",
    },
    {
      name: "ArisanGroup",
      role: "Per-group state: members, schedule, balance, withdrawal requests.",
      tag: "Core",
    },
    {
      name: "VotingEngine",
      role: "Reputation-weighted ballots, deadlines, challenge windows, finalization.",
      tag: "Governance",
    },
    {
      name: "ReputationRegistry",
      role: "Per-account score; cross-group lookups for portable trust.",
      tag: "Identity",
    },
    {
      name: "BadgeNFT",
      role: "Soulbound attestations: Consistent Payer, Trusted Member, Dispute-Free.",
      tag: "Identity",
    },
    {
      name: "Treasury",
      role: "Holds POT, releases only on a finalized APPROVED verdict.",
      tag: "Custody",
    },
  ],
};

export const features = [
  {
    icon: "Sparkles",
    title: "Hybrid AI approval",
    body: "Confidence ≥ 85% unlocks a fast-track path: lighter quorum, 12-hour challenge window. Below 50% auto-rejects with a reasoning trail.",
  },
  {
    icon: "Scale",
    title: "Reputation-weighted voting",
    body: "Vote weight = base × reputation_multiplier × badge_multiplier. Long-term contributors carry proportionally more signal.",
  },
  {
    icon: "Zap",
    title: "Optimistic execution",
    body: "Emergency requests can release POT immediately, subject to a challenge window. Any member can pull the brake.",
  },
  {
    icon: "Network",
    title: "Cross-group reputation",
    body: "Agents query reputation across every Auralis group on Portaldot before a vote. A defaulter doesn't get a clean slate.",
  },
  {
    icon: "ShieldCheck",
    title: "Soulbound badges",
    body: "Non-transferable NFTs attest to behavior: Consistent Payer, Trusted Member, Cross-Group Veteran. Portable across the ecosystem.",
  },
  {
    icon: "FileLock",
    title: "Verifiable reasoning",
    body: "Every AI verdict + reviewer vote stores its reasoning CID on IPFS. Onchain holds the hash — the full trace is auditable forever.",
  },
];

export const workflow = {
  eyebrow: "How it works",
  title: "Six steps from request to release.",
  body:
    "Every step is bounded by time and verified onchain. The AI layer recommends; the contract decides.",
  steps: [
    {
      n: "01",
      title: "Member submits request",
      body: "Withdrawal amount + reason hash committed onchain via ArisanGroup contract.",
    },
    {
      n: "02",
      title: "Requester Agent pre-validates",
      body: "Deposit consistency, cross-group history, reputation, reason plausibility — scored in under 10 seconds.",
    },
    {
      n: "03",
      title: "Confidence routes the path",
      body: "≥85% → fast-track. 50–85% → 24h voting. <50% → auto-reject. Routing happens onchain.",
    },
    {
      n: "04",
      title: "Reviewer Agents vote",
      body: "One agent per member reasons independently against the member's configured policy, then casts a weighted onchain ballot.",
    },
    {
      n: "05",
      title: "VotingEngine tallies",
      body: "Quorum met or deadline reached — the engine finalizes APPROVED or REJECTED. No manual gatekeeper.",
    },
    {
      n: "06",
      title: "Treasury releases POT",
      body: "On APPROVED, the Treasury transfers POT to the requester. Reputation updates. Badges may mint.",
    },
  ],
};

export const agents = {
  eyebrow: "Agent topology",
  title: "Two tiers of reasoning. One source of truth.",
  body:
    "Auralis runs a Requester Agent for pre-validation and N Reviewer Agents — one per member, each with a personal policy.",
  tiers: [
    {
      tag: "Tier 1",
      name: "Requester Agent",
      mission: "Pre-validation in under 10 seconds.",
      checks: [
        { label: "Deposit consistency", weight: "25%" },
        { label: "Reputation score", weight: "25%" },
        { label: "Cross-group participation", weight: "15%" },
        { label: "Reason plausibility (LLM)", weight: "15%" },
        { label: "Emergency flag verification", weight: "10%" },
        { label: "Outstanding cross-group debts", weight: "10%" },
      ],
    },
    {
      tag: "Tier 2",
      name: "Reviewer Agents",
      mission: "Independent per-member reasoning + onchain vote.",
      checks: [
        { label: "Reads the request + Tier 1 verdict (as input, not gospel)" },
        { label: "Pulls requester's history, badges, prior votes" },
        { label: "Applies the member's policy: Conservative · Trust-default · Strict-emergency" },
        { label: "Submits Vote(approve, weight, reasoning_cid) onchain" },
        { label: "Reasoning text on IPFS — hash + summary on Portaldot" },
      ],
    },
  ],
};

export const reputation = {
  eyebrow: "Identity",
  title: "Portable reputation, soulbound attestations.",
  body:
    "Reputation is computed from deposit consistency, voting participation, vote quality, group age, badges and cross-group penalties. Score range 0–1000.",
  tiers: [
    { name: "Bronze", range: "0 – 250", accent: "from-amber-700/70 to-amber-500/30" },
    { name: "Silver", range: "251 – 500", accent: "from-zinc-400/60 to-zinc-200/20" },
    { name: "Gold", range: "501 – 750", accent: "from-amber-400/80 to-yellow-200/30" },
    { name: "Platinum", range: "751 – 1000", accent: "from-cyan-200/70 to-violet-200/30" },
  ],
  badges: [
    { name: "Consistent Payer", trigger: "12 on-time deposits in a row", rep: "+50" },
    { name: "Trusted Member", trigger: "≥80% vote agreement over 20 votes", rep: "+75 · 1.2× vote weight" },
    { name: "Group Founder", trigger: "Founded a group with ≥5 active members", rep: "+30" },
    { name: "Dispute-Free", trigger: "6 months with no challenge raised", rep: "+40" },
    { name: "Cross-Group Veteran", trigger: "Active in 3+ groups for 3+ months each", rep: "+60" },
  ],
};

export const preview = {
  eyebrow: "Demo preview",
  title: "Watch a withdrawal pass through the protocol.",
  body:
    "Below is what a member sees when an emergency withdrawal request lands in Arisan Tetangga RT 03. AI verdict on the left; reviewer voting on the right.",
};

export const impact = {
  eyebrow: "Why it matters",
  title: "A 200-million-person primitive, dignified by code.",
  body:
    "Arisan is how Indonesian neighborhoods, families, and offices save together. Auralis preserves the social ritual and removes the failure modes — without asking anyone to learn finance jargon.",
  points: [
    { stat: "200M+", label: "Indonesians culturally familiar with Arisan" },
    { stat: "0 trust assumptions", label: "in AI — final verdict is always the contract" },
    { stat: "100% onchain", label: "deposits, votes, reasoning hashes, payouts" },
    { stat: "Portable", label: "reputation works across every Auralis group" },
  ],
};

export const ctaSection = {
  title: "Ship a transparent Arisan in a weekend.",
  body:
    "The protocol is open source. The contracts are MIT. The agents are Python. POT pays the gas. Clone the repo and run the local demo.",
  primary: { label: "Open the app", href: "/app" },
  secondary: { label: "GitHub repo", href: "https://github.com/EzraNahumury/auralis" },
};

export const footer = {
  brand: "Auralis",
  tagline: "Gotong royong, on the chain.",
  columns: [
    {
      title: "Protocol",
      links: [
        { label: "Solution", href: "#solution" },
        { label: "Workflow", href: "#workflow" },
        { label: "Reputation", href: "#reputation" },
      ],
    },
    {
      title: "Build",
      links: [
        { label: "GitHub", href: "https://github.com/EzraNahumury/auralis" },
        { label: "Portaldot docs", href: "https://portaldot-dev.readthedocs.io/" },
        { label: "ink!", href: "https://use.ink/" },
      ],
    },
    {
      title: "Hackathon",
      links: [
        { label: "Portaldot Mini S1", href: "https://portaldot-dev.readthedocs.io/" },
        { label: "Discord", href: "https://discord.gg/portaldot" },
      ],
    },
  ],
};
