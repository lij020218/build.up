import { buildRoadmapState, evaluateStageCompletion } from "./roadmap/workflow";
import type { FreshnessMeta } from "./types/freshness";
import type {
  RecommendationItem,
  RoadmapStageState,
  WorkflowDecisionMap,
  WorkflowTaskMap
} from "./types/roadmap";

type StarterCard = {
  title: string;
  summary: string;
  points: string[];
};

export type StarterIndustryCategory = {
  id: string;
  title: string;
  summary: string;
};

const officialFreshness: FreshnessMeta = {
  status: "fresh",
  label: "Official source reviewed",
  lastCheckedAt: "2026-03-19T09:00:00+09:00",
  nextReviewAt: "2026-03-26T09:00:00+09:00",
  sources: [
    {
      sourceName: "Government and official provider source",
      sourceUrl: "https://example.com/official-source",
      verifiedAt: "2026-03-19T09:00:00+09:00",
      confidence: "high"
    }
  ]
};

const reviewSoonFreshness: FreshnessMeta = {
  status: "review_soon",
  label: "Review due soon",
  lastCheckedAt: "2026-03-15T09:00:00+09:00",
  nextReviewAt: "2026-03-22T09:00:00+09:00",
  notes: "Recheck district lease and competition changes before final contract.",
  sources: [
    {
      sourceName: "District commercial trend source",
      sourceUrl: "https://example.com/district-trends",
      verifiedAt: "2026-03-15T09:00:00+09:00",
      confidence: "medium"
    }
  ]
};

export const starterStepCards: StarterCard[] = [
  {
    title: "Roadmap-first flow",
    summary:
      "Users clear one focused stage at a time instead of getting lost in a dashboard full of tasks.",
    points: [
      "Current-step driven UI",
      "Deterministic stage progression",
      "Completion unlocks the next stage"
    ]
  },
  {
    title: "Logic before AI",
    summary:
      "Rules, branching, and required checks stay in code so product behavior stays reliable and explainable.",
    points: [
      "Workflow engine for progression",
      "Rule engine for risks and gating",
      "AI only for explanation and nuanced comparison"
    ]
  },
  {
    title: "Freshness-aware information",
    summary:
      "Every user-facing recommendation can carry source and freshness metadata so quality stays visible.",
    points: [
      "Verified date and review windows",
      "Source confidence markers",
      "Stale content can be blocked before display"
    ]
  }
];

export const starterIndustryCategories: StarterIndustryCategory[] = [
  {
    id: "food",
    title: "Food Service",
    summary: "Restaurants, delivery-first kitchens, and casual meal formats."
  },
  {
    id: "cafe-dessert",
    title: "Cafe & Dessert",
    summary: "Coffee, bakery, takeout drinks, and dessert-focused concepts."
  },
  {
    id: "retail",
    title: "Retail",
    summary: "Small-format stores, convenience, lifestyle goods, and specialty retail."
  },
  {
    id: "beauty",
    title: "Beauty",
    summary: "Hair, nails, skin care, and appointment-based self-care services."
  },
  {
    id: "fitness",
    title: "Fitness",
    summary: "Studios, gyms, and recurring membership-based wellness formats."
  },
  {
    id: "education",
    title: "Education",
    summary: "Classes, tutoring, academies, and recurring instruction businesses."
  },
  {
    id: "pet",
    title: "Pet",
    summary: "Pet services, grooming, supplies, and care-focused shops."
  },
  {
    id: "living-service",
    title: "Living Service",
    summary: "Laundry, cleaning, repair, and neighborhood convenience services."
  },
  {
    id: "space",
    title: "Space & Stay",
    summary: "Study rooms, rental spaces, guest stays, and managed venues."
  },
  {
    id: "online-digital",
    title: "Online & Digital",
    summary: "E-commerce, digital products, and creator-led service businesses."
  },
  {
    id: "startup-tech",
    title: "Tech Startup",
    summary: "AI products, SaaS, fintech, developer tools, and venture-backed software companies."
  }
];

export const starterIndustryOptions: RecommendationItem[] = [
  {
    id: "korean-casual",
    title: "Korean Meals / Casual Dining",
    score: 80,
    summary: "Reliable lunch and dinner demand, but menu operations need discipline.",
    reasons: ["Broad customer familiarity", "Works well in mixed office-residential areas"],
    warnings: ["Kitchen labor and ingredient prep complexity rises quickly"],
    meta: { categoryId: "food", categoryLabel: "Food Service" }
  },
  {
    id: "delivery-meals",
    title: "Delivery-first Meals",
    score: 84,
    summary: "Good fit for founders who want smaller space needs and faster launch cycles.",
    reasons: ["Less dependence on seating", "Can work with tighter frontage constraints"],
    warnings: ["Platform fees and packaging costs need tighter margin control"],
    meta: { categoryId: "food", categoryLabel: "Food Service" }
  },
  {
    id: "salad-healthy",
    title: "Salad & Healthy Meals",
    score: 77,
    summary: "Clear brand story and repeat demand, but ingredient waste control matters.",
    reasons: ["Strong fit for office and fitness-adjacent customers", "Premium pricing can work with a clean brand"],
    warnings: ["Fresh inventory control is sensitive from day one"],
    meta: { categoryId: "food", categoryLabel: "Food Service" }
  },
  {
    id: "ramen-noodle",
    title: "Noodles / Soup / Gukbap",
    score: 78,
    summary: "Strong repeat demand format with simpler menu focus and compact operations.",
    reasons: ["Easy customer understanding", "Can work in lunch-heavy corridors"],
    warnings: ["Flavor consistency matters immediately"],
    meta: { categoryId: "food", categoryLabel: "Food Service" }
  },
  {
    id: "chicken-burger",
    title: "Chicken / Burger / Pizza",
    score: 79,
    summary: "Fast-turn format that can work well with delivery and takeout together.",
    reasons: ["Clear menu proposition", "Strong fit for hybrid channels"],
    warnings: ["Promotion-heavy competition can compress margins"],
    meta: { categoryId: "food", categoryLabel: "Food Service" }
  },
  {
    id: "western-pasta-brunch",
    title: "Western / Pasta / Brunch",
    score: 81,
    summary: "Brand and plating matter more, but pasta and brunch demand can build clear destination traffic.",
    reasons: ["Covers pasta, brunch, and light western dining", "Good fit for concept-driven neighborhoods"],
    warnings: ["Kitchen prep and customer expectation can be higher"],
    meta: { categoryId: "food", categoryLabel: "Food Service" }
  },
  {
    id: "takeout-coffee",
    title: "Takeout Coffee",
    score: 87,
    summary: "A lean format for founders prioritizing throughput and smaller spaces.",
    reasons: ["Lower seating dependency", "Faster service flow and smaller footprint"],
    warnings: ["Needs stronger differentiation in dense coffee corridors"],
    meta: { categoryId: "cafe-dessert", categoryLabel: "Cafe & Dessert" }
  },
  {
    id: "specialty-coffee",
    title: "Specialty Coffee Bar",
    score: 82,
    summary: "Quality-led coffee concept suited to brand-conscious neighborhoods.",
    reasons: ["Stronger premium positioning", "Good fit for loyal regulars"],
    warnings: ["Bean quality and bar workflow need discipline"],
    meta: { categoryId: "cafe-dessert", categoryLabel: "Cafe & Dessert" }
  },
  {
    id: "dessert-cafe",
    title: "Dessert Cafe",
    score: 84,
    summary: "Brandable format with stronger repeat and social sharing potential.",
    reasons: ["Works well with visual branding", "Can start lean with takeout focus"],
    warnings: ["Ingredient spoilage needs tighter cost control"],
    meta: { categoryId: "cafe-dessert", categoryLabel: "Cafe & Dessert" }
  },
  {
    id: "bakery-studio",
    title: "Bakery Studio",
    score: 78,
    summary: "More setup work, but stronger brand depth in destination neighborhoods.",
    reasons: ["Higher perceived value", "Can expand into classes or branded retail"],
    warnings: ["Equipment and production setup can delay opening"],
    meta: { categoryId: "cafe-dessert", categoryLabel: "Cafe & Dessert" }
  },
  {
    id: "icecream-bingsu",
    title: "Ice Cream / Bingsu",
    score: 73,
    summary: "Seasonal peaks can be strong when branding and location match well.",
    reasons: ["Highly visual product appeal", "Can drive destination traffic"],
    warnings: ["Seasonality affects cash-flow planning"],
    meta: { categoryId: "cafe-dessert", categoryLabel: "Cafe & Dessert" }
  },
  {
    id: "self-serve-cafe",
    title: "Self-serve / Unmanned Cafe",
    score: 68,
    summary: "Lower staffing pressure, but location and automation quality matter more.",
    reasons: ["Lean labor structure", "Can work in functional foot-traffic zones"],
    warnings: ["Differentiation and machine maintenance matter"],
    meta: { categoryId: "cafe-dessert", categoryLabel: "Cafe & Dessert" }
  },
  {
    id: "convenience-small",
    title: "Neighborhood Convenience",
    score: 74,
    summary: "Predictable traffic potential, but staffing and operating hours matter early.",
    reasons: ["Useful for dense residential micro-markets", "Strong repeat purchase behavior"],
    warnings: ["Long hours can strain labor planning"],
    meta: { categoryId: "retail", categoryLabel: "Retail" }
  },
  {
    id: "lifestyle-goods",
    title: "Lifestyle Goods Store",
    score: 71,
    summary: "Brand-led retail that benefits from curation and walk-in discovery.",
    reasons: ["Can build loyal repeat buyers", "Good fit for design-forward neighborhoods"],
    warnings: ["Inventory buying discipline is critical"],
    meta: { categoryId: "retail", categoryLabel: "Retail" }
  },
  {
    id: "beauty-supplies",
    title: "Beauty Supplies Retail",
    score: 69,
    summary: "Works when curated assortment and local demand align.",
    reasons: ["Can bundle retail with appointment services", "Relatively clear product positioning"],
    warnings: ["Slow-moving inventory can tie up cash"],
    meta: { categoryId: "retail", categoryLabel: "Retail" }
  },
  {
    id: "fashion-accessories",
    title: "Fashion Accessories",
    score: 68,
    summary: "Brand and merchandising matter more than pure convenience traffic.",
    reasons: ["Good fit for curated assortments", "Can benefit from social discovery"],
    warnings: ["Trend risk can age inventory quickly"],
    meta: { categoryId: "retail", categoryLabel: "Retail" }
  },
  {
    id: "health-food-store",
    title: "Health Food Store",
    score: 70,
    summary: "Useful when trust and product explanation are part of the purchase journey.",
    reasons: ["Clear health-led demand niche", "Can support subscription or repeat bundles"],
    warnings: ["Product compliance and trust messaging matter"],
    meta: { categoryId: "retail", categoryLabel: "Retail" }
  },
  {
    id: "unmanned-retail",
    title: "Unmanned / Convenience Retail",
    score: 67,
    summary: "Low-touch retail format that depends heavily on product mix and location fit.",
    reasons: ["Leaner staffing assumptions", "Can fit smaller neighborhood footprints"],
    warnings: ["Shrinkage and product turnover matter"],
    meta: { categoryId: "retail", categoryLabel: "Retail" }
  },
  {
    id: "hair-salon",
    title: "Hair Salon",
    score: 82,
    summary: "Service-led recurring business with strong local loyalty potential.",
    reasons: ["Repeat booking behavior can be strong", "Works well with neighborhood retention"],
    warnings: ["Operator skill and staffing quality matter from day one"],
    meta: { categoryId: "beauty", categoryLabel: "Beauty" }
  },
  {
    id: "nail-studio",
    title: "Nail Studio",
    score: 79,
    summary: "Compact footprint and repeat visit model make it accessible for first founders.",
    reasons: ["Small space efficiency", "Appointment-driven demand can stabilize schedule"],
    warnings: ["Local competition density can be high"],
    meta: { categoryId: "beauty", categoryLabel: "Beauty" }
  },
  {
    id: "skin-care-room",
    title: "Skin Care Studio",
    score: 76,
    summary: "Higher trust business with stronger service explanation needs.",
    reasons: ["Premium pricing can work with strong positioning", "Membership models are possible"],
    warnings: ["Licensing and trust-building take more effort"],
    meta: { categoryId: "beauty", categoryLabel: "Beauty" }
  },
  {
    id: "waxing-studio",
    title: "Waxing Studio",
    score: 75,
    summary: "Compact appointment model with high repeat potential in the right location.",
    reasons: ["Small footprint possible", "Recurring visit behavior can be strong"],
    warnings: ["Skill quality and privacy experience matter"],
    meta: { categoryId: "beauty", categoryLabel: "Beauty" }
  },
  {
    id: "eyelash-brow",
    title: "Eyelash / Brow Studio",
    score: 74,
    summary: "Service-led beauty format with strong repeat patterns and compact space needs.",
    reasons: ["Small setup requirement", "Good add-on or upsell structure"],
    warnings: ["Local competition can become dense quickly"],
    meta: { categoryId: "beauty", categoryLabel: "Beauty" }
  },
  {
    id: "makeup-bridal",
    title: "Makeup / Bridal Studio",
    score: 69,
    summary: "Reservation-led beauty service with event-based demand and higher trust needs.",
    reasons: ["Premium service packaging possible", "Brand story can be clear"],
    warnings: ["Demand can be seasonal and event-dependent"],
    meta: { categoryId: "beauty", categoryLabel: "Beauty" }
  },
  {
    id: "pilates-studio",
    title: "Pilates Studio",
    score: 81,
    summary: "Appointment and membership mix can create steady retention.",
    reasons: ["Recurring revenue structure", "Clear target customer segmentation"],
    warnings: ["Instructor scheduling and churn need careful planning"],
    meta: { categoryId: "fitness", categoryLabel: "Fitness" }
  },
  {
    id: "pt-gym",
    title: "PT-focused Gym",
    score: 75,
    summary: "Good value per customer, but space and staffing economics matter more.",
    reasons: ["Higher ticket services", "Can combine membership and PT upsell"],
    warnings: ["Equipment and lease costs can rise quickly"],
    meta: { categoryId: "fitness", categoryLabel: "Fitness" }
  },
  {
    id: "yoga-studio",
    title: "Yoga Studio",
    score: 74,
    summary: "Community retention can be strong when class quality is consistent.",
    reasons: ["Recurring class format", "Strong local community potential"],
    warnings: ["Schedule fill rate needs close monitoring"],
    meta: { categoryId: "fitness", categoryLabel: "Fitness" }
  },
  {
    id: "crossfit-box",
    title: "CrossFit / Group Training",
    score: 71,
    summary: "Community-led training model with strong retention when coaching quality is high.",
    reasons: ["Group format supports energy and community", "Membership loyalty can be strong"],
    warnings: ["Noise, safety, and coach quality matter a lot"],
    meta: { categoryId: "fitness", categoryLabel: "Fitness" }
  },
  {
    id: "golf-studio",
    title: "Screen Golf / Golf Studio",
    score: 73,
    summary: "Higher setup cost but clearer premium positioning in the right district.",
    reasons: ["Strong repeat leisure demand", "Premium pricing can work"],
    warnings: ["Equipment and rent pressure are higher"],
    meta: { categoryId: "fitness", categoryLabel: "Fitness" }
  },
  {
    id: "unmanned-fitness",
    title: "Unmanned / 24h Fitness",
    score: 69,
    summary: "Operationally leaner fitness model that needs security, access, and equipment discipline.",
    reasons: ["Lower front-desk dependence", "Can support membership convenience"],
    warnings: ["Equipment upkeep and safety systems matter"],
    meta: { categoryId: "fitness", categoryLabel: "Fitness" }
  },
  {
    id: "study-room",
    title: "Study Room / Study Cafe",
    score: 78,
    summary: "Stable demand in education-heavy zones with disciplined seat utilization.",
    reasons: ["Clear target market", "Strong fit for recurring pass models"],
    warnings: ["Location and quiet-space quality are critical"],
    meta: { categoryId: "education", categoryLabel: "Education" }
  },
  {
    id: "kids-academy",
    title: "Kids Academy",
    score: 72,
    summary: "Strong recurring revenue potential, but trust and regulatory setup matter more.",
    reasons: ["Clear family repeat behavior", "Can support higher retention when outcomes are clear"],
    warnings: ["Instructor quality and compliance raise startup complexity"],
    meta: { categoryId: "education", categoryLabel: "Education" }
  },
  {
    id: "adult-class",
    title: "Adult Hobby Class",
    score: 73,
    summary: "Flexible format with brandable content, especially in community-led neighborhoods.",
    reasons: ["Can start lean", "Works well with reservations and small groups"],
    warnings: ["Demand can be more seasonal"],
    meta: { categoryId: "education", categoryLabel: "Education" }
  },
  {
    id: "language-academy",
    title: "Language Academy",
    score: 74,
    summary: "Recurring class model with clear outcomes and strong parent or adult demand.",
    reasons: ["Repeat enrollment potential", "Outcome messaging is easier to explain"],
    warnings: ["Teacher quality and retention matter"],
    meta: { categoryId: "education", categoryLabel: "Education" }
  },
  {
    id: "coding-class",
    title: "Coding / Digital Skills Class",
    score: 75,
    summary: "Skill-based learning format suited to recurring cohorts and modern parent demand.",
    reasons: ["Strong relevance for youth and adult learners", "Can mix offline and online delivery"],
    warnings: ["Curriculum quality must stay current"],
    meta: { categoryId: "education", categoryLabel: "Education" }
  },
  {
    id: "small-study-room",
    title: "Study Room / Small Tutoring",
    score: 72,
    summary: "Compact education model that can mix tutoring, homework, and focused study support.",
    reasons: ["Lean space requirement possible", "Clear local parent demand in some districts"],
    warnings: ["Trust and instruction quality matter early"],
    meta: { categoryId: "education", categoryLabel: "Education" }
  },
  {
    id: "pet-grooming",
    title: "Pet Grooming",
    score: 80,
    summary: "Recurring service demand with strong neighborhood retention potential.",
    reasons: ["Repeat visit behavior", "Can bundle care and retail add-ons"],
    warnings: ["Skill quality and safety trust are core"],
    meta: { categoryId: "pet", categoryLabel: "Pet" }
  },
  {
    id: "pet-supplies",
    title: "Pet Supplies Shop",
    score: 70,
    summary: "Retail-led model that works better with a strong local care ecosystem.",
    reasons: ["Can pair with grooming or daycare", "Repeat consumable purchases help"],
    warnings: ["Differentiation is harder without service layering"],
    meta: { categoryId: "pet", categoryLabel: "Pet" }
  },
  {
    id: "pet-hotel",
    title: "Pet Hotel / Daycare",
    score: 72,
    summary: "Higher-trust pet care model with stronger weekend and holiday demand.",
    reasons: ["Can build recurring care relationships", "Adds premium service positioning"],
    warnings: ["Safety, staffing, and cleanliness standards are critical"],
    meta: { categoryId: "pet", categoryLabel: "Pet" }
  },
  {
    id: "pet-cafe",
    title: "Pet Cafe",
    score: 66,
    summary: "Experience-led format that needs careful hygiene, zoning, and concept execution.",
    reasons: ["Strong experiential appeal", "Can attract destination traffic"],
    warnings: ["Regulation and hygiene complexity are higher"],
    meta: { categoryId: "pet", categoryLabel: "Pet" }
  },
  {
    id: "pet-training-school",
    title: "Pet Training / Kindergarten",
    score: 71,
    summary: "Behavior and care-focused model with higher trust and repeat potential.",
    reasons: ["Recurring care relationship possible", "Can support premium service positioning"],
    warnings: ["Staff quality and safety standards are critical"],
    meta: { categoryId: "pet", categoryLabel: "Pet" }
  },
  {
    id: "pet-walking-visit",
    title: "Pet Walking / Visit Care",
    score: 68,
    summary: "Low-footprint service model that relies on scheduling and trust more than storefront traffic.",
    reasons: ["No large storefront required", "Can start with leaner fixed cost"],
    warnings: ["Scheduling reliability and trust matter most"],
    meta: { categoryId: "pet", categoryLabel: "Pet" }
  },
  {
    id: "laundry-service",
    title: "Laundry Service",
    score: 75,
    summary: "Utility-driven demand with stable local usage patterns.",
    reasons: ["Clear neighborhood demand", "Operations are easier to explain to first-time users"],
    warnings: ["Machine downtime directly affects trust"],
    meta: { categoryId: "living-service", categoryLabel: "Living Service" }
  },
  {
    id: "cleaning-service",
    title: "Cleaning Service",
    score: 73,
    summary: "Service demand can be strong, but staffing reliability matters immediately.",
    reasons: ["Can start with lower storefront needs", "B2B and household demand both possible"],
    warnings: ["Hiring quality and schedule coordination are core risks"],
    meta: { categoryId: "living-service", categoryLabel: "Living Service" }
  },
  {
    id: "repair-service",
    title: "Repair & Fix Service",
    score: 68,
    summary: "Niche but useful when local convenience and trust can be established.",
    reasons: ["Strong problem-solving value", "Can benefit from neighborhood loyalty"],
    warnings: ["Demand predictability can vary by category"],
    meta: { categoryId: "living-service", categoryLabel: "Living Service" }
  },
  {
    id: "self-laundry",
    title: "Self-service Laundry",
    score: 74,
    summary: "Relatively simple service model with location quality and machine uptime as core drivers.",
    reasons: ["Operational model is easier to understand", "Works with low-touch staffing"],
    warnings: ["Location and maintenance discipline are everything"],
    meta: { categoryId: "living-service", categoryLabel: "Living Service" }
  },
  {
    id: "print-copy",
    title: "Print / Copy Service",
    score: 67,
    summary: "Utility-led business that benefits from proximity to schools, offices, or government demand.",
    reasons: ["Practical repeat demand can exist", "Can bundle shipping and document services"],
    warnings: ["Pure copy demand may be shrinking in some districts"],
    meta: { categoryId: "living-service", categoryLabel: "Living Service" }
  },
  {
    id: "device-repair",
    title: "Phone / Small Device Repair",
    score: 70,
    summary: "Practical service model with repeat local need when trust and speed are strong.",
    reasons: ["Clear problem-solving demand", "Can pair with accessories or utility sales"],
    warnings: ["Technical skill and trust are core"],
    meta: { categoryId: "living-service", categoryLabel: "Living Service" }
  },
  {
    id: "guesthouse",
    title: "Guesthouse",
    score: 67,
    summary: "Strong upside in the right tourism zone, but licensing and operations are heavier.",
    reasons: ["Clear location leverage", "Can differentiate through hospitality brand"],
    warnings: ["Operational and compliance overhead is higher"],
    meta: { categoryId: "space", categoryLabel: "Space & Stay" }
  },
  {
    id: "rental-studio",
    title: "Rental Studio",
    score: 76,
    summary: "Reservation-led model that can work well with creator or local community demand.",
    reasons: ["Flexible use cases", "Can monetise hourly without full retail operations"],
    warnings: ["Occupancy rate is everything"],
    meta: { categoryId: "space", categoryLabel: "Space & Stay" }
  },
  {
    id: "party-room",
    title: "Party Room",
    score: 69,
    summary: "Can work with strong neighborhood demand, but regulation and noise issues matter.",
    reasons: ["Simple offer to understand", "Reservation model is clear"],
    warnings: ["Complaints and local restrictions can become core risk"],
    meta: { categoryId: "space", categoryLabel: "Space & Stay" }
  },
  {
    id: "study-cafe-space",
    title: "Study Cafe",
    score: 75,
    summary: "Seat-utilization business with strong fit in exam-heavy or residential education districts.",
    reasons: ["Predictable target demand", "Can run with membership or pass models"],
    warnings: ["Silence, cleanliness, and occupancy rates are critical"],
    meta: { categoryId: "space", categoryLabel: "Space & Stay" }
  },
  {
    id: "shared-office",
    title: "Shared Office / Small Workspace",
    score: 70,
    summary: "Recurring workspace model that works when local freelancer or startup demand is visible.",
    reasons: ["Membership-style revenue possible", "Can add meeting room upsells"],
    warnings: ["Fit depends heavily on district demand"],
    meta: { categoryId: "space", categoryLabel: "Space & Stay" }
  },
  {
    id: "practice-room",
    title: "Practice Room / Lesson Room",
    score: 71,
    summary: "Reservation-led space model suited to music, dance, and private coaching demand.",
    reasons: ["Clear hourly monetization", "Can serve creator and lesson traffic"],
    warnings: ["Occupancy rate and noise control matter"],
    meta: { categoryId: "space", categoryLabel: "Space & Stay" }
  },
  {
    id: "smart-store",
    title: "Smart Store Commerce",
    score: 77,
    summary: "Good entry point for product-led businesses without a storefront lease.",
    reasons: ["Lower physical overhead", "Can test product-market fit faster"],
    warnings: ["Traffic acquisition and margins need discipline"],
    meta: { categoryId: "online-digital", categoryLabel: "Online & Digital" }
  },
  {
    id: "digital-products",
    title: "Digital Products",
    score: 74,
    summary: "Lean inventory structure, but clear niche positioning matters more.",
    reasons: ["No physical stock required", "Can scale with a small team"],
    warnings: ["Demand trust and niche clarity are critical"],
    meta: { categoryId: "online-digital", categoryLabel: "Online & Digital" }
  },
  {
    id: "creator-service",
    title: "Creator-led Service",
    score: 72,
    summary: "Audience-led business with flexible formats across content and consulting.",
    reasons: ["Can launch quickly", "Works well with a personal brand"],
    warnings: ["Revenue can fluctuate more without recurring offers"],
    meta: { categoryId: "online-digital", categoryLabel: "Online & Digital" }
  },
  {
    id: "consignment-commerce",
    title: "Consignment / Marketplace Selling",
    score: 71,
    summary: "Low-inventory entry path for founders who want to validate demand before stocking deeply.",
    reasons: ["Lower upfront stock burden", "Can test multiple product lines quickly"],
    warnings: ["Margin control can be weaker than owned inventory"],
    meta: { categoryId: "online-digital", categoryLabel: "Online & Digital" }
  },
  {
    id: "newsletter-membership",
    title: "Newsletter / Membership Content",
    score: 69,
    summary: "Audience-led digital business with recurring revenue potential when niche trust is strong.",
    reasons: ["Low fixed overhead", "Recurring subscriber model is possible"],
    warnings: ["Niche trust and consistency matter more than volume"],
    meta: { categoryId: "online-digital", categoryLabel: "Online & Digital" }
  },
  {
    id: "global-buying",
    title: "Global Buying / Cross-border Selling",
    score: 70,
    summary: "Product-selling model with lower local rent burden but more sourcing and fulfillment complexity.",
    reasons: ["No storefront lease needed", "Can test niche demand across channels"],
    warnings: ["Shipping, sourcing, and refund handling matter"],
    meta: { categoryId: "online-digital", categoryLabel: "Online & Digital" }
  },
  {
    id: "ai-application",
    title: "AI Application / Agent",
    score: 86,
    summary: "Fast-moving startup segment with strong demand, but retention and reliability matter immediately.",
    reasons: ["Clear 2025-2026 demand signal across workflows", "Can validate with a narrow wedge use case first"],
    warnings: ["Model costs, eval quality, and differentiation must be tightly controlled"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "developer-tools",
    title: "Developer Tools / Infrastructure",
    score: 83,
    summary: "Strong fit for technical founders solving painful workflow or infrastructure bottlenecks.",
    reasons: ["YC activity remains high in developer tools", "Technical buyers respond well to clear ROI and speed gains"],
    warnings: ["You need a sharp wedge and a clear buyer, not just a cool tool"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "b2b-saas",
    title: "B2B SaaS / Workflow Software",
    score: 82,
    summary: "Works well when you understand a painful business workflow and can land one team first.",
    reasons: ["Recurring revenue model is easier to compound", "Expansion revenue can build after initial wedge"],
    warnings: ["Longer sales cycles can hide weak product-market fit early"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "fintech-startup",
    title: "Fintech / Payments / Treasury",
    score: 78,
    summary: "Large market with strong need, but compliance and trust requirements are heavier.",
    reasons: ["Payments, finance ops, and treasury remain large software categories", "Clear ROI is possible when you save time or reduce leakage"],
    warnings: ["Compliance, risk controls, and integration complexity rise quickly"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "healthtech-startup",
    title: "Healthtech / Care Operations",
    score: 77,
    summary: "High-value category with strong inefficiencies to fix, but workflows and compliance are demanding.",
    reasons: ["Healthcare operations remain fragmented", "B2B workflow software can create deep stickiness"],
    warnings: ["Sales and implementation cycles are slower than generic SaaS"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "security-startup",
    title: "Cybersecurity / Trust",
    score: 79,
    summary: "High-priority buyer pain category suited to strong technical teams and clear threat framing.",
    reasons: ["Security remains a persistent budget priority", "Trust and urgency can support premium pricing"],
    warnings: ["Founders need credible technical depth and a narrow attack surface focus"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  // ── 하드웨어·딥테크 — 자본 구조 자체가 SaaS 와 완전히 다름 ──
  {
    id: "hardware-iot",
    title: "Hardware / IoT Device",
    score: 76,
    summary: "Consumer or industrial hardware, IoT, wearables — physical product with manufacturing complexity.",
    reasons: ["CES 2026 한국 60%+ 수상 — 피지컬 AI 모멘텀", "정부 슈퍼-갭 12개 미래산업 자금 가능"],
    warnings: ["부품·금형·인증·재고 자본 부담 큼 — SaaS 대비 10-20배 자본 필요", "공급망·BOM·인증 (KC·CE·FCC) 리드타임 6-12개월"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "robotics-physical-ai",
    title: "Robotics / Physical AI",
    score: 88,
    summary: "Robot arms, autonomous mobility, humanoid — physical AI category attracting record 2026 funding.",
    reasons: ["디노티시아 900억·BOS 870억·UVify·홀리데이로보틱스 등 대규모 투자 활발", "정부 7.45조 국가성장펀드 + 슈퍼-갭 우선 배정"],
    warnings: ["엔지니어 인건비·랩·프로토타입 월 1-3억 번레이트 정상", "시리즈A 평균 100억+ 필요 — 일반 SaaS 대비 5-10배"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "semiconductor",
    title: "Semiconductor / Chip Design",
    score: 84,
    summary: "AI chip, fabless, IP — extremely capital-intensive deep tech with multi-year tape-out cycles.",
    reasons: ["AI 반도체 2026년 시리즈A 평균 870-900억원대", "팹리스·IP·EDA 정부 지원 폭 가장 넓음 (반도체 특별법 등)"],
    warnings: ["EDA 라이선스·MPW·테이프아웃 비용만 분기당 수억원", "IP 라이브러리·검증·인증 (AEC-Q 등) 리드타임 1-2년"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "biotech-medtech",
    title: "Biotech / Medical Device",
    score: 75,
    summary: "Diagnostics, drug discovery, medical AI, lab equipment — heavy regulation + clinical validation.",
    reasons: ["고령화·만성질환 시장 지속 확대", "임상 데이터 + 인허가가 강력한 진입장벽 형성"],
    warnings: ["식약처·FDA 임상 통과 평균 3-5년", "랩·시약·임상 비용으로 시드부터 수십억 필요"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  },
  {
    id: "climate-energy",
    title: "Climate Tech / Energy",
    score: 73,
    summary: "Battery, energy efficiency, carbon capture — varies from software-light to heavy infrastructure.",
    reasons: ["탄소중립 정책 + ESG 투자 우선순위", "에너지 안보 — 정부 R&D 지원 확대"],
    warnings: ["설비·필드테스트 자본 매우 큼 (수십~수백억)", "정책 사이클·인허가·사업화 리드타임 길음"],
    meta: { categoryId: "startup-tech", categoryLabel: "Tech Startup" }
  }
];

const starterBusinessModelOptionsByCategory: Record<string, RecommendationItem[]> = {
  food: [
    {
      id: "dine-in-restaurant",
      title: "Dine-in Restaurant",
      score: 81,
      summary: "Best for concepts that depend on in-store dining, table turnover, and neighborhood loyalty.",
      reasons: ["Works for Korean meals, pasta, brunch, and sit-down formats", "Supports fuller menu storytelling"],
      warnings: ["Rent, labor, and hall operations are heavier"]
    },
    {
      id: "takeout-focused",
      title: "Takeout Focused",
      score: 84,
      summary: "Lean format for founders who want smaller footprints and faster early execution.",
      reasons: ["Smaller space requirement", "Useful for pasta, burger, or casual quick meal formats"],
      warnings: ["Menu clarity and throughput matter more"]
    },
    {
      id: "delivery-hybrid",
      title: "Hybrid (Dine-in + Delivery)",
      // 한국 외식 표준 — 사장님 95% 가 이 모델. recommendation score 최상으로 상향.
      score: 88,
      summary: "The standard for Korean F&B — dine-in customers + delivery channels operating together.",
      reasons: ["Captures both walk-in regulars and delivery demand", "Industry-standard in Korea — channel diversification", "Pickup option offsets some delivery fees"],
      warnings: ["Baemin/Coupang Eats fees 17–28% must be priced in", "Separate the 3 kitchen flows (dine-in / pickup / rider) for smooth operations"]
    }
  ],
  "cafe-dessert": [
    {
      id: "storefront-cafe",
      title: "Storefront Cafe",
      score: 83,
      summary: "Balanced model for brand visibility, seating, and neighborhood loyalty.",
      reasons: ["Good for repeat local traffic", "Supports brand and menu storytelling"],
      warnings: ["Higher rent and staffing pressure than leaner formats"]
    },
    {
      id: "takeout-focused",
      title: "Takeout Focused",
      score: 89,
      summary: "Lean footprint with faster setup and simpler staffing assumptions.",
      reasons: ["Smaller space requirement", "Good fit when budget discipline matters"],
      warnings: ["Need strong throughput and sharper menu positioning"]
    },
    {
      id: "self-serve-light",
      title: "Self-serve / Unmanned Light",
      score: 68,
      summary: "Lower staffing format for functional drink demand and simple beverage operations.",
      reasons: ["Leaner labor structure", "Can fit smaller convenience locations"],
      warnings: ["Machine quality and differentiation matter"]
    }
  ],
  retail: [
    {
      id: "small-storefront-retail",
      title: "Small Storefront Retail",
      score: 76,
      summary: "Best for curated offline retail with repeat neighborhood traffic.",
      reasons: ["Supports lifestyle and specialty assortment", "Works with local repeat demand"],
      warnings: ["Inventory discipline matters from day one"]
    },
    {
      id: "unmanned-retail-model",
      title: "Unmanned Retail",
      score: 69,
      summary: "Lower-touch format with simpler staffing, but stronger dependence on product mix and location.",
      reasons: ["Can lower staffing burden", "Works for convenience-led assortments"],
      warnings: ["Shrinkage and low turnover can hurt quickly"]
    },
    {
      id: "omni-retail",
      title: "Offline + Online Retail",
      score: 74,
      summary: "Useful when the store also supports pickup, social traffic, and online conversion.",
      reasons: ["Wider demand channels", "Good for fashion and lifestyle products"],
      warnings: ["Operations can become scattered without discipline"]
    }
  ],
  beauty: [
    {
      id: "appointment-studio",
      title: "Appointment Studio",
      score: 85,
      summary: "Best for salons, nails, waxing, and appointment-led repeat services.",
      reasons: ["Strong repeat visit pattern", "Works with small or mid-size spaces"],
      warnings: ["Schedule quality and service consistency matter"]
    },
    {
      id: "premium-private-room",
      title: "Private Premium Room",
      score: 73,
      summary: "Higher-trust beauty model for skin care, bridal, and premium consultation services.",
      reasons: ["Supports premium pricing", "Good for private service positioning"],
      warnings: ["Demand may build slower without trust signals"]
    },
    {
      id: "beauty-retail-hybrid",
      title: "Service + Retail Hybrid",
      score: 72,
      summary: "Adds product retail to service revenue for upsell and repeat purchase.",
      reasons: ["Can lift average order value", "Useful for care-product recommendations"],
      warnings: ["Retail stock can tie up cash"]
    }
  ],
  fitness: [
    {
      id: "membership-studio",
      title: "Membership Studio",
      score: 80,
      summary: "Best for pilates, yoga, and class-led repeat membership models.",
      reasons: ["Recurring revenue structure", "Clear retention loop"],
      warnings: ["Instructor schedule quality matters"]
    },
    {
      id: "coach-led-premium",
      title: "Coach-led Premium",
      score: 74,
      summary: "Useful for PT, golf, and higher-ticket personalized training.",
      reasons: ["Supports premium pricing", "Clear value per customer"],
      warnings: ["Labor quality and rent pressure are heavier"]
    },
    {
      id: "low-touch-fitness",
      title: "Low-touch / Unmanned Fitness",
      score: 68,
      summary: "Lean staffing model with stronger dependence on access systems and equipment uptime.",
      reasons: ["Lower front-desk dependence", "Simple recurring membership proposition"],
      warnings: ["Safety and maintenance systems matter more"]
    }
  ],
  education: [
    {
      id: "academy-classroom",
      title: "Academy Classroom",
      score: 77,
      summary: "Best for recurring subject, language, and skills classes with cohorts.",
      reasons: ["Structured enrollment cycle", "Works for repeat attendance"],
      warnings: ["Instructor quality and trust are core"]
    },
    {
      id: "small-group-tutoring",
      title: "Small Group Tutoring",
      score: 75,
      summary: "Lean format for small study rooms, homework clubs, and focused tutoring.",
      reasons: ["Lower space burden", "Clear value for local parents and students"],
      warnings: ["Retention depends heavily on outcomes"]
    },
    {
      id: "hybrid-learning",
      title: "Offline + Online Learning",
      score: 73,
      summary: "Useful for coding or adult learning models that mix in-person and digital delivery.",
      reasons: ["Flexible delivery model", "Can widen addressable market"],
      warnings: ["Curriculum consistency must stay high"]
    }
  ],
  pet: [
    {
      id: "pet-service-studio",
      title: "Pet Service Studio",
      score: 79,
      summary: "Best for grooming and appointment-led pet care.",
      reasons: ["Strong repeat care behavior", "Works with compact service spaces"],
      warnings: ["Skill and safety trust are non-negotiable"]
    },
    {
      id: "pet-care-center",
      title: "Pet Hotel / Care Center",
      score: 72,
      summary: "Higher-trust care model for hotels, daycare, and kindergarten services.",
      reasons: ["Supports premium care positioning", "Can build long-term customer relationships"],
      warnings: ["Staffing and cleanliness standards are heavy"]
    },
    {
      id: "pet-retail-hybrid",
      title: "Pet Retail Hybrid",
      score: 70,
      summary: "Combines service, supplies, and repeat consumable purchases.",
      reasons: ["Can diversify revenue", "Good for add-on product sales"],
      warnings: ["Without service quality, retail can be hard to differentiate"]
    }
  ],
  "living-service": [
    {
      id: "utility-storefront",
      title: "Utility Storefront",
      score: 74,
      summary: "Best for laundry, printing, repair, and practical neighborhood services.",
      reasons: ["Clear local use case", "Easy to explain value proposition"],
      warnings: ["Convenience and reliability matter more than branding"]
    },
    {
      id: "self-service-model",
      title: "Self-service Model",
      score: 72,
      summary: "Useful for laundromat-style operations with low-touch staffing.",
      reasons: ["Lower labor dependence", "Simple service flow"],
      warnings: ["Machine uptime and location are critical"]
    },
    {
      id: "visit-service-model",
      title: "Visit / Dispatch Service",
      score: 69,
      summary: "Useful for cleaning or call-out repair models without heavy storefront needs.",
      reasons: ["Lower lease burden", "Can start leaner"],
      warnings: ["Scheduling reliability becomes the main product"]
    }
  ],
  space: [
    {
      id: "reservation-space",
      title: "Reservation Space",
      score: 76,
      summary: "Best for rental studios, practice rooms, and party rooms with hourly booking.",
      reasons: ["Simple hourly monetization", "Works with creator or event demand"],
      warnings: ["Occupancy rate is everything"]
    },
    {
      id: "membership-space",
      title: "Membership Space",
      score: 73,
      summary: "Useful for study cafes and shared office concepts with repeat usage.",
      reasons: ["Recurring revenue possible", "Clear utilization model"],
      warnings: ["Location fit and churn control matter"]
    },
    {
      id: "hospitality-operations",
      title: "Hospitality Operations",
      score: 67,
      summary: "Heavier operating model for guesthouses and stay-led concepts.",
      reasons: ["Clear accommodation value", "Brand experience can differentiate"],
      warnings: ["Compliance and operations are heavier"]
    }
  ],
  "online-digital": [
    {
      id: "marketplace-seller",
      title: "Marketplace Seller",
      score: 79,
      summary: "Best for smart store, consignment, and marketplace-led product selling.",
      reasons: ["Fastest entry to market", "Can test demand before heavy investment"],
      warnings: ["Traffic and fee pressure can erode margin"]
    },
    {
      id: "brand-storefront-online",
      title: "Brand Storefront Online",
      score: 73,
      summary: "Useful when you want more control over brand, repeat purchase, and customer data.",
      reasons: ["Better brand ownership", "Can build stronger retention loops"],
      warnings: ["Requires stronger marketing discipline"]
    },
    {
      id: "content-membership-model",
      title: "Content / Membership Model",
      score: 70,
      summary: "Best for creator-led, newsletter, digital product, and audience-driven revenue.",
      reasons: ["Low fixed overhead", "Can support recurring subscriber revenue"],
      warnings: ["Trust and consistency matter more than volume"]
    }
  ],
  "startup-tech": [
    {
      id: "plg-saas",
      title: "Product-led SaaS",
      score: 83,
      summary: "Good for self-serve or light-touch products where activation speed matters.",
      reasons: ["Fast feedback loops", "Easier to test onboarding and retention early"],
      warnings: ["Low activation can quietly kill growth before sales ever matters"]
    },
    {
      id: "sales-led-b2b",
      title: "Sales-led B2B",
      score: 80,
      summary: "Better when pain is expensive, buyer count is small, and pilots lead to expansion.",
      reasons: ["Works well for enterprise workflow pain", "Can support higher ACV and longer contracts"],
      warnings: ["Founder sales and long cycles require more runway discipline"]
    },
    {
      id: "usage-based-api",
      title: "Usage-based API / Infra",
      score: 78,
      summary: "Fit for developer-facing tools where value scales with usage or automation volume.",
      reasons: ["Strong fit for infra and AI building blocks", "Usage growth can compound quickly after integration"],
      warnings: ["Reliability, docs quality, and margins are make-or-break"]
    },
    {
      id: "hybrid-software-service",
      title: "Software + Service Hybrid",
      score: 72,
      summary: "Useful when founders need manual service to prove demand before product catches up.",
      reasons: ["Lets you learn customer pain faster", "Can generate early revenue before full automation"],
      warnings: ["Services can hide weak product leverage if you do not productize aggressively"]
    }
  ]
};

export function getStarterBusinessModelOptions(categoryId?: string): RecommendationItem[] {
  return starterBusinessModelOptionsByCategory[categoryId ?? "food"] ?? starterBusinessModelOptionsByCategory.food;
}

export const starterBudgetPresets = [
  { id: "budget-10m", label: "10M KRW", value: 10000000 },
  { id: "budget-20m", label: "20M KRW", value: 20000000 },
  { id: "budget-30m", label: "30M KRW", value: 30000000 },
  { id: "budget-50m", label: "50M KRW", value: 50000000 },
  { id: "budget-80m", label: "80M KRW", value: 80000000 },
  { id: "budget-120m", label: "120M KRW", value: 120000000 },
  { id: "budget-200m", label: "200M KRW", value: 200000000 }
] as const;

export const starterOpenDatePresets = [
  { id: "open-next-month", label: "Next month", value: "2026-04-30" },
  { id: "open-three-months", label: "In 3 months", value: "2026-06-30" },
  { id: "open-six-months", label: "In 6 months", value: "2026-09-30" },
  { id: "open-nine-months", label: "In 9 months", value: "2026-12-31" },
  { id: "open-next-year", label: "Next year", value: "2027-03-31" }
] as const;

export const starterLocationOptions: RecommendationItem[] = [
  {
    id: "seongsu",
    title: "Seongsu",
    score: 88,
    summary: "Good for brand-forward cafes with strong foot traffic and trend visibility.",
    reasons: [
      "Strong 20s-30s foot traffic",
      "High fit for branded cafe concepts",
      "Strong spillover from destination retail traffic"
    ],
    warnings: ["Rent pressure is higher than average", "Competition density is already high"],
    meta: {
      rentBand: "high",
      competitionLevel: "high",
      customerFit: "strong"
    },
    freshness: officialFreshness
  },
  {
    id: "mangwon",
    title: "Mangwon",
    score: 82,
    summary: "More balanced for founders who want repeat local demand with lower rent pressure.",
    reasons: [
      "Neighborhood repeat traffic is steadier",
      "Smaller-format stores can work well",
      "Better fit for careful early-stage budgeting"
    ],
    warnings: ["Destination traffic is lower than Seongsu", "Brand lift may grow slower"],
    meta: {
      rentBand: "mid",
      competitionLevel: "mid",
      customerFit: "steady"
    },
    freshness: reviewSoonFreshness
  },
  {
    id: "konkuk",
    title: "Konkuk University",
    score: 79,
    summary: "Can move quickly on sales volume, but requires sharper operational discipline.",
    reasons: [
      "High student and evening traffic",
      "Strong match for takeout-heavy concepts",
      "Works when fast throughput matters"
    ],
    warnings: ["Price sensitivity can be higher", "Weekend demand may fluctuate more"],
    meta: {
      rentBand: "mid-high",
      competitionLevel: "high",
      customerFit: "throughput"
    },
    freshness: officialFreshness
  }
];

const starterLocationOptionsByCategory: Record<string, RecommendationItem[]> = {
  "online-digital": [
    {
      id: "online-base-home",
      title: "Home-based operations",
      score: 74,
      summary: "Useful when you want to keep fixed costs low and validate demand before scaling.",
      reasons: ["Lowest upfront overhead", "Good for testing product-market fit first"],
      warnings: ["Storage, packaging, and pickup flow can get tight quickly"]
    },
    {
      id: "online-base-logistics",
      title: "Logistics-friendly workspace",
      score: 81,
      summary: "Better when you expect frequent deliveries, returns, and packaging work from day one.",
      reasons: ["Easier shipping and return handling", "More stable for inventory-led operations"],
      warnings: ["Monthly fixed costs rise faster than home-based setups"]
    },
    {
      id: "online-base-sourcing",
      title: "Sourcing / wholesale access base",
      score: 78,
      summary: "Helpful when your business depends on frequent sourcing, sampling, or supplier access.",
      reasons: ["Faster supplier access", "Useful for repeat sourcing or B2B buying cycles"],
      warnings: ["The base itself does not create customer traffic"]
    }
  ]
};

export function getStarterLocationOptions(categoryId?: string): RecommendationItem[] {
  return starterLocationOptionsByCategory[categoryId ?? ""] ?? starterLocationOptions;
}

export function getIndustryCategoryIdByOptionId(optionId?: string): string | undefined {
  if (!optionId) {
    return undefined;
  }

  return starterIndustryOptions.find((option) => option.id === optionId)?.meta?.categoryId as
    | string
    | undefined;
}

export const starterStageFlow: RoadmapStageState[] = [
  // ── Shared: stages 1-4 (both offline and online paths) ────────────────────
  {
    stageId: "industry-selection",
    code: "industry_selection",
    title: "Choose an industry",
    type: "selection",
    status: "in_progress",
    stepNumber: 1,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Set the business category before any downstream guidance begins.",
    whyNow: "Every other decision — location, permits, suppliers — depends on this choice.",
    completionRule: { kind: "select_and_save", requiredKeys: ["subIndustryId"] },
    taskIds: [],
    riskIds: [],
    nextStageIds: ["startup-type"]
  },
  {
    stageId: "startup-type",
    code: "startup_type",
    title: "Choose a startup type",
    type: "selection",
    status: "locked",
    stepNumber: 2,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Choose whether you are opening independently, through a franchise, or still deciding.",
    whyNow: "Brand, contract, and setup guidance changes based on this choice.",
    completionRule: { kind: "select_one", minimumSelectedCount: 1 },
    taskIds: [],
    riskIds: [],
    nextStageIds: ["business-model"]
  },
  {
    stageId: "business-model",
    code: "business_model",
    title: "Choose an operating model",
    type: "selection",
    status: "locked",
    stepNumber: 3,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Define how the business will run so location and cost logic can stay realistic.",
    whyNow: "A dine-in cafe, delivery kitchen, and unmanned studio each need a different plan.",
    completionRule: { kind: "select_one", minimumSelectedCount: 1 },
    taskIds: [],
    riskIds: [],
    // 2026-05-14 사장님 신고: "타깃 고객 정의 단계가 어디에도 없다."
    //   business-model 다음으로 target-customer-definition 삽입 — 모든 cluster 통과.
    //   타깃 페르소나 없이 budget·location·menu 결정하면 매번 평균값으로 회귀 → 차별화 실패.
    nextStageIds: ["target-customer-definition"]
  },
  // ──────────────────────────────────────────────────────────────────────────
  //  Stage 4 (NEW 2026-05-14) — 타깃 고객 정의
  //  사장님 신고: "이 과정이 새로 들어가면 좋겠어. 현재 로드맵 어느 단계에도 없어."
  //  배치: 모든 cluster 공통 (shared path). business-model 다음, budget-setup 전.
  //    이유: 타깃 페르소나 (연령·라이프스타일·가격 민감도) 가 정해져야 예산 분배,
  //          입지 선정, 메뉴 가격대, 마케팅 채널 — 모든 후속 결정의 기준선이 됨.
  //    Tech 클러스터 (offline → startup-foundation 분기) 도 통과 — 가벼운 페르소나 sketch.
  //          더 깊은 customer-discovery (10명 인터뷰) 는 stepNumber 6 에서 별도 진행.
  // ──────────────────────────────────────────────────────────────────────────
  {
    stageId: "target-customer-definition",
    code: "target_customer_definition",
    title: "Define your target customer",
    type: "verification",
    status: "locked",
    stepNumber: 4,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Capture the primary customer persona — age range, lifestyle, and price sensitivity — so location, menu, and marketing decisions stay focused on a real person, not a generic average.",
    whyNow: "Every downstream decision — where to lease, what to charge, which channel to advertise on — depends on who the customer is. Skipping this means each subsequent stage drifts toward generic averages and underperforms. 5-10 min input now saves months of pivoting.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["tc-age-narrowed", "tc-lifestyle-specified", "tc-price-anchor", "tc-counter-example"]
    },
    taskIds: ["tc-age-narrowed", "tc-lifestyle-specified", "tc-price-anchor", "tc-counter-example"],
    riskIds: [],
    nextStageIds: ["budget-setup"]
  },
  {
    stageId: "budget-setup",
    code: "budget_setup",
    title: "Set budget and timing",
    type: "verification",
    status: "locked",
    stepNumber: 4,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Capture capital, loan intent, and target opening date before recommending places or contracts.",
    whyNow: "Budget defines the safe range for every decision that follows.",
    completionRule: { kind: "required_inputs", requiredKeys: ["capital", "targetOpenDate"] },
    taskIds: [],
    riskIds: [],
    // Default → offline path. Franchise → franchise-application first.
    // Condition → online-digital branches to platform-setup.
    nextStageIds: ["permit-check"],
    // ⚠️ 2026-05-18: franchise 분기를 최상위로 이동. 종전엔 online-digital + franchise 사장님이
    //   online 조건에 먼저 매치되어 platform-setup 으로 라우팅 → franchise-application 영원히
    //   미실행. franchise 는 cluster 무관 1순위로 분기.
    nextStageConditions: [
      {
        decisionStageId: "startup-type",
        decisionKey: "startupType",
        matchValue: "franchise",
        stageIds: ["franchise-application"]
      },
      {
        decisionStageId: "industry-selection",
        decisionKey: "categoryId",
        matchValue: "startup-tech",
        stageIds: ["startup-foundation"]
      },
      {
        decisionStageId: "industry-selection",
        decisionKey: "categoryId",
        matchValue: "online-digital",
        stageIds: ["platform-setup"]
      }
    ]
  },

  // ── Tech startup path: stages 5-14 (+ shared tail) ──────────────────────
  // 순서: 팀·법인 → 법인운영·세무 → 고객발굴 → MVP+IP → 출시+GTM → 성장 → 런웨이·투자 → 벤처인증·지원사업
  {
    stageId: "startup-foundation",
    code: "startup_foundation",
    title: "Founder and company setup",
    type: "execution",
    status: "locked",
    stepNumber: 5,
    totalSteps: 19,
    goal: "Define the core problem, decide your team structure, and know when to incorporate.",
    whyNow: "Founder misalignment and fuzzy ownership destroy startups before customers ever do. But first — define the problem worth solving.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["problem-defined", "founder-alignment", "company-formation-path"]
    },
    // taskIds 는 5개 (3 필수 + 2 선택). 본문 페이지(문제 정의·팀·법인·사례) 와 일대일 매칭.
    taskIds: ["problem-defined", "founder-alignment", "company-formation-path", "case-study-review", "build-in-public-setup"],
    riskIds: [],
    nextStageIds: ["customer-discovery"]
  },
  // 순서: 팀 → 고객발굴(6) → 사업자등록(7) → MVP
  // 이유: 고객 검증 전 사업자등록은 예비창업패키지 자격 상실 위험
  {
    stageId: "customer-discovery",
    code: "customer_discovery",
    title: "Customer discovery",
    type: "execution",
    status: "locked",
    stepNumber: 6,
    totalSteps: 19,
    goal: "Run customer interviews, identify repeated pain, and narrow to one wedge problem with real urgency.",
    whyNow: "A startup dies when it builds for a vague audience instead of a painful problem. Validate before you register.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["customer-interviews-done", "pain-pattern-documented", "narrow-wedge-defined"]
    },
    taskIds: ["customer-interviews-done", "pain-pattern-documented", "narrow-wedge-defined"],
    riskIds: [],
    nextStageIds: ["company-setup"]
  },
  {
    stageId: "company-setup",
    code: "company_setup",
    title: "Business registration, IP protection, and legal foundation",
    type: "execution",
    status: "locked",
    stepNumber: 7,
    totalSteps: 19,
    goal: "Choose between sole proprietor and corporation, complete business registration, protect your IP before public disclosure, and set up basic tax and security foundations.",
    whyNow: "Now that you've validated the problem, register your business to unlock contracts, invoicing, and government programs. File IP before any public disclosure.",
    // 2026-05-12 P3: trademark-filed 를 required:true 로 격상 (사장님 신고 audit).
    //   사장님이 가게 이름 결정 후 인테리어·간판 발주를 진행하는데 상표 출원이 옵션이면
    //   다른 가게가 같은 이름 출원 시 사용 금지 가처분 + 침해소송 위험. 출원료 6만원·심사
    //   6-12개월 — 적은 비용으로 가게 정체성 자산 보호. 한국 외식·뷰티 업종에서 빈번한 이슈.
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["business-structure-decided", "startup-biz-registered", "ip-protection-planned", "trademark-filed", "terms-privacy-published"]
    },
    taskIds: ["business-structure-decided", "startup-biz-registered", "ip-protection-planned", "trademark-filed", "tax-setup-basics", "security-basics", "terms-privacy-published", "pg-payment-ready"],
    riskIds: [],
    nextStageIds: ["mvp-build"]
  },
  {
    stageId: "mvp-build",
    code: "mvp_build",
    title: "MVP, proof of value, and IP protection",
    type: "execution",
    status: "locked",
    stepNumber: 8,
    totalSteps: 19,
    goal: "Ship the minimum useful product that solves one core workflow, capture first proof of value, and file IP protection before public disclosure.",
    whyNow: "Shipping late burns runway without learning. Publishing without IP protection can permanently forfeit patent rights.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["core-workflow-defined", "mvp-shipped", "ip-protection-filed"]
    },
    taskIds: ["core-workflow-defined", "mvp-shipped", "ip-protection-filed"],
    riskIds: [],
    // ── 클러스터별 분기: MVP 직후 흐름이 갈림 ──
    //   • Hardware/IoT → NPI 4단계 (prototype/BOM/cert/manufacturing)
    //   • Deep Tech Lab (로보틱스/바이오) → lab + 임상/필드 4단계
    //   • Extreme Deep Tech (반도체/클린테크) → EDA·tape-out 4단계
    //   • Software (default) → 바로 launch-gtm
    nextStageIds: ["launch-gtm"],
    nextStageConditions: [
      {
        decisionStageId: "industry-selection",
        decisionKey: "selectedPrimaryOptionId",
        matchValue: "hardware-iot",
        stageIds: ["hardware-prototype"]
      },
      {
        decisionStageId: "industry-selection",
        decisionKey: "selectedPrimaryOptionId",
        matchValueIn: ["robotics-physical-ai", "biotech-medtech"],
        stageIds: ["lab-setup"]
      },
      {
        decisionStageId: "industry-selection",
        decisionKey: "selectedPrimaryOptionId",
        matchValueIn: ["semiconductor", "climate-energy"],
        stageIds: ["eda-tooling-setup"]
      }
    ]
  },
  {
    stageId: "launch-gtm",
    code: "launch_gtm",
    title: "Launch stack, app store submission, and GTM",
    type: "execution",
    status: "locked",
    stepNumber: 9,
    totalSteps: 19,
    goal: "Put analytics, billing, error monitoring, and a customer feedback loop in place before pushing for growth. If building a mobile app, submit to app stores early.",
    whyNow: "Without instrumentation founders mistake noise for signal. Analytics, billing, error monitoring, and feedback loop — these 4 enable meaningful decisions. Skipping any one means flying blind.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["analytics-live", "billing-or-conversion-live", "error-monitoring-live", "feedback-loop-live", "first-100-users-acquired", "marketing-content-cadence"]
    },
    // 본문 4페이지(출시스택·첫100명·콘텐츠·채널) 와 일대일 매칭. 실제 출시는 go-live 단계로 분리.
    taskIds: ["analytics-live", "billing-or-conversion-live", "error-monitoring-live", "feedback-loop-live", "first-100-users-acquired", "marketing-content-cadence", "security-checklist-reviewed"],
    riskIds: [],
    nextStageIds: ["go-live"]
  },
  // ──────────────────────────────────────────────────────────────────────────
  //  Stage 10 — 실제 출시 (Go Live)
  //  분리 이유: 출시는 단순 sub-task 가 아닌 명확한 milestone. 절차·기간이 채널마다 크게 다름.
  //  검증 출처: Apple Developer 2026 (iOS 26 SDK 의무 4.28~), Google Play 12 testers x 14 days,
  //              Product Hunt 화·수 12am PT, Hacker News Show HN 가이드라인.
  // ──────────────────────────────────────────────────────────────────────────
  {
    stageId: "go-live",
    code: "go_live",
    title: "Go Live — actual launch",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 19,
    goal: "Launch publicly through 1-3 verified channels (web, App Store, Google Play, Product Hunt, Hacker News). Each channel has different procedures and review times.",
    whyNow: "Launch is a milestone, not a sub-task. iOS 26 SDK mandatory after 4/28. Google Play requires 12 testers × 14 days closed testing. Product Hunt and HN single-shot launches need 1-2 weeks prep.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["web-go-live", "launch-channel-active"]
    },
    taskIds: ["web-go-live", "launch-channel-active", "apple-app-store-submitted", "google-play-submitted", "launch-day-monitored"],
    riskIds: [],
    nextStageIds: ["growth-engine"]
  },
  {
    stageId: "growth-engine",
    code: "growth_engine",
    title: "Growth and retention loop",
    type: "execution",
    status: "locked",
    stepNumber: 11,
    totalSteps: 19,
    goal: "Define the north-star metric, review growth weekly, and prove that users return or expand over time.",
    whyNow: "Topline growth without retention is usually a temporary illusion.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["north-star-set", "weekly-review-running", "retention-check-defined"]
    },
    taskIds: ["north-star-set", "weekly-review-running", "retention-check-defined"],
    riskIds: [],
    nextStageIds: ["fundraising-readiness"]
  },
  {
    stageId: "fundraising-readiness",
    code: "fundraising_readiness",
    title: "Runway and fundraising readiness",
    type: "execution",
    status: "locked",
    stepNumber: 12,
    totalSteps: 19,
    goal: "Model burn rate and runway (target 24–30 months at seed), build a milestone-driven use-of-cash plan, and prepare investor-grade materials — only if fundraising is actually needed.",
    whyNow: "In 2026, investors reward capital efficiency over aggressive growth. Fundraising without a clear runway model and profitability path burns 3–6 months of founder time and destroys negotiation leverage.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: [
        "runway-model-ready",
        "fundraising-decision-made",
        "funding-programs-matched",
        "investor-material-ready"
      ]
    },
    // 본문 4페이지 (런웨이 / 부트스트랩 vs 투자 / 프로그램 매칭 / 사업계획서) 와 일대일 매칭
    taskIds: [
      "runway-model-ready",
      "fundraising-decision-made",
      "funding-programs-matched",
      "investor-material-ready"
    ],
    riskIds: [
      "runway-too-short",
      "dilution-risk"
    ],
    nextStageIds: ["venture-certification"]
  },
  {
    stageId: "venture-certification",
    code: "venture_certification",
    title: "Venture certification and government programs",
    type: "verification",
    status: "locked",
    stepNumber: 13,
    totalSteps: 19,
    goal: "Apply for venture business certification, match to government startup support programs, and secure non-dilutive funding before committing personal capital.",
    whyNow: "Venture certification unlocks tax breaks, military service exemptions, and program eligibility. Government programs have hard deadlines — missing them means paying full cost out of pocket.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: [
        "venture-cert-type-checked",
        "application-submitted",
        "venture-benefits-activated"
      ]
    },
    // 정부 지원사업 매칭 (govt-program-matched) 은 이전 'fundraising-readiness' 단계의
    // funding-programs-matched 로 이관됨. 여기는 인증 자체 + 인증 후 활용에 집중.
    taskIds: [
      "venture-cert-type-checked",
      "application-submitted",
      "venture-benefits-activated"
    ],
    riskIds: [],
    nextStageIds: ["tax-guide"]
  },

  // ──────────────────────────────────────────────────────────────────────────
  //  Cluster B — Hardware / IoT NPI 4단계
  //  mvp-build → hardware-prototype → bom-supply-chain → certification-kc-ce → manufacturing-partner → launch-gtm
  //  검증 출처: MistyWest·Xavor NPI 가이드, IB-Lenhardt KC 인증 절차, EMC FastPass
  // ──────────────────────────────────────────────────────────────────────────
  {
    stageId: "hardware-prototype",
    code: "hardware_prototype",
    title: "Hardware prototype: EVT → DVT → PVT",
    type: "execution",
    status: "locked",
    stepNumber: 9,
    totalSteps: 22,
    goal: "Run engineering, design, and production validation tests (EVT/DVT/PVT) to take the device from breadboard to factory-ready.",
    whyNow: "Skipping any of EVT/DVT/PVT means you discover defects in mass production — by then it's too late and 1000s of units are scrap.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["evt-passed", "dvt-passed", "pvt-passed"]
    },
    taskIds: ["evt-passed", "dvt-passed", "pvt-passed"],
    riskIds: [],
    nextStageIds: ["bom-supply-chain"]
  },
  {
    stageId: "bom-supply-chain",
    code: "bom_supply_chain",
    title: "BOM and supply chain lock",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 22,
    goal: "Build a complete bill of materials, secure suppliers, lock leadtimes, and identify single-source risks.",
    whyNow: "Single-source components without alternatives can stall production for 6-12 months. Lock leadtimes before you commit to a launch date.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["bom-finalized", "suppliers-locked", "single-source-risks-identified"]
    },
    taskIds: ["bom-finalized", "suppliers-locked", "single-source-risks-identified"],
    riskIds: [],
    nextStageIds: ["certification-kc-ce"]
  },
  {
    stageId: "certification-kc-ce",
    code: "certification_kc_ce",
    title: "Certification: KC, CE, FCC",
    type: "verification",
    status: "locked",
    stepNumber: 11,
    totalSteps: 22,
    goal: "Plan and submit certifications required for sale: KC (Korea, 4-16 weeks; 8-10 standard for non-wireless, longer for wireless products needing KC-RRA + Safety + EMC), CE (EU), FCC (US).",
    whyNow: "Selling without certification is illegal — pre-compliance testing now saves months later. Wireless products need KC-RRA + Safety + EMC (3 separate certs), so start before manufacturing.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["pre-compliance-test-done", "cert-bodies-selected", "cert-application-submitted"]
    },
    taskIds: ["pre-compliance-test-done", "cert-bodies-selected", "cert-application-submitted"],
    riskIds: [],
    nextStageIds: ["manufacturing-partner"]
  },
  {
    stageId: "manufacturing-partner",
    code: "manufacturing_partner",
    title: "Manufacturing partner (EMS / CM) selection",
    type: "execution",
    status: "locked",
    stepNumber: 12,
    totalSteps: 22,
    goal: "Select EMS/CM partner, negotiate MOQ, payment terms, and quality standards. Plan first production run.",
    whyNow: "Choosing the wrong manufacturing partner can result in defective products, missed deadlines, or quality issues. Audit before committing.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["ems-shortlist-done", "ems-audited", "first-run-planned"]
    },
    taskIds: ["ems-shortlist-done", "ems-audited", "first-run-planned"],
    riskIds: [],
    nextStageIds: ["launch-gtm"]
  },

  // ──────────────────────────────────────────────────────────────────────────
  //  Cluster C — Deep Tech with Lab (로보틱스·바이오) 4단계
  //  mvp-build → lab-setup → prototype-iteration → field-or-clinical-test → regulatory-submission → launch-gtm
  //  검증 출처: 한국 MFDS Fast-Track 80-140일, IND 4-6주 (IntoInWorld 2026), 슈퍼-갭 12개 미래산업
  // ──────────────────────────────────────────────────────────────────────────
  {
    stageId: "lab-setup",
    code: "lab_setup",
    title: "Lab and prototyping facility setup",
    type: "execution",
    status: "locked",
    stepNumber: 9,
    totalSteps: 22,
    goal: "Set up a research lab or prototyping workshop with safety protocols, equipment, and (for biotech) GLP-compliant procedures.",
    whyNow: "Prototype iteration speed depends on lab quality. Skipping safety setup leads to incidents that shut down operations entirely.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["lab-facility-secured", "safety-protocol-defined", "core-equipment-installed"]
    },
    taskIds: ["lab-facility-secured", "safety-protocol-defined", "core-equipment-installed"],
    riskIds: [],
    nextStageIds: ["prototype-iteration"]
  },
  {
    stageId: "prototype-iteration",
    code: "prototype_iteration",
    title: "Prototype iteration cycles",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 22,
    goal: "Run iterative prototype cycles — robotics: hardware v0 → v3 with weekly testing / biotech: candidate compound screening with go/no-go gates. For digital health (45-50% of 2025 device IND): SaMD prototype with clinical workflow integration.",
    whyNow: "Deep-tech founders fail by 'spending 3 years perfecting v1' — set explicit go/no-go gates and ship intermediate prototypes for feedback. Korea Digital Medical Device Product Act (Jan 2025) enables fast SaMD pathway.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["iteration-plan-set", "v1-prototype-shipped", "feedback-cycle-running"]
    },
    taskIds: ["iteration-plan-set", "v1-prototype-shipped", "feedback-cycle-running"],
    riskIds: [],
    nextStageIds: ["field-or-clinical-test"]
  },
  {
    stageId: "field-or-clinical-test",
    code: "field_or_clinical_test",
    title: "Field test or clinical trial",
    type: "execution",
    status: "locked",
    stepNumber: 11,
    totalSteps: 22,
    goal: "Run field testing (robotics) or clinical trial (biotech). For Korea biotech: IND submission (4-6 weeks / 30 working days) + IRB ethics review (parallel — total 6-8 weeks). Pre-IND consultation can shorten review to ~7 days.",
    whyNow: "Real-world performance data is the gating evidence for regulatory approval and customer adoption. Korean MFDS IND is among the fastest globally; subject injury compensation insurance is mandatory for the IND dossier.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["test-protocol-approved", "test-cohort-secured", "first-results-collected"]
    },
    taskIds: ["test-protocol-approved", "test-cohort-secured", "first-results-collected"],
    riskIds: [],
    nextStageIds: ["regulatory-submission"]
  },
  {
    stageId: "regulatory-submission",
    code: "regulatory_submission",
    title: "Regulatory submission and approval",
    type: "verification",
    status: "locked",
    stepNumber: 12,
    totalSteps: 22,
    goal: "Submit for regulatory approval — robotics: KC + safety certification (4-16 weeks) / biotech: MFDS approval (Fast-Track 80-140 days for innovative devices, was 490 days).",
    whyNow: "Without regulatory approval you cannot legally sell. MFDS Fast-Track shortens 490 days → 80-140 days for qualifying innovative devices (199 device categories qualify, including 113 AI-based digital devices).",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["pre-consultation-done", "regulatory-package-submitted", "approval-pathway-confirmed"]
    },
    taskIds: ["pre-consultation-done", "regulatory-package-submitted", "approval-pathway-confirmed"],
    riskIds: [],
    nextStageIds: ["launch-gtm"]
  },

  // ──────────────────────────────────────────────────────────────────────────
  //  Cluster D — Extreme Deep Tech (반도체·클린테크) 4단계
  //  mvp-build → eda-tooling-setup → mpw-or-pilot-tape-out → packaging-and-test → partner-foundation-or-pilot-line → launch-gtm
  //  검증 출처: AnySilicon Tape-out 가이드, Synopsys/Cadence 라이선스 비용, X-FAB MPW
  // ──────────────────────────────────────────────────────────────────────────
  {
    stageId: "eda-tooling-setup",
    code: "eda_tooling_setup",
    title: "EDA and design tooling",
    type: "execution",
    status: "locked",
    stepNumber: 9,
    totalSteps: 22,
    goal: "License EDA software (Synopsys / Cadence — vary by toolset; premium tools can exceed $750K/seat. Multi-year commitments offer 10-25% discount), set up design environment, define IP/library strategy.",
    whyNow: "EDA licenses are typically 6-12+ month subscriptions and the bottleneck for chip design progress. Multi-year commitments lock pricing — startup-tier shared tools or token-based pricing models can cut initial cost.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["eda-licenses-secured", "design-env-set-up", "ip-library-strategy-defined"]
    },
    taskIds: ["eda-licenses-secured", "design-env-set-up", "ip-library-strategy-defined"],
    riskIds: [],
    nextStageIds: ["mpw-or-pilot-tape-out"]
  },
  {
    stageId: "mpw-or-pilot-tape-out",
    code: "mpw_or_pilot_tape_out",
    title: "MPW or pilot tape-out",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 22,
    goal: "Run a Multi-Project Wafer (MPW) shared run for cost-efficient prototyping (90-95% cheaper), OR a full mask set when volumes justify ($1M+ for 28nm, $10M+ for 7nm/below).",
    whyNow: "MPW reduces tape-out cost 90-95% but production time is still 6-9 months. Plan early — TSMC 2/3nm capacity is booked through 2027-2028, advanced packaging (CoWoS) leadtime 52-78 weeks.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["foundry-process-selected", "tape-out-package-ready", "tape-out-submitted"]
    },
    taskIds: ["foundry-process-selected", "tape-out-package-ready", "tape-out-submitted"],
    riskIds: [],
    nextStageIds: ["packaging-and-test"]
  },
  {
    stageId: "packaging-and-test",
    code: "packaging_and_test",
    title: "Packaging and test",
    type: "execution",
    status: "locked",
    stepNumber: 11,
    totalSteps: 22,
    goal: "Source OSAT (Outsourced Semiconductor Assembly and Test) partner, define test plan, and validate first samples.",
    whyNow: "OSAT prices rising 5-20% in 2026 (some specialists +30%) due to AI demand — providers running ~90% utilization. Choosing the wrong package locks you in. Test coverage decides yield (= profitability).",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["osat-partner-selected", "test-plan-defined", "first-samples-validated"]
    },
    taskIds: ["osat-partner-selected", "test-plan-defined", "first-samples-validated"],
    riskIds: [],
    nextStageIds: ["partner-foundation-or-pilot-line"]
  },
  {
    stageId: "partner-foundation-or-pilot-line",
    code: "partner_foundation_or_pilot_line",
    title: "Foundry partnership or pilot line",
    type: "execution",
    status: "locked",
    stepNumber: 12,
    totalSteps: 22,
    goal: "Lock foundry partnership (TSMC / Samsung Foundry / UMC / X-FAB) for volume production, OR establish a pilot line for cleantech infrastructure.",
    whyNow: "TSMC's 2nm/3nm sold out through 2027-2028. CoWoS advanced packaging 52-78 weeks (some 78-104 weeks). Without a partnership commitment locked early you cannot scale beyond MPW samples.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["foundry-partnership-discussion", "volume-production-plan", "scale-up-budget-modeled"]
    },
    taskIds: ["foundry-partnership-discussion", "volume-production-plan", "scale-up-budget-modeled"],
    riskIds: [],
    nextStageIds: ["launch-gtm"]
  },

  // ── Franchise path: application stage (only for franchise startupType) ─────
  {
    stageId: "franchise-application",
    code: "franchise_application",
    title: "Complete franchise application",
    type: "execution",
    status: "locked",
    stepNumber: 5,
    totalSteps: 19,
    goal: "Complete the franchise application process before proceeding with permits and location.",
    whyNow: "The franchise contract defines your budget, location options, interior, and suppliers. Everything else depends on this.",
    completionRule: { kind: "required_tasks", requiredTaskIds: ["fc-inquiry", "fc-disclosure", "fc-visit", "fc-contract", "fc-training"] },
    taskIds: ["fc-inquiry", "fc-disclosure", "fc-visit", "fc-legal", "fc-contract", "fc-training"],
    riskIds: [],
    nextStageIds: ["permit-check"]
  },

  // ── Offline path: stages 5-12 (or 6-12 for franchise) ─────────────────────
  {
    stageId: "permit-check",
    code: "permit_check",
    title: "Check permits early",
    type: "verification",
    status: "locked",
    stepNumber: 5,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Identify which permits, licenses, and certifications your category requires before signing a lease.",
    whyNow: "Signing a lease without confirming permit eligibility can permanently block your opening.",
    // ⚠️ 5개 모두 필수 — 이전엔 ["building-registry-checked","permit-type-checked"] 만 required 라
    //    사용자가 2개만 체크해도 다음 단계로 자동 진행되는 버그 (사용자 보고 2026-05-03).
    //    permit-check 는 「건물·인허가·위생·면허·소방」 5축 모두 확인해야 영업신고 가능 여부 결정 가능.
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: [
        "building-registry-checked",
        "permit-type-checked",
        "hygiene-health-checked",
        "license-registration-checked",
        "fire-safety-checked",
      ]
    },
    taskIds: [
      "building-registry-checked",
      "permit-type-checked",
      "hygiene-health-checked",
      "license-registration-checked",
      "fire-safety-checked",
    ],
    riskIds: [],
    nextStageIds: ["location-candidates"]
  },
  {
    stageId: "location-candidates",
    code: "location_candidates",
    title: "Compare location candidates",
    type: "comparison",
    status: "locked",
    stepNumber: 6,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Shortlist candidate markets with scores, reasons, and freshness-checked signals.",
    whyNow: "Location should only be shortlisted after business model, budget, and permit requirements are clear.",
    completionRule: { kind: "select_one", minimumSelectedCount: 1 },
    recommendationPayload: {
      type: "location",
      recommendedItemId: "seongsu",
      items: starterLocationOptions
    },
    taskIds: [],
    riskIds: ["location-data-review"],
    nextStageIds: ["contract-review"]
  },
  {
    stageId: "contract-review",
    code: "contract_review",
    title: "Review before contract",
    type: "execution",
    status: "locked",
    stepNumber: 7,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Check the lease and operating constraints before committing to a location.",
    whyNow: "Contract mistakes are expensive and hard to reverse.",
    // ⚠️ certified-date-obtained 는 required:true 인데 이전엔 requiredTaskIds 누락 — 사용자가 확정일자 안 받아도 진행 가능했음.
    //    septic-tank-checked 만 음식점·카페 한정 옵션 (required:false) 으로 유지.
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["use-check", "facility-check", "restriction-check", "certified-date-obtained"]
    },
    taskIds: ["use-check", "facility-check", "restriction-check", "septic-tank-checked", "certified-date-obtained"],
    riskIds: [],
    // 2026-05-12 P3: contract-review → registration-setup (was construction-setup).
    //   실제 사업 흐름은 임대차계약 직후 사업자등록 (홈택스 5분, 무료) → 통장 → 인테리어.
    //   인테리어 발주 전 사업자등록증 있어야 세금계산서 받고 부가세 환급 가능.
    //   세법: 사업개시일로부터 20일 이내 + 인테리어 부가세 환급은 같은 과세기간 내 등록 필수.
    nextStageIds: ["registration-setup"]
  },
  {
    stageId: "construction-setup",
    code: "construction_setup",
    title: "Interior, fixtures and equipment",
    type: "execution",
    status: "locked",
    // 2026-05-12 P3 reorder: construction-setup 위치 #8 → #12 (사업자등록·통장·세무·자금 결정 후).
    //   인테리어 발주 시 세금계산서를 사업자등록번호로 받아야 부가세 환급 가능.
    stepNumber: 12,
    totalSteps: 19,
    goal: "Select interior contractors, approve the layout design, and manage the construction timeline. Also plan furniture, fixtures, and equipment (FF&E) including IT devices if applicable.",
    whyNow: "Interior and FF&E are usually the largest single cost — locking in contractors, furniture, and equipment early prevents overrun. With biz reg + tax type already set, every interior invoice can be input-tax-credit eligible.",
    // ⚠️ 5개 모두 필수 — 인테리어 단계는 가장 변수 많은 phase 라 partial-check advance 가
    //    개업 직전 치명적인 누락으로 이어진다 (사용자 보고: 2026-05-03 "체크리스트 3개만 했는데 다음 단계로").
    //    legally required: 소방필증·보건증 신청 (open 전 필수). business-essential: 컨셉 결정.
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: [
        "interior-concept-selected",
        "contractor-selected",
        "design-approved",
        "construction-complete",
        "fire-health-parallel"
      ]
    },
    taskIds: [
      "interior-concept-selected",
      "contractor-selected",
      "design-approved",
      "construction-complete",
      "fire-health-parallel"
    ],
    riskIds: [],
    // 2026-05-14 사장님 신고: "메뉴를 결정하는 과정이 새로 들어가면 좋겠어.
    //   미리 메뉴를 결정하면 재고 관리 카드에 들어가게 해서 수고를 덜을 수 있어."
    //   construction-setup (인테리어 거의 끝) → menu-design (메뉴/서비스 라인업 확정)
    //   → vendor-setup (메뉴 알아야 식자재·공급처·장비 결정 가능).
    nextStageIds: ["menu-design"]
  },
  // ──────────────────────────────────────────────────────────────────────────
  //  Stage (NEW 2026-05-14) — 메뉴/서비스 라인업 확정
  //  사장님 신고: "메뉴 결정 과정 + 재고 관리 카드 연동" 두 가지를 한 번에.
  //
  //  배치: offline path 만 (construction-setup 직후). startup/online 은 이 경로
  //    안 거침. offline-food/cafe = 음식·음료 메뉴, offline-beauty/fitness/pet =
  //    서비스 메뉴, offline-retail = 상품 카탈로그 — 모두 "초기 라인업 확정 +
  //    재고 추적 시작점" 의미는 동일.
  //
  //  데이터 흐름:
  //    menu-design.decisions.inputs.menuItemsJson (serialized array)
  //      → roadmap-store.menuItems (parsed)
  //      → InventoryOpsCard "메뉴에서 가져오기" 버튼 → 재고 카드 자동 prefill.
  //
  //  Why this position:
  //    • construction-setup 직후: 주방 동선·집기 결정 후 메뉴 확정 가능.
  //    • vendor-setup 전: 식자재 공급처 협상에 메뉴 정보 필수.
  //    • hiring-setup 전: 메뉴 복잡도가 필요 인력·교육 시간 결정.
  // ──────────────────────────────────────────────────────────────────────────
  {
    stageId: "menu-design",
    code: "menu_design",
    title: "Lock your menu / service lineup",
    type: "execution",
    status: "locked",
    stepNumber: 13,
    totalSteps: 19,
    goal: "Define the initial menu or service lineup with item name, price, and category. Items captured here pre-load the inventory tracking card so day-1 prep doesn't slip.",
    whyNow: "Menu decisions determine ingredient sourcing, equipment needs, pricing strategy, and the inventory tracking baseline. Locking before vendor setup prevents rework and week-1 stockouts. For cafes — drink lineup; for beauty/fitness — service menu; for retail — product catalog.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["md-signature-items", "md-side-items", "md-pricing-set", "md-categories-organized"]
    },
    taskIds: ["md-signature-items", "md-side-items", "md-pricing-set", "md-categories-organized"],
    riskIds: [],
    // menu-design → vendor-setup (was direct from construction-setup).
    nextStageIds: ["vendor-setup"]
  },
  {
    stageId: "vendor-setup",
    code: "vendor_setup",
    title: "Suppliers and equipment",
    type: "execution",
    status: "locked",
    // 2026-05-12 P3 reorder: #9 → #13. 사업자등록번호로 공급업체 계약·세금계산서 가능한 상태에서 진행.
    stepNumber: 13,
    totalSteps: 19,
    goal: "Confirm suppliers, finalize equipment purchases or rentals, and set up POS.",
    whyNow: "Supply chain and equipment decisions directly affect day-one cash flow. Now that you have a 사업자등록번호, all supplier invoices are properly issued and VAT-creditable.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["supplier-identified", "equipment-planned", "pos-selected"]
    },
    taskIds: ["supplier-identified", "equipment-planned", "pos-selected"],
    riskIds: [],
    // 2026-05-12 P3: vendor-setup → hiring-setup (was registration-setup which now precedes).
    nextStageIds: ["hiring-setup"]
  },
  {
    stageId: "registration-setup",
    code: "registration_setup",
    title: "Business registration and permits",
    type: "execution",
    status: "locked",
    // 2026-05-12 P3 reorder (사장님 신고: "이 단계가 더 늦게 왔어야 되는 거 아닌가?").
    //   임대차계약 직후 사업자등록 = 황금타이밍 — 인테리어·집기 세금계산서 모두
    //   사업자등록번호로 발행받아야 부가세 환급 가능. 사업개시일 20일 이내 등록.
    //   원래 위치 #10 → 새 위치 #8 (contract-review 직후).
    stepNumber: 8,
    totalSteps: 19,
    goal: "Complete the business registration at the tax office (HomeTax 5min, free). 영업신고증 (operating permit) is filed later after interior is built — task description notes when.",
    whyNow: "사업자등록은 임대차계약 직후가 황금타이밍. 인테리어·집기·공급업체 세금계산서를 모두 사업자등록번호로 받아야 부가세 환급 가능. 사업개시일 20일 이내 의무.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["tax-type-decided", "business-registered", "permit-filed"]
    },
    taskIds: ["tax-type-decided", "business-registered", "permit-filed"],
    riskIds: [],
    // 2026-05-12 P3: registration-setup → biz-registration (was tax-guide).
    //   사업자등록증 받자마자 사업용 통장·카드 개설이 day-1 인프라.
    nextStageIds: ["biz-registration"]
  },
  // ⚠️ tax-guide 는 registration-setup 직후 위치 — pathStepNumber 가 array index 기반이라
  //    array 순서 = 플로우 순서 일치 시키려고 여기에 둠. (이전엔 array 끝쪽에 있어
  //    offline 사용자에게 tax-guide 가 15단계로 표시되는 버그 있었음. 2026-05-01 수정.)
  {
    stageId: "tax-guide",
    code: "tax_guide",
    title: "Review tax guide",
    type: "verification",
    status: "locked",
    // 2026-05-12 P3 reorder: 사업자등록·통장 직후 과세유형 검증·신고 일정 확정.
    //   원래 위치 #11 유지 (offline new) — biz-registration 다음 = 자연스러운 흐름.
    //   online/startup 에서도 동일 위치 (online #8, startup ~#14).
    stepNumber: 10,
    totalSteps: 19,
    goal: "Check the first tax setup and filing guidance before operations begin.",
    whyNow: "Tax structure, receipts, and proof handling are easier to set correctly before opening.",
    completionRule: { kind: "required_inputs", requiredKeys: ["reviewed"] },
    taskIds: [],
    riskIds: [],
    // 2026-05-12 P3: tax-guide → loan-guide (모든 path 통일).
    //   종전엔 offline → hiring-setup (insurance-tax-setup 우회) 분기였는데,
    //   reorder 후엔 offline 도 loan-guide → construction-setup → vendor-setup → hiring-setup 순서.
    //   분기 조건 제거.
    nextStageIds: ["loan-guide"]
  },
  // ★ 2026-05-03 순서 수정: 한국 노동법 실무 흐름 반영.
  //   채용 결정 → 근로계약서 작성·교부 (근기법 17조, 미체결 1차 500만원 과태료) → 근로 개시
  //   → 4대보험 사업장 성립·자격취득 신고 (14일 이내) → 원천세 (월 10일) → 급여 시스템.
  //   이전: insurance-tax-setup(12) → hiring-setup(13) — 의무 처리가 채용보다 앞서있어
  //         "근로계약 미작성 직원의 4대보험"이라는 모순. 사용자 피드백으로 수정.
  {
    stageId: "hiring-setup",
    code: "hiring_setup",
    title: "Staff hiring and employment contract",
    type: "execution",
    status: "locked",
    // 2026-05-12 P3 reorder: vendor-setup 직후 (인테리어 거의 끝나갈 때 채용 시작).
    stepNumber: 14,
    totalSteps: 19,
    goal: "Decide staffing needs, run hiring, and sign + deliver employment contracts BEFORE the first work day.",
    whyNow: "Labor Standards Act §17: contract must be written and delivered before work starts (penalty up to ₩5M if missing). Once signed, you have 14 days to register 4-insurance — that's the next stage.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["hiring-decision-made", "employment-contract-signed"]
    },
    taskIds: ["hiring-decision-made", "employment-contract-signed"],
    riskIds: [],
    nextStageIds: ["insurance-tax-setup"]  // ← was operations-setup
  },
  {
    stageId: "insurance-tax-setup",
    code: "insurance_tax_setup",
    title: "Post-hire obligations — 4 insurance, withholding tax, payroll",
    type: "execution",
    status: "locked",
    // 2026-05-12 P3 reorder: hiring-setup 다음 (14일 의무).
    stepNumber: 15,
    totalSteps: 19,
    goal: "After signing the employment contract: register 4-insurance (within 14 days of work start), set up withholding tax (monthly 10th filing), and pick a payroll method (manual / CPA / SaaS).",
    whyNow: "These 3 obligations trigger automatically once your first employee starts work. 4-insurance late = penalty + back-payment retroactively to start date. Withholding tax misfiling = monthly penalty.",
    // ⚠️ 3개 모두 필수 (사용자 보고 2026-05-04 "2개만 체크해도 다음 단계로 자동 진행"):
    //    이전엔 payroll-method-decided 가 required:false → 4대보험·원천세만 체크해도 advance.
    //    급여 처리 방식 결정 안 하면 첫 달부터 매월 수기 혼선·세무사 누락 발생 → 운영 가능 상태가 아님.
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["insurance-registered", "withholding-tax-set", "payroll-method-decided"]
    },
    taskIds: ["insurance-registered", "withholding-tax-set", "payroll-method-decided"],
    riskIds: [],
    nextStageIds: ["operations-setup"]  // ← was hiring-setup
  },
  {
    stageId: "operations-setup",
    code: "operations_setup",
    title: "Operations and marketing",
    type: "execution",
    status: "locked",
    stepNumber: 16,
    totalSteps: 19,
    goal: "Register on delivery platforms, go live with POS, and prepare SNS and local marketing.",
    whyNow: "Customers need to be able to find you from day one — late marketing setup means lost early revenue.",
    // ⚠️ 6개 task 모두 필수 (사용자 보고 2026-05-04 "6개 중 3개만 체크해도 다음 단계 자동 진행"):
    //    이전 룰(2개만 required) + 누락된 taskIds → UI는 6개 표시인데 룰은 일부만 평가 →
    //    핵심 운영 인프라(VAN·간판·음악) 미완 상태로 advance → 오픈 후 카드 결제 X · 간판 X · 저작권 위반 리스크.
    //    operations-setup 은 매장 오픈 직전 단계라 6개 모두 완료해야 영업 가능.
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["delivery-app-registered", "pos-live", "sns-setup", "brand-identity-offline", "card-merchant-registered", "music-license-registered"]
    },
    taskIds: ["delivery-app-registered", "pos-live", "sns-setup", "brand-identity-offline", "card-merchant-registered", "music-license-registered"],
    riskIds: [],
    nextStageIds: ["pre-launch"]
  },
  {
    stageId: "pre-launch",
    code: "pre_launch",
    title: "Soft open",
    type: "execution",
    status: "locked",
    stepNumber: 17,
    totalSteps: 19,
    goal: "Run a soft open with a limited audience, collect feedback, and complete the final pre-opening checklist.",
    whyNow: "A soft open surfaces operational problems before they reach paying customers at scale.",
    // ⚠️ 3개 모두 필수 — feedback-collected 가 빠지면 「피드백 수집 안 해도 본오픈」 가능. 사용자 정신 어긋남.
    //    이전엔 ["soft-open-done","final-checklist"] 만 required.
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["soft-open-done", "feedback-collected", "final-checklist"]
    },
    taskIds: ["soft-open-done", "feedback-collected", "final-checklist"],
    riskIds: [],
    // 2026-05-12 P3 reorder: pre-launch → financial-review (loan-guide 가 이미 #11로 이동).
    nextStageIds: ["financial-review"]
  },

  // ── Online / Digital path: stages 5-9 ─────────────────────────────────────
  {
    stageId: "platform-setup",
    code: "platform_setup",
    title: "Choose a sales platform",
    type: "selection",
    status: "locked",
    stepNumber: 5,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Select the right sales platform — Smart Store, Coupang, or a custom store — and open a seller account.",
    whyNow: "Platform choice defines fees, customer reach, and fulfillment options from day one.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["platform-selected", "seller-account-created"]
    },
    taskIds: ["platform-selected", "seller-account-created"],
    riskIds: [],
    nextStageIds: ["online-registration"]
  },
  {
    stageId: "online-registration",
    code: "online_registration",
    title: "Business and telecom registration",
    type: "execution",
    status: "locked",
    stepNumber: 6,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Register the business and file the telecommunications sales notification required for all online sellers.",
    whyNow: "Selling online without a telecom sales filing is a legal violation — this must be done before going live.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["business-registered-online", "telecom-sale-filed"]
    },
    taskIds: ["business-registered-online", "telecom-sale-filed"],
    riskIds: [],
    // 2026-05-12 P3: online-registration → biz-registration (was sourcing-setup).
    //   사업자등록 + 통신판매 직후 통장·세무사 결정 → tax → loan → 재고 발주 순서.
    //   온라인 셀러도 사업용 통장 없이 재고 사면 종소세 신고 시 비용 인정 어려움.
    nextStageIds: ["biz-registration"]
  },
  {
    stageId: "sourcing-setup",
    code: "sourcing_setup",
    title: "Product sourcing",
    type: "execution",
    status: "locked",
    // 2026-05-12 P3 reorder: biz/tax/loan 사이에 들어가 #10 (online 새 순서).
    stepNumber: 10,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Contract with suppliers, photograph products, and create detail pages ready for listing.",
    whyNow: "High-quality photos and detail pages are the primary conversion driver in online selling.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["supplier-contracted", "product-photographed"]
    },
    taskIds: ["supplier-contracted", "product-photographed", "detail-page-created"],
    riskIds: [],
    nextStageIds: ["store-setup"]
  },
  {
    stageId: "store-setup",
    code: "store_setup",
    title: "Store and delivery setup",
    type: "execution",
    status: "locked",
    stepNumber: 11,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Configure the storefront, connect shipping carriers, and set up payment.",
    whyNow: "Getting shipping and payment right before launch prevents failed orders and refund requests on opening day.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["store-configured", "shipping-setup"]
    },
    taskIds: ["store-configured", "shipping-setup", "pg-connected"],
    riskIds: [],
    nextStageIds: ["online-marketing"]
  },
  {
    stageId: "online-marketing",
    code: "online_marketing",
    title: "Marketing and launch",
    type: "execution",
    status: "locked",
    stepNumber: 12,
    totalSteps: 0, // 동적 산출: useComputedDashboard.pathTotalStages 사용
    goal: "Optimize for search, set up initial ads, and plan a review-building strategy before launch.",
    whyNow: "New stores have no reviews and low search ranking — early marketing investment directly affects first-month revenue.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["store-seo-done", "first-ad-set"]
    },
    taskIds: ["store-seo-done", "first-ad-set", "review-strategy-set"],
    riskIds: [],
    // 2026-05-12 P3: online-marketing → financial-review (tax/loan/biz는 이미 일찍 방문 완료).
    nextStageIds: ["financial-review"]
  },

  // ── Shared tail (재정렬됨) ──
  // 2026-05-12 P3 reorder: 자금·통장 의사결정이 인테리어 발주 *전* 으로 이동.
  //   리드타임 (정책자금 신청부터 입금까지 4-12주) 고려하면 영업 전 신청 필수.
  //   loan-guide 의 다음 stage 는 path 별로 분기.
  {
    stageId: "loan-guide",
    code: "loan_guide",
    title: "Funding and support programs",
    type: "verification",
    status: "locked",
    // offline path #11, online #9, startup ~#15 — path-aware 표시는 traverseUserPath 이 처리.
    stepNumber: 11,
    totalSteps: 19,
    goal: "Explore government funding, startup support programs, low-interest loans, and grants. Match your profile to available programs before committing personal capital.",
    whyNow: "Government programs have application deadlines. Application → disbursement takes 4–12 weeks for 소상공인 정책자금 — apply BEFORE construction/inventory commit so funds arrive when needed.",
    completionRule: { kind: "required_inputs", requiredKeys: ["reviewed"] },
    taskIds: [],
    riskIds: [],
    // 2026-05-12 P3: path 별 분기.
    //   offline (음식·카페·소매·뷰티 등) → construction-setup (인테리어 발주)
    //   online-digital → sourcing-setup (재고 발주)
    //   startup-tech → biz-registration (default — startup 은 후반에 통장·세무사 결정)
    nextStageIds: ["biz-registration"],
    nextStageConditions: [
      {
        decisionStageId: "industry-selection",
        decisionKey: "categoryId",
        matchValueIn: ["food", "cafe-dessert", "retail", "beauty", "fitness", "education", "pet", "living-service", "space"],
        stageIds: ["construction-setup"]
      },
      {
        decisionStageId: "industry-selection",
        decisionKey: "categoryId",
        matchValue: "online-digital",
        stageIds: ["sourcing-setup"]
      }
    ]
  },

  // 2026-05-12 P3: biz-registration 의 위치가 path 별로 다름.
  //   - offline: #9 (registration-setup 직후, 인테리어 전)
  //   - online:  #7 (online-registration 직후, 재고 발주 전)
  //   - startup: ~#16 (tax/loan 다음, 후반 finalization)
  //   array 위치는 후반에 두되 nextStageConditions 로 분기.
  {
    stageId: "biz-registration",
    code: "biz_registration",
    title: "Business account + CPA decision",
    type: "execution",
    status: "locked",
    // path 별 표시는 traverseUserPath 가 자동 계산 (이 stepNumber 는 사용 안 함)
    stepNumber: 9,
    totalSteps: 19,
    goal: "Confirm the business registration, open a dedicated business account (사업용 통장·카드), and decide whether to engage a tax accountant.",
    whyNow: "사업용 통장 = day-1 인프라. 매출 입금처·경비 결제·세금계산서 발행 모두 사업용 통장 기반. 사업자등록증 발급 후 즉시 개설 (~30분, 무료). 세무사 결정은 매출 규모·복잡도에 따라.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["biz-reg-confirmed", "biz-account-opened"]
    },
    taskIds: ["biz-reg-confirmed", "biz-account-opened", "cpa-decision-made"],
    riskIds: [],
    // 2026-05-12 P3: path 별 분기.
    //   offline + online → tax-guide (통장 개설 후 과세유형·신고 일정 검증)
    //   startup → financial-review (default — startup 은 후반에 도달)
    nextStageIds: ["financial-review"],
    nextStageConditions: [
      {
        decisionStageId: "industry-selection",
        decisionKey: "categoryId",
        matchValueIn: ["food", "cafe-dessert", "retail", "beauty", "fitness", "education", "pet", "living-service", "space", "online-digital"],
        stageIds: ["tax-guide"]
      }
    ]
  },
  {
    stageId: "financial-review",
    code: "financial_review",
    title: "Monthly operating costs review",
    type: "verification",
    status: "locked",
    stepNumber: 18,
    totalSteps: 19,
    goal: "Review and confirm the monthly cost structure auto-estimated from prior stages (rent, staff, operations, loan). Ensures operational dashboard has accurate baseline from Day 1.",
    whyNow: "Oversights here directly cause cash shortages in the first three months. Confirming the structure once prevents re-entering the same data after launch.",
    completionRule: { kind: "required_inputs", requiredKeys: ["reviewed"] },
    taskIds: [],
    riskIds: [],
    nextStageIds: ["pre-launch-final"]
  },
  {
    stageId: "pre-launch-final",
    code: "pre_launch_final",
    title: "Final opening preparation",
    type: "execution",
    status: "locked",
    stepNumber: 19,
    totalSteps: 19,
    goal: "Complete final pre-launch preparations: inventory, team readiness, and marketing announcements.",
    whyNow: "Gaps in preparation on launch day directly damage the first customer experience and are hard to recover from.",
    completionRule: {
      kind: "required_tasks",
      // 본문 4페이지를 핵심 액션 5개로 압축
      requiredTaskIds: [
        "launch-date-locked",       // Page 0 — D-Day 확정 + 베타 10명
        "production-deployed",      // Page 1 — 배포 + Sentry/Slack 검증
        "payment-and-legal-ready",  // Page 1 — 라이브 결제 + PIPA 풋터
        "runbook-prepared",         // Page 2 — 당일 매뉴얼 (시간대별·템플릿·응급)
        "calendar-alarms-set",      // Page 3 — 13개 알림 + PH 예약 + D-Day 봉인
      ]
    },
    taskIds: [
      "launch-date-locked",
      "production-deployed",
      "payment-and-legal-ready",
      "runbook-prepared",
      "calendar-alarms-set",
    ],
    riskIds: [],
    // 로드맵 마지막 단계 — 다음은 운영 대시보드(businessLaunched=true)로 이동
    // 출시 후 생존 점검(KPI·런웨이·비상금·연락처)은 MorningBriefing/Cashflow Hero 등 대시보드에서 처리
    nextStageIds: []
  }
];

export const starterTaskMap: WorkflowTaskMap = {
  // ── Franchise application tasks ────────────────────────────────────────────
  "franchise-application": [
    { taskId: "fc-inquiry", title: "Request franchise consultation from HQ", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "fc-disclosure", title: "Receive and review franchise disclosure document (14-day period)", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "fc-visit", title: "Visit nearby franchise stores and talk to existing owners", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "fc-legal", title: "Get legal review of franchise contract", status: "todo", required: false, estimatedMinutes: 120 },
    { taskId: "fc-contract", title: "Sign franchise agreement and pay franchise fee", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "fc-training", title: "Complete HQ training program", status: "todo", required: true, estimatedMinutes: 2400 }
  ],
  // ── Target customer definition tasks (shared, 모든 cluster) ────────────────
  //   페르소나 한 명을 명시 → 후속 모든 결정 (입지·메뉴·가격·광고) 의 anchor.
  "target-customer-definition": [
    { taskId: "tc-age-narrowed", title: "Narrow primary age range / industry to one persona", status: "todo", required: true, estimatedMinutes: 5 },
    { taskId: "tc-lifestyle-specified", title: "Specify lifestyle / daily workflow — when, where, why they use the product", status: "todo", required: true, estimatedMinutes: 8 },
    { taskId: "tc-price-anchor", title: "Set ticket / budget anchor — including the price they would NEVER pay", status: "todo", required: true, estimatedMinutes: 5 },
    { taskId: "tc-counter-example", title: "Verify with counter-examples — 4 behaviors this persona would never do", status: "todo", required: true, estimatedMinutes: 10 }
  ],
  // ── Menu / service lineup tasks (offline + online clusters) ────────────────
  //   초기 메뉴(서비스) 라인업 락인 → 식자재·재고·가격 전략의 베이스라인.
  "menu-design": [
    { taskId: "md-signature-items", title: "Lock 3-5 signature menu (or service) items", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "md-side-items", title: "Lock 2-3 side / supporting items", status: "todo", required: true, estimatedMinutes: 15 },
    { taskId: "md-pricing-set", title: "Set price per item — target cost ratio 33% or lower", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "md-categories-organized", title: "Organize categories + display order — auto-loads into inventory card", status: "todo", required: true, estimatedMinutes: 15 }
  ],
  // ── Tech startup path tasks ───────────────────────────────────────────────
  "startup-foundation": [
    { taskId: "problem-defined", title: "Define the core problem in one sentence (Musk first-principles + Thiel contrarian truth)", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "founder-alignment", title: "Decide team structure (solo or co-founder) and document roles, equity vesting, and exit clauses", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "company-formation-path", title: "Decide: sole proprietor vs corporation (actual registration happens in next 'Company Setup' stage)", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "case-study-review", title: "Review 5 verified founder cases for your mode (indie/bootstrap/seed/seriesA) and document 3 takeaways", status: "todo", required: false, estimatedMinutes: 30 },
    { taskId: "build-in-public-setup", title: "Set up build-in-public channel (X/Twitter or blog) — Marc Lou & Pieter Levels pattern", status: "todo", required: false, estimatedMinutes: 30 },
  ],
  "customer-discovery": [
    { taskId: "customer-interviews-done", title: "Run at least 10 customer interviews in one target segment", status: "todo", required: true, estimatedMinutes: 180 },
    { taskId: "pain-pattern-documented", title: "Document repeated pain patterns, existing workarounds, and urgency", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "narrow-wedge-defined", title: "Choose the narrowest painful workflow to solve first", status: "todo", required: true, estimatedMinutes: 45 }
  ],
  "mvp-build": [
    { taskId: "core-workflow-defined", title: "Define one core user workflow and success outcome", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "mvp-shipped", title: "Ship the smallest MVP that proves this workflow can be solved", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "ip-protection-filed", title: "File trademark and provisional patent before public launch", status: "todo", required: true, estimatedMinutes: 90, waitDays: 14, followupQuestion: "특허/상표 출원 접수 확인서를 받으셨나요?" }
  ],
  "launch-gtm": [
    // ── Page 1: 출시 스택 (4가지 도구) ──
    { taskId: "analytics-live", title: "Install analytics (PostHog or Mixpanel) — 5 core events + 1 funnel + weekly dashboard", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "billing-or-conversion-live", title: "Set up Stripe billing or conversion tracking — pricing decision + free→paid trigger", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "error-monitoring-live", title: "Connect Sentry error monitoring + Slack alerts (10-min Next.js SDK setup)", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "feedback-loop-live", title: "Build feedback loop — in-app button + Discord/Cal.com + 24h welcome email", status: "todo", required: true, estimatedMinutes: 45 },
    // ── Page 2: 첫 100명 (GTM 핵심) ──
    { taskId: "first-100-users-acquired", title: "Acquire first 100 users hand-delivered — DM/cold email + community + PH/HN launch", status: "todo", required: true, estimatedMinutes: 1200 },
    // ── Page 3: 마케팅·콘텐츠 ──
    { taskId: "marketing-content-cadence", title: "Pick 1-2 marketing channels + start weekly content cadence (Build in Public, SEO, etc)", status: "todo", required: true, estimatedMinutes: 240 },
    // ── 선택 ──
    { taskId: "security-checklist-reviewed", title: "Review 47-item security checklist before launch (AI prompts, SOC2, privacy, DDoS)", status: "todo", required: false, estimatedMinutes: 120 },
    // ⚠️ terms-privacy-published 와 pg-payment-ready 는 company-setup 단계로 이관.
    // ⚠️ app-store 제출은 go-live 단계로 분리.
  ],
  "go-live": [
    { taskId: "web-go-live", title: "Web go-live — domain + SSL + SEO meta + Google Search Console", status: "todo", required: true, estimatedMinutes: 180 },
    { taskId: "launch-channel-active", title: "Launch on at least 1 channel — Product Hunt, Hacker News, or Disquiet (build log)", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "apple-app-store-submitted", title: "Submit to Apple App Store (iOS only) — Xcode 26 + iOS 26 SDK + TestFlight (mandatory from 2026-04-28)", status: "todo", required: false, estimatedMinutes: 480, waitDays: 7, followupQuestion: "App Store 심사 결과 받으셨나요?" },
    { taskId: "google-play-submitted", title: "Submit to Google Play (Android only) — 12 testers × 14 days closed testing", status: "todo", required: false, estimatedMinutes: 600, waitDays: 14, followupQuestion: "Google Play 폐쇄 테스트 완료되셨나요?" },
    { taskId: "launch-day-monitored", title: "Launch day — 24h monitoring + reply to every comment + share on Twitter/HN/PH", status: "todo", required: false, estimatedMinutes: 480 },
  ],
  "growth-engine": [
    { taskId: "north-star-set", title: "Choose one north-star metric and one weekly growth metric", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "weekly-review-running", title: "Run a weekly review for growth, burn, and biggest bottleneck", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "retention-check-defined", title: "Define a retention check so growth is not judged on acquisition alone", status: "todo", required: true, estimatedMinutes: 45 }
  ],
  "company-setup": [
    { taskId: "business-structure-decided", title: "Choose legal structure: sole proprietor (개인사업자) or corporation (법인) — most startups begin as sole proprietor", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "startup-biz-registered", title: "Complete business registration via HomeTax (홈택스) or tax office — takes 3 business days", status: "todo", required: true, estimatedMinutes: 60, waitDays: 3, followupQuestion: "사업자등록증을 발급받으셨나요?" },
    { taskId: "ip-protection-planned", title: "File patent application at KIPRIS/특허로 BEFORE any public disclosure (demo, beta, press)", status: "todo", required: true, estimatedMinutes: 90 },
    { taskId: "trademark-filed", title: "File trademark application for your brand name and logo at 특허로 (patent.go.kr) — protects brand before competitor registers same name", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "tax-setup-basics", title: "Choose tax type (간이과세 vs 일반과세) and set up basic bookkeeping", status: "todo", required: false, estimatedMinutes: 45 },
    { taskId: "security-basics", title: "Set up customer data protection plan + security baseline (TLS, RLS, env vars)", status: "todo", required: false, estimatedMinutes: 45 },
    // ── launch-gtm 에서 이관 — 사업자등록 후 즉시 처리 ──
    { taskId: "terms-privacy-published", title: "Publish Terms of Service and Privacy Policy before any user can sign up (legally required, generate via 개인정보보호 포털)", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "pg-payment-ready", title: "Apply for PG (payment gateway) — Toss Payments / KCP / Inicis. Review takes 1-2 weeks, start as soon as site is ready", status: "todo", required: false, estimatedMinutes: 30, waitDays: 14, followupQuestion: "PG 심사가 완료되었나요?" },
  ],
  "fundraising-readiness": [
    // ── Page 0: 왜·런웨이 진단 ──
    { taskId: "runway-model-ready", title: "Runway model — Best/Base/Worst scenarios + Net Burn < 2x Net New ARR check + 18+ month target", status: "todo", required: true, estimatedMinutes: 60 },
    // ── Page 1: 부트스트랩 vs 투자 결정 ──
    { taskId: "fundraising-decision-made", title: "Decide path: PATH A (Bootstrap) vs PATH B (Fundraise) — Default Alive check + 5 prep items", status: "todo", required: true, estimatedMinutes: 45 },
    // ── Page 2: 프로그램 매칭 (신규) ──
    { taskId: "funding-programs-matched", title: "Pick 1-3 funding programs from your mode (TIPS/예비창업/액셀러레이터/VC) and start applications", status: "todo", required: true, estimatedMinutes: 90 },
    // ── Page 3: AI 사업계획서 + 투자자 만나기 ──
    { taskId: "investor-material-ready", title: "AI business plan generated + 10-slide pitch deck + 3-yr financial model + product demo", status: "todo", required: true, estimatedMinutes: 120 },
  ],
  "venture-certification": [
    // ── Page 1: 인증 유형 결정 ──
    { taskId: "venture-cert-type-checked", title: "Check venture certification type: investment type, R&D type, or innovation growth type", status: "todo", required: true, estimatedMinutes: 30 },
    // ── Page 3: 신청 절차 ──
    { taskId: "application-submitted", title: "Submit venture certification application at venture.or.kr — review takes 30 days", status: "todo", required: true, estimatedMinutes: 90, waitDays: 30, followupQuestion: "벤처기업 확인서 받으셨나요?" },
    // ── Page 3: 인증 후 활용 (신규) ──
    { taskId: "venture-benefits-activated", title: "Activate post-cert benefits — 5-yr corp tax 50% cut + tax-free stock options + 50% option pool + military exemption", status: "todo", required: true, estimatedMinutes: 60 },
  ],
  // ── Cluster B (Hardware/IoT) — NPI 4단계 ──
  // 검증 출처: Titoma·OnLogic·Kaizen Dynamic·Hatch (EVT/DVT/PVT 정의), IB-Lenhardt·BlueAsiaLabs·MPR Korea (KC), CISA HBOM Framework
  "hardware-prototype": [
    { taskId: "evt-passed", title: "EVT (Engineering Validation Test) 통과 — 10-50 유닛, 4-6주, 핵심 회로/펌웨어 결함 검증", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "dvt-passed", title: "DVT (Design Validation Test) 통과 — 50-200 유닛, 양산 공정과 동일하게 제작, 내구성·신뢰성 테스트", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "pvt-passed", title: "PVT (Production Validation Test) 통과 — 첫 정식 양산의 5-10%, 최소 4주, 양산 가능성·목표 단가 확인", status: "todo", required: true, estimatedMinutes: 180 },
  ],
  "bom-supply-chain": [
    { taskId: "bom-finalized", title: "BOM (Bill of Materials) 완성 — 모든 부품·하위조립·원재료 + 공급사·리드타임·대안 부품 명시", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "suppliers-locked", title: "공급사 락인 — 핵심 부품 1차/2차 공급사 계약 (CISA HBOM 권장: dual-sourcing)", status: "todo", required: true, estimatedMinutes: 180 },
    { taskId: "single-source-risks-identified", title: "Single-source 리스크 식별 — 대체 부품 없는 항목 명시 + 안전재고(safety stock) 계획", status: "todo", required: true, estimatedMinutes: 120 },
  ],
  "certification-kc-ce": [
    { taskId: "pre-compliance-test-done", title: "Pre-compliance 테스트 — 정식 KC 인증 전 자체 EMC/Safety 테스트 (몇 달 단축 효과)", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "cert-bodies-selected", title: "인증기관 선정 — 한국 RRA/NTC 등 공인 시험소 + 한국 대리인 지정 (KC 필수)", status: "todo", required: true, estimatedMinutes: 90 },
    { taskId: "cert-application-submitted", title: "KC 인증 신청 — 비무선 4-8주 / 무선 (KC-RRA + Safety + EMC) 8-16주", status: "todo", required: true, estimatedMinutes: 180, waitDays: 56 },
  ],
  "manufacturing-partner": [
    { taskId: "ems-shortlist-done", title: "EMS/CM 후보 3-5개 비교 — 능력·캐파·품질 표준·QC 시스템 점검", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "ems-audited", title: "EMS 현장 감사 — 직접 방문 또는 화상 라인 점검, ISO 9001 등 인증 확인", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "first-run-planned", title: "1차 양산 계획 — MOQ 협상, 결제조건 (T/T·L/C), 불량률 임계치, IPI 검사 포인트", status: "todo", required: true, estimatedMinutes: 180 },
  ],
  // ── Cluster C (Deep Tech Lab — 로보틱스/바이오) — 4단계 ──
  // 검증 출처: IntoInWorld 2026 Korea Clinical Trials, MFDS 가이드, KoreaBiomed (의료기기 IND 4-6주)
  "lab-setup": [
    { taskId: "lab-facility-secured", title: "랩/시제품 작업장 확보 — 로보틱스: 안전 펜스·EMC 차폐 / 바이오: GLP 또는 BSL-1/2 시설", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "safety-protocol-defined", title: "안전 매뉴얼 — 로보틱스: 비상정지·전원 격리 / 바이오: 화학물질·생물학적 폐기물 처리", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "core-equipment-installed", title: "핵심 장비 설치·교정 — 로보틱스: 모션캡처·계측 / 바이오: 유전자 분석기·세포배양기", status: "todo", required: true, estimatedMinutes: 480 },
  ],
  "prototype-iteration": [
    { taskId: "iteration-plan-set", title: "반복 일정 + go/no-go 게이트 — 로봇 v0~v3 주간 / 바이오: 스크리닝 단계별 결정 기준", status: "todo", required: true, estimatedMinutes: 180 },
    { taskId: "v1-prototype-shipped", title: "v1 프로토타입 완성 — 핵심 기능 동작 + 실험 데이터 수집 가능 상태", status: "todo", required: true, estimatedMinutes: 720 },
    { taskId: "feedback-cycle-running", title: "피드백 사이클 가동 — 매주 사용자/실험 결과 → 다음 v 정의", status: "todo", required: true, estimatedMinutes: 120 },
  ],
  "field-or-clinical-test": [
    { taskId: "test-protocol-approved", title: "테스트 프로토콜 승인 — 로봇: 필드 안전 평가 / 바이오: IRB 윤리 심사 + 임상시험계획서", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "test-cohort-secured", title: "참가자/환경 확보 — 로봇: 필드 사이트 + 모니터링 / 바이오: 임상시험 기관 + 피험자 + 보상보험", status: "todo", required: true, estimatedMinutes: 360 },
    { taskId: "first-results-collected", title: "첫 결과 수집 — 로봇: 동작 로그·고장 통계 / 바이오: IND 4-6주 (30 working days) 후 1상 데이터", status: "todo", required: true, estimatedMinutes: 240, waitDays: 42 },
  ],
  "regulatory-submission": [
    { taskId: "pre-consultation-done", title: "MFDS pre-consultation 완료 — 정식 심사 전 사전 협의 (최단 7일로 단축 가능)", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "regulatory-package-submitted", title: "인허가 패키지 제출 — 로봇: KC + 안전인증 / 바이오: MFDS Fast-Track (199개 카테고리·113개 AI 디지털 의료기기)", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "approval-pathway-confirmed", title: "승인 경로 확정 — 일반 (490일→295일) vs Fast-Track (80-140일) 결정 + 일정 락인", status: "todo", required: true, estimatedMinutes: 180, waitDays: 100 },
  ],
  // ── Cluster D (Extreme Deep Tech — 반도체/클린테크) — 4단계 ──
  // 검증 출처: AnySilicon·Wikipedia (MPW), Vendr·EDABoard·Datagravity (EDA), Silicon Analysts (TSMC 2/3nm 2027-2028 매진), TrendForce (OSAT 5-30% 인상)
  "eda-tooling-setup": [
    { taskId: "eda-licenses-secured", title: "EDA 라이선스 확보 — 스타트업 티어 (token-based, full-service) 비교 후 multi-year 협상 (10-25% 할인)", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "design-env-set-up", title: "설계 환경 구축 — 서버, OS, 백업, 라이선스 서버, 시뮬레이션 클러스터", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "ip-library-strategy-defined", title: "IP/라이브러리 전략 — 자체 vs 라이선스 IP, 표준셀 라이브러리, 메모리/PHY/AnalogIP 결정", status: "todo", required: true, estimatedMinutes: 240 },
  ],
  "mpw-or-pilot-tape-out": [
    { taskId: "foundry-process-selected", title: "공정 노드 선정 — TSMC/Samsung/UMC/X-FAB/SkyWater 등 + 노드 (28nm·12nm·7nm) 결정", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "tape-out-package-ready", title: "테이프아웃 패키지 준비 — GDS-II, DRC/LVS clean, 검증 보고서, schedule 등록", status: "todo", required: true, estimatedMinutes: 720 },
    { taskId: "tape-out-submitted", title: "MPW shuttle 또는 full-mask 테이프아웃 제출 — MPW 90-95% 절감 / Full mask: 28nm $1M+ · 7nm $10M+", status: "todo", required: true, estimatedMinutes: 120, waitDays: 180 },
  ],
  "packaging-and-test": [
    { taskId: "osat-partner-selected", title: "OSAT 파트너 선정 — ASE·Amkor·JCET·Powertech 등 (2026 가격 5-30% 인상, 90% 가동률)", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "test-plan-defined", title: "테스트 플랜 정의 — wafer-level/package-level, ATE, burn-in, yield 임계치", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "first-samples-validated", title: "첫 샘플 검증 — 기능·성능·전력·온도, customer 샘플 발송 준비", status: "todo", required: true, estimatedMinutes: 360 },
  ],
  "partner-foundation-or-pilot-line": [
    { taskId: "foundry-partnership-discussion", title: "파운드리 파트너십 협의 — TSMC 2/3nm 2027-2028 매진, Samsung 대안 / 구형 노드는 SkyWater·Tower·X-FAB", status: "todo", required: true, estimatedMinutes: 480 },
    { taskId: "volume-production-plan", title: "양산 수량 계획 — 첫 12개월 wafer-out 예상, CoWoS 등 advanced packaging 52-78주 leadtime 반영", status: "todo", required: true, estimatedMinutes: 360 },
    { taskId: "scale-up-budget-modeled", title: "Scale-up 예산 모델링 — Full mask 전환비 + OSAT 캐파·인상률 + 채널/디스트리뷰터 비용", status: "todo", required: true, estimatedMinutes: 240 },
  ],
  // ── Offline path tasks ─────────────────────────────────────────────────────
  "permit-check": [
    // ⓘ 이 단계는 "사전 확인" — 발급/신청은 registration-setup 단계에서 수행.
    //   따라서 모든 항목은 "확인했나요?" 형태의 verification 으로 통일.
    {
      taskId: "building-registry-checked",
      title: "건축물대장 용도가 내 업종 영업을 허용하는지 확인 — 근린생활시설 등 코드 점검",
      status: "todo",
      required: true,
      estimatedMinutes: 15,
    },
    {
      taskId: "permit-type-checked",
      title: "위 패널에서 내 업종에 필요한 인허가·등록 종류를 모두 확인",
      status: "todo",
      required: true,
      estimatedMinutes: 20
    },
    // ⚠️ 5개 모두 required: true — 영업신고에 직결되는 인허가 사전 점검 항목.
    //    이전엔 false 였으나 사용자가 "체크리스트 2개만 해도 다음 단계로 넘어간다" 고 보고 (2026-05-03).
    //    위생·면허·소방 빠지면 영업신고 거부되니 모두 필수.
    {
      taskId: "hygiene-health-checked",
      title: "위생교육 6시간·보건증 발급 요건 확인 (음식/카페/뷰티) — 절차·기간·발급처",
      status: "todo",
      required: true,
      estimatedMinutes: 15
    },
    {
      taskId: "license-registration-checked",
      title: "전문 면허·업종별 등록 요건 확인 (미용사 면허, 학원·체육시설·동물관련업 등록 등)",
      status: "todo",
      required: true,
      estimatedMinutes: 15
    },
    {
      taskId: "fire-safety-checked",
      title: "소방완비증명서·시설 안전 요건 확인 — 영업장 면적·층수별 기준 점검",
      status: "todo",
      required: true,
      estimatedMinutes: 15
    },
  ],
  "contract-review": [
    {
      taskId: "use-check",
      title: "Confirm building use and zoning fit",
      status: "todo",
      required: true,
      estimatedMinutes: 20
    },
    {
      taskId: "facility-check",
      title: "Review utilities, ventilation, and facilities",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "restriction-check",
      title: "Check lease restrictions, key money, and renewal clauses",
      status: "todo",
      required: true,
      estimatedMinutes: 25
    },
    {
      taskId: "septic-tank-checked",
      title: "Confirm septic tank capacity supports food service permit (food/cafe only)",
      status: "todo",
      required: false,
      estimatedMinutes: 15
    },
    {
      taskId: "certified-date-obtained",
      title: "Obtain 확정일자 (certified date stamp) on lease for deposit protection",
      status: "todo",
      required: true,
      estimatedMinutes: 20
    }
  ],
  "construction-setup": [
    {
      // 자동 완료: 사용자가 ConstructionSetupStage UI 에서 selectedInteriorConcept 를
      //   선택하면 useTaskAutoCompletion 이 이 task 를 mark-complete.
      taskId: "interior-concept-selected",
      title: "Pick a design concept direction (industrial / natural / parisian / etc.)",
      status: "todo",
      required: true,
      estimatedMinutes: 10
    },
    {
      taskId: "contractor-selected",
      title: "Select interior contractor and collect at least two estimates",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "design-approved",
      title: "Approve final layout design and construction plan",
      status: "todo",
      required: true,
      estimatedMinutes: 45
    },
    {
      taskId: "construction-complete",
      title: "Confirm construction complete and pass final walkthrough",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      // ⚠ 법적 필수 — 소방필증·보건증 없이는 영업 신고 불가. 이전엔 optional 이었지만
      //   다음 단계 진입 전에 신청만이라도 시작돼야 14일 대기시간 안에 개업 일정 맞출 수 있음.
      taskId: "fire-health-parallel",
      title: "Apply for fire safety certificate (소방필증) and health certificate (보건증) in parallel with construction",
      status: "todo",
      required: true,
      estimatedMinutes: 30,
      waitDays: 14,
      followupQuestion: "소방필증/보건증 신청 완료하셨나요?"
    }
  ],
  "vendor-setup": [
    {
      taskId: "supplier-identified",
      title: "Confirm key suppliers for ingredients, products, or materials",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "equipment-planned",
      title: "Finalize equipment purchase or rental plan",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    {
      taskId: "pos-selected",
      title: "Select POS system and connect to operating workflow",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    }
  ],
  "registration-setup": [
    {
      taskId: "tax-type-decided",
      title: "Decide between simplified (간이) and general (일반) taxation before registration",
      status: "todo",
      required: true,
      estimatedMinutes: 15
    },
    {
      taskId: "business-registered",
      title: "Complete business registration at the tax office (within 20 days of starting operations)",
      status: "todo",
      required: true,
      estimatedMinutes: 40,
      waitDays: 3,
      followupQuestion: "사업자등록증 발급 받으셨나요?"
    },
    {
      taskId: "permit-filed",
      title: "File operating permit or notification with the relevant authority",
      status: "todo",
      required: true,
      estimatedMinutes: 60,
      waitDays: 7,
      followupQuestion: "영업신고/허가 수리 완료 통보 받으셨나요?"
    }
  ],
  "insurance-tax-setup": [
    {
      taskId: "insurance-registered",
      title: "Register 4 major insurance policies at 4insure.or.kr",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    {
      taskId: "withholding-tax-set",
      title: "Set up withholding tax via Hometax simplified tax table",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "payroll-method-decided",
      title: "Choose payroll method: manual, tax advisor, or payroll SaaS (flex, Albam)",
      status: "todo",
      required: true,
      estimatedMinutes: 20
    }
  ],
  "hiring-setup": [
    {
      taskId: "hiring-decision-made",
      title: "Decide staffing needs and headcount plan",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "employment-contract-signed",
      title: "Write and deliver employment contracts",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    }
  ],
  "operations-setup": [
    {
      taskId: "delivery-app-registered",
      title: "Register on delivery platforms (Baemin, Coupang Eats, etc.)",
      status: "todo",
      required: true,
      estimatedMinutes: 45
    },
    {
      taskId: "pos-live",
      title: "Confirm POS is live and tested with real transactions",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "sns-setup",
      title: "Set up Instagram, Naver Place, and Kakao Channel",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "brand-identity-offline",
      title: "Prepare brand assets: signage design, menu/price list, and interior brand elements",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "card-merchant-registered",
      title: "Register as card merchant via VAN provider (NICE, KIS, Smartro) — takes ~1 week",
      status: "todo",
      required: true,
      estimatedMinutes: 30,
      waitDays: 7,
      followupQuestion: "카드 가맹점 등록이 완료되었나요?"
    },
    {
      taskId: "music-license-registered",
      title: "Register for background music license (KOMCA/매장음악서비스) if store >50㎡",
      status: "todo",
      required: true,
      estimatedMinutes: 15
    }
  ],
  "pre-launch": [
    {
      taskId: "soft-open-done",
      title: "Complete day-of soft open operations checklist",
      status: "todo",
      required: true,
      estimatedMinutes: 120
    },
    {
      taskId: "feedback-collected",
      title: "Collect guest feedback (taste · service · price · ambiance)",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "final-checklist",
      title: "Complete grand opening marketing & event preparation",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    }
  ],

  // ── Online / Digital path tasks ────────────────────────────────────────────
  "platform-setup": [
    {
      taskId: "platform-selected",
      title: "Choose primary sales platform (Smart Store, Coupang, custom store)",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    {
      taskId: "seller-account-created",
      title: "Create and verify seller account on chosen platform",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    }
  ],
  "online-registration": [
    {
      taskId: "business-registered-online",
      title: "Complete business registration at the tax office",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    {
      taskId: "escrow-registered",
      title: "Open business bank account and register for escrow service (구매안전서비스) before telecom filing",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    {
      taskId: "telecom-sale-filed",
      title: "File telecommunications sales notification with local government",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    }
  ],
  "sourcing-setup": [
    {
      taskId: "kc-trademark-reviewed",
      title: "Review KC certification requirements and trademark registration before sourcing products",
      status: "todo",
      required: false,
      estimatedMinutes: 45,
    },
    {
      taskId: "supplier-contracted",
      title: "Contract with at least one reliable supplier or wholesaler",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "product-photographed",
      title: "Photograph all initial products for listing",
      status: "todo",
      required: true,
      estimatedMinutes: 90
    },
    {
      taskId: "detail-page-created",
      title: "Create product detail pages with descriptions and images",
      status: "todo",
      required: false,
      estimatedMinutes: 90
    }
  ],
  "store-setup": [
    {
      taskId: "store-configured",
      title: "Configure storefront: categories, banners, and return policy",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "shipping-setup",
      title: "Connect shipping carrier and configure delivery options",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "pg-connected",
      title: "Connect payment gateway (required for custom stores)",
      status: "todo",
      required: false,
      estimatedMinutes: 30
    },
    {
      taskId: "brand-identity-online",
      title: "Prepare brand assets: store logo, banner images, and packaging design",
      status: "todo",
      required: false,
      estimatedMinutes: 60
    },
    {
      taskId: "cs-channel-ready",
      title: "Set up customer service channel (KakaoTalk Channel or Naver TalkTalk) and prepare return/exchange policy",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "packaging-supplies-ready",
      title: "Secure packaging supplies: boxes, bubble wrap, tape, invoice printer — test a full packing workflow",
      status: "todo",
      required: true,
      estimatedMinutes: 45
    }
  ],
  "online-marketing": [
    {
      taskId: "store-seo-done",
      title: "Optimize product titles and tags for Naver Shopping search",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "first-ad-set",
      title: "Set up first Smart Store or Coupang ad campaign",
      status: "todo",
      required: true,
      estimatedMinutes: 45
    },
    {
      taskId: "review-strategy-set",
      title: "Plan early review-building strategy for new product listings",
      status: "todo",
      required: false,
      estimatedMinutes: 30
    }
  ],
  "biz-registration": [
    {
      taskId: "biz-reg-confirmed",
      title: "Confirm tax office business registration is complete",
      status: "todo",
      required: true,
      estimatedMinutes: 20
    },
    {
      taskId: "biz-account-opened",
      title: "Open a dedicated business bank account",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "cpa-decision-made",
      title: "Decide whether to hire a tax accountant",
      status: "todo",
      required: false,
      estimatedMinutes: 20
    }
  ],
  "pre-launch-final": [
    // ── Page 0 — D-Day 확정 + 베타 10명 ──
    {
      taskId: "launch-date-locked",
      title: "Lock D-Day + list 10 beta users / pre-open contacts in calendar+sheet",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    // ── Page 1 — 배포 + 모니터링 ──
    {
      taskId: "production-deployed",
      title: "Production deploy + domain + SSL + Sentry/Slack alarm triggered with real error",
      status: "todo",
      required: true,
      estimatedMinutes: 90
    },
    // ── Page 1 — 결제 + 법적 (통합) ──
    {
      taskId: "payment-and-legal-ready",
      title: "Live 100 KRW payment cycle + legal footer + PIPA 2025 (consent, portability, refund)",
      status: "todo",
      required: true,
      estimatedMinutes: 90
    },
    // ── Page 2 — 당일 매뉴얼 ──
    {
      taskId: "runbook-prepared",
      title: "Day-of runbook: hour-by-hour schedule + 5 reply templates + 5 emergency playbooks + roles",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    // ── Page 3 — 캘린더 봉인 ──
    {
      taskId: "calendar-alarms-set",
      title: "13 calendar alarms (D-28~D+14) + PH/store schedule + D-Day/D-1/D+1 blocked",
      status: "todo",
      required: true,
      estimatedMinutes: 95
    }
  ]
  // ⚠️ "first-month-check"는 운영 대시보드(MorningBriefing/Cashflow Hero)로 이전됨 — taskMap 엔트리 삭제.
};

export const starterDecisionMap: WorkflowDecisionMap = {};

export const starterRoadmap = buildRoadmapState(
  {
    roadmapId: "starter-roadmap",
    templateId: "starter-template",
    stages: starterStageFlow
  },
  starterDecisionMap,
  starterTaskMap
);

export const starterCurrentStage =
  starterRoadmap.stages.find((stage) => stage.stageId === starterRoadmap.currentStageId) ??
  starterRoadmap.stages[0];

export const starterCurrentStageCompletion = evaluateStageCompletion(
  starterCurrentStage,
  starterDecisionMap,
  starterTaskMap
);
