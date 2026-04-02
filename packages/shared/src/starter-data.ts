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

  // ── Tech startup path: stages 5-11 (+ shared tail 12-16) ─────────────────
  {
    stageId: "startup-foundation",
    code: "startup_foundation",
    title: "Founder and company setup",
    type: "execution",
    status: "locked",
    stepNumber: 5,
    totalSteps: 16,
    goal: "Clarify the founding structure, company setup path, equity basics, and the one problem worth solving first.",
    whyNow: "Founder misalignment and fuzzy ownership destroy startups before customers ever do.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["founder-alignment", "equity-plan-defined", "company-formation-path"]
    },
    taskIds: ["founder-alignment", "equity-plan-defined", "company-formation-path", "83b-safe-basics"],
    riskIds: [],
    nextStageIds: ["customer-discovery"]
  },
  {
    stageId: "customer-discovery",
    code: "customer_discovery",
    title: "Customer discovery",
    type: "execution",
    status: "locked",
    stepNumber: 6,
    totalSteps: 16,
    goal: "Run customer interviews, identify repeated pain, and narrow to one wedge problem with real urgency.",
    whyNow: "A startup dies when it builds for a vague audience instead of a painful problem.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["customer-interviews-done", "pain-pattern-documented", "narrow-wedge-defined"]
    },
    taskIds: ["customer-interviews-done", "pain-pattern-documented", "narrow-wedge-defined"],
    riskIds: [],
    nextStageIds: ["mvp-build"]
  },
  {
    stageId: "mvp-build",
    code: "mvp_build",
    title: "MVP and proof of value",
    type: "execution",
    status: "locked",
    stepNumber: 7,
    totalSteps: 16,
    goal: "Ship the minimum useful product that solves one core workflow and captures the first proof of value.",
    whyNow: "Shipping late or building too broad is the fastest way to burn runway without learning.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["core-workflow-defined", "mvp-shipped", "first-user-feedback-loop"]
    },
    taskIds: ["core-workflow-defined", "mvp-shipped", "first-user-feedback-loop"],
    riskIds: [],
    nextStageIds: ["launch-stack"]
  },
  {
    stageId: "launch-stack",
    code: "launch_stack",
    title: "Launch stack and instrumentation",
    type: "execution",
    status: "locked",
    stepNumber: 8,
    totalSteps: 16,
    goal: "Put billing, analytics, error tracking, and customer feedback loops in place before pushing harder on growth.",
    whyNow: "Without instrumentation, founders mistake noise for signal and waste weeks chasing the wrong problem.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["analytics-live", "billing-or-conversion-live", "support-loop-live"]
    },
    taskIds: ["analytics-live", "billing-or-conversion-live", "support-loop-live", "error-monitoring-live"],
    riskIds: [],
    nextStageIds: ["growth-engine"]
  },
  {
    stageId: "growth-engine",
    code: "growth_engine",
    title: "Growth and retention loop",
    type: "execution",
    status: "locked",
    stepNumber: 9,
    totalSteps: 16,
    goal: "Define the north-star metric, review growth weekly, and prove that users return or expand over time.",
    whyNow: "Topline growth without retention is usually a temporary illusion.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["north-star-set", "weekly-review-running", "retention-check-defined"]
    },
    taskIds: ["north-star-set", "weekly-review-running", "retention-check-defined", "first-gtm-channel-tested"],
    riskIds: [],
    nextStageIds: ["company-setup"]
  },
  {
    stageId: "company-setup",
    code: "company_setup",
    title: "Company, finance, and security basics",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 16,
    goal: "Set up incorporation, banking, lightweight finance ops, privacy, and core security foundations.",
    whyNow: "Weak company plumbing creates painful delays when customers, hires, or investors ask for basic diligence.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["banking-finance-stack", "privacy-security-basics", "data-room-basics"]
    },
    taskIds: ["banking-finance-stack", "privacy-security-basics", "data-room-basics"],
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
    totalSteps: 16,
    goal: "Model runway, define milestones, and prepare a crisp investor-ready story only if fundraising is actually needed.",
    whyNow: "Fundraising without a clear use-of-cash plan usually burns time and leverage.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["runway-model-ready", "milestone-plan-ready", "investor-material-ready"]
    },
    taskIds: ["runway-model-ready", "milestone-plan-ready", "investor-material-ready"],
    riskIds: [],
    nextStageIds: ["tax-guide"]
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
      requiredTaskIds: ["permit-type-checked", "health-cert-checked"]
    },
    taskIds: ["permit-type-checked", "health-cert-checked", "safety-requirement-checked"],
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
    taskIds: ["use-check", "facility-check", "restriction-check"],
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
    whyNow: "Supply chain and equipment decisions directly affect day-one cash flow.",
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
    title: "Business registration",
    type: "execution",
    status: "locked",
    stepNumber: 10,
    totalSteps: 14,
    goal: "Complete the business registration, operating permit filing, and insurance setup.",
    whyNow: "Registration and permits must be in place before you can legally begin operating.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["business-registered", "permit-filed", "insurance-setup"]
    },
    taskIds: ["business-registered", "permit-filed", "insurance-setup"],
    riskIds: [],
    nextStageIds: ["hiring-setup"]
  },
  {
    stageId: "hiring-setup",
    code: "hiring_setup",
    title: "Staff hiring and labor",
    type: "execution",
    status: "locked",
    stepNumber: 11,
    totalSteps: 15,
    goal: "Decide whether you need staff, post a job listing, write employment contracts, and handle payroll and insurance obligations.",
    whyNow: "Hiring without a contract or proper insurance registration is a legal violation — and the most common mistake first-time owners make.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["hiring-decision-made", "employment-contract-signed"]
    },
    taskIds: ["hiring-decision-made", "employment-contract-signed", "payroll-insurance-filed"],
    riskIds: [],
    nextStageIds: ["operations-setup"]
  },
  {
    stageId: "operations-setup",
    code: "operations_setup",
    title: "Operations and marketing",
    type: "execution",
    status: "locked",
    stepNumber: 12,
    totalSteps: 15,
    goal: "Register on delivery platforms, go live with POS, and prepare SNS and local marketing.",
    whyNow: "Customers need to be able to find you from day one — late marketing setup means lost early revenue.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["delivery-app-registered", "sns-setup"]
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
    stepNumber: 13,
    totalSteps: 15,
    goal: "Run a soft open with a limited audience, collect feedback, and complete the final pre-opening checklist.",
    whyNow: "A soft open surfaces operational problems before they reach paying customers at scale.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["soft-open-done", "final-checklist"]
    },
    taskIds: ["soft-open-done", "feedback-collected", "final-checklist"],
    riskIds: [],
    nextStageIds: ["tax-guide"]
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
    stepNumber: 14,
    totalSteps: 18,
    goal: "Check the first tax setup and filing guidance before operations begin.",
    whyNow: "Tax structure, receipts, and proof handling are easier to set correctly before opening.",
    completionRule: { kind: "required_inputs", requiredKeys: ["reviewed"] },
    taskIds: [],
    riskIds: [],
    nextStageIds: ["loan-guide"]
  },
  {
    stageId: "loan-guide",
    code: "loan_guide",
    title: "Funding and support programs",
    type: "verification",
    status: "locked",
    stepNumber: 15,
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
    stepNumber: 16,
    totalSteps: 18,
    goal: "Confirm the tax office registration, open a dedicated business account, and decide on a tax accountant.",
    whyNow: "Getting the financial structure right before opening prevents tax filing and expense tracking problems from day one.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["biz-reg-confirmed", "biz-account-opened"]
    },
    taskIds: ["biz-reg-confirmed", "biz-account-opened", "cpa-decision-made"],
    riskIds: [],
    nextStageIds: ["pre-launch-final"]
  },
  {
    stageId: "pre-launch-final",
    code: "pre_launch_final",
    title: "Final opening preparation",
    type: "execution",
    status: "locked",
    stepNumber: 17,
    totalSteps: 18,
    goal: "Receive the first inventory order, complete final staff training, and publish an opening teaser post.",
    whyNow: "Gaps in preparation on opening day directly damage the first customer experience and are hard to recover from.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["inventory-first-order", "staff-final-brief"]
    },
    taskIds: ["inventory-first-order", "staff-final-brief", "sns-open-teaser"],
    riskIds: [],
    nextStageIds: ["first-month-check"]
  },
  {
    stageId: "first-month-check",
    code: "first_month_check",
    title: "Launch readiness check",
    type: "execution",
    status: "locked",
    stepNumber: 18,
    totalSteps: 18,
    goal: "Set up a daily cash flow tracking habit, confirm emergency reserves, and organize key contacts before opening.",
    whyNow: "The first month is the most dangerous period — 22% of Korean small businesses close within the first year.",
    completionRule: {
      kind: "required_tasks",
      requiredTaskIds: ["cashflow-plan-ready", "emergency-fund-ready"]
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
    { taskId: "founder-alignment", title: "Write founder roles, decision rights, and what each founder owns", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "equity-plan-defined", title: "Define founder equity, vesting, and dilution assumptions", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "company-formation-path", title: "Decide incorporation path, banking plan, and jurisdiction", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "83b-safe-basics", title: "Review 83(b), SAFE, and cap table basics before fundraising", status: "todo", required: false, estimatedMinutes: 30 }
  ],
  "customer-discovery": [
    { taskId: "customer-interviews-done", title: "Run at least 10 customer interviews in one target segment", status: "todo", required: true, estimatedMinutes: 180 },
    { taskId: "pain-pattern-documented", title: "Document repeated pain patterns, existing workarounds, and urgency", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "narrow-wedge-defined", title: "Choose the narrowest painful workflow to solve first", status: "todo", required: true, estimatedMinutes: 45 }
  ],
  "mvp-build": [
    { taskId: "core-workflow-defined", title: "Define one core user workflow and success outcome", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "mvp-shipped", title: "Ship the smallest MVP that proves this workflow can be solved", status: "todo", required: true, estimatedMinutes: 240 },
    { taskId: "first-user-feedback-loop", title: "Collect direct feedback from first users and log what blocks repeat use", status: "todo", required: true, estimatedMinutes: 90 }
  ],
  "launch-stack": [
    { taskId: "analytics-live", title: "Install analytics for activation, retention, and funnel events", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "billing-or-conversion-live", title: "Set up billing, pricing, or conversion tracking before launch", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "support-loop-live", title: "Create a support and user-feedback loop founders check every day", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "error-monitoring-live", title: "Install error and uptime monitoring for production", status: "todo", required: false, estimatedMinutes: 30 }
  ],
  "growth-engine": [
    { taskId: "north-star-set", title: "Choose one north-star metric and one weekly growth metric", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "weekly-review-running", title: "Run a weekly review for growth, burn, and biggest bottleneck", status: "todo", required: true, estimatedMinutes: 30 },
    { taskId: "retention-check-defined", title: "Define a retention check so growth is not judged on acquisition alone", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "first-gtm-channel-tested", title: "Test one focused GTM channel with real users or pilots", status: "todo", required: false, estimatedMinutes: 120 }
  ],
  "company-setup": [
    { taskId: "banking-finance-stack", title: "Separate company banking, bookkeeping, and cash tracking", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "privacy-security-basics", title: "Put basic privacy, access control, and security hygiene in place", status: "todo", required: true, estimatedMinutes: 60 },
    { taskId: "data-room-basics", title: "Prepare a lightweight data room with incorporation and KPI basics", status: "todo", required: true, estimatedMinutes: 45 }
  ],
  "fundraising-readiness": [
    { taskId: "runway-model-ready", title: "Model burn, runway, and the milestones cash must buy", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "milestone-plan-ready", title: "Define the milestone plan for PMF, revenue, or pilots before raising", status: "todo", required: true, estimatedMinutes: 45 },
    { taskId: "investor-material-ready", title: "Prepare a crisp deck, metric snapshot, and founder narrative", status: "todo", required: true, estimatedMinutes: 90 }
  ],
  // ── Offline path tasks ─────────────────────────────────────────────────────
  "permit-check": [
    {
      taskId: "permit-type-checked",
      title: "Confirm which permit or registration your category requires",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "health-cert-checked",
      title: "Check health certificate and hygiene training requirements",
      status: "todo",
      required: true,
      estimatedMinutes: 20
    },
    {
      taskId: "safety-requirement-checked",
      title: "Verify fire safety and facility safety requirements",
      status: "todo",
      required: false,
      estimatedMinutes: 20
    }
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
      taskId: "business-registered",
      title: "Complete business registration at the tax office",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    {
      taskId: "permit-filed",
      title: "File operating permit or notification with the relevant authority",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "insurance-setup",
      title: "Set up employment insurance and industrial accident insurance",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    }
  ],
  "hiring-setup": [
    {
      taskId: "hiring-decision-made",
      title: "직원·알바 필요 여부 및 인원 계획 확정",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    },
    {
      taskId: "employment-contract-signed",
      title: "근로계약서 작성 및 교부 완료",
      status: "todo",
      required: true,
      estimatedMinutes: 40
    },
    {
      taskId: "payroll-insurance-filed",
      title: "4대보험 취득 신고 완료",
      status: "todo",
      required: false,
      estimatedMinutes: 60
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
      required: false,
      estimatedMinutes: 30
    },
    {
      taskId: "sns-setup",
      title: "Set up Instagram, Naver Place, and Kakao Channel",
      status: "todo",
      required: true,
      estimatedMinutes: 60
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
      taskId: "telecom-sale-filed",
      title: "File telecommunications sales notification with local government",
      status: "todo",
      required: true,
      estimatedMinutes: 30
    }
  ],
  "sourcing-setup": [
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
      title: "Place and receive first inventory or ingredient order",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "staff-final-brief",
      title: "Complete final staff training and assign opening-day roles",
      status: "todo",
      required: true,
      estimatedMinutes: 60
    },
    {
      taskId: "sns-open-teaser",
      title: "Publish SNS opening teaser post",
      status: "todo",
      required: false,
      estimatedMinutes: 30
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
