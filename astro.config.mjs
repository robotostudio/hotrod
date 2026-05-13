// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import { blobManifest } from './src/integrations/blob-manifest.ts';

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
