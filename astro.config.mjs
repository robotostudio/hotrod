// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import { loadEnv } from 'vite';
import { blobManifest } from './src/integrations/blob-manifest.ts';
import { hotrodTaxiTheme } from './src/integrations/shiki-hotrod-taxi.ts';

// Load .env, .env.local, and mode-specific env files into process.env so that
// integrations running at astro:config:setup (e.g. blobManifest) can read
// secrets like BLOB_READ_WRITE_TOKEN. Astro's CLI does not do this automatically
// for the config layer — Vite's loadEnv reads the same files Vite would.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel({
    imageService: true,
  }),
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  integrations: [mdx(), icon(), blobManifest()],
  markdown: {
    shikiConfig: {
      theme: hotrodTaxiTheme,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geist',
      cssVariable: '--font-sans',
      weights: ['400', '500', '600', '700', '800', '900'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      weights: ['400', '500', '700'],
    },
  ],
});
