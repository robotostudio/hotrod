import type { APIRoute } from 'astro';
import { renderIcon } from '../lib/icon-image';

export const GET: APIRoute = async () => {
  const bytes = await renderIcon(180);
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
