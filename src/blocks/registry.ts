import { heroSchema } from './hero/schema';
import HeroComponent from './hero/index.astro';
import { figuresSchema } from './figures/schema';
import FiguresComponent from './figures/index.astro';
import { cardGridSchema } from './card-grid/schema';
import CardGridComponent from './card-grid/index.astro';
import { featureStripSchema } from './feature-strip/schema';
import FeatureStripComponent from './feature-strip/index.astro';
import { pricingSchema } from './pricing/schema';
import PricingComponent from './pricing/index.astro';
import { ctaBannerSchema } from './cta-banner/schema';
import CtaBannerComponent from './cta-banner/index.astro';
import { imageFeatureSchema } from './image-feature/schema';
import ImageFeatureComponent from './image-feature/index.astro';

export const blockSchemas = {
  hero: heroSchema,
  figures: figuresSchema,
  'card-grid': cardGridSchema,
  'feature-strip': featureStripSchema,
  pricing: pricingSchema,
  'cta-banner': ctaBannerSchema,
  'image-feature': imageFeatureSchema,
} as const;

export const blockComponents = {
  hero: HeroComponent,
  figures: FiguresComponent,
  'card-grid': CardGridComponent,
  'feature-strip': FeatureStripComponent,
  pricing: PricingComponent,
  'cta-banner': CtaBannerComponent,
  'image-feature': ImageFeatureComponent,
} satisfies Record<keyof typeof blockSchemas, unknown>;

export type BlockType = keyof typeof blockSchemas;
