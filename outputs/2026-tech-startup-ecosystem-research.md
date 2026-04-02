# 2026 Tech Startup Ecosystem: Comprehensive Research Report
## For build.up — Tech Startup Founder Guidance Platform

**Date:** 2026-03-31
**Purpose:** Define the tech startup roadmap, stage-by-stage tools, and ecosystem context for build.up's expansion from small business/self-employed guidance to tech startup founder support.

---

## Table of Contents

1. [Tech Startup Stack & Tools 2026](#1-tech-startup-stack--tools-2026)
2. [AI Startup Specific Roadmap](#2-ai-startup-specific-roadmap-2026)
3. [SaaS/B2B Startup Roadmap](#3-saasb2b-startup-roadmap)
4. [Developer Tools / Infra Startup Roadmap](#4-developer-tools--infra-startup-roadmap)
5. [Fintech Startup Considerations](#5-fintech-startup-considerations)
6. [Korean Startup Ecosystem 2026](#6-korean-startup-ecosystem-2026)
7. [Stage-by-Stage AI Tool Recommendations](#7-stage-by-stage-ai-tool-recommendations)
8. [build.up Integration Recommendations](#8-buildup-integration-recommendations)

---

## 1. Tech Startup Stack & Tools 2026

### 1.1 Design & Prototyping

| Tool | Best For | Pricing | Korean Support | URL |
|------|----------|---------|----------------|-----|
| **Figma** | Full design system, team collaboration, handoff to dev | Free (2 editors), Pro $15/editor/mo, Org $45/editor/mo. Startup discount: 50% off first year via Figma for Startups | Full Korean UI | https://figma.com |
| **Framer** | Marketing/landing pages with animation, no-code publish | Free tier, Mini $5/mo, Basic $15/mo, Pro $30/mo | Partial Korean | https://framer.com |
| **v0 by Vercel** | AI-generated React/Next.js UI components from text prompts | Free tier (10 generations/day), Premium $20/mo (unlimited) | English only, outputs universal code | https://v0.dev |
| **Bolt.new by StackBlitz** | Full-stack prototyping in browser, instant deploy | Free tier, Pro $20/mo | English only | https://bolt.new |
| **Galileo AI** | AI-generated high-fidelity UI designs from text descriptions | Waitlist/invite, Pro ~$40/mo | English only | https://galileo.ai |
| **Uizard** | Rapid wireframing and mockup from sketches/text, non-designer friendly | Free (2 projects), Pro $19/mo, Business $49/mo | English only | https://uizard.io |

**When to use each:**
- **Figma**: Always your design system of record. Use for component libraries, design tokens, developer handoff, design reviews. Non-negotiable for any team > 1 designer.
- **Framer**: When you need a polished marketing site FAST without engineering involvement. Great for landing page A/B testing. Not for app UI.
- **v0**: When a developer needs a starting point for a React component. Generates shadcn/ui + Tailwind code. Ideal for MVP UI scaffolding -- generate, then customize in code.
- **Bolt.new**: When you want to prototype a full working app (frontend + backend) without local setup. Good for hackathons, quick demos, investor prototypes.
- **Galileo AI / Uizard**: When non-designers (founders, PMs) need to create UI mockups quickly to communicate ideas. Not production-grade but excellent for ideation.

**2026 Design Trend Notes:**
- Figma's Dev Mode (launched 2024, matured 2025-26) has become the standard for design-to-code handoff, reducing the gap between design and implementation.
- AI-assisted design plugins within Figma (Magician, Automator) are now mainstream -- auto-generating variants, resizing for responsive, and suggesting accessibility fixes.
- The "design-in-code" movement (v0, Shadcn, Radix) is increasingly popular: designers create in Figma, developers implement using pre-built accessible component libraries, reducing pixel-pushing.

---

### 1.2 Frontend Development

| Technology | Category | 2026 Status | Best For | Market Share (approx.) |
|------------|----------|-------------|----------|----------------------|
| **Next.js 15** | Framework | Dominant React meta-framework | Full-stack React apps, SSR/SSG/ISR, API routes | ~38% of React projects |
| **Remix (now React Router v7)** | Framework | Merged with React Router in late 2024 | Data-heavy apps, progressive enhancement | ~8% of React projects |
| **Astro 5** | Framework | Growing fast, content-first | Marketing sites, blogs, docs, content-heavy sites | ~12% of new projects |
| **React 19** | Library | Still dominant | General SPA/SSR, massive ecosystem | ~62% of frontend |
| **Vue 3** | Library | Strong in Asia/Europe | Approachable DX, gradual adoption | ~18% of frontend |
| **Svelte 5 (Runes)** | Library | Niche but loved, gaining | Performance-critical, small bundles, simple DX | ~5% of frontend |
| **SolidJS** | Library | Niche, React alternative | Maximum performance, familiar JSX syntax | ~2% |
| **Tailwind CSS v4** | Styling | De facto standard | Utility-first CSS, rapid prototyping | ~65% of new projects |
| **shadcn/ui** | Components | Standard React component library | Accessible, customizable, Tailwind-based | Most popular React component approach |

**Hosting & Deployment:**

| Platform | Best For | Pricing | Korean CDN | URL |
|----------|----------|---------|------------|-----|
| **Vercel** | Next.js apps (first-class support), edge functions | Hobby free, Pro $20/dev/mo, Enterprise custom. Startup credits available | Seoul edge node | https://vercel.com |
| **Netlify** | JAMstack sites, simpler apps, forms | Free tier, Pro $19/member/mo | Asia CDN | https://netlify.com |
| **Cloudflare Pages** | Static sites + Workers, maximum performance globally | Free tier (unlimited bandwidth), Workers $5/mo for paid | Seoul PoP | https://pages.cloudflare.com |
| **AWS Amplify** | AWS-native frontend hosting + backend | Free tier, then pay-as-use (~$0.15/GB) | ap-northeast-2 (Seoul) | https://aws.amazon.com/amplify |

**Recommendation for Korean tech startups:**
- **Default stack**: Next.js 15 + React 19 + Tailwind CSS v4 + shadcn/ui + Vercel
- **Why**: Largest talent pool in Korea, best DX, fastest time-to-market, excellent docs, strong community (Korean Next.js meetup 5,000+ members)
- **Alternative for content sites**: Astro 5 (faster, cheaper hosting, better SEO out-of-box)
- **Alternative for max performance**: SvelteKit + Svelte 5 (smaller bundle, but smaller talent pool)

---

### 1.3 Backend & Infrastructure

| Technology | Category | Best For | Pricing (Startup) | URL |
|------------|----------|----------|-------------------|-----|
| **Supabase** | BaaS (Postgres) | Full-stack MVP, real-time, auth, storage, edge functions | Free tier (500MB DB, 1GB storage), Pro $25/mo, startup credits via YC deal | https://supabase.com |
| **Firebase** | BaaS (NoSQL) | Mobile-first apps, real-time sync, Google ecosystem | Spark free, Blaze pay-as-go (~$25/mo for small apps) | https://firebase.google.com |
| **PlanetScale** | Managed MySQL | MySQL-dependent apps, branching workflow | Hobby free (deprecated early 2024, now Scaler $39/mo), enterprise usage. **Note: PlanetScale discontinued free tier in 2024** | https://planetscale.com |
| **Neon** | Serverless Postgres | Serverless Postgres with branching, cold-start optimized | Free tier (0.5GB), Launch $19/mo, Scale $69/mo | https://neon.tech |
| **Turso** | Edge SQLite (libSQL) | Edge-first apps, embedded databases, multi-region reads | Free (500 DBs, 9GB), Scaler $29/mo | https://turso.tech |
| **Upstash** | Serverless Redis + Kafka | Rate limiting, caching, queues, serverless-native | Free tier, Pay-as-go $0.2/100K commands | https://upstash.com |

**Cloud & Compute:**

| Platform | Best For | Startup Program | Korean Region | URL |
|----------|----------|-----------------|---------------|-----|
| **AWS** | Enterprise, complex infra | Activate: up to $100K credits (via accelerator) | Seoul (ap-northeast-2) | https://aws.amazon.com |
| **GCP** | AI/ML, BigQuery, Vertex AI | Startup program: up to $200K credits (2 years) | Seoul (asia-northeast3) | https://cloud.google.com |
| **Azure** | Enterprise, MS ecosystem | Founders Hub: up to $150K credits + free OpenAI access | Korea Central (Seoul) | https://azure.microsoft.com |
| **Vercel** | Frontend + edge + serverless | Apply for startup credits | Seoul edge | https://vercel.com |
| **Railway** | Simple deployments, Heroku alternative | Hobby $5/mo, Pro $20/mo, good free trial | US/EU only (no Seoul) | https://railway.app |
| **Fly.io** | Edge containers, global distribution | Free allowances, pay-as-go ~$5-15/mo small apps | Tokyo (nearest to Seoul) | https://fly.io |
| **Render** | Simple PaaS, Heroku replacement | Free tier for static, $7/mo for services | US/EU (Oregon/Frankfurt) | https://render.com |

**Serverless vs Containers in 2026:**

| Aspect | Serverless (Lambda, Vercel Functions, Cloudflare Workers) | Containers (Docker, Fly.io, Railway, ECS) |
|--------|----------------------------------------------------------|------------------------------------------|
| **Best for** | Event-driven, API routes, cron jobs, variable traffic | Long-running processes, WebSocket, stateful services |
| **2026 trend** | Workers/Edge Functions gaining (Cloudflare Workers, Vercel Edge) | Lightweight containers (Fly.io) winning over K8s for startups |
| **Startup recommendation** | Start serverless, move to containers only when you hit cold-start or duration limits | Only if you need persistent connections, GPU, or >5min processes |
| **Korean consideration** | Vercel/Cloudflare have Seoul PoPs for edge functions | AWS ECS/Fargate in Seoul for container workloads |
| **Cost at scale** | Can get expensive with high invocations | More predictable, better for sustained high traffic |

**2026 Infrastructure Key Trend**: The "Serverless Postgres + Edge Functions" pattern (Supabase/Neon + Vercel/Cloudflare Workers) has become the default starting point for tech startups. Kubernetes is increasingly hidden behind PaaS layers; very few early-stage startups manage K8s directly anymore.

---

### 1.4 AI/ML Tools for Startups

#### LLM APIs

| Provider | Flagship Model (2026) | Strength | Pricing (Input/Output per 1M tokens) | Korean Language Quality | URL |
|----------|-----------------------|----------|--------------------------------------|------------------------|-----|
| **Anthropic (Claude)** | Claude Opus 4 / Sonnet 4 | Reasoning, long context (1M tokens), safety, coding | Sonnet: $3/$15, Opus: $15/$75, Haiku: $0.25/$1.25 | Excellent (top-tier Korean) | https://anthropic.com |
| **OpenAI** | GPT-5 / o3 | Broad capabilities, ecosystem, brand recognition | GPT-4.1: $2/$8, o3: $10/$40, GPT-4.1 mini: $0.4/$1.6 | Excellent | https://openai.com |
| **Google (Gemini)** | Gemini 2.5 Pro/Flash | Multimodal (native), Google integration, long context | Pro: $1.25-$10/$2.50-$10, Flash: $0.15/$0.60 | Very good | https://ai.google.dev |
| **Meta (Llama)** | Llama 4 (Maverick/Scout) | Open-source, self-hosted, fine-tunable | Free (self-host), or via providers ~$0.20-$0.80/M tokens | Good (improved in v4) | https://llama.meta.com |
| **Mistral** | Mistral Large 2 / Codestral | European, open-weight, competitive pricing | Large: $2/$6, Small: $0.2/$0.6 | Good | https://mistral.ai |
| **DeepSeek** | DeepSeek-V3 / R1 | Extremely cheap, strong reasoning (R1), Chinese origin | V3: $0.27/$1.10, R1: $0.55/$2.19 | Good (CJK strength) | https://deepseek.com |

**Recommendation for Korean startups:**
- **Primary**: Claude (Anthropic) -- best Korean language quality, strongest reasoning, best for complex business logic. Claude Sonnet 4 offers best price/performance ratio.
- **Secondary**: OpenAI GPT-4.1 -- broadest ecosystem, most third-party integrations.
- **Budget option**: DeepSeek V3 or Gemini Flash -- 10-50x cheaper for simple tasks (classification, extraction, summarization).
- **On-premise/privacy**: Llama 4 self-hosted on Korean cloud (NCP, KT Cloud, or AWS Seoul).

#### AI Coding Assistants

| Tool | Type | Pricing | Best For | URL |
|------|------|---------|----------|-----|
| **Claude Code** | CLI agent (agentic coding) | Included with Claude Pro ($20/mo) or Max ($100-200/mo), also API-based | Complex multi-file refactoring, architecture decisions, full project understanding | https://claude.ai/code |
| **Cursor** | AI-native IDE (VSCode fork) | Hobby free (2K completions), Pro $20/mo (unlimited), Business $40/mo | Daily coding with AI, inline edits, chat, codebase-aware completions | https://cursor.com |
| **GitHub Copilot** | IDE extension | Individual $10/mo, Business $19/user/mo, Enterprise $39/user/mo | Quick completions, broad language support, GitHub integration | https://github.com/features/copilot |
| **Windsurf (Codeium)** | AI-native IDE | Free tier (generous), Pro $15/mo | Budget-friendly Cursor alternative, Cascade agent flows | https://windsurf.com |
| **Cline** | VSCode extension (open-source) | Free (bring your own API key) | Open-source, customizable, supports any LLM provider | https://github.com/cline/cline |
| **Aider** | CLI tool (open-source) | Free (bring your own API key) | Git-native AI pair programming, good for terminal-first developers | https://aider.chat |

**2026 AI Coding Landscape:**
- The market has bifurcated: **agentic coding** (Claude Code, Cursor Composer, Windsurf Cascade) where AI autonomously makes multi-file changes vs **copilot-style** (GitHub Copilot, inline completions) for line-by-line assistance.
- Most productive setup in 2026: **Claude Code for architecture/complex tasks + Cursor for daily coding** (they complement rather than compete).
- Korean developer adoption: Cursor has become dominant among Korean startup developers (estimated 60%+ adoption in Gangnam/Pangyo startup scene as of early 2026).

#### AI Frameworks & SDKs

| Framework | Best For | Pricing | URL |
|-----------|----------|---------|-----|
| **Vercel AI SDK** | Streaming AI UIs in Next.js/React, multi-provider | Free, open-source | https://sdk.vercel.ai |
| **LangChain** | Complex chains, agents, RAG pipelines | Free (open-source), LangSmith $39/mo for tracing | https://langchain.com |
| **LlamaIndex** | Data indexing, RAG, structured data extraction | Free (open-source), LlamaCloud $299+/mo | https://llamaindex.ai |
| **Anthropic SDK** | Direct Claude API integration | Free SDK, pay per API usage | https://docs.anthropic.com |
| **Mastra** | TypeScript AI agent framework | Free, open-source | https://mastra.ai |
| **CrewAI** | Multi-agent orchestration | Free (open-source), Enterprise cloud TBD | https://crewai.com |

**Recommendation:**
- **Default for web apps**: Vercel AI SDK -- best DX for streaming UI, works with any LLM provider, perfect Next.js integration.
- **For complex RAG/agent systems**: LangChain (flexibility) or LlamaIndex (data-focused).
- **For agent workflows**: Mastra (TypeScript-native, good for Node.js teams) or CrewAI (Python, more mature agent patterns).

#### Vector Databases

| Database | Best For | Pricing | Performance | URL |
|----------|----------|---------|-------------|-----|
| **Supabase pgvector** | Teams already on Supabase, simple RAG | Included with Supabase plan | Good for < 1M vectors | https://supabase.com/vector |
| **Pinecone** | Production vector search, managed service | Free (100K vectors), Standard $70/mo | Excellent, serverless scaling | https://pinecone.io |
| **Weaviate** | Hybrid search (vector + keyword), open-source option | Free (open-source), Serverless from $25/mo | Excellent, flexible | https://weaviate.io |
| **Qdrant** | High performance, open-source, Rust-based | Free (open-source), Cloud from $25/mo | Top-tier performance | https://qdrant.tech |
| **ChromaDB** | Quick prototyping, local development | Free (open-source, embeddable) | Good for dev/small-scale | https://trychroma.com |
| **Turbopuffer** | Serverless, S3-backed, cost-efficient at scale | Pay-per-query, very cheap at scale | Good, eventual consistency | https://turbopuffer.com |

**Recommendation for startups:**
- **Start**: Supabase pgvector (if already using Supabase) or ChromaDB (for prototyping)
- **Scale**: Pinecone (managed, zero-ops) or Qdrant (self-hosted for cost control)
- **Budget optimization**: Turbopuffer for large-scale, infrequent-access use cases

#### Fine-tuning Platforms

| Platform | Best For | URL |
|----------|----------|-----|
| **OpenAI Fine-tuning** | GPT-4o-mini/GPT-4.1-mini fine-tuning, easiest workflow | https://platform.openai.com |
| **Anyscale / Together AI** | Open-source model fine-tuning (Llama, Mistral), cost-effective | https://together.ai |
| **Hugging Face** | Training, hosting, model hub, community models | https://huggingface.co |
| **Modal** | Serverless GPU compute, custom training jobs | https://modal.com |
| **Replicate** | Run and fine-tune open-source models via API | https://replicate.com |
| **Axolotl** | Open-source fine-tuning toolkit (LoRA, QLoRA) | https://github.com/OpenAccess-AI-Collective/axolotl |

---

### 1.5 DevOps & Deployment

| Tool | Category | Best For | Pricing | URL |
|------|----------|----------|---------|-----|
| **GitHub Actions** | CI/CD | Default for most teams, deeply integrated with GitHub | 2,000 min/mo free, then $0.008/min | https://github.com/features/actions |
| **CircleCI** | CI/CD | Complex pipelines, parallelism | Free (6K credits/mo), Performance $15+/mo | https://circleci.com |
| **Sentry** | Error tracking | Error monitoring, performance, session replay | Free (5K events), Team $26/mo, Business $80/mo. Startup discount available | https://sentry.io |
| **Datadog** | Full observability | Metrics, logs, APM, infrastructure monitoring (enterprise) | Free (5 hosts), Pro $15/host/mo | https://datadoghq.com |
| **Axiom** | Log management | Serverless-friendly, generous free tier, modern log analytics | Free (500GB ingest/mo), Team $25/mo | https://axiom.co |
| **BetterStack (formerly Logtail)** | Uptime + logs | Uptime monitoring + log management combined | Free tier, Starter $24/mo | https://betterstack.com |
| **PostHog** | Product analytics + session replay + feature flags | All-in-one product OS | Free (1M events/mo), $0.00031/event after. Self-hosted free | https://posthog.com |
| **Docker** | Containerization | Standard container runtime | Free (personal), Pro $9/mo | https://docker.com |
| **Kamal (by 37signals)** | Deployment | Simple Docker deployments to any VPS, Heroku alternative | Free, open-source | https://kamal-deploy.org |
| **SST (Serverless Stack)** | IaC for serverless | AWS serverless infrastructure as code (TypeScript) | Free, open-source | https://sst.dev |

**2026 DevOps Recommendations for Small Teams:**
- **CI/CD**: GitHub Actions (unless you have a reason not to). It's free for most startup usage.
- **Error tracking**: Sentry (de facto standard). Apply for their startup program (90% discount).
- **Logging**: Axiom (best free tier) or BetterStack (uptime + logs combo).
- **Monitoring**: PostHog for product analytics + Sentry for errors is the 2026 startup combo.
- **Deployment without K8s**: Kamal (for VPS), Fly.io (for containers), or Vercel (for Next.js). Kubernetes is overkill for teams under 10 engineers.

---

### 1.6 Payments & Billing

#### Global

| Platform | Best For | Pricing | Merchant of Record? | URL |
|----------|----------|---------|---------------------|-----|
| **Stripe** | Global SaaS, flexible API, subscriptions | 2.9% + $0.30 per transaction (lower for volume) | No (you handle tax) | https://stripe.com |
| **Paddle** | SaaS with global tax compliance | 5% + $0.50 per transaction | Yes (handles tax, VAT globally) | https://paddle.com |
| **Lemon Squeezy** | Digital products, indie/small SaaS | 5% + $0.50 per transaction | Yes (handles global tax) | https://lemonsqueezy.com |

#### Korean Payment Processors

| Platform | Best For | Pricing | Key Feature | URL |
|----------|----------|---------|-------------|-----|
| **Toss Payments (토스페이먼츠)** | Korean domestic payments, most popular among startups | 2.0~3.5% (volume-based) | Best developer API in Korea, fast settlement (D+1 available), Toss Pay integration | https://tosspayments.com |
| **PortOne (포트원, 구 아임포트)** | Multi-PG aggregation, one API for all Korean PGs | Free SDK, pay PG fees only (2.5~3.5%) | Single API to connect Toss/KG이니시스/나이스 etc., fastest integration | https://portone.io |
| **NHN KCP** | Enterprise, established businesses | 2.5~3.5% | Large merchant network, mature platform | https://kcp.co.kr |
| **KG이니시스** | Largest PG in Korea by volume | 2.5~3.5% | Most widely accepted, all payment methods | https://inicis.com |
| **Bootpay (부트페이)** | Simple integration, startup-friendly | Free SDK, PG fees only | React Native / Flutter SDK, easy mobile integration | https://bootpay.co.kr |

**Recommendation for Korean tech startups:**
- **Domestic focus**: Toss Payments (best DX, startup-friendly, fast settlement) or PortOne (if you want PG flexibility)
- **Global SaaS**: Stripe (if selling globally) + Toss Payments (for Korean customers). Note: Stripe has limited Korean domestic payment method support.
- **Digital products sold globally**: Paddle or Lemon Squeezy (they handle international tax compliance as MoR)
- **Mobile apps**: Bootpay (excellent mobile SDK) or PortOne (React Native/Flutter support)

---

### 1.7 Analytics

| Tool | Category | Pricing | Best For | Korean Support | URL |
|------|----------|---------|----------|----------------|-----|
| **PostHog** | Product analytics, session replay, feature flags, A/B testing | Free (1M events/mo), then $0.00031/event. Self-hosted free | All-in-one product analytics for startups | English | https://posthog.com |
| **Mixpanel** | Event analytics, funnels, cohorts | Free (20M events/mo), Growth $28/mo | Deep behavioral analytics, mobile-strong | English | https://mixpanel.com |
| **Amplitude** | Product analytics, experimentation | Free (50K MTUs), Plus $49/mo | Enterprise product analytics, advanced ML features | English | https://amplitude.com |
| **Plausible** | Privacy-first web analytics | Cloud $9/mo (10K pageviews), self-host free | GA4 alternative, GDPR/CCPA compliant, lightweight | English | https://plausible.io |
| **Simple Analytics** | Privacy-first web analytics | Starter $9/mo, Business $49/mo | No cookies, EU-hosted, simple | English | https://simpleanalytics.com |
| **Google Analytics 4** | Web analytics (free) | Free | Baseline web analytics, Google Ads integration | Korean UI | https://analytics.google.com |

**2026 Analytics Trend:**
- PostHog has become the "default" for tech startups: free for most early-stage usage, replaces 4-5 separate tools (analytics + session replay + feature flags + A/B testing + surveys).
- GA4 remains for SEO/marketing teams but is increasingly supplemented by privacy-first alternatives.
- Mixpanel pivoted to a very generous free tier (20M events) in 2024, making it viable for startups again.

---

### 1.8 Communication & Project Management

| Tool | Category | Pricing | Best For | URL |
|------|----------|---------|----------|-----|
| **Linear** | Project management | Free (250 issues), Standard $8/user/mo, Plus $14/user/mo, startup discount 50% Y1 | Engineering-first project management, fast, opinionated | https://linear.app |
| **Jira** | Project management | Free (10 users), Standard $8.15/user/mo | Enterprise, complex workflows, large teams | https://atlassian.com/jira |
| **Notion** | Wiki + lightweight PM | Free (personal), Plus $10/user/mo, Business $18/user/mo. Startup credits available | Documentation, knowledge base, light project tracking | https://notion.so |
| **Slack** | Team communication | Free, Pro $8.75/user/mo, Business+ $15/user/mo | Default startup communication, rich integrations | https://slack.com |
| **Discord** | Community + team chat | Free, Nitro $9.99/mo | Developer communities, open-source projects, casual teams | https://discord.com |
| **FigJam** | Collaborative whiteboard | Included with Figma | Brainstorming, retrospectives, workshops | https://figma.com/figjam |
| **GitHub Issues + Projects** | Lightweight PM | Free with GitHub | Small teams that live in GitHub | https://github.com |

**2026 PM Recommendation for startups:**
- **< 5 engineers**: GitHub Issues + Projects (free, already where your code is) or Linear free tier
- **5-20 engineers**: Linear (fast, loved by developers, great keyboard shortcuts)
- **20+ engineers**: Linear or Jira (Jira only if you need enterprise compliance)
- **Documentation**: Notion (universal) or dedicated docs (Mintlify for public docs)
- **Communication**: Slack (startup standard) -- Korean startups sometimes use KakaoWork but Slack dominates in tech companies

---

## 2. AI Startup Specific Roadmap (2026)

### 2.1 The 6 Stages of Building an AI Startup

#### Stage 1: Problem Validation (Weeks 1-4)

**Goal:** Confirm that a real, painful, frequent problem exists that AI can uniquely solve.

**Key Activities:**
1. **Problem interviews** (30+ conversations with target users)
   - Do NOT mention AI. Ask about pain, workflow, current solutions.
   - Use the "Mom Test" framework: ask about their behavior, not opinions.
2. **Existing solution audit**
   - What do people use today? (Excel, manual process, competitor product?)
   - Where does the current solution fail?
3. **AI feasibility check**
   - Does this problem require intelligence/judgment that rules can't handle?
   - Is there training data available (public, purchasable, or generatable)?
   - Can a human expert do this task? (If not, AI likely can't either)
4. **Market sizing (TAM/SAM/SOM)**
   - Bottom-up: # of potential customers x willingness to pay
   - Korean market specifics: KOSIS data, industry reports from NICE평가정보, KDI

**AI Tools for This Stage:**
- Claude/ChatGPT for competitive landscape synthesis
- Perplexity for real-time market research
- Statista / KOSIS (통계청) for market data

**Common Mistakes:**
- Building "AI for AI's sake" -- technology looking for a problem
- Assuming AI quality will improve "later" -- if the core AI doesn't work at 80%+ accuracy now, the product will fail
- Not validating willingness to pay (people love free AI demos but won't pay)

**Deliverables:**
- [ ] Problem hypothesis document
- [ ] 30+ interview summaries
- [ ] Competitive landscape map
- [ ] AI feasibility assessment
- [ ] TAM/SAM/SOM estimate

---

#### Stage 2: Data Strategy (Weeks 2-6, overlapping with Stage 1)

**Goal:** Define where your AI's intelligence will come from and build a data moat strategy.

**Key Activities:**
1. **Data source identification**
   - Public datasets (HuggingFace Datasets, 공공데이터포털)
   - Proprietary data (user-generated, scraped, purchased)
   - Synthetic data (generated by LLMs for training)
2. **Data collection plan**
   - MVP can use 3rd-party APIs (Claude, GPT, Gemini) -- no custom model needed
   - Plan for how user interactions create a data flywheel
3. **Privacy & compliance**
   - Korean PIPA (개인정보보호법) requirements
   - Data residency: Korean user data may need to stay in Korea
   - AI Act (EU) implications if serving European customers
4. **Labeling strategy**
   - If fine-tuning: who labels data? (internal, crowdsource, AI-assisted)
   - Evaluation datasets: create a "golden set" of 100-500 examples early

**2026 Data Strategy Key Insight:**
- Most AI startups in 2026 do NOT train custom models from scratch. The playbook is:
  1. Start with a frontier API (Claude, GPT) via prompt engineering
  2. Collect user interaction data
  3. Fine-tune an open-source model (Llama 4, Mistral) when you have 10K+ examples
  4. Only build custom models if your use case truly requires it (very rare)

**Deliverables:**
- [ ] Data inventory document
- [ ] Data collection/pipeline architecture
- [ ] Privacy compliance checklist (PIPA)
- [ ] Initial evaluation dataset (golden set)

---

#### Stage 3: MVP with AI (Weeks 4-12)

**Goal:** Build the minimum viable product that demonstrates AI value to early users.

**Key Activities:**
1. **Architecture decision**
   - API-first (Claude/OpenAI) vs self-hosted (Llama/Mistral)
   - Recommended for MVP: Always start with API (faster, cheaper to build, better quality)
2. **Prompt engineering**
   - System prompts, few-shot examples, chain-of-thought
   - Use structured outputs (JSON mode) for reliable parsing
   - Version control your prompts (treat as code)
3. **RAG pipeline** (if knowledge-intensive)
   - Document ingestion -> chunking -> embedding -> vector store -> retrieval -> generation
   - Start simple: Supabase pgvector + Vercel AI SDK
4. **UX for AI uncertainty**
   - Show confidence levels when appropriate
   - Always provide a way to correct/override AI
   - Stream responses for perceived speed
   - Handle errors gracefully (rate limits, timeouts, hallucinations)
5. **Human-in-the-loop**
   - Design workflows where AI assists but humans decide
   - Collect feedback on every AI output (thumbs up/down minimum)

**Tech Stack for AI MVP (2026 Default):**
```
Frontend: Next.js 15 + React 19 + Tailwind + shadcn/ui
AI Layer:  Vercel AI SDK + Claude Sonnet 4 API
Backend:   Supabase (auth, DB, storage, pgvector)
Deploy:    Vercel
Monitoring: Sentry + PostHog
```

**Timeline:** 4-8 weeks for a focused team of 1-3 developers.

**Deliverables:**
- [ ] Working MVP deployed to production
- [ ] 10+ beta users actively using the product
- [ ] Feedback collection mechanism
- [ ] Error tracking and AI quality monitoring

---

#### Stage 4: Evaluation & Testing (Ongoing from Week 8)

**Goal:** Systematically measure AI quality and improve it.

**Key Activities:**
1. **Evaluation framework**
   - Define metrics: accuracy, relevance, safety, latency, cost
   - Build automated eval pipeline (run on every prompt change)
   - Use LLM-as-judge for scalable evaluation (Claude judges GPT outputs or vice versa)
2. **A/B testing AI features**
   - Compare prompt versions, model versions, RAG configurations
   - Measure business metrics (not just AI metrics): retention, conversion, NPS
3. **Safety & red-teaming**
   - Test for hallucinations, harmful outputs, prompt injection
   - Implement content filtering and output validation
4. **Cost optimization**
   - Route simple queries to cheaper models (Haiku, GPT-4.1 mini)
   - Cache common queries
   - Batch processing for non-real-time tasks

**Tools for AI Evaluation:**
| Tool | Purpose | URL |
|------|---------|-----|
| **Braintrust** | LLM evaluation, logging, prompt playground | https://braintrust.dev |
| **LangSmith** | LLM tracing, evaluation, monitoring | https://smith.langchain.com |
| **Weights & Biases** | ML experiment tracking, model evaluation | https://wandb.ai |
| **Promptfoo** | Open-source LLM evaluation CLI | https://promptfoo.dev |
| **Helicone** | LLM observability, cost tracking | https://helicone.ai |

**Deliverables:**
- [ ] Evaluation dataset (500+ examples with expected outputs)
- [ ] Automated eval pipeline in CI/CD
- [ ] AI quality dashboard (accuracy, latency, cost per query)
- [ ] Safety test suite

---

#### Stage 5: Scaling (Months 3-12)

**Goal:** Grow users while maintaining AI quality and controlling costs.

**Key Activities:**
1. **Infrastructure scaling**
   - Implement caching layer (Upstash Redis for prompt caching)
   - Add queue system for async AI processing (Inngest, Trigger.dev)
   - Consider multi-model routing (simple queries to cheap models)
2. **Cost management**
   - Track cost per user, cost per AI interaction
   - Implement usage limits/tiers in pricing
   - Negotiate volume discounts with LLM providers
3. **Model optimization**
   - Fine-tune smaller models to replace expensive API calls
   - Distillation: use large model outputs to train smaller models
   - Prompt optimization: shorter prompts = lower cost + lower latency
4. **Team scaling**
   - First AI hire should be an ML engineer (not a data scientist)
   - Product manager with AI experience is critical
5. **Go-to-market**
   - See Section 3 (SaaS) or Section 4 (DevTools) for GTM playbooks

**Deliverables:**
- [ ] Cost per user < 10% of revenue per user
- [ ] P99 latency < 3 seconds for AI features
- [ ] Model routing/caching reducing costs by 40%+
- [ ] Scalable async processing for batch operations

---

#### Stage 6: Moat Building (Month 6+)

**Goal:** Create sustainable competitive advantages that compound over time.

**AI Startup Moat Types (2026):**

| Moat Type | Description | Example | Difficulty |
|-----------|-------------|---------|------------|
| **Data flywheel** | User interactions improve the model, which attracts more users | Every correction a user makes improves suggestions | High value, Medium difficulty |
| **Proprietary dataset** | Unique data no one else has | Industry-specific training data collected from users | High value, High difficulty |
| **Workflow integration** | So embedded in user workflow they can't switch | Replacing an entire manual process end-to-end | Medium value, Medium difficulty |
| **Fine-tuned models** | Custom models trained on proprietary data | Domain-specific model that outperforms general LLMs | Medium value, High difficulty |
| **Network effects** | More users = more value for each user | Marketplace, community features | High value, Very high difficulty |
| **Speed of execution** | Ship faster than competition | Not a moat, but a bridge until you build one | Temporary |

**YC / a16z Advice for AI Startups (2026 Synthesis):**
- "The model layer is commoditizing. Your moat is NOT the model -- it's the full-stack product experience." (a16z)
- "Vertical AI apps that own the workflow beat horizontal AI tools." (YC)
- "Focus on the last mile: data cleaning, edge cases, integration, and UX." (YC)
- "The best AI startups have AI that gets better with usage -- build the feedback loop from day 1." (a16z)
- "Don't compete with foundation model companies. Build on top of them." (YC)
- "AI startups should charge from day 1. If users won't pay, the problem isn't painful enough." (YC)

---

### 2.2 AI Startup Common Mistakes (2026)

| Mistake | Why It Happens | How to Avoid |
|---------|---------------|--------------|
| **"AI wrapper" with no moat** | Easy to build, but easy to replicate | Build data flywheel, own the workflow, not just the API call |
| **Demoing vaporware** | AI demos are easy; production is hard | Ship to real users within 4 weeks, not 4 months |
| **Ignoring evaluation** | Hard to measure AI quality systematically | Build eval pipeline before scaling, not after |
| **Over-engineering infrastructure** | Engineers love building infra | Use managed services (Supabase, Vercel). Build product, not infra |
| **Training custom models too early** | Feels "more technical" and "defensible" | API-first until you have 10K+ labeled examples AND a clear accuracy gap |
| **Ignoring cost economics** | AI is expensive; free tiers hide the cost | Model cost per user from day 1. Ensure unit economics work at scale |
| **Not considering Korean language** | Testing in English, deploying in Korean | Test Korean quality separately. Some models have significantly different quality in Korean |
| **Hallucination denial** | "Our model doesn't hallucinate" | It does. Build guardrails, validation, and human-in-the-loop |

---

## 3. SaaS/B2B Startup Roadmap

### 3.1 B2B SaaS Playbook (2026)

#### Phase 1: Find Product-Market Fit (Months 0-6)

**1. Identify ICP (Ideal Customer Profile)**
- Company size (SMB, Mid-market, Enterprise)
- Industry vertical
- Job title of buyer AND user (often different people)
- Current solution (what are they replacing?)

**2. Build and Price the MVP**

| Approach | When | Example |
|----------|------|---------|
| **Concierge MVP** | When you're not sure what to build | Manually do the task for 5 customers, then automate |
| **Wizard of Oz** | When AI is part of the product | Human does the "AI" work behind the scenes initially |
| **Single-feature MVP** | When you know the #1 pain point | Build one thing extremely well, nothing else |

**3. Pricing Strategy (2026 SaaS)**

| Model | Best For | Example |
|-------|----------|---------|
| **Usage-based** | AI products, API products, variable consumption | $X per AI query, per document processed |
| **Seat-based** | Collaboration tools, workflow tools | $X/user/month |
| **Hybrid** | Most SaaS in 2026 | Base seat price + usage overage |
| **Outcome-based** | High-value AI products | Charge based on results (revenue generated, time saved) |

**2026 Pricing Trend:** Pure seat-based pricing is declining. AI costs make usage-based or hybrid pricing necessary. Successful SaaS companies in 2026 charge based on **value delivered** (outcomes) rather than **access** (seats).

**Pricing Benchmarks (Korean B2B SaaS):**
- SMB tier: 월 3만~10만원/user
- Mid-market: 월 10만~50만원/user
- Enterprise: 연 1,000만~1억원+ (custom pricing)
- Note: Korean B2B willingness-to-pay is generally 40-60% of US equivalent

#### Phase 2: Get First 100 Customers (Months 3-12)

**Channels that work for early B2B SaaS in Korea:**

| Channel | Effort | Cost | Best For |
|---------|--------|------|----------|
| **Founder-led sales** | High | Low ($) | Enterprise, complex products |
| **Product Hunt / Hacker News launch** | Medium | Free | Developer tools, global audience |
| **LinkedIn outbound** | Medium | Low | B2B decision-makers |
| **Korean community posting** (Disquiet, 글래스노드, GeekNews) | Low | Free | Korean tech audience |
| **Content/SEO** | High (slow) | Medium | Long-term inbound |
| **Partnerships** | High | Varies | Distribution through existing platforms |
| **Korean accelerator demo days** | Medium | Free (if accepted) | Investor + customer acquisition |

**First 100 Customer Tactics:**
1. **Do things that don't scale**: Manually onboard every customer. Call them. Watch them use the product.
2. **Build in public**: Tweet/post your journey (especially effective on X/Twitter and Disquiet in Korea)
3. **Offer annual discount**: 2 months free for annual commitment (improves cash flow, reduces churn)
4. **Design partnerships**: Offer free/discounted access to 5-10 "design partners" who commit to weekly feedback
5. **Referral incentive**: "Refer a company, get 1 month free" -- B2B referrals are the highest-converting channel

### 3.2 SaaS Metrics That Matter (2026)

| Metric | Healthy Range (Early) | Formula | Why It Matters |
|--------|----------------------|---------|----------------|
| **MRR** (Monthly Recurring Revenue) | Growing 15-20% MoM (pre-PMF) | Sum of all monthly subscriptions | Core revenue metric |
| **Net Revenue Retention (NRR)** | > 100% (good), > 130% (great) | (Beginning MRR + expansion - contraction - churn) / Beginning MRR | Can you grow without new customers? |
| **CAC** (Customer Acquisition Cost) | < 12 months of revenue | Sales + Marketing spend / New customers | How efficient is your growth? |
| **LTV:CAC Ratio** | > 3:1 | Customer Lifetime Value / CAC | Unit economics viability |
| **Logo Churn** | < 5% monthly (SMB), < 1% monthly (enterprise) | Churned customers / Total customers | Product-market fit indicator |
| **Time to Value** | < 1 day (self-serve), < 1 week (enterprise) | Sign-up to first "aha moment" | Activation quality |
| **Burn Multiple** | < 2x (efficient) | Net burn / Net new ARR | Capital efficiency |
| **Magic Number** | > 0.75 | Net new ARR / Prior quarter S&M spend | GTM efficiency |
| **Rule of 40** | Revenue growth % + Profit margin % > 40 | Growth rate + margin | Overall health (for later stage) |

**2026 SaaS Benchmark Note:** Investors increasingly focus on **efficiency metrics** (burn multiple, magic number) over pure growth. The "grow at all costs" era ended in 2023; capital-efficient growth is the 2026 standard.

---

## 4. Developer Tools / Infra Startup Roadmap

### 4.1 DevTool GTM Playbook (2026)

#### The DevTool Adoption Funnel

```
Awareness (content, community, open-source)
    -> Activation (first API call, "hello world" in < 5 min)
        -> Adoption (integrated into workflow)
            -> Revenue (convert free to paid)
                -> Expansion (team adoption, enterprise)
```

#### Key Strategies

**1. Open Source as GTM**

| Model | Description | Revenue Source | Example |
|-------|-------------|----------------|---------|
| **Open Core** | Core is OSS, premium features proprietary | Enterprise features, hosted cloud | GitLab, Supabase, PostHog |
| **Cloud-first with OSS** | Cloud product primary, OSS secondary | Cloud hosting, managed service | Vercel (Next.js), Netlify |
| **OSS Community** | Fully open, monetize via services | Support, consulting, managed hosting | Red Hat model |
| **Source Available** | Viewable source but restricted license | Enterprise license, cloud offering | Elastic, HashiCorp (BSL) |

**2026 Open Source Business Trend:**
- The BSL (Business Source License) and SSPL trend continues: companies open-source but restrict cloud providers from competing.
- "Open-source is a distribution strategy, not a business model" -- the revenue comes from hosted/managed versions.
- Korean startups using open-source GTM: consider dual-licensing (AGPLv3 for open, commercial for enterprise).

**2. Developer Experience (DX) is the Moat**
- **5-minute rule**: Developers should go from zero to "hello world" in under 5 minutes
- **Documentation is product**: Invest heavily in docs (Mintlify, Docusaurus, Nextra)
- **SDK quality**: Provide SDKs in top 3 languages for your audience (TypeScript, Python, Go typically)
- **Playground/sandbox**: Interactive demo that works without signup

**3. Community-Led Growth**
- Discord/Slack community (respond to every message in first 6 months)
- Write technical blog posts (SEO + developer trust)
- Conference talks (in Korea: FEConf, if(kakao), DEVIEW, GDG Korea)
- Open-source contributions to adjacent projects

**4. Developer Community Platforms (Korean Market)**

| Platform | Audience | Best For |
|----------|----------|----------|
| **Disquiet** | Korean startup/product builders | Product launches, feedback, networking |
| **GeekNews** | Korean tech enthusiasts, HN-style | Technical content, awareness |
| **velog** | Korean developers (blog platform) | Technical writing, SEO |
| **OKKY** | Korean developers (forum) | Q&A, community discussion |
| **Wanted** | Korean tech professionals | Recruiting, employer branding |

---

## 5. Fintech Startup Considerations

### 5.1 Korean Fintech Regulatory Landscape (2026)

| License/Requirement | Governing Body | What It Covers | Timeline to Get | Difficulty |
|---------------------|---------------|----------------|-----------------|------------|
| **전자금융업 등록** (Electronic Finance Registration) | 금융위원회 (FSC) | Payment services, electronic wallets, remittance | 3-6 months | High |
| **간편결제 사업자** (Simple Payment Business) | 금융위원회 | Mobile payments (like Toss Pay, Naver Pay) | 6-12 months | Very High |
| **P2P 대출 중개업** (P2P Lending) | 금융위원회 | Online lending marketplace | 6-12 months, registered capital 5억원+ | Very High |
| **투자자문업/투자일임업** | 금융위원회 | Robo-advisor, investment advice | 3-6 months, registered capital 1-5억원+ | High |
| **보험대리점** | 금융감독원 (FSS) | Insurance distribution (insurtech) | 1-3 months | Medium |
| **마이데이터** (MyData) | 금융위원회 | Data aggregation across financial institutions | 6-12 months, significant compliance | Very High |
| **혁신금융서비스** (Innovative Finance/Sandbox) | 금융위원회 | Temporary exemption from regulations for testing | 3-6 months to apply, 2-year sandbox period | Medium (but competitive) |
| **오픈뱅킹** (Open Banking) | 금융결제원 (KFTC) | Access to bank account APIs | Must be registered fintech, 2-4 months integration | Medium |

### 5.2 Fintech MVP Requirements

**For a payments-adjacent startup (NOT processing payments yourself):**
- Use an existing PG (Toss Payments, PortOne) -- no license needed
- You can build payment analytics, expense management, invoicing without a financial license
- This covers most fintech "lite" startups

**For a full payment company:**
1. 법인설립 (corporate registration) -- 주식회사 필수
2. 최소 자본금 (minimum capital): 전자금융업 등록 시 5억~20억원 (depending on type)
3. 정보보호관리체계 (ISMS) certification or equivalent security measures
4. 자금세탁방지 (AML/KYC) system implementation
5. 이용자 보호 체계 (user protection system)

**2026 Fintech Shortcut: 혁신금융서비스 (Financial Sandbox)**
- Apply to FSC's Innovation Finance program for temporary regulatory exemption
- Allows you to test your product for 2 years without full licensing
- Requirements: novel financial service that benefits consumers
- ~50-80 companies approved per year
- Apply at: https://www.fsc.go.kr (금융혁신지원 특별법)

### 5.3 Fintech Startup Stack (Korean-specific)

| Component | Recommended Tool | Alternative |
|-----------|-----------------|-------------|
| KYC/Identity | 본인확인 via PASS앱 API (통신사 인증), 금융결제원 본인확인서비스 | 카카오 인증서, 네이버 인증서 |
| Banking API | 오픈뱅킹 (금융결제원 KFTC) | 각 은행 직접 API |
| Payments | Toss Payments, PortOne | KG이니시스, NHN KCP |
| Data aggregation | 마이데이터 API (if licensed), 쿠콘 (Coocon) scraping | N/A |
| Compliance | 내부통제시스템 자체개발 or 레그테크 솔루션 | 금융보안원 컨설팅 |

---

## 6. Korean Startup Ecosystem 2026

### 6.1 Investment Landscape (2026)

**Korean VC Investment Trends:**

| Metric | 2024 | 2025 | 2026 (projected) |
|--------|------|------|-------------------|
| Total VC investment | ~5.6조원 | ~6.2조원 | ~7조원 (recovery continuing) |
| Deal count | ~2,800 | ~3,000 | ~3,200 |
| Average seed round | 3-5억원 | 3-6억원 | 4-7억원 |
| Average Series A | 15-30억원 | 20-40억원 | 25-50억원 |
| AI/DeepTech share | 25% | 32% | 38%+ (largest sector) |

**Hot sectors in Korean VC (2026):**
1. **AI/LLM Applications** -- 가장 활발, vertical AI apps especially
2. **Robotics** -- 물류/제조 로봇, 서비스 로봇
3. **Climate/Energy Tech** -- 탄소중립, 에너지 효율
4. **Bio/Healthcare** -- AI 신약개발, 디지털 치료제
5. **Defense/Aerospace** -- 드론, 위성, 방위산업
6. **SaaS (Enterprise)** -- 한국 기업 SaaS 도입 가속화

**Notable Korean VCs Active in 2026:**

| VC | Focus | Typical Check Size | Notable Portfolio |
|----|-------|--------------------|-------------------|
| **Korea Investment Partners (한국투자파트너스)** | Generalist, early-to-growth | 10-100억원 | Coupang, Toss, Yanolja |
| **SoftBank Ventures Asia** | Tech, AI, B2B | 5-50억원 | SendBird, Scatter Lab |
| **Altos Ventures** | Consumer, enterprise, early-stage | $500K-$5M | Coupang, Woowa Bros, Riiid |
| **Strong Ventures** | Korean startups going global | $200K-$2M | SendBird, Lunit, Rebellions |
| **Kakao Ventures** | Consumer tech, AI, content | 3-30억원 | Various Kakao ecosystem |
| **Naver D2SF** | DeepTech, AI (no dilution grants) | 1,000만원 (grant) | AI/robotics startups |
| **BonAngels** | Early-stage, serial entrepreneurs | 5-20억원 | Various early-stage |
| **SparkLabs** | Accelerator + seed | 5-10억원 | LegalInsight, AIQ |
| **Primer** | Korea's first accelerator | 3-10억원 | Rainist (Banksalad), Mathpresso |
| **Capstone Partners** | Growth stage, IPO-track | 30-200억원 | Growth-stage Korean tech |

### 6.2 Government Support Programs for Tech Startups

#### TIPS (Tech Incubator Program for Startup)

| Aspect | Details |
|--------|---------|
| **What** | Korea's flagship tech startup support program |
| **Organizer** | 중소벤처기업부 (MSS) via KISED |
| **Amount** | 최대 5억원 (R&D 3억 + 창업사업화 2억) over 3 years |
| **How it works** | Approved "TIPS 운영사" (operator/accelerator) selects and recommends startups -> government co-funds |
| **Equity** | 운영사 may invest (typically 5-10% equity for 1-3억원) |
| **Eligibility** | 창업 7년 이내, 기술 기반 스타트업 |
| **2026 Update** | AI/DeepTech track expanded, 약 200개 팀 선발/년 |
| **Application** | Via TIPS 운영사 (50+ operators including SparkLabs, Primer, BonAngels, etc.) |
| **URL** | https://www.jointips.or.kr |

**TIPS 운영사 (Notable Operators, 2026):**
SparkLabs, Primer, BonAngels, FuturePlay, Bluepoint Partners, Mashup Angels, Company K Partners, DSC Investment, KB Investment, CJ Investment, LG Technology Ventures, Hyundai Ventures

#### Other Key Government Programs for Tech Startups

| Program | Amount | Target | Application Period |
|---------|--------|--------|-------------------|
| **예비창업패키지** | 최대 1억원 | 예비 기술창업자 | 1-3월 |
| **초기창업패키지** | 최대 1억원 (딥테크 1.5억) | 창업 3년 이내 | 1-3월 |
| **창업도약패키지** | 최대 3억원 | 창업 3-7년, 도약 필요 기업 | 1-3월 |
| **민관공동 창업자 발굴 육성** | 최대 2억원 | 기술창업, 민간 VC 연계 | 연중 |
| **글로벌 창업사관학교** | 해외 진출 지원 | 해외 진출 의향 스타트업 | 상반기 |
| **AI 바우처** | 최대 3억원 | AI 솔루션 도입 기업 + AI 기업 | 상반기 |
| **데이터 바우처** | 최대 5,000만원 | 데이터 활용 스타트업 | 상반기 |
| **클라우드 바우처** | 최대 2,400만원 | 클라우드 전환 기업 | 연중 |

### 6.3 Korean Startup Legal Requirements

#### 법인설립 (Corporate Registration) -- Tech Startup Track

| Step | Description | Cost | Timeline |
|------|-------------|------|----------|
| **1. 법인 형태 선택** | 주식회사 (Corp.) -- 투자 유치 시 필수 | - | - |
| **2. 자본금** | 법정 최소: 0원 (2024부터). 실무 최소: 100만~1,000만원. VC 투자 유치 시 권장: 1,000만~5,000만원 | 자본금 금액 | 즉시 |
| **3. 정관 작성** | 상호, 사업목적, 본점소재지, 주식수/액면가 등 | 법무사 이용 시 50-100만원 | 1-2일 |
| **4. 등기** | 관할 등기소 법인설립 등기 | 등록면허세 ~15만원 + 교육세 ~4.5만원 + 등기수수료 | 1-3일 |
| **5. 사업자등록** | 관할 세무서 또는 홈택스 온라인 | 무료 | 1-3일 |
| **6. 4대보험 가입** | 직원 채용 시 의무 (1인 법인도 대표이사 건강보험 가입) | 급여의 약 9.5% (회사부담분) | 고용 후 14일 내 |
| **7. 통장 개설** | 법인 명의 계좌 (투자금 입금용) | 무료 | 1일 |

**법인설립 간소화 서비스 (2026):**
- **온라인 법인설립 시스템**: https://iros.go.kr (대법원 인터넷등기소)
- **스타트업 전문 서비스**:
  - 헬프미 (https://www.help-me.kr) -- 법인설립 대행, 29.8만원~
  - 스타트업 법률 서비스 (원스톱)
  - 법무법인 디라이트 (스타트업 특화)

#### 스톡옵션 (Stock Options) -- 주식매수선택권

| Aspect | Details |
|--------|---------|
| **법적 근거** | 상법 제340조의2, 벤처기업육성법 제16조의3 |
| **부여 한도** | 상법: 발행주식총수의 10%, 벤처기업: 50%까지 가능 |
| **대상** | 임직원 (대표이사 제외가 일반적, 벤처는 대표도 가능) |
| **행사 기간** | 부여일로부터 2년 이상 경과 후 ~ 10년 이내 |
| **벤처기업 세제 혜택** | 행사이익 연 5,000만원까지 비과세 (2024 개정으로 확대), 5,000만원 초과분은 양도세율 적용 (20%) |
| **2026 변경사항** | 비과세 한도 연 5,000만원으로 확대 유지, 벤처확인 후 5년 이내 부여분 적용 |
| **실무 주의** | 주주총회 특별결의 필요, 정관에 근거 규정 필요, 부여계약서 작성 필수 |

**스톡옵션 부여 실무 (2026 Best Practice):**
1. 정관에 주식매수선택권 관련 조항 포함
2. 주주총회 특별결의 (출석 주주 2/3 이상 찬성)
3. 부여 계약서 체결 (행사가격, 행사기간, 베스팅 조건 명시)
4. 일반적 베스팅: 4년 베스팅 + 1년 클리프 (한국 스타트업 표준)
5. 행사가격: 부여 시점의 시가 (비상장: 최근 투자 라운드 기준 or 보충적 평가)

### 6.4 Korean Accelerators & Their Focus Areas (2026)

| Accelerator | Focus | Investment | Duration | Application |
|-------------|-------|------------|----------|-------------|
| **SparkLabs** | Global-oriented tech | $50K-$200K for 5-10% | 22주 프로그램 | 연 2회 배치 |
| **Primer** | Generalist, Korea's first | 3-10억원 seed | 6개월 | 연 2회 |
| **FuturePlay** | DeepTech, AI | 1-5억원 seed | 6-12개월 | 수시 |
| **BonAngels** | Consumer, SaaS | 2-10억원 | 3-6개월 | 수시 |
| **Mashup Angels** | Early-stage generalist | 1-5억원 | 유동적 | 수시 |
| **Y Combinator** | Global (Korean teams accepted) | $500K for 7% | 3개월 (SF) | 연 2회 (Mar/Sep) |
| **500 Global** | Global emerging markets | $150K for 6% | 4개월 | 연 multiple |
| **Google for Startups** | Cloud, AI startups | Credits + mentoring (비지분) | 3-6개월 | 연 1-2회 |
| **Microsoft for Startups** | Azure-focused startups | $150K Azure credits + mentoring | 유동적 | 상시 |
| **AWS Startup Loft Seoul** | AWS ecosystem | Credits + technical support | 유동적 | 상시 |

### 6.5 판교/강남/성수 스타트업 지역 현황 (2026)

| Location | Character | Monthly Rent (전용 10평 기준) | Why Startups Go There |
|----------|-----------|-------------------------------|----------------------|
| **판교 (Pangyo)** | Korea's Silicon Valley, mature tech hub | 100-200만원 | NAVER, Kakao, NCSoft HQ. 경기 스타트업캠퍼스 입주 가능. VC 밀집 |
| **강남/역삼** | Traditional startup district | 120-250만원 | VC 접근성 최고, 채용 용이, 투자 미팅 |
| **성수** | Trendy, creative startups, D2C | 80-180만원 | 디캠프(D.CAMP), 크래프톤 타워, 팁스타운S |
| **마포/상수/합정** | Indie/creative tech | 60-120만원 | 비용 절감, 크리에이티브 문화 |
| **서울 전역 -- 공유오피스** | WeWork, 패스트파이브, 스파크플러스 | 40-80만원/seat | 초기 팀 (1-5명)에 적합, 단기 유연성 |

---

## 7. Stage-by-Stage AI Tool Recommendations

### 7.1 Ideation & Validation Stage

| Tool | Use Case | Pricing | How to Use | URL |
|------|----------|---------|-----------|-----|
| **Claude (Anthropic)** | Market research synthesis, competitive analysis, business model brainstorming | Free (limited), Pro $20/mo, Team $30/user/mo | Upload competitor docs, ask for market analysis. Use Projects feature for persistent context | https://claude.ai |
| **Perplexity** | Real-time market research, finding data, competitive intelligence | Free (5 Pro searches/day), Pro $20/mo | "What are the top competitors in [space] in Korea?", "What is the TAM for [market]?" | https://perplexity.ai |
| **ChatGPT** | General brainstorming, quick research | Free, Plus $20/mo, Team $30/user/mo | Brainstorm features, customer personas, naming | https://chat.openai.com |
| **NotebookLM (Google)** | Analyzing long documents, research synthesis | Free | Upload research papers, competitor reports. Generate audio summaries | https://notebooklm.google.com |
| **Grok** | Real-time X/Twitter trend analysis, market sentiment | Free with X Premium | Analyze what people say about competitors, market trends on X | https://grok.com |
| **KOSIS (통계청)** | Korean market data, demographics | Free | TAM/SAM sizing for Korean market | https://kosis.kr |
| **Statista** | Global market statistics | Free (limited), Basic $199/mo | Global market sizing, industry reports | https://statista.com |

**Korean-Specific Research:**
- **공공데이터포털** (data.go.kr): Free Korean government datasets
- **K-Startup** (k-startup.go.kr): Startup ecosystem data, program info
- **NICE평가정보**: Industry reports, company financial data (paid)
- **과학기술정보통신부**: AI/tech industry reports

---

### 7.2 Design & Prototyping Stage

| Tool | Use Case | Pricing | Korean Support | URL |
|------|----------|---------|----------------|-----|
| **Figma** | UI/UX design, component libraries, handoff | Free (2 editors), Pro $15/mo. **Figma for Startups: 50% off Y1** | Full Korean UI | https://figma.com |
| **Figma AI (built-in)** | Auto-layout suggestions, design generation, rename layers | Included with Figma | Yes | Built into Figma |
| **v0 (Vercel)** | Generate React UI components from text/images | Free (10/day), Premium $20/mo | Code output is universal | https://v0.dev |
| **Framer** | No-code marketing/landing pages | Free, Mini $5/mo, Pro $30/mo | Partial | https://framer.com |
| **Bolt.new** | Full-stack app prototyping in browser | Free, Pro $20/mo | English only | https://bolt.new |
| **Lovable (ex-GPT Engineer)** | AI-generated full-stack apps from description | Free tier, $20/mo | English only | https://lovable.dev |
| **Relume** | AI-generated wireframes and sitemaps | Free (limited), $38/mo | English only | https://relume.io |
| **Magician (Figma plugin)** | AI-powered Figma plugin for copy, icons, images | $5/mo | English only | https://magician.design |

**Workflow Recommendation:**
1. Use **Relume** to generate sitemap + wireframes from a text brief
2. Refine in **Figma** with proper design system
3. Use **v0** to generate initial React component code
4. Use **Framer** for marketing site (non-developer can update)
5. For quick full-stack prototype: **Bolt.new** or **Lovable**

---

### 7.3 Development Stage

| Tool | Use Case | Pricing | URL |
|------|----------|---------|-----|
| **Claude Code** | Agentic coding -- architecture, complex refactoring, multi-file changes | Pro $20/mo or Max $100-200/mo | https://claude.ai/code |
| **Cursor** | Daily coding IDE with AI, inline edits, codebase chat | Free (2K completions), Pro $20/mo | https://cursor.com |
| **GitHub Copilot** | Inline code completions, familiar VSCode integration | $10/mo individual, $19/mo business | https://github.com/features/copilot |
| **Vercel AI SDK** | Building AI-powered features into your app | Free, open-source | https://sdk.vercel.ai |
| **Supabase** | Backend (auth, DB, storage, realtime, edge functions) | Free tier, Pro $25/mo | https://supabase.com |
| **Inngest** | Background jobs, AI workflow orchestration | Free (hobby), Pro $50/mo | https://inngest.com |
| **Trigger.dev** | Background jobs, cron, long-running tasks | Free (open-source), Cloud free tier | https://trigger.dev |
| **Resend** | Transactional email | Free (100 emails/day), Pro $20/mo | https://resend.com |
| **Uploadthing** | File uploads for Next.js | Free (2GB), Pro $10/mo | https://uploadthing.com |

**2026 AI-Augmented Development Workflow:**
```
1. Architecture design: Claude Code (discuss architecture, generate scaffold)
2. Daily coding: Cursor (inline AI completions + chat)
3. Code review: Claude Code or Cursor (explain PR, find bugs)
4. Testing: Claude Code (generate test cases, fix failing tests)
5. Documentation: Claude (generate API docs, README)
6. Debugging: Cursor (paste error, get fix suggestion)
```

**Productivity Impact (2026 estimates):**
- AI-assisted developers ship 2-3x faster for new feature development
- AI is particularly effective for: boilerplate, tests, documentation, refactoring, debugging
- AI is less effective for: novel architecture decisions, performance optimization, security auditing (still needs human review)

---

### 7.4 Marketing & Growth Stage

| Tool | Use Case | Pricing | Korean Market Fit | URL |
|------|----------|---------|-------------------|-----|
| **Claude / ChatGPT** | Marketing copy, blog posts, email campaigns, social media content | $20/mo | Excellent Korean writing | https://claude.ai |
| **Jasper AI** | Marketing-specific AI (templates, brand voice, campaigns) | Creator $49/mo, Pro $69/mo | English-focused (Korean okay) | https://jasper.ai |
| **Surfer SEO** | AI SEO optimization, content scoring | Essential $89/mo, Scale $129/mo | English-focused | https://surferseo.com |
| **Frase.io** | AI SEO content creation + optimization | Solo $15/mo, Basic $45/mo | English-focused | https://frase.io |
| **Canva (AI features)** | Social media graphics, presentations with AI generation | Free, Pro $13/mo, Teams $10/user/mo | Full Korean UI | https://canva.com |
| **HeyGen** | AI avatar video generation (demos, marketing videos) | Free (1 video), Creator $29/mo | Korean avatars available | https://heygen.com |
| **ElevenLabs** | AI voice generation (product demos, content) | Free, Starter $5/mo, Creator $22/mo | Korean voice available | https://elevenlabs.io |
| **Gamma** | AI-generated presentations and pitch decks | Free (10 credits), Plus $10/mo, Pro $20/mo | English (Korean content okay) | https://gamma.app |
| **Beehiiv** | Newsletter platform with AI writing assist | Free (2,500 subs), Grow $49/mo | English platform | https://beehiiv.com |

**Korean-Specific Marketing Tools:**

| Tool | Use Case | Pricing | URL |
|------|----------|---------|-----|
| **네이버 스마트스토어** | Korean e-commerce presence | Commission-based | https://sell.smartstore.naver.com |
| **카카오 비즈메시지** | KakaoTalk business messaging | Per-message pricing (~15원/msg) | https://business.kakao.com |
| **채널톡** | Korean customer chat (Intercom alternative) | Free (limited), $36/mo | https://channel.io |
| **리메이크** | Korean AI marketing content | Various | Korean-native tools |
| **네이버 블로그 / 포스트** | Korean SEO (Naver dominates Korean search) | Free | https://blog.naver.com |

**Korean SEO Note (2026):**
- Google Korea share: ~35-40% (growing)
- Naver share: ~45-50% (declining but still dominant)
- You MUST optimize for both Naver and Google
- Naver SEO requires: Naver Blog, Naver Post, 네이버 서치어드바이저 registration
- Google SEO requires: Standard technical SEO + Korean content

---

### 7.5 Operations Stage

| Tool | Use Case | Pricing | Korean Support | URL |
|------|----------|---------|----------------|-----|
| **Intercom (Fin AI)** | AI customer support chatbot + helpdesk | Starter $39/mo, Fin AI $0.99/resolution | English platform, Korean conversations supported | https://intercom.com |
| **채널톡 (Channel.io)** | Korean-native customer chat + AI support | Free (limited), $36/mo | Full Korean | https://channel.io |
| **Zendesk AI** | Enterprise customer support with AI | Suite Team $55/agent/mo | Korean UI available | https://zendesk.com |
| **PostHog** | Product analytics, feature flags, A/B tests | Free (1M events/mo) | English | https://posthog.com |
| **Metabase** | Internal BI dashboards, SQL analytics | Free (open-source), Cloud $85/mo | English (Korean community) | https://metabase.com |
| **Retool** | Internal tools builder | Free (5 users), Team $10/user/mo | English | https://retool.com |
| **Notion AI** | Meeting notes, documentation, project management with AI | $10/member/mo for AI add-on | Full Korean | https://notion.so |
| **Otter.ai** | AI meeting transcription and notes | Free, Pro $16.99/mo | English only (Korean transcription limited) | https://otter.ai |
| **Clova Note (네이버)** | Korean meeting transcription | Free (basic) | Full Korean, best Korean transcription | https://clovanote.naver.com |
| **Typeform / Tally** | AI-assisted form/survey building | Typeform $25/mo, Tally free | English | https://typeform.com / https://tally.so |

**AI-Assisted Financial Planning:**

| Tool | Use Case | Pricing | URL |
|------|----------|---------|-----|
| **Runway Financial** | AI financial modeling, scenario planning | $50/mo+ | https://runway.com |
| **Causal** | Financial planning with AI | Free (basic), $50/mo | https://causal.app |
| **Fathom** | AI financial reporting (connects to accounting) | $39/mo (for accountants) | https://fathomhq.com |
| **자비스 (JOBIS)** | Korean AI bookkeeping / accounting | 월 11,000원~ | https://jobis.co |
| **삼쩜삼 (3o3)** | Korean tax filing assistance, AI-powered | Per-filing pricing | https://3o3.co.kr |

---

### 7.6 Tool Summary by Stage (Quick Reference)

| Stage | Must-Have Tools | Nice-to-Have | Monthly Cost (Solo Founder) |
|-------|----------------|--------------|----------------------------|
| **Ideation** | Claude Pro, Perplexity Pro, Google Docs | Statista, NotebookLM | ~$40/mo |
| **Design** | Figma (free), v0 (free), Framer (free) | Relume, Bolt.new | $0-20/mo |
| **Development** | Cursor Pro, GitHub (free), Supabase (free), Vercel (free), Sentry (free) | Claude Code Max, Inngest | $20-40/mo |
| **Launch** | PostHog (free), Sentry (free), Toss Payments, Linear (free) | Mixpanel, BetterStack | $0-25/mo |
| **Marketing** | Claude for copy, Canva (free), Naver Blog (free), Beehiiv (free) | Surfer SEO, HeyGen | $0-50/mo |
| **Scale** | PostHog, Linear, Slack, Notion | Datadog, Amplitude | $50-200/mo |

**Total estimated monthly cost for a solo tech founder MVP to launch: $60-125/mo**
(This is dramatically lower than even 2-3 years ago thanks to generous free tiers and AI productivity tools)

---

## 8. build.up Integration Recommendations

### 8.1 Data Model Extensions for Tech Startup Support

Based on the current build.up architecture (which uses `LifecyclePhase`, `LifecycleStage`, `RoadmapStageState`, `UserBusinessProfile`), here are the recommended extensions:

**New Industry Categories to Add:**

```typescript
// Extend starterIndustryCategories
{ id: "ai-saas", title: "AI / SaaS", summary: "AI-powered software products and SaaS businesses" },
{ id: "devtools", title: "Developer Tools", summary: "APIs, SDKs, infrastructure tools for developers" },
{ id: "fintech", title: "Fintech", summary: "Financial technology, payments, lending, insurtech" },
{ id: "healthtech", title: "Healthcare / Bio", summary: "Digital health, AI diagnostics, healthtech platforms" },
{ id: "edtech", title: "Education Technology", summary: "Online learning, AI tutoring, LMS platforms" },
{ id: "marketplace", title: "Marketplace / Platform", summary: "Two-sided marketplaces and platform businesses" },
{ id: "d2c-ecommerce", title: "D2C / E-commerce", summary: "Direct-to-consumer brands and online commerce" },
{ id: "content-media", title: "Content / Media", summary: "Content platforms, creator economy, media tech" },
```

**New UserBusinessProfile Fields:**

```typescript
// Tech startup specific
techStack?: string[];           // ["nextjs", "supabase", "claude-api"]
fundingStage?: "bootstrapped" | "pre-seed" | "seed" | "series-a" | "series-b-plus";
teamSize?: number;
hasCofounder?: boolean;
targetMarket?: "korea" | "global" | "korea-first-then-global";
businessModel?: "saas" | "marketplace" | "api" | "usage-based" | "freemium" | "enterprise";
aiEnabled?: boolean;            // Does the product use AI?
monthlyBurnRate?: number;       // KRW
runway?: number;                // months
mrr?: number;                   // Monthly Recurring Revenue in KRW
```

### 8.2 Tech Startup Lifecycle Stages (Parallel to Existing)

The existing `LIFECYCLE_STAGES` covers small business/self-employed lifecycle. For tech startups, a parallel lifecycle is needed:

```
Phase: Ideation       -> "Problem Validation" (2-4 weeks)
Phase: Building       -> "MVP Development" (4-8 weeks)
Phase: Launch         -> "Launch & First Users" (4-12 weeks)
Phase: Growth         -> "Product-Market Fit" (3-12 months)
Phase: Scaling        -> "Growth & Team Scaling" (12-36 months)
Phase: Maturity       -> "Profitability / IPO Track" (36+ months)
Phase: Transition     -> "Pivot or Exit" (variable)
```

Each stage should carry:
- Stage-specific tool recommendations (from Section 7)
- Relevant Korean government programs (from startup-programs.ts)
- Key metrics to track (from Section 3.2)
- AI tool recommendations (from Section 7)
- Legal/regulatory requirements (from Section 6.3, 5.1)

### 8.3 New Stage Guides Needed (StageGuideContent additions)

For each tech startup roadmap stage, create guides with:

| Stage | Guide Topics |
|-------|-------------|
| **Problem Validation** | Customer interview templates, Korean market research tools, TAM/SAM methodology |
| **Data Strategy** | PIPA compliance checklist, data flywheel design, evaluation dataset creation |
| **MVP Development** | Tech stack selection wizard, AI feature integration guide, deployment setup |
| **Launch** | Korean startup launch channels (Disquiet, Product Hunt), beta testing playbook |
| **First Funding** | TIPS application guide, pitch deck template, VC outreach strategy (Korean VCs) |
| **Product-Market Fit** | SaaS metrics dashboard setup, user interview cadence, pricing iteration |
| **Team Building** | Korean 스톡옵션 setup guide, first 10 hires playbook, engineering culture |
| **Scaling** | Infrastructure scaling checklist, enterprise sales in Korea, Series A preparation |

### 8.4 Recommended API Integrations

| Integration | Purpose | API Available? |
|-------------|---------|---------------|
| **GitHub API** | Track user's code activity, repo setup status | Yes (OAuth) |
| **Vercel API** | Deployment status, project health | Yes (REST) |
| **Supabase Management API** | Project status, database metrics | Yes (REST) |
| **PostHog API** | Pull analytics data for dashboard | Yes (REST) |
| **K-Startup API** | Government program matching | Partial (web scraping may be needed) |
| **TIPS Portal** | Program application status | No public API (scraping) |
| **Toss Payments API** | Payment integration status, revenue tracking | Yes (REST) |
| **Claude API / Vercel AI SDK** | AI-powered guidance, analysis | Yes |

### 8.5 Priority Implementation Order

1. **Phase 1 (Now):** Add tech startup industry categories + UserBusinessProfile extensions
2. **Phase 2 (Next Sprint):** Create tech startup lifecycle stages parallel to existing LIFECYCLE_STAGES
3. **Phase 3:** Build stage-specific tool recommendation engine (match tools to user's stage, budget, team size)
4. **Phase 4:** Add tech startup government program matching (TIPS, AI바우처, etc.)
5. **Phase 5:** Integrate with developer tools APIs for real-time progress tracking
6. **Phase 6:** Add SaaS metrics dashboard (MRR tracking, burn rate, runway calculator)

---

## Appendix A: Startup Credits & Discount Programs (2026)

| Provider | Program | Credits | How to Apply | URL |
|----------|---------|---------|-------------|-----|
| **AWS Activate** | Cloud credits for startups | Up to $100K | Via accelerator or direct application | https://aws.amazon.com/activate |
| **Google Cloud for Startups** | Cloud credits | Up to $200K (2 years) | Direct application | https://cloud.google.com/startup |
| **Microsoft for Startups** | Azure + GitHub + OpenAI credits | Up to $150K Azure + $2,500 OpenAI | Founders Hub | https://foundershub.startups.microsoft.com |
| **Vercel** | Startup credits | Varies | Apply via startup program | https://vercel.com/startups |
| **Supabase** | Startup credits | Pro plan free for 2 years (via YC deal) | Via accelerator or apply | https://supabase.com/partners/integrations |
| **Figma for Startups** | Design tool discount | 50% off first year | Via startup program | https://figma.com/startups |
| **Linear** | Startup discount | 50% off first year | Apply as startup | https://linear.app |
| **Notion for Startups** | Workspace credits | Plus plan free (up to 6 months) | Via startup program | https://notion.so/startups |
| **Stripe Atlas** | Incorporation + Stripe setup | $500 (discounted via accelerator) | Direct application | https://stripe.com/atlas |
| **Sentry** | Error tracking credits | 90% off first year | Startup program | https://sentry.io/for/startups |
| **PostHog** | Analytics credits | $50K in credits | YC or accelerator deal | https://posthog.com/startups |
| **HubSpot for Startups** | CRM credits | 90% off first year | Via accelerator | https://hubspot.com/startups |
| **Segment (Twilio)** | CDP credits | $50K in credits | Startup program | https://segment.com/startups |
| **Brex** | Corporate card | $75K in rewards | Via YC/accelerator | https://brex.com |

**Tip:** Many of these stack. A Y Combinator-accepted startup can get $500K+ in total credits. Korean accelerator alumni (SparkLabs, Primer) can access many of these through partnership deals.

---

## Appendix B: Korean Startup Legal Checklist (Tech Focus)

### Pre-Incorporation
- [ ] Choose business name (상호) -- check availability at 인터넷등기소
- [ ] Determine co-founder equity split (구두 약속 금지, 반드시 서면으로)
- [ ] Draft founders' agreement (주주간 계약서)
- [ ] Decide initial capital (최소 1,000만원 권장 for VC-track)
- [ ] Register domain name and social media handles

### Incorporation (법인설립)
- [ ] Prepare articles of incorporation (정관)
- [ ] Open capital deposit account (자본금 납입)
- [ ] File incorporation at registry office (법인등기)
- [ ] Obtain business registration (사업자등록) at tax office
- [ ] Register for 4대보험 (if hiring employees)

### Post-Incorporation (First 30 Days)
- [ ] Open corporate bank account (법인 통장)
- [ ] Set up accounting system (자비스, 세무사 계약)
- [ ] Register at 중소기업확인 portal (중소기업 확인서 -- needed for government programs)
- [ ] Apply for 벤처기업 인증 (if applicable -- unlocks 스톡옵션 benefits, tax benefits)
- [ ] Register at K-Startup portal (정부 지원사업 통합 관리)

### Hiring & Stock Options
- [ ] Create employment contract templates (근로계약서)
- [ ] Set up stock option plan (주식매수선택권 제도 설계)
- [ ] Board/shareholder resolution for stock option grants
- [ ] File stock option grants with tax authority

### IP & Compliance
- [ ] File trademark registration (특허청 상표출원) -- 약 20만원
- [ ] Register with KISA for privacy compliance (개인정보 처리방침)
- [ ] Obtain ISMS certification (if handling financial/medical data)
- [ ] Register domain with WHOIS privacy protection

---

## Appendix C: 2026 AI Model Pricing Quick Reference

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Context Window | Best For |
|-------|----------------------|------------------------|----------------|----------|
| Claude Opus 4 | $15 | $75 | 1M | Complex reasoning, long documents |
| Claude Sonnet 4 | $3 | $15 | 200K | Best price/performance for most tasks |
| Claude Haiku 3.5 | $0.25 | $1.25 | 200K | Classification, extraction, simple tasks |
| GPT-4.1 | $2 | $8 | 1M | General purpose, broad capabilities |
| GPT-4.1 mini | $0.40 | $1.60 | 1M | Budget alternative to GPT-4.1 |
| GPT-4.1 nano | $0.10 | $0.40 | 1M | Cheapest OpenAI option |
| o3 | $10 | $40 | 200K | Advanced reasoning, math, code |
| o4-mini | $1.10 | $4.40 | 200K | Budget reasoning model |
| Gemini 2.5 Pro | $1.25-$10 | $2.50-$10 | 1M | Multimodal, Google integration |
| Gemini 2.5 Flash | $0.15 | $0.60 | 1M | Cheap multimodal tasks |
| DeepSeek V3 | $0.27 | $1.10 | 128K | Ultra-budget option |
| DeepSeek R1 | $0.55 | $2.19 | 128K | Budget reasoning |
| Llama 4 Maverick | Self-host or ~$0.20-0.50 | ~$0.50-1.00 | 1M | Open-source, self-hosted, fine-tunable |

**Cost Estimation for a Typical AI Feature:**
- Simple chatbot (1,000 conversations/day, avg 500 tokens each): ~$1.50-$45/day depending on model
- RAG-powered Q&A (500 queries/day, avg 2K tokens context + 500 output): ~$3-$75/day
- Document analysis (100 docs/day, avg 10K tokens each): ~$5-$150/day

**Rule of thumb:** Start with Claude Sonnet or GPT-4.1 for development, then optimize with cheaper models (Haiku, Flash, mini) for production routes that don't need top-tier reasoning.

---

*End of Research Report*

*This document should be reviewed and updated quarterly as the AI/startup tooling landscape evolves rapidly. Last comprehensive review: 2026-03-31.*
