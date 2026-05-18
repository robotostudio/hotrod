import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const manifest = {
    name: 'Hotrod',
    short_name: 'Hotrod',
    description:
      "Roboto Studio's open-source Astro starter for agent-edited marketing sites.",
    start_url: '/',
    display: 'standalone',
    background_color: '#FFD700',
    theme_color: '#FFD700',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
