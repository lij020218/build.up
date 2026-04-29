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
      title: "Delivery Hybrid",
      score: 78,
      summary: "Useful when you want walk-in demand and delivery demand together.",
      reasons: ["Wider reach beyond walk-in traffic", "Strong fit for fast meals and repeat demand"],
      warnings: ["Packaging, dispatch, and channel fees add complexity"]
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
    totalSteps: 14,
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
    totalSteps: 14,
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
    totalSteps: 14,
    goal: "Define how the business will run so location and cost logic can stay realistic.",
    whyNow: "A dine-in cafe, delivery kitchen, and unmanned studio each need a different plan.",
    completionRule: { kind: "select_one", minimumSelectedCount: 1 },
    taskIds: [],
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
    totalSteps: 14,
    goal: "Capture capital, loan intent, and target opening date before recommending places or contracts.",
    whyNow: "Budget defines the safe range for every decision that follows.",
    completionRule: { kind: "required_inputs", requiredKeys: ["capital", "targetOpenDate"] },
    taskIds: [],
    riskIds: [],
    // Default → offline path. Franchise → franchise-application first.
    // Condition → online-digital branches to platform-setup.
    nextStageIds: ["permit-check"],
    nextStageConditions: [
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
      },
      {
        decisionStageId: "startup-type",
        decisionKey: "startupType",
        matchValue: "franchise",
        stageIds: ["franchise-application"]
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
    totalSteps: 18,
    goal: "Define the core problem, decide your team structure, and know when to incorporate.",
    whyNow: "Founder misalignment and fuzzy ownership destroy startups before customers ever do. But first — define the problem worth solving.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["problem-defined", "founder-alignment", "company-formation-path"]
    },
    taskIds: ["problem-defined", "founder-alignment", "company-formation-path"],
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
    totalSteps: 18,
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
    totalSteps: 18,
    goal: "Choose between sole proprietor and corporation, complete business registration, protect your IP before public disclosure, and set up basic tax and security foundations.",
    whyNow: "Now that you've validated the problem, register your business to unlock contracts, invoicing, and government programs. File IP before any public disclosure.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["business-structure-decided", "startup-biz-registered", "ip-protection-planned"]
    },
    taskIds: ["business-structure-decided", "startup-biz-registered", "ip-protection-planned", "trademark-filed", "tax-setup-basics", "security-basics"],
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
    totalSteps: 18,
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
    totalSteps: 18,
    goal: "Put analytics, billing, error monitoring, and a customer feedback loop in place before pushing for growth. If building a mobile app, submit to app stores early.",
    whyNow: "Without instrumentation founders mistake noise for signal. Analytics, billing, error monitoring, and feedback loop — these 4 enable meaningful decisions. Skipping any one means flying blind.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["analytics-live", "billing-or-conversion-live", "error-monitoring-live", "feedback-loop-live"]
    },
    taskIds: ["analytics-live", "billing-or-conversion-live", "error-monitoring-live", "feedback-loop-live", "app-store-submission"],
    riskIds: [],
    nextStageIds: ["growth-engine"]
  },
  {
    stageId: "growth-engine",
    code: "growth_engine",
    title: "Growth and retention loop",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 18,
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
    stepNumber: 11,
    totalSteps: 18,
    goal: "Model burn rate and runway (target 24–30 months at seed), build a milestone-driven use-of-cash plan, and prepare investor-grade materials — only if fundraising is actually needed.",
    whyNow: "In 2026, investors reward capital efficiency over aggressive growth. Fundraising without a clear runway model and profitability path burns 3–6 months of founder time and destroys negotiation leverage.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: [
        "runway-model-ready",
        "fundraising-decision-made",
        "investor-material-ready"
      ]
    },
    taskIds: [
      "runway-model-ready",
      "fundraising-decision-made",
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
    stepNumber: 12,
    totalSteps: 18,
    goal: "Apply for venture business certification, match to government startup support programs, and secure non-dilutive funding before committing personal capital.",
    whyNow: "Venture certification unlocks tax breaks, military service exemptions, and program eligibility. Government programs have hard deadlines — missing them means paying full cost out of pocket.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: [
        "venture-cert-type-checked",
        "govt-program-matched",
        "application-submitted"
      ]
    },
    taskIds: [
      "venture-cert-type-checked",
      "govt-program-matched",
      "application-submitted"
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
    totalSteps: 18,
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
    totalSteps: 14,
    goal: "Identify which permits, licenses, and certifications your category requires before signing a lease.",
    whyNow: "Signing a lease without confirming permit eligibility can permanently block your opening.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["building-registry-checked", "permit-type-checked"]
    },
    // 의도된 5개 — 위 패널 (PermitCheckPanels) 에서 업종별 상세 정보를 보고
    // 사용자가 "확인했음" 을 마킹하는 verification 체크리스트. 동일 의미 중복 제거됨.
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
    totalSteps: 14,
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
    totalSteps: 14,
    goal: "Check the lease and operating constraints before committing to a location.",
    whyNow: "Contract mistakes are expensive and hard to reverse.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["use-check", "facility-check", "restriction-check"]
    },
    taskIds: ["use-check", "facility-check", "restriction-check", "septic-tank-checked", "certified-date-obtained"],
    riskIds: [],
    nextStageIds: ["construction-setup"]
  },
  {
    stageId: "construction-setup",
    code: "construction_setup",
    title: "Interior, fixtures and equipment",
    type: "execution",
    status: "locked",
    stepNumber: 8,
    totalSteps: 14,
    goal: "Select interior contractors, approve the layout design, and manage the construction timeline. Also plan furniture, fixtures, and equipment (FF&E) including IT devices if applicable.",
    whyNow: "Interior and FF&E are usually the largest single cost — locking in contractors, furniture, and equipment early prevents overrun.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["contractor-selected", "design-approved"]
    },
    taskIds: ["contractor-selected", "design-approved", "construction-complete"],
    riskIds: [],
    nextStageIds: ["vendor-setup"]
  },
  {
    stageId: "vendor-setup",
    code: "vendor_setup",
    title: "Suppliers and equipment",
    type: "execution",
    status: "locked",
    stepNumber: 9,
    totalSteps: 14,
    goal: "Confirm suppliers, finalize equipment purchases or rentals, and set up POS.",
    whyNow: "Supply chain and equipment decisions directly affect day-one cash flow. Tip: Start vendor research now, but finalize contracts after business registration — most Korean suppliers require a 사업자등록번호 for invoicing.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["supplier-identified", "equipment-planned", "pos-selected"]
    },
    taskIds: ["supplier-identified", "equipment-planned", "pos-selected"],
    riskIds: [],
    nextStageIds: ["registration-setup"]
  },
  {
    stageId: "registration-setup",
    code: "registration_setup",
    title: "Business registration and permits",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 15,
    goal: "Complete the business registration at the tax office and file the operating permit with your district office.",
    whyNow: "Registration and permits must be in place before you can legally begin operating.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["tax-type-decided", "business-registered", "permit-filed"]
    },
    taskIds: ["tax-type-decided", "business-registered", "permit-filed"],
    riskIds: [],
    // 사업자등록 직후 세무 가이드(홈택스·과세유형·법인카드)가 황금 타이밍.
    // 이전: insurance-tax-setup 직행 → 변경: tax-guide → insurance-tax-setup
    nextStageIds: ["tax-guide"]
  },
  {
    stageId: "insurance-tax-setup",
    code: "insurance_tax_setup",
    title: "Insurance and tax setup",
    type: "execution",
    status: "locked",
    stepNumber: 12,
    totalSteps: 15,
    goal: "Set up 4 major insurance policies (national pension, health, employment, industrial accident), register for withholding tax, and configure payroll basics.",
    whyNow: "Even with 1 employee, insurance registration is mandatory within 14 days of hiring. Late filing triggers penalties and back-payment. Tax setup before first payroll prevents future audit risk.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["insurance-registered", "withholding-tax-set"]
    },
    taskIds: ["insurance-registered", "withholding-tax-set", "payroll-method-decided"],
    riskIds: [],
    nextStageIds: ["hiring-setup"]
  },
  {
    stageId: "hiring-setup",
    code: "hiring_setup",
    title: "Staff hiring and labor",
    type: "execution",
    status: "locked",
    stepNumber: 13,
    totalSteps: 15,
    goal: "Decide whether you need staff, post a job listing, and write employment contracts.",
    whyNow: "Hiring without a proper contract is the most common legal violation first-time owners make.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["hiring-decision-made", "employment-contract-signed"]
    },
    taskIds: ["hiring-decision-made", "employment-contract-signed"],
    riskIds: [],
    nextStageIds: ["operations-setup"]
  },
  {
    stageId: "operations-setup",
    code: "operations_setup",
    title: "Operations and marketing",
    type: "execution",
    status: "locked",
    stepNumber: 14,
    totalSteps: 15,
    goal: "Register on delivery platforms, go live with POS, and prepare SNS and local marketing.",
    whyNow: "Customers need to be able to find you from day one — late marketing setup means lost early revenue.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["pos-live", "sns-setup"]
    },
    taskIds: ["delivery-app-registered", "pos-live", "sns-setup"],
    riskIds: [],
    nextStageIds: ["pre-launch"]
  },
  {
    stageId: "pre-launch",
    code: "pre_launch",
    title: "Soft open",
    type: "execution",
    status: "locked",
    stepNumber: 15,
    totalSteps: 15,
    goal: "Run a soft open with a limited audience, collect feedback, and complete the final pre-opening checklist.",
    whyNow: "A soft open surfaces operational problems before they reach paying customers at scale.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["soft-open-done", "final-checklist"]
    },
    taskIds: ["soft-open-done", "feedback-collected", "final-checklist"],
    riskIds: [],
    // ★ 순서 조정: tax-guide 가 사업자등록 직후로 이동했으므로, pre-launch 다음은 loan-guide 로 직행
    nextStageIds: ["loan-guide"]
  },

  // ── Online / Digital path: stages 5-9 ─────────────────────────────────────
  {
    stageId: "platform-setup",
    code: "platform_setup",
    title: "Choose a sales platform",
    type: "selection",
    status: "locked",
    stepNumber: 5,
    totalSteps: 14,
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
    totalSteps: 14,
    goal: "Register the business and file the telecommunications sales notification required for all online sellers.",
    whyNow: "Selling online without a telecom sales filing is a legal violation — this must be done before going live.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["business-registered-online", "telecom-sale-filed"]
    },
    taskIds: ["business-registered-online", "telecom-sale-filed"],
    riskIds: [],
    nextStageIds: ["sourcing-setup"]
  },
  {
    stageId: "sourcing-setup",
    code: "sourcing_setup",
    title: "Product sourcing",
    type: "execution",
    status: "locked",
    stepNumber: 7,
    totalSteps: 14,
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
    stepNumber: 8,
    totalSteps: 14,
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
    stepNumber: 9,
    totalSteps: 14,
    goal: "Optimize for search, set up initial ads, and plan a review-building strategy before launch.",
    whyNow: "New stores have no reviews and low search ranking — early marketing investment directly affects first-month revenue.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["store-seo-done", "first-ad-set"]
    },
    taskIds: ["store-seo-done", "first-ad-set", "review-strategy-set"],
    riskIds: [],
    nextStageIds: ["tax-guide"]
  },

  // ── Shared tail: tax and loan guides (both paths) ──────────────────────────
  {
    stageId: "tax-guide",
    code: "tax_guide",
    title: "Review tax guide",
    type: "verification",
    status: "locked",
    // ★ 순서 조정 (이전 14 → 11): 사업자등록 직후가 세무 세팅 황금 타이밍
    //   - Offline: registration-setup → tax-guide → insurance-tax-setup
    //   - Online/Startup: tax-guide 도달 시 insurance-tax-setup 이 hidden 이라 다음 visible 인 loan-guide 로 진행
    stepNumber: 11,
    totalSteps: 18,
    goal: "Check the first tax setup and filing guidance before operations begin.",
    whyNow: "Tax structure, receipts, and proof handling are easier to set correctly before opening.",
    completionRule: { kind: "required_inputs", requiredKeys: ["reviewed"] },
    taskIds: [],
    riskIds: [],
    // multi-edge: insurance-tax-setup (offline 우선) / loan-guide (online·startup 폴백)
    nextStageIds: ["insurance-tax-setup", "loan-guide"]
  },
  {
    stageId: "loan-guide",
    code: "loan_guide",
    title: "Funding and support programs",
    type: "verification",
    status: "locked",
    // ★ 순서 조정: 소프트오픈 직후 운영 자금 확보 단계로 이동 (16번)
    stepNumber: 16,
    totalSteps: 18,
    goal: "Explore government funding, startup support programs, low-interest loans, and grants. Match your profile to available programs before committing personal capital.",
    whyNow: "Government programs have application deadlines. Missing them means paying full cost out of pocket. Check eligibility early.",
    completionRule: { kind: "required_inputs", requiredKeys: ["reviewed"] },
    taskIds: [],
    riskIds: [],
    nextStageIds: ["biz-registration"]
  },

  // ── Post-launch preparation: stages 16-18 (shared) ────────────────────────
  {
    stageId: "biz-registration",
    code: "biz_registration",
    title: "Business registration finalization",
    type: "execution",
    status: "locked",
    stepNumber: 17,
    totalSteps: 18,
    goal: "Confirm the tax office registration, open a dedicated business account, and decide on a tax accountant.",
    whyNow: "Getting the financial structure right before opening prevents tax filing and expense tracking problems from day one.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["biz-reg-confirmed", "biz-account-opened"]
    },
    taskIds: ["biz-reg-confirmed", "biz-account-opened", "cpa-decision-made"],
    riskIds: [],
    nextStageIds: ["financial-review"]
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
      // 모든 보이는 task가 체크되어야 단계 완료 — 체크리스트 진행률과 일치
      requiredTaskIds: ["inventory-first-order", "staff-final-brief", "payment-system-tested", "launch-day-roles-assigned", "sns-open-teaser", "emergency-plan-ready"]
    },
    taskIds: ["inventory-first-order", "staff-final-brief", "payment-system-tested", "launch-day-roles-assigned", "sns-open-teaser", "emergency-plan-ready"],
    riskIds: [],
    nextStageIds: ["first-month-check"]
  },
  {
    stageId: "first-month-check",
    code: "first_month_check",
    title: "Launch readiness check",
    type: "execution",
    status: "locked",
    stepNumber: 20,
    totalSteps: 18,
    goal: "Set up a tracking system for key metrics, confirm reserves, and organize essential contacts before launch.",
    whyNow: "The first month is the most dangerous period — preparation and daily tracking separate success from failure.",
    completionRule: {
      kind: "required_tasks",
      // 모든 보이는 task가 체크되어야 단계 완료 — 체크리스트 진행률과 일치
      requiredTaskIds: ["cashflow-plan-ready", "emergency-fund-ready", "key-contacts-list"]
    },
    taskIds: ["cashflow-plan-ready", "emergency-fund-ready", "key-contacts-list"],
    riskIds: [],
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
  // ── Tech startup path tasks ───────────────────────────────────────────────
  "startup-foundation": [
    { taskId: "problem-defined", title: "Define the core problem in one sentence", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "founder-alignment", title: "Decide team structure (solo or co-founder) and document roles", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "company-formation-path", title: "Decide when to incorporate and choose the formation path", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "brand-identity-draft", title: "Draft initial brand identity (name, logo direction, tone) before public launch", status: "todo", required: false, estimatedMinutes: 60 },
    { taskId: "nda-ip-agreement", title: "Prepare NDA and IP assignment agreements for co-founders, contractors, and freelancers", status: "todo", required: false, estimatedMinutes: 45 },
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
    { taskId: "analytics-live", title: "Install analytics for activation, retention, and funnel events", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "billing-or-conversion-live", title: "Set up billing, pricing, or conversion tracking before launch", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "error-monitoring-live", title: "Connect error monitoring (Sentry) and Slack alerts for real-time issue tracking", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "feedback-loop-live", title: "Build customer feedback loop with in-app channel and weekly review habit", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "app-store-submission", title: "Submit app to Google Play and/or Apple App Store", status: "todo", required: false, estimatedMinutes: 240 },
    { taskId: "terms-privacy-published", title: "Publish Terms of Service and Privacy Policy before any user can sign up (legally required)", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "pg-payment-ready", title: "Apply for PG (payment gateway) approval — takes 1-2 weeks, start early", status: "todo", required: false, estimatedMinutes: 30, waitDays: 14, followupQuestion: "PG 심사가 완료되었나요?" },
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
    { taskId: "trademark-filed", title: "File trademark application for your brand name and logo at 특허로 (patent.go.kr)", status: "todo", required: false, estimatedMinutes: 60 },
    { taskId: "tax-setup-basics", title: "Choose tax type (간이과세 vs 일반과세) and set up basic bookkeeping", status: "todo", required: false, estimatedMinutes: 45 },
    { taskId: "security-basics", title: "Set up privacy policy, customer data protection plan, and terms of service", status: "todo", required: false, estimatedMinutes: 45 },
  ],
  "fundraising-readiness": [
    { taskId: "runway-model-ready", title: "Model burn rate and cash runway with best/base/worst scenarios", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "fundraising-decision-made", title: "Decide fundraising path: VC, bootstrap, or government grants", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "investor-material-ready", title: "Prepare pitch deck, metric snapshot, and financial projection", status: "todo", required: true, estimatedMinutes: 120 }
  ],
  "venture-certification": [
    { taskId: "venture-cert-type-checked", title: "Check venture certification eligibility: investment type, R&D type, or innovation growth type", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "govt-program-matched", title: "Match to K-Startup programs: pre-startup package, early-stage package, TIPS, or growth package", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "application-submitted", title: "Submit venture certification or government program application before deadline", status: "todo", required: true, estimatedMinutes: 90, waitDays: 30, followupQuestion: "벤처기업 확인서 또는 지원사업 선정 결과를 받으셨나요?" }
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
    {
      taskId: "hygiene-health-checked",
      title: "위생교육 6시간·보건증 발급 요건 확인 (음식/카페/뷰티) — 절차·기간·발급처",
      status: "todo",
      required: false,
      estimatedMinutes: 15
    },
    {
      taskId: "license-registration-checked",
      title: "전문 면허·업종별 등록 요건 확인 (미용사 면허, 학원·체육시설·동물관련업 등록 등)",
      status: "todo",
      required: false,
      estimatedMinutes: 15
    },
    {
      taskId: "fire-safety-checked",
      title: "소방완비증명서·시설 안전 요건 확인 — 영업장 면적·층수별 기준 점검",
      status: "todo",
      required: false,
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
      required: false,
      estimatedMinutes: 30
    },
    {
      taskId: "fire-health-parallel",
      title: "Apply for fire safety certificate (소방필증) and health certificate (보건증) in parallel with construction",
      status: "todo",
      required: false,
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
      required: false,
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
      required: false,
      estimatedMinutes: 45
    },
    {
      taskId: "pos-live",
      title: "Confirm POS is live and tested with real transactions",
      status: "todo",
      required: false,
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
      required: false,
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
      required: false,
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
      required: false,
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
    {
      taskId: "inventory-first-order",
      title: "Place and receive first inventory/ingredient order (or deploy to production for startups)",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "staff-final-brief",
      title: "Complete final staff training and rehearse the opening-day workflow end to end",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "payment-system-tested",
      title: "Test full payment flow with real transaction (card terminal / PG / Stripe) — confirm receipt prints",
      status: "todo",
      required: true,
      estimatedMinutes: 20
    },
    {
      taskId: "launch-day-roles-assigned",
      title: "Assign specific roles for launch day — who handles what when things go wrong",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "sns-open-teaser",
      title: "Publish opening teaser on SNS / Product Hunt / community channels",
      status: "todo",
      required: false,
      estimatedMinutes: 30
    },
    {
      taskId: "emergency-plan-ready",
      title: "Prepare emergency plan: Wi-Fi backup, card terminal failure, stock-out response, customer complaint escalation",
      status: "todo",
      required: false,
      estimatedMinutes: 20
    }
  ],
  "first-month-check": [
    {
      taskId: "cashflow-plan-ready",
      title: "Set up a method to track daily cash flow",
      status: "todo",
      required: true,
      estimatedMinutes: 15
    },
    {
      taskId: "emergency-fund-ready",
      title: "Confirm at least one month of fixed costs is in reserve",
      status: "todo",
      required: true,
      estimatedMinutes: 10
    },
    {
      taskId: "key-contacts-list",
      title: "Save key contacts: tax accountant, suppliers, equipment repair",
      status: "todo",
      required: false,
      estimatedMinutes: 20
    }
  ]
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
