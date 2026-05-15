import type { APIRoute } from 'astro';
import { getPublishedPages, getPublishedPosts } from '../lib/content';

const SITE_NAME = 'Hotrod';
const SITE_SUMMARY =
  'An open-source Astro starter for sites that are designed, written, and maintained by coding agents.';
const SITE_DESCRIPTION =
  'Hotrod ships with strict Zod content schemas, a typed page-builder, Vercel Blob + Mux media wiring, and a yellow-cab brand identity. Every blog post is also available as plain markdown at its slug followed by `.md`. The full corpus is available at `/llms-full.txt`.';

function pagePath(id: string): string {
  // The "index" page renders at /, every other page renders at /<id>.
  return id === 'index' ? '/' : `/${id}`;
}

export const GET: APIRoute = async () => {
  const pages = await getPublishedPages();
  const posts = await getPublishedPosts();

  const lines: string[] = [`# ${SITE_NAME}`, '', `> ${SITE_SUMMARY}`, '', SITE_DESCRIPTION];

  if (pages.length > 0) {
    lines.push('', '## Pages', '');
    for (const page of pages) {
      lines.push(`- [${page.data.title}](${pagePath(page.id)}): ${page.data.description}`);
    }
  }

  if (posts.length > 0) {
    lines.push('', '## Blog', '');
    for (const post of posts) {
      lines.push(`- [${post.data.title}](/blog/${post.id}.md): ${post.data.description}`);
    }
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
