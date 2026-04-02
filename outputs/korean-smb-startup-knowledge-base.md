# Korean Small Business & Startup AI Coaching Knowledge Base

**Compiled**: 2026-03-29
**Coverage**: 2024-2026 data, Korea-specific + Global best practices
**Purpose**: Reference data for AI coaching system (Build.Up)

---

## A. Korean SMB Operational Benchmarks (2024-2026)

### A1. Food Service (외식업) Cost Structure

| Cost Category | % of Revenue | Source/Year | Notes |
|---|---|---|---|
| Food/ingredient cost (식재료비) | 40.4-40.7% | 농림축산식품부 2024 | Up from 36.3% in 2020 |
| Labor cost (인건비) | 29.4% | 농림축산식품부 2024 | |
| Rent (임차료) | 8.7% | 농림축산식품부 2024 | |
| Tax (세금) | 5.6% | 농림축산식품부 2024 | |
| Other (카드수수료, 배달수수료, 가맹비 등) | 7.0% | 농림축산식품부 2024 | |
| **Operating profit (영업이익)** | **8.7%** | 농림축산식품부 2024 | Down from 12.1% in 2020 |

- **Korea-specific**: Food cost ratio (40.4%) is 11.7%p higher than US (28.7%).
- **Prime Cost benchmark**: Food cost + labor cost should stay under 60% of revenue (currently ~70% in Korea = structurally squeezed).
- **Trend**: Revenue grew 41.4% from 2020-2024 but operating costs grew 46.7% -- "sales increase, profits decline" pattern.

**AI Coach Usage**:
- Alert when user's food cost exceeds 40% -- "Your food cost is above the national average. Consider menu engineering, supplier renegotiation, or portion control."
- Flag when prime cost exceeds 65% -- "Danger zone: your combined food+labor cost leaves insufficient margin for rent and profit."
- Compare user's operating profit margin against the 8.7% national average.

### A2. Ideal Cost Ratios by Business Type (Korea)

| Expense | Restaurant | Cafe | Retail |
|---|---|---|---|
| Ingredients/COGS | 30-45% | ~30% | 50-65% |
| Labor | ~20% | ~25% | ~15% |
| Rent | 10-15% | ~10% (3 days' revenue) | 10-15% |
| Utilities/Other | ~10% | ~10% | ~10% |
| **Target Net Profit** | **15-25%** | **15-20%** | **10-20%** |

- **Source**: Korean small business management literature, KB Financial Group reports, CashNote business platform analysis.
- **Cafe benchmark**: A well-run cafe should be able to pay monthly rent with ~3 days of revenue.
- **Franchise vs Non-franchise**: Franchise annual revenue avg 330M KRW vs non-franchise 230M KRW (1.4x gap, widening).

**AI Coach Usage**:
- Use as baseline comparison: "Your rent is 18% of revenue -- the recommended maximum is 15%. Consider renegotiating or supplementing with delivery/takeout revenue."
- Cafe-specific: "Can you cover rent with 3 days of sales? If not, your location cost may be too high."

### A3. Average Revenue Benchmarks

| Business Type | Avg Annual Revenue | Source/Year |
|---|---|---|
| All food service businesses | 255.26M KRW | 농림축산식품부 2024 |
| Franchise restaurants | 330M KRW | 농림축산식품부 2024 |
| Non-franchise restaurants | 230M KRW | 농림축산식품부 2024 |
| All small businesses (quarterly) | 49.16M KRW/quarter | KCD Data Lab Q4 2025 |

**High-growth segments (2020-2024)**:
- Mobile food vendors (출장/이동 음식점): +101.2%
- Kimbap/simple food shops (김밥/간이음식): +70.3%
- Non-alcoholic beverages (카페): +47.3%
- Korean restaurants (한식): +46%

**Declining segments (2023-2024)**:
- Chinese cuisine, Western restaurants, specialty chicken, bakery categories saw revenue declines.

**AI Coach Usage**:
- Benchmark user's monthly/annual revenue against industry averages.
- Identify whether user is in a growing or declining segment and advise accordingly.

### A4. Delivery Platform Fee Burden (2025-2026)

| Platform | Mediation Fee | Restaurant-paid Delivery Fee | Effective Total Burden |
|---|---|---|---|
| 배달의민족 (Top 35%) | 7.8% | 1,900-3,400 KRW/order | ~29.3% of revenue |
| 배달의민족 (Middle 35-80%) | 6.8% | 1,900-3,400 KRW/order | Similar range |
| 배달의민족 (Bottom 20%) | 2.0% | 1,900-3,400 KRW/order | Lower |
| 쿠팡이츠 | 7.8% | ~3,400 KRW/order | ~28.1-28.4% |
| 요기요 | 9.7% (base, down to 4.7%) | ~2,900 KRW/order | ~16.9-28% |
| 땡겨요 | 2.0% | Separate | ~16.9% |

**Critical findings**:
- Seoul city analysis: total platform fees range from 16.9% to 29.3% of revenue.
- On a 10,000 KRW order, effective burden can reach 41.8% when all fees combined.
- On a 15,000 KRW order, fees = 34.6%; on a 30,000 KRW order, fees = 22.7%.
- 95% of restaurant owners say delivery fees are burdensome.
- 배달의민족 started charging 6.8% on pickup/takeout orders from April 14, 2025.

**AI Coach Usage**:
- Calculate per-order profitability: "On a 15,000 KRW delivery order with 35% food cost, your actual margin after platform fees may be negative."
- Suggest optimal delivery strategy: "Focus on orders above 25,000 KRW to maintain positive margins on delivery platforms."
- Compare platform costs: "Consider listing on 땡겨요 (2% fee) alongside 배달의민족 to reduce average fee burden."

### A5. Business Closure Statistics (2024-2025)

**Scale**:
- 2024 total closures: 1,008,282 businesses (first time exceeding 1 million since records began)
- 2023 closures: 986,000 businesses

**Closure timeline**:
- Within 1 year: 5.6%
- Within 1-3 years: 34.3%
- **Total under 3 years: 40%**
- Average operating period before closure: 6.5 years

**Survival rates (all industries)**:
- 1-year survival: 62-64.4%
- 3-year survival: 38-52.3%
- 5-year survival: 25-36.4%

**Closure reasons (multiple response)**:
| Reason | Percentage |
|---|---|
| Deteriorating profitability/declining sales | 86.7% |
| Personal circumstances (aptitude, family) | 28.7% |
| Starting new ventures | 26.0% |
| Lease expiration, administrative reasons | 21.8% |

**Sub-causes of revenue decline**:
| Sub-cause | Percentage |
|---|---|
| Reduced customers due to weak domestic demand | 52.2% |
| Rising labor costs | 49.4% |
| Raw material cost increases (inflation) | 46.0% |
| Rising fixed costs (rent) | 44.6% |

**Financial impact at closure**:
- Average debt: 102.36M KRW (~$75K USD)
- Average closure costs: 21.88M KRW
  - Demolition: 5.18M KRW
  - Restoration: 3.79M KRW
  - Severance pay: 5.63M KRW
  - Taxes: 4.20M KRW

**Critical finding**: 78.2% of closed businesses did NOT use available government programs.

**Closure by industry**:
- Retail: 29.7% of all closures
- Food service: 15.2% of all closures

**AI Coach Usage**:
- Early warning: "Businesses that close typically show these warning signs 6-12 months before: 3+ consecutive months of declining revenue, prime cost exceeding 70%, inability to pay rent from operations."
- Proactive government program recommendations: "78% of businesses that closed didn't use available support. Let me check which programs you qualify for."
- Timeline awareness: "The highest-risk period is years 1-3. Your business is at month 18 -- let's focus on building sustainable unit economics."

### A6. Break-Even Timeline

- **1-person creative businesses**: Average 15.3 months to break even (중소벤처기업부 2022 survey)
- **First revenue**: Average 2.6 months after founding
- **General SMBs**: Typically 12-24 months depending on industry and capital structure

**AI Coach Usage**:
- Set realistic expectations: "Most Korean businesses take 12-18 months to reach break-even. Your current trajectory suggests [X] months."
- Cash reserve planning: "You should have at least 15-18 months of operating expenses saved or available as credit."

### A7. Startup Costs by Business Type (Korea)

| Business Type | Average Startup Cost |
|---|---|
| Online-only business | ~35M KRW (first year) |
| Mobile/app business | ~90M KRW |
| Offline store | ~100M KRW |
| Convenience store (franchise) | ~22.7M KRW |
| Cafe | ~117.54M KRW |
| Chicken franchise | ~56M KRW |

**Interior costs**: 15-pyeong space typically 30-50M KRW for new build; 5-10M KRW if taking over existing setup.

---

## B. Korean Tax & Regulatory Knowledge

### B1. Tax Calendar (2026)

| Tax | Schedule | Key Dates |
|---|---|---|
| **부가가치세 (VAT)** | Semi-annual (일반) / Annual (간이) | Jan 26: 2H prior year; Jul 27: 1H current year |
| **종합소득세 (Income Tax)** | Annual | May 31 (2026: Jun 1) |
| **원천세 (Withholding)** | Monthly (if employees) | 10th of each month |
| **지방소득세 (Local Income Tax)** | Annual (10% of income tax) | May 31 |
| **4대보험 (Social Insurance)** | Monthly (if employees) | Monthly payroll cycle |
| **등록면허세** | Annual | January |

### B2. Income Tax Brackets (종합소득세 세율)

| Taxable Income (과세표준) | Rate | Progressive Deduction (누진공제) |
|---|---|---|
| Up to 14M KRW | 6% | -- |
| 14M-50M KRW | 15% | 1,260,000 |
| 50M-88M KRW | 24% | 5,760,000 |
| 88M-150M KRW | 35% | 15,440,000 |
| 150M-300M KRW | 38% | 19,940,000 |
| 300M-500M KRW | 40% | 25,940,000 |
| 500M-1B KRW | 42% | 35,940,000 |
| Over 1B KRW | 45% | 65,940,000 |

Formula: Tax = (Taxable Income x Rate) - Progressive Deduction

**AI Coach Usage**: Auto-calculate estimated tax burden. "Based on your projected annual profit of 50M KRW, your estimated income tax will be approximately 6.24M KRW (15% rate minus 1.26M deduction), plus 10% local income tax."

### B3. Simplified vs General Taxpayer (간이과세자 vs 일반과세자)

| Criteria | 간이과세자 (Simplified) | 일반과세자 (General) |
|---|---|---|
| Annual revenue threshold | Under 104M KRW | 104M KRW and above |
| VAT rate | 1.5-4% | 10% |
| VAT filing frequency | Once/year | Twice/year |
| Tax invoice issuance | Required if revenue >= 48M | Required |
| VAT refund | Not available | Available |
| VAT exemption | Revenue under 48M KRW = exempt | Not available |

**AI Coach Usage**:
- "Your projected annual revenue is 80M KRW. As a simplified taxpayer, your VAT burden will be just 1.5-4% instead of 10%. This saves you approximately X million KRW per year."
- "Warning: If your revenue exceeds 104M KRW, you'll automatically become a general taxpayer next year. Plan for the increased tax burden."

### B4. Four Major Social Insurances (4대보험) - 2026 Rates

| Insurance | Total Rate | Employer | Employee | Change from 2025 |
|---|---|---|---|---|
| 국민연금 (National Pension) | 9.5% | 4.75% | 4.75% | +0.5%p (first increase in 25 years) |
| 건강보험 (Health Insurance) | 7.19% | 3.595% | 3.595% | +0.1%p |
| 장기요양보험 (Long-term Care) | 13.14% of health premium | Split 50/50 | Split 50/50 | +0.19%p |
| 고용보험 (Employment Insurance) | 1.8% (base) | 0.9% + 0.25-0.85% surcharge | 0.9% | Unchanged |
| 산재보험 (Industrial Accident) | Varies by industry | 100% employer | 0% | Industry-specific |

**Total employer burden**: ~11.2% of salary (excluding 산재보험)
**Total employee burden**: ~9.7% of salary

**AI Coach Usage**:
- "Hiring one employee at minimum wage (2,156,880 KRW/month) will cost you approximately 2,398,000 KRW/month including employer social insurance contributions."
- "When planning labor costs, add ~11-12% on top of gross salary for employer social insurance obligations."

### B5. Minimum Wage (2026)

- **Hourly**: 10,320 KRW (2.9% increase from 2025's 10,030 KRW)
- **Monthly (40hr/week)**: 2,156,880 KRW
- **Take-home pay**: ~1,900,000-1,960,000 KRW after deductions

**AI Coach Usage**:
- Calculate full labor cost: "One full-time employee at minimum wage costs approximately 2.4M KRW/month (salary + employer insurance). For a part-timer working 20hrs/week, budget ~1.2M KRW/month."

### B6. Commercial Lease Protection Act (상가건물임대차보호법)

**Regional Deposit Caps (환산보증금 한도)**:

| Region | Deposit Limit |
|---|---|
| Seoul | 900M KRW |
| Metropolitan overcrowding zones + Busan | 690M KRW |
| Other metropolitan cities + Sejong + select cities | 540M KRW |
| Other regions | 370M KRW |

**Key protections**:
- **Rent increase cap**: Maximum 5% per renewal period (applies within 10-year total lease)
- **Contract renewal right**: Tenant can request renewal up to 10 years total from first lease
- **Key money (권리금) protection**: Landlord must allow outgoing tenant to transfer key money to new tenant (since 2015)
- **Opposition rights (대항력)**: Available regardless of deposit amount (after business registration)
- **2026 amendment**: Starting May 12, 2026, landlords must provide detailed maintenance fee breakdowns upon tenant request

**Converted deposit formula**: Total Deposit = Deposit + (Monthly Rent x 100)

**AI Coach Usage**:
- "Your rent is 2M KRW/month with 30M KRW deposit. Your converted deposit is 230M KRW, which is under the Seoul cap (900M). You're fully protected by the Commercial Lease Protection Act."
- "Your landlord can only increase rent by max 5% at renewal. If they're demanding more, this is illegal."
- "You've been operating for 8 years. You have 2 more years of guaranteed renewal rights. Start planning for year 10."

### B7. Online Sales Business Registration (통신판매업 신고)

- **Required for**: All online sales (website, marketplace, SNS)
- **Processing time**: 3-7 business days
- **Method**: Online (gov.kr) or in-person (district office)
- **Key document**: Purchase safety service confirmation (구매안전서비스 이용확인증)
- **Annual fee**: Registration license tax (등록면허세), varies by region
- **Penalty for non-registration**: Up to 15-day business suspension + up to 5M KRW fine

---

## C. Korean Government Support Programs (2026)

### C1. Policy Funds (소상공인 정책자금)

| Fund Type | Purpose | Rate | Key Details |
|---|---|---|---|
| 성장기반자금 | Business growth/expansion | ~2.96% base | Facility + operating funds |
| 경영안정자금 | Operational stability | ~2.96% base | For businesses facing difficulties |
| 대환대출 | Refinancing high-rate loans | Lower rate conversion | Existing debt restructuring |
| 재도전특별자금 | Restart after failure | Favorable terms | For re-entrepreneurs |
| 청년고용연계자금 | Youth employment link | Favorable terms | Must employ youth |
| 신용취약자금 | Low-credit borrowers | Favorable terms | Mid-to-low credit |

- **Base rate**: ~2.96% (Q1 2026), range 2-4% depending on type
- **Non-capital region discount**: Additional 0.2%p rate reduction
- **Application**: Online at SEMAS portal or regional centers
- **Contact**: SME Integrated Call Center 1357

### C2. Startup Support Programs (창업지원사업)

| Program | Target | Max Support | Scale |
|---|---|---|---|
| 예비창업패키지 (Pre-startup) | Pre-entrepreneurs with tech/innovation | Up to 100M KRW | 660 general + 120 specialized |
| 초기창업패키지 | Startups within 3 years | Up to 100M KRW | Varies by year |
| 청년창업 (Youth Startup) | Under 29 years old | Prototype + biz model support | Through startup-focused universities |
| 기업가형 소상공인 육성 | Growth-oriented small biz | Varies | |

**Total 2026 budget**: 5.4 trillion KRW (historic high)
**Direct support programs**: 26 categories, total 1.341 trillion KRW

### C3. Digital Transformation Support

| Program | Support Details |
|---|---|
| 스마트상점 기술보급사업 | Kiosks, serving robots, AI solutions -- subsidized purchase/rental |
| 지역 디지털전환 (e.g., 화순군) | Digital equipment (kiosks, table ordering, waiting boards) -- 80% subsidy up to 1M KRW |
| 소상공인 디지털 역량강화 | Training + implementation support |

### C4. Closure & Restart Support

| Program | Details |
|---|---|
| 희망리턴패키지 (재창업) | Up to 20M KRW startup funds + up to 6M KRW demolition costs + mentoring |
| 새출발기금 | Debt reduction up to 80-90% for struggling businesses; max 1.5B KRW eligible (1B secured + 500M unsecured) |
| 재기교육/취업연계 | Career transition education + job placement |

**AI Coach Usage**:
- Match user's situation to available programs: "Based on your business stage (operating 2 years, revenue declining), you may qualify for 경영안정자금 at ~3% interest."
- "You're closing your business. The 희망리턴패키지 can cover up to 6M KRW in demolition costs and provide 20M KRW for your next venture."
- Remind about utilization gap: "78% of businesses that closed never used government programs. Let me help you find what you qualify for."

---

## D. Startup-Specific Knowledge

### D1. Burn Rate & Runway Benchmarks

| Metric | Guideline | Source |
|---|---|---|
| Minimum runway | 6+ months (absolute minimum) | Industry consensus |
| Target runway post-funding | 18-24 months | VC best practice |
| Danger zone | Under 6 months -- immediately fundraise or cut burn | Standard advice |
| Seed-stage monthly burn (Korea) | Varies widely; AI startups lean heavier | THE VC 2025 |

**Korean context (2025-2026)**:
- VC environment remains conservative: 64.8% of founders and 58.9% of investors say conditions worsened YoY.
- Early-stage startups receiving funding dropped 56.3% (749 to 327 companies) in 2025.
- Total early-stage investment volume dropped 63.2% (1.218T to 449B KRW).

**AI Coach Usage**:
- "Your monthly burn is 30M KRW with 120M KRW in the bank. That's 4 months of runway -- you need to either raise funds immediately or cut burn by 40% to reach 6-month runway."
- "In the current Korean VC climate, plan for 6-9 months to close a funding round. Start fundraising when you have 12+ months runway."

### D2. Korean Startup Investment Benchmarks (2025)

| Stage | Avg Investment/Round | Median | Typical Valuation |
|---|---|---|---|
| Pre-seed | Tens of millions KRW to 500M | -- | -- |
| Seed | 1.69B KRW (avg, 2025) | 300M KRW | -- |
| Series A | 4-9B KRW | -- | Tens of billions to 100B KRW |
| Ultra-early (<=1 year) | 3.08B KRW (avg) | -- | -- |

**Valuation multiples (2025-2026 Korea)**:
| Sector | EV/Revenue Multiple |
|---|---|
| AI / Deep Tech | 15-30x |
| SaaS / B2B | 6-12x |
| Commerce / D2C | 2-5x |
| Fintech | 5-10x |

**AI sector concentration**:
- 28.7% of early-stage funded startups are AI companies
- AI captures 33.2% of early-stage capital (up from 27.3%)
- Among ultra-early startups (<=1 year), AI captures 55.2% of investment capital

**YC benchmarks** (global, for context):
- W25 batch: 10% week-over-week growth (unprecedented)
- Top-tier YC companies (5-10%): $150K-$500K ARR, raising $2M at $20-25M post-money
- Mid-tier (60%): $3-5K monthly revenue, raising $2M at $20M post-money
- 25% of current YC startups: 95% of code AI-generated
- Some reaching $10M revenue with <10 people

### D3. Product-Market Fit (PMF) Indicators

| Indicator | Benchmark | How to Measure |
|---|---|---|
| Sean Ellis Test | 40%+ "Very disappointed" if product disappeared | Survey existing users |
| DAU/MAU ratio | >20% good, >50% world-class | Analytics |
| D1/D7/D30 retention | 40%/20%/10% = good baseline | Cohort analysis |
| NPS Score | >0 okay, >50 excellent | NPS survey |
| Week-over-week growth | 5-7% good, 10%+ exceptional | Revenue/user tracking |
| Organic growth share | >30% of new users from word-of-mouth | Attribution analysis |

**AI Coach Usage**:
- "Your Sean Ellis score is 25%. You haven't reached PMF yet. Focus on talking to your most engaged users to understand what they love."
- "Your DAU/MAU is 35% -- that's strong engagement. You likely have PMF with your core user segment."

### D4. Unit Economics Framework

**Core metrics**:
| Metric | Formula | Good Benchmark |
|---|---|---|
| CAC (Customer Acquisition Cost) | Total S&M / New Customers | Industry-dependent |
| LTV (Lifetime Value) | (ARPU x Gross Margin) / Churn Rate | 3x+ CAC |
| LTV:CAC Ratio | LTV / CAC | 3:1 minimum; 5:1+ for subscriptions |
| CAC Payback Period | CAC / (Monthly Revenue per Customer x Gross Margin) | <12 months excellent; <18 months healthy |

**Industry-specific CAC payback**:
- E-commerce: 3-6 months
- SaaS: 12-18 months (healthy)
- Fintech / Enterprise: 18-24 months

### D5. SaaS Metrics Benchmarks (2025)

| Metric | Benchmark | Notes |
|---|---|---|
| Annual churn rate | <5% excellent, <10% median | SMB churn 8.2x higher than enterprise |
| Net Revenue Retention (NRR) | 100-110% ($1-10M ARR), 110-120% ($10-50M ARR), 120%+ ($50M+) | NRR >= 100% = 2x faster growth |
| Rule of 40 | Growth Rate + Profit Margin >= 40% | Balances speed with sustainability |
| Expansion revenue share | ~40% of growth at $15-30M ARR | Up from 30% in 2021 |

**AI Coach Usage**:
- "Your monthly churn is 8% -- that's 96% annualized, far above the 5-10% benchmark. Fix retention before spending more on acquisition."
- "Your LTV:CAC ratio is 1.5:1 -- you're spending too much to acquire customers who don't stay long enough. Either reduce CAC or increase retention."

---

## E. Global Best Practices for Small Business

### E1. Restaurant Cost Control Framework

**Food Cost Optimization** (target: 28-35%):
1. **FIFO inventory system**: First In, First Out -- date-label everything, oldest stock in front
2. **PAR level management**: Set minimum stock quantities based on average daily usage x days between orders + safety buffer
3. **Supplier management**: Compare 3+ suppliers quarterly; negotiate bulk discounts; cross-utilize ingredients across dishes
4. **Portion control**: Standardize recipes with exact measurements; use scales and portioning tools
5. **Waste tracking**: Measure and categorize waste weekly; target <2% of food purchases
6. **Technology**: POS-integrated inventory tracking with automatic reorder alerts

**Labor Cost Optimization** (target: 20-30%):
1. **Demand forecasting**: Use historical sales data by hour/day/season to predict staffing needs
2. **Flexible scheduling**: Cross-train employees for multiple roles; use split shifts during slow periods
3. **Technology**: Scheduling software that aligns labor hours with actual sales patterns
4. **Performance tracking**: Monitor labor cost as % of revenue in real-time during each shift

### E2. Menu Engineering Matrix

| Category | Popularity | Profitability | Strategy |
|---|---|---|---|
| **Stars** | High | High | Promote heavily; feature prominently on menu; protect recipe |
| **Plowhorses** | High | Low | Adjust portions, increase price slightly, pair with high-margin sides |
| **Puzzles** | Low | High | Rename, reposition on menu, train staff to recommend, run promotions |
| **Dogs** | Low | Low | Remove from menu or completely reformulate |

**Impact**: Restaurants that invest in menu engineering typically see 10-15% profit increase.

**AI Coach Usage**:
- "Upload your menu with costs and sales data. I'll classify each item as Star, Plowhorse, Puzzle, or Dog and suggest specific actions."
- "Your best-selling bibimbap is a Plowhorse (popular but low margin). Consider: (1) reducing portion 5%, (2) adding 1,000 KRW to price, (3) pairing with a high-margin side dish."

### E3. Cash Flow Management (13-Week Framework)

**Why**: 82% of small businesses fail due to cash flow problems, not lack of sales.

**Structure**:
```
Week 1-13 Rolling Forecast:
[+] Cash Inflows: Sales revenue, receivables, other income
[-] Cash Outflows: Payroll, rent, suppliers, insurance, loan payments, taxes
[=] Net Cash Flow per week
[Running] Beginning Balance -> Ending Balance
```

**Implementation steps**:
1. Collect 12+ months of historical financial data
2. Identify recurring patterns (seasonal, weekly cycles)
3. Project inflows conservatively; project outflows generously
4. Update weekly: compare actual vs forecast, adjust future weeks
5. Maintain rolling 13-week horizon at all times

**Key rules**:
- Always know your cash position 13 weeks out
- Identify potential shortfalls 4-6 weeks before they occur
- Keep cash reserves equal to 2-3 months of operating expenses

**AI Coach Usage**:
- "Based on your data, you'll face a cash shortfall of 5M KRW in week 8. Options: (1) negotiate 30-day payment extension with supplier X, (2) draw on your credit line, (3) run a promotion to accelerate revenue weeks 5-7."

### E4. Pricing Strategy Framework

| Strategy | Best For | Key Principle |
|---|---|---|
| **Cost-Plus** | Commodity products, simple services | Cost + fixed markup % |
| **Value-Based** | Differentiated products, premium services | Price based on customer-perceived value |
| **Competitive** | Crowded markets, price-sensitive customers | Match or undercut competitors |
| **Dynamic** | Delivery, seasonal businesses | Adjust based on real-time demand |

**Small business recommendation**: Start with cost-plus to ensure coverage, then evolve toward value-based pricing as brand strengthens.

**AI Coach Usage**:
- "Your food cost is 35% and you're charging 9,000 KRW per dish. With a 2.5x markup, you should be at 12,000+ KRW. Consider repositioning this as a premium offering."
- "Three competitors within 500m are charging 8,000-9,000 KRW for similar items. Either match their price or clearly communicate what makes yours worth more."

### E5. Customer Retention Strategies

**Key statistics**:
- Increasing retention by 5% can boost profits by 25-95%
- Loyalty program members generate 12-18% more incremental revenue
- Top loyalty programs boost revenue by 15-25% annually
- Loyalty programs return 4.8x the initial investment on average
- 56% of consumers become repeat buyers after a personalized experience

**Local business retention playbook**:
1. **Simple loyalty program**: Digital stamp card (10th visit free or similar)
2. **Personalized communication**: Birthday messages, preference-based recommendations
3. **Consistent quality**: The #1 driver of repeat visits
4. **Community building**: Events, social media engagement, local partnerships
5. **Feedback loops**: Regular surveys, act on feedback visibly

**AI Coach Usage**:
- "You're spending 50,000 KRW per new customer through advertising but losing 40% within 3 months. Redirecting 30% of your marketing budget to retention (loyalty program, follow-up messages) could yield 3-5x better ROI."

---

## F. Cross-Reference: AI Coaching Scenarios

### F1. New Business Health Check

When a user first connects, the AI coach should benchmark against:
1. Food/ingredient cost ratio vs industry average (A1)
2. Labor cost ratio vs industry average (A1, A2)
3. Rent-to-revenue ratio vs recommended range (A2)
4. Prime cost check (food + labor < 60%)
5. Operating profit margin vs 8.7% national average (A1)
6. Monthly revenue vs industry average (A3)
7. Delivery platform fee analysis if applicable (A4)

### F2. Tax Planning Calendar

Auto-generate reminders:
- January: VAT filing for prior year 2H + 등록면허세
- Monthly: Withholding tax (if employees) by 10th
- May: Income tax + local income tax filing
- July: VAT filing for current year 1H
- Monthly: 4대보험 payments
- Quarterly: Estimated tax prepayments if applicable

### F3. Crisis Detection Triggers

Flag for immediate coaching intervention:
- Revenue declining 3+ consecutive months
- Prime cost exceeding 70% of revenue
- Cash runway under 2 months
- Rent exceeding 15% of revenue
- Employee turnover spiking
- Delivery fee ratio exceeding 25% of delivery revenue

### F4. Government Program Matching

Based on user profile, automatically recommend:
- **Pre-startup**: 예비창업패키지 (up to 100M KRW)
- **Under 3 years, struggling**: 경영안정자금 (~3% rate)
- **High-rate debt**: 대환대출 (refinancing)
- **Digital upgrade needed**: 스마트상점 기술보급사업
- **Considering closure**: 희망리턴패키지 (20M restart + 6M demolition)
- **Heavy debt post-closure**: 새출발기금 (up to 90% debt reduction)
- **Youth under 29**: 청년창업 programs
- **Re-entrepreneur**: 재도전특별자금

---

## Sources

### Korean Government & Official Sources
- [National Tax Service (국세청)](https://www.nts.go.kr)
- [Ministry of SMEs and Startups (중소벤처기업부)](https://www.mss.go.kr)
- [SEMAS (소상공인시장진흥공단)](https://www.semas.or.kr)
- [Ministry of Agriculture, Food and Rural Affairs (농림축산식품부)](https://www.mafra.go.kr)
- [Korea Real Estate Board (한국부동산원)](https://www.reb.or.kr)
- [KOSIS National Statistics Portal](https://kosis.kr)
- [K-Startup Portal](https://www.k-startup.go.kr)
- [BizInfo (기업지원통합정보)](https://www.bizinfo.go.kr)
- [New Start Fund (새출발기금)](https://www.newstartfund.or.kr)
- [Minimum Wage Commission (최저임금위원회)](https://www.minimumwage.go.kr)
- [Easy Law (찾기쉬운 생활법령)](https://easylaw.go.kr)

### Industry Data & Research
- [THE VC - Korean Startup Investment Database](https://thevc.kr)
- [KCD Data Lab (소상공인 데이터 랩)](https://data-lab.kcd.co.kr)
- [Korea Rural Economic Institute (KREI)](https://www.krei.re.kr)
- [KB Financial Group Research](https://kbthink.com)
- [KPMG Korea - F&B Franchise Report 2025](https://assets.kpmg.com)
- [Seoul City Delivery Platform Analysis (2025)](https://www.etoday.co.kr)
- [Newsis - Small Business Closure Survey (2025)](https://www.newsis.com)

### Global Benchmarks
- [Y Combinator Startup Library](https://www.ycombinator.com/library)
- [Rebel Fund - YC Seed Round Benchmarks 2025](https://www.rebelfund.vc)
- [High Alpha - 2025 SaaS Benchmarks Report](https://www.highalpha.com/saas-benchmarks)
- [Toast POS - Menu Engineering Guide](https://pos.toasttab.com)
- [Shopify - Customer Retention Programs](https://www.shopify.com/blog/customer-retention-program)
- [Fractional CFO School - 13-Week Cash Flow Model](https://fractionalcfoschool.com)
