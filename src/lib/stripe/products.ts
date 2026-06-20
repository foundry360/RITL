import { BRAND_NAME } from "@/lib/brand";

export type ProductId = "focus-coffee" | "matcha";

export type PurchaseType = "one-time" | "subscription";

export interface ProductDescriptionContent {
  paragraphs: string[];
  listItems?: string[];
  closingParagraphs?: string[];
}

export interface PreparationStep {
  title: string;
  paragraphs?: string[];
  listItems?: string[];
}

export interface PreparationContent {
  steps: PreparationStep[];
}

export type ProductGalleryItem =
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
      label?: string;
      fit?: "contain" | "cover";
    }
  | {
      id: string;
      type: "viewer";
      viewerUrl: string;
      alt: string;
      label?: string;
      thumbnailSrc?: string;
    };

export interface Product {
  id: ProductId;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  subscriptionIntervalWeeks: number;
  variant: "focus" | "matcha";
  features: string[];
  productDescription: string | ProductDescriptionContent;
  preparation: string | PreparationContent;
  blendComposition: string | ProductDescriptionContent;
  viewerUrl?: string;
  thumbnailSrc?: string;
  gallery?: ProductGalleryItem[];
}

const FOCUS_COFFEE_VIEWER_URL =
  "https://viewer.roastify.app?productType=Tubes&artworkUrl=https://storage.roastify.app/design-upload/2da560c2-5ee4-4a51-926d-5f7751d2a1d9.jpeg";

const MATCHA_VIEWER_URL =
  "https://viewer.roastify.app?productType=Tubes&artworkUrl=https://storage.roastify.app/design-upload/8a4175a7-d590-47f5-8d81-84e625e9eb1c.jpeg";

export const products: Record<ProductId, Product> = {
  "focus-coffee": {
    id: "focus-coffee",
    name: "Focus Coffee",
    tagline: "Precision cognitive performance",
    description:
      "A refined functional blend engineered for alert clarity and sustained mental performance.",
    longDescription:
      "Focus Coffee is formulated for those who demand precision from their morning ritual. Clean caffeine delivery paired with nootropic compounds supports sharp attention without the noise of conventional coffee.",
    subscriptionIntervalWeeks: 4,
    variant: "focus",
    thumbnailSrc: "/products/focus-checkout-thumb.png",
    viewerUrl: FOCUS_COFFEE_VIEWER_URL,
    features: [
      "L-Theanine for calm alertness",
      "120mg clean caffeine",
      "No crash formulation",
      "Single-origin base",
    ],
    productDescription: {
      paragraphs: [
        "Functional Coffee is designed as a daily cognitive performance ritual, not just a beverage.",
        "Cognitive performance is not a single moment. It is a structured system of inputs that shape how you think, focus, and execute throughout the day. Functional Coffee helps you build a repeatable routine that compounds clarity, focus, and calm energy over time.",
        "This is not about stimulation. It is about controlled, sustained performance.",
        "Each cup is engineered to support a consistent state of:",
      ],
      listItems: [
        "Clear mental direction",
        "Stable, sustained energy",
        "Reduced cognitive noise",
        "Improved daily focus discipline",
      ],
      closingParagraphs: [
        "Over time, this ritual becomes a framework for how you operate: predictable, intentional, and optimized.",
        "Functional Coffee exists for those who do not leave performance to chance.",
      ],
    },
    preparation: {
      steps: [
        {
          title: "1. Set intention",
          paragraphs: [
            "Before preparation, establish a simple cognitive direction for the day.",
            "Not goals. Focus state. Example: clarity, deep work, execution.",
          ],
        },
        {
          title: "2. Prepare your ritual",
          listItems: [
            "Add 1 serving to 8 to 12 oz of hot water",
            "Stir thoroughly until fully dissolved",
            "Optional: add milk or fat source for slower energy release",
          ],
        },
        {
          title: "3. Consume with attention",
          paragraphs: [
            "Do not multitask during your first intake.",
            "The ritual is designed to anchor focus before cognitive load begins.",
          ],
        },
        {
          title: "4. Enter work mode",
          paragraphs: [
            "Allow 15 to 30 minutes for onset.",
            "Transition into deep work, structured thinking, or execution-based tasks.",
          ],
        },
      ],
    },
    blendComposition:
      "A carefully crafted blend of traditional Papua New Guinea Arabica varietals: Typica, Bourbon, and Arusha, selected for their natural structure, refined sweetness, and bright complexity. High-altitude beans grown in nutrient-rich volcanic soils form the foundation of clarity and clean flavor. This base is elevated with functional mushrooms, including Lion's Mane for crisp, focused cognitive support and Chaga for smooth, grounding depth with subtle vanilla-woody undertones. The result is a premium instant functional coffee designed to deliver balanced energy, enhanced focus, and a smooth, full-bodied finish without compromise.",
    gallery: [
      {
        id: "product-hero",
        type: "image",
        src: "/products/focus-hero-v6.png",
        alt: `${BRAND_NAME} Focus Coffee — Think sharp. Execute clearly.`,
        label: "Product",
        fit: "contain",
      },
      {
        id: "hot-cold",
        type: "image",
        src: "/products/focus-hot-cold-v2.png",
        alt: `${BRAND_NAME} Focus Coffee — Hot or cold. Same focus.`,
        label: "Hot / Cold",
        fit: "contain",
      },
      {
        id: "certifications",
        type: "image",
        src: "/products/matcha-certifications-v2.png",
        alt: `${BRAND_NAME} third-party lab certifications`,
        label: "Certified",
        fit: "cover",
      },
      {
        id: "interactive-viewer",
        type: "viewer",
        viewerUrl: FOCUS_COFFEE_VIEWER_URL,
        alt: "Focus Coffee interactive product view",
        label: "3D View",
        thumbnailSrc: "/products/focus-3d-thumb.png",
      },
    ],
  },
  matcha: {
    id: "matcha",
    name: "Matcha",
    tagline: "Calm focus, smooth energy",
    description:
      "Ceremonial-grade matcha with functional enhancements for smooth, sustained cognitive energy.",
    longDescription:
      "Our Matcha delivers the meditative clarity of ceremonial-grade green tea with a functional edge. Clean, sustained energy builds gradually, supporting steady focus throughout your day.",
    subscriptionIntervalWeeks: 4,
    variant: "matcha",
    thumbnailSrc: "/products/matcha-checkout-thumb.png",
    viewerUrl: MATCHA_VIEWER_URL,
    features: [
      "Ceremonial-grade sourcing",
      "Smooth L-theanine release",
      "Sustained cognitive energy",
      "Antioxidant-rich profile",
    ],
    productDescription: {
      paragraphs: [
        "Functional Matcha is a ceremonial-grade cognitive ritual designed for smooth, sustained clarity and calm energy.",
        "Crafted from shade-grown Japanese tea leaves, this matcha is engineered for those who prefer elegant focus over stimulation. It delivers a refined energy profile: steady, luminous, and free from harsh spikes or crashes.",
        "Each cup is designed to support a state of:",
      ],
      listItems: [
        "Calm cognitive clarity",
        "Smooth, sustained energy",
        "Emotional and mental steadiness",
        "Clean focus without overstimulation",
      ],
      closingParagraphs: [
        "This is not just matcha. It is a daily preparation for composed performance.",
      ],
    },
    preparation: {
      steps: [
        {
          title: "1. Set intention",
          paragraphs: [
            "Begin in a calm state.",
            "Matcha is best consumed as a grounding ritual, not a rushed beverage.",
          ],
        },
        {
          title: "2. Sift and prepare (recommended for optimal texture)",
          listItems: [
            "Add 1 to 2 grams of matcha to a bowl or cup",
            "Sift to remove clumps for a smoother whisk",
          ],
        },
        {
          title: "3. Add water",
          listItems: [
            "Pour 2 to 3 oz of hot water (not boiling, ideally 160 to 175°F / 70 to 80°C)",
            "Avoid boiling water to preserve sweetness and reduce bitterness",
          ],
        },
        {
          title: "4. Whisk to ritual consistency",
          listItems: [
            'Whisk in a fast "W" or "M" motion',
            "Continue until a fine layer of foam forms on top",
            "Texture should be smooth, creamy, and uniform",
          ],
        },
        {
          title: "5. Optional extension (latte preparation)",
          listItems: [
            "Add 6 to 10 oz of milk or plant-based alternative",
            "Whisk or shake until fully integrated",
            "Results in a softer, more sustained focus profile",
          ],
        },
        {
          title: "6. Consume with awareness",
          paragraphs: [
            "Drink slowly, without distraction.",
            "Allow the ritual to anchor a calm, focused cognitive state.",
          ],
        },
      ],
    },
    blendComposition:
      "A ceremonial-grade matcha crafted from single-cultivar and select-cultivar blends of shade-grown, first-harvest tencha sourced from renowned Japanese tea-growing regions. Tender young leaves are carefully cultivated under shade to enhance chlorophyll and amino acid content, then hand-selected, steamed, and stone-milled into an ultra-fine powder. This traditional process preserves the matcha's natural sweetness, vivid green color, and rich umami profile, resulting in a pure 100% matcha expression designed for clarity, vibrancy, and smooth, sustained energy.",
    gallery: [
      {
        id: "product-image",
        type: "image",
        src: "/products/matcha-hero-v5.png",
        alt: `${BRAND_NAME} Ceremonial Matcha — Think steady. Feel clear.`,
        label: "Product",
        fit: "contain",
      },
      {
        id: "hot-cold",
        type: "image",
        src: "/products/matcha-hot-cold-v2.png",
        alt: `${BRAND_NAME} Matcha — Hot or cold. Same clarity.`,
        label: "Hot / Cold",
        fit: "contain",
      },
      {
        id: "certifications",
        type: "image",
        src: "/products/matcha-certifications-v2.png",
        alt: `${BRAND_NAME} third-party lab certifications`,
        label: "Certified",
        fit: "cover",
      },
      {
        id: "interactive-viewer",
        type: "viewer",
        viewerUrl: MATCHA_VIEWER_URL,
        alt: "Matcha interactive product view",
        label: "3D View",
        thumbnailSrc: "/products/matcha-tube-mockup.png",
      },
    ],
  },
};

export function getProduct(id: string): Product | undefined {
  return products[id as ProductId];
}

export function getStripePriceId(
  productId: ProductId,
  purchaseType: PurchaseType = "one-time"
): string | undefined {
  const envMap: Record<ProductId, Record<PurchaseType, string | undefined>> = {
    "focus-coffee": {
      "one-time": process.env.STRIPE_PRICE_FOCUS_COFFEE,
      subscription: process.env.STRIPE_PRICE_FOCUS_COFFEE_SUBSCRIPTION,
    },
    matcha: {
      "one-time": process.env.STRIPE_PRICE_MATCHA,
      subscription: process.env.STRIPE_PRICE_MATCHA_SUBSCRIPTION,
    },
  };
  return envMap[productId][purchaseType];
}
